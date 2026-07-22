import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

import requests

from providers import (
    fetch_available_models,
    get_all_provider_model_pairs,
    get_available_providers,
    get_base_url,
    get_provider_api_key,
    get_provider_config,
)

ROOT_DIR = Path(__file__).resolve().parent.parent
KANBAN_PATH = ROOT_DIR / "ai-worker" / "kanban.json"
PROVIDER_DRIFT_LOG = ROOT_DIR / "ai-worker" / "provider-drift.log"

BACKOFF_DELAYS = [2, 4, 8, 16]
MAX_COMPLEXITY = 3
EVIDENCE_DIR = ROOT_DIR / "test-results"


def load_kanban(path=None):
    kanban_path = path or KANBAN_PATH
    with open(kanban_path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_kanban(data):
    with open(KANBAN_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def get_max_tokens(complexity: int) -> int:
    """Calcola un limite di token ragionevole in base alla complessità."""
    if not isinstance(complexity, int) or complexity < 1:
        complexity = 1
    return min(8192, 2048 * complexity)


def write_evidence(
    task,
    status: str,
    used_model: Optional[str],
    elapsed: float,
    error: Optional[str] = None,
    skipped: bool = False,
    provider: Optional[str] = None,
    lint_result: Optional[dict] = None,
):
    """Scrive il log di esecuzione per permettere al coordinator interno di chiudere il task."""
    EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
    evidence = {
        "task_id": task.get("id"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": status,
        "used_model": used_model,
        "used_provider": provider,
        "target_file": task.get("target_file"),
        "complexity": task.get("complexity"),
        "elapsed_seconds": round(elapsed, 3),
        "error": error,
        "skipped": skipped,
        "lint_result": lint_result,
    }
    path = EVIDENCE_DIR / f"ai-worker-{task['id']}.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(evidence, f, indent=2, ensure_ascii=False)
    print(f"[EVIDENCE] Log scritto: {path}")


def extract_code(raw_text: str) -> str:
    """Estrae il codice dal primo blocco Markdown, se presente."""
    match = re.search(r"```(?:\w+)?\n(.*?)```", raw_text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return raw_text.strip()


def run_lint(scope: str, timeout: int = 120) -> dict:
    """Esegue npm run lint -- <scope> e restituisce il risultato."""
    try:
        result = subprocess.run(
            ["npm", "run", "lint", "--", scope],
            cwd=ROOT_DIR,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        return {
            "success": result.returncode == 0,
            "returncode": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr,
        }
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "returncode": -1,
            "stdout": "",
            "stderr": f"Lint timeout after {timeout}s",
        }
    except Exception as e:
        return {
            "success": False,
            "returncode": -1,
            "stdout": "",
            "stderr": str(e),
        }


def call_provider(provider_name: str, model: str, prompt: str, max_tokens: int = 2048):
    """Call an AI provider with OpenAI-compatible endpoint."""
    api_key = get_provider_api_key(provider_name)
    base_url = get_base_url(provider_name)
    url = f"{base_url}/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "max_tokens": max_tokens,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a coding assistant. Return only the raw source code, "
                    "without Markdown code fences and without explanations."
                ),
            },
            {"role": "user", "content": prompt},
        ],
    }
    return requests.post(url, headers=headers, json=payload, timeout=120)


def find_next_todo(data):
    for task in data.get("tasks", []):
        if task.get("status") == "todo":
            return task
    return None


def log_provider_drift(provider_name: str, whitelist_models: List[str], available_models: List[str]):
    """Log provider drift when intersection of whitelist and available models is empty."""
    PROVIDER_DRIFT_LOG.parent.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).isoformat()
    log_entry = (
        f"[{timestamp}] PROVIDER DRIFT: {provider_name}\n"
        f"  Whitelist models: {whitelist_models}\n"
        f"  Available models: {available_models}\n"
        f"  Intersection: EMPTY - provider excluded from fallback cycle\n"
    )
    with open(PROVIDER_DRIFT_LOG, "a", encoding="utf-8") as f:
        f.write(log_entry + "\n")
    print(f"[DRIFT] Logged provider drift for {provider_name} to {PROVIDER_DRIFT_LOG}")


def get_effective_provider_model_pairs() -> List[tuple]:
    """Get effective (provider, model) pairs using intersection of whitelist and live models.

    For each provider, intersects the hardcoded whitelist (models known to be suitable
    for coding) with the live models fetched from the provider's /models endpoint.
    Logs provider drift if intersection is empty and excludes that provider.
    """
    effective_pairs = []
    
    for provider_name in get_available_providers():
        try:
            # Get whitelist from PROVIDERS config
            config = get_provider_config(provider_name)
            whitelist = config["models"]
            
            # Get live models from provider API
            available = fetch_available_models(provider_name)
            
            # Intersect whitelist with available models
            intersection = [m for m in whitelist if m in available]
            
            if not intersection:
                # Provider drift: all expected models are gone
                log_provider_drift(provider_name, whitelist, available)
                print(f"[WARN] Excluding {provider_name} from fallback cycle (no whitelisted models available)")
                continue
            
            # Add intersection pairs to effective list
            for model in intersection:
                effective_pairs.append((provider_name, model))
            
            print(f"[INFO] {provider_name}: {len(intersection)}/{len(whitelist)} whitelisted models available")
            
        except Exception as e:
            print(f"[WARN] Error getting models for {provider_name}: {e}")
            # Fallback to whitelist if fetch fails
            config = get_provider_config(provider_name)
            for model in config["models"]:
                effective_pairs.append((provider_name, model))
    
    return effective_pairs


def run_single_task() -> bool:
    start_time = time.time()

    data = load_kanban()
    task = find_next_todo(data)
    if task is None:
        print("[INFO] Nessun task con status 'todo' trovato.")
        return True

    task_id = task["id"]
    target_file = task["target_file"]
    prompt = task["prompt"]
    complexity = task.get("complexity", 1)
    execution_hint = task.get("execution_hint", "atomic")

    # Get effective provider/model pairs (intersection of whitelist and live models)
    provider_model_pairs = get_effective_provider_model_pairs()
    if not provider_model_pairs:
        elapsed = time.time() - start_time
        error = "Nessun provider con modelli disponibili trovato"
        print(f"[ERRORE] {error}")
        task["status"] = "failed"
        task["error"] = error
        write_evidence(task, "failed", None, elapsed, error=error)
        save_kanban(data)
        return False

    print(f"[INFO] Esecuzione task {task_id} -> {target_file} (complexity {complexity}, execution_hint={execution_hint})")

    if complexity > MAX_COMPLEXITY:
        reason = f"Complexity {complexity} superiore alla soglia {MAX_COMPLEXITY}; delegato a executor esterno."
        print(f"[SKIP] {reason}")
        task["status"] = "skipped"
        task["error"] = reason
        elapsed = time.time() - start_time
        write_evidence(task, "skipped", None, elapsed, error=reason, skipped=True)
        save_kanban(data)
        return True

    generated_code = None
    used_provider = None
    used_model = None
    success = False
    max_tokens = get_max_tokens(complexity)
    last_error_detail = None
    attempt_log = []

    for attempt_index, delay in enumerate(BACKOFF_DELAYS):
        for provider_name, model in provider_model_pairs:
            print(f"[ATTEMPTS] Tentativo {attempt_index + 1}/{len(BACKOFF_DELAYS)} - {provider_name}/{model}")
            try:
                response = call_provider(provider_name, model, prompt, max_tokens=max_tokens)

                status_code = response.status_code
                response_text = response.text[:200].replace("\n", " ") if response.text else ""

                if status_code == 429:
                    msg = f"Rate limit (429) per {provider_name}/{model}"
                    print(f"[WARN] {msg}")
                    last_error_detail = f"{provider_name}/{model}: {msg}"
                    attempt_log.append(last_error_detail)
                    continue

                response.raise_for_status()
                payload = response.json()
                choices = payload.get("choices", [])
                if not choices:
                    msg = f"Nessuna scelta nella risposta di {provider_name}/{model}"
                    print(f"[WARN] {msg}")
                    last_error_detail = msg
                    attempt_log.append(last_error_detail)
                    continue

                raw_content = choices[0].get("message", {}).get("content", "")
                generated_code = extract_code(raw_content)
                used_provider = provider_name
                used_model = model
                success = True
                print(f"[SUCCESS] Codice generato con {provider_name}/{model}")
                break

            except requests.exceptions.RequestException as e:
                detail = f"{provider_name}/{model}: {e}"
                print(f"[WARN] Errore di rete: {detail}")
                last_error_detail = detail
                attempt_log.append(detail)
            except Exception as e:
                detail = f"{provider_name}/{model}: {e}"
                print(f"[WARN] Errore: {detail}")
                last_error_detail = detail
                attempt_log.append(detail)

        if success:
            break

        if attempt_index < len(BACKOFF_DELAYS) - 1:
            print(f"[BACKOFF] Attesa {delay} secondi prima del prossimo giro")
            time.sleep(delay)

    elapsed = time.time() - start_time

    if success and generated_code is not None:
        target_path = ROOT_DIR / target_file
        target_path.parent.mkdir(parents=True, exist_ok=True)
        with open(target_path, "w", encoding="utf-8") as f:
            f.write(generated_code)

        print(f"[DONE] File scritto: {target_path}")

        # Post-generation lint verification for 'assisted' tasks
        lint_result = None
        if execution_hint == "assisted":
            print(f"[LINT] Esecuzione lint post-generazione per task 'assisted'")
            # Determine lint scope from target file
            if target_file.endswith(".md"):
                lint_scope = "*.md"
            elif target_file.endswith(".json"):
                lint_scope = "*.json"
            elif target_file.endswith(".ts"):
                lint_scope = target_file
            else:
                lint_scope = target_file

            lint_result = run_lint(lint_scope)
            if lint_result["success"]:
                print(f"[LINT] SUCCESS: lint passato per {lint_scope}")
            else:
                print(f"[LINT] FAILED: lint fallito per {lint_scope}")
                print(f"[LINT] stderr: {lint_result['stderr'][:500]}")
                task["status"] = "failed"
                task["error"] = f"Lint fallito: {lint_result['stderr'][:200]}"
                task["lint_result"] = lint_result
                write_evidence(task, "failed", used_model, elapsed, error=task["error"], provider=used_provider, lint_result=lint_result)
                save_kanban(data)
                return False

        task["status"] = "done"
        task["used_provider"] = used_provider
        task["used_model"] = used_model
        task.pop("error", None)
        if lint_result:
            task["lint_result"] = lint_result
        write_evidence(task, "done", used_model, elapsed, provider=used_provider, lint_result=lint_result)
        save_kanban(data)
        return True
    else:
        error = "Tutti i provider/modelli hanno fallito o sono andati in rate limit"
        if last_error_detail:
            error = f"{error}. Ultimo errore: {last_error_detail}"
        task["status"] = "failed"
        task["error"] = error
        task["provider_attempt_log"] = attempt_log[:20]
        print("[FAILED] Impossibile completare il task")
        write_evidence(task, "failed", used_model, elapsed, error=error, provider=used_provider)

    save_kanban(data)
    return False


if __name__ == "__main__":
    sys.exit(0 if run_single_task() else 1)
