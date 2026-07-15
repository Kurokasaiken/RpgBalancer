#!/usr/bin/env python3
"""
Auto-snapshot script for RPG Balancer project

Creates automatic snapshots of uncommitted changes every 2 hours
without disturbing the current working branch.

Features:
- Checks for uncommitted changes
- Creates snapshot in separate worktree (no checkout)
- Pushes to remote branch with timestamp
- Logs all operations
- Safe to run multiple times
"""

import os
import sys
import subprocess
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path
import argparse

# Configuration
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
LOG_FILE = PROJECT_ROOT / ".auto-snapshot.log"
SNAPSHOT_BRANCH_PREFIX = "wip/auto-snapshot"
REMOTE_NAME = "origin"
MAX_SNAPSHOT_AGE_HOURS = 48

def setup_logging():
    """Setup logging to both file and stdout"""
    log_file = PROJECT_ROOT / ".auto-snapshot.log"
    
    # Create logger
    logger = logging.getLogger("auto-snapshot")
    logger.setLevel(logging.INFO)
    
    # Clear existing handlers
    logger.handlers.clear()
    
    # File handler
    file_handler = logging.FileHandler(log_file, mode='a', encoding='utf-8')
    file_handler.setLevel(logging.INFO)
    file_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(file_formatter)
    logger.addHandler(file_handler)
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_formatter = logging.Formatter('%(levelname)s: %(message)s')
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)
    
    return logger

def run_git_command(cmd, cwd=None, capture_output=True, check=True):
    """Run git command and return result"""
    try:
        result = subprocess.run(
            ["git"] + cmd,
            cwd=cwd or PROJECT_ROOT,
            capture_output=capture_output,
            text=True,
            check=check
        )
        return result
    except subprocess.CalledProcessError as e:
        if check:
            raise
        return e

def has_uncommitted_changes():
    """Check if there are uncommitted changes"""
    try:
        result = run_git_command(["status", "--porcelain"])
        return bool(result.stdout.strip())
    except Exception as e:
        logger.error(f"Error checking git status: {e}")
        return False

def get_current_branch():
    """Get current branch name"""
    try:
        result = run_git_command(["branch", "--show-current"])
        return result.stdout.strip()
    except Exception as e:
        logger.error(f"Error getting current branch: {e}")
        return None

def get_current_commit():
    """Get current commit hash"""
    try:
        result = run_git_command(["rev-parse", "HEAD"])
        return result.stdout.strip()
    except Exception as e:
        logger.error(f"Error getting current commit: {e}")
        return None

def create_snapshot_branch(timestamp):
    """Create snapshot branch using worktree"""
    branch_name = f"{SNAPSHOT_BRANCH_PREFIX}-{timestamp}"
    worktree_path = PROJECT_ROOT / f".git-worktrees-{branch_name}"
    
    try:
        # Remove existing worktree if it exists
        if worktree_path.exists():
            run_git_command(["worktree", "remove", str(worktree_path)], check=False)
        
        # Create new worktree for snapshot branch
        run_git_command([
            "worktree", "add", 
            str(worktree_path), 
            "--detach",  # Don't switch branches
            "HEAD"
        ])
        
        logger.info(f"Created worktree for snapshot: {branch_name}")
        return branch_name, worktree_path
        
    except Exception as e:
        logger.error(f"Error creating worktree: {e}")
        # Cleanup worktree if creation failed
        if worktree_path.exists():
            run_git_command(["worktree", "remove", str(worktree_path)], check=False)
        raise

def commit_snapshot(worktree_path, timestamp):
    """Commit all changes in the worktree"""
    try:
        # Add all changes (including untracked files, excluding .gitignore)
        run_git_command(["add", "-A"], cwd=worktree_path)
        
        # Commit with timestamp message
        commit_message = f"auto-snapshot: {timestamp}"
        run_git_command(["commit", "-m", commit_message], cwd=worktree_path)
        
        logger.info(f"Committed snapshot: {commit_message}")
        return True
        
    except Exception as e:
        logger.error(f"Error committing snapshot: {e}")
        return False

def push_snapshot(branch_name):
    """Push snapshot branch to remote"""
    try:
        # Force push to remote (overwrite existing snapshot)
        run_git_command([
            "push", 
            REMOTE_NAME, 
            f"{branch_name}:{branch_name}", 
            "--force"
        ])
        
        logger.info(f"Pushed snapshot to remote: {branch_name}")
        return True
        
    except Exception as e:
        logger.error(f"Error pushing snapshot: {e}")
        return False

def cleanup_old_snapshots():
    """Remove snapshot branches older than MAX_SNAPSHOT_AGE_HOURS"""
    try:
        # Get all snapshot branches
        result = run_git_command([
            "branch", "-r", 
            f"{REMOTE_NAME}/{SNAPSHOT_BRANCH_PREFIX}*"
        ], check=False)
        
        if not result.stdout.strip():
            return
        
        current_time = datetime.now(timezone.utc)
        branches_to_remove = []
        
        for branch_line in result.stdout.strip().split('\n'):
            if not branch_line.strip():
                continue
                
            # Remove remote prefix
            remote_branch = branch_line.strip()
            if remote_branch.startswith(f"{REMOTE_NAME}/"):
                branch_name = remote_branch[len(f"{REMOTE_NAME}/"):]
                
                # Extract timestamp from branch name
                try:
                    timestamp_str = branch_name.replace(f"{SNAPSHOT_BRANCH_PREFIX}-", "")
                    branch_time = datetime.fromisoformat(timestamp_str.replace('_', ':'))
                    
                    # Check if branch is too old
                    if current_time - branch_time > timedelta(hours=MAX_SNAPSHOT_AGE_HOURS):
                        branches_to_remove.append(branch_name)
                        
                except ValueError:
                    # Skip branches that don't have valid timestamp format
                    continue
        
        # Remove old branches
        for branch_name in branches_to_remove:
            try:
                run_git_command([
                    "push", REMOTE_NAME, 
                    "--delete", 
                    branch_name
                ], check=False)
                logger.info(f"Removed old snapshot branch: {branch_name}")
            except Exception as e:
                logger.warning(f"Failed to remove old branch {branch_name}: {e}")
                
    except Exception as e:
        logger.warning(f"Error cleaning up old snapshots: {e}")

def cleanup_worktree(worktree_path, branch_name):
    """Remove worktree after snapshot is complete"""
    try:
        run_git_command(["worktree", "remove", str(worktree_path)], check=False)
        run_git_command(["branch", "-D", branch_name], check=False)
        logger.info(f"Cleaned up worktree and branch: {branch_name}")
    except Exception as e:
        logger.warning(f"Error cleaning up worktree: {e}")

def main():
    """Main function"""
    global logger
    logger = setup_logging()
    
    timestamp = datetime.now(timezone.utc).isoformat().replace(':', '_')
    logger.info(f"Auto-snapshot started at {timestamp}")
    
    try:
        # Check if we're in a git repository
        if not (PROJECT_ROOT / ".git").exists():
            logger.error("Not in a git repository")
            return 1
        
        # Check for uncommitted changes
        if not has_uncommitted_changes():
            logger.info("No uncommitted changes - skipping snapshot")
            return 0
        
        current_branch = get_current_branch()
        current_commit = get_current_commit()
        
        logger.info(f"Found uncommitted changes on branch '{current_branch}' at commit {current_commit}")
        
        # Create snapshot branch
        branch_name, worktree_path = create_snapshot_branch(timestamp)
        
        try:
            # Commit snapshot
            if not commit_snapshot(worktree_path, timestamp):
                return 1
            
            # Push to remote
            if not push_snapshot(branch_name):
                return 1
            
            logger.info(f"Snapshot completed successfully: {branch_name}")
            
        finally:
            # Always cleanup worktree
            cleanup_worktree(worktree_path, branch_name)
        
        # Cleanup old snapshots
        cleanup_old_snapshots()
        
        return 0
        
    except Exception as e:
        logger.error(f"Auto-snapshot failed: {e}")
        return 1

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Auto-snapshot script for RPG Balancer")
    parser.add_argument("--dry-run", action="store_true", help="Check for changes but don't create snapshot")
    parser.add_argument("--cleanup-only", action="store_true", help="Only cleanup old snapshots")
    
    args = parser.parse_args()
    
    if args.dry_run:
        logger = setup_logging()
        if has_uncommitted_changes():
            logger.info("Found uncommitted changes - would create snapshot")
            sys.exit(1)
        else:
            logger.info("No uncommitted changes - would skip")
            sys.exit(0)
    elif args.cleanup_only:
        logger = setup_logging()
        cleanup_old_snapshots()
        sys.exit(0)
    else:
        sys.exit(main())
