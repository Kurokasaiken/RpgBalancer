/**
 * Accessibility Audit Component for Idle Village Drag & Drop
 * Provides real-time accessibility testing and reporting
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import type { AxeResults, Violation } from 'axe-core';

interface AccessibilityIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  rule: string;
  description: string;
  element: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  help: string;
  helpUrl: string;
}

interface AccessibilityAuditProps {
  enabled?: boolean;
  showDetails?: boolean;
  onViolationFound?: (violation: AccessibilityIssue) => void;
}

/**
 * Component that performs real-time accessibility audits
 * and provides visual feedback for accessibility issues
 */
export function AccessibilityAudit({
  enabled = true,
  showDetails = false,
  onViolationFound,
}: AccessibilityAuditProps) {
  const [issues, setIssues] = useState<AccessibilityIssue[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);

  const runAudit = useCallback(async () => {
    if (!enabled || typeof window === 'undefined') return;

    setIsRunning(true);
    
    try {
      // Dynamic import of axe-core
      const axe = await import('axe-core');
      
      // Run accessibility audit
      const results = await axe.run({
        include: ['[data-testid="drag-test-container"]'],
        exclude: ['.sr-only', '[aria-hidden="true"]'],
      });

      // Convert axe violations to our format
      const accessibilityIssues: AccessibilityIssue[] = results.violations.map(violation => ({
        id: violation.id,
        type: 'error',
        rule: violation.id,
        description: violation.description,
        element: violation.nodes.map(node => node.target.join(', ')).join('; '),
        impact: violation.impact as AccessibilityIssue['impact'],
        help: violation.help,
        helpUrl: violation.helpUrl,
      }));

      // Add warnings for incomplete checks
      const warnings: AccessibilityIssue[] = results.incomplete.map(incomplete => ({
        id: incomplete.id,
        type: 'warning',
        rule: incomplete.id,
        description: incomplete.description,
        element: incomplete.nodes.map(node => node.target.join(', ')).join('; '),
        impact: 'moderate' as const,
        help: incomplete.help || 'Needs manual review',
        helpUrl: incomplete.helpUrl || '#',
      }));

      const allIssues = [...accessibilityIssues, ...warnings];
      setIssues(allIssues);
      setLastRun(new Date());

      // Notify parent of violations
      allIssues.forEach(issue => {
        onViolationFound?.(issue);
      });

    } catch (error) {
      console.error('Accessibility audit failed:', error);
    } finally {
      setIsRunning(false);
    }
  }, [enabled, onViolationFound]);

  // Auto-run audit when enabled changes
  useEffect(() => {
    if (enabled) {
      runAudit();
    }
  }, [enabled, runAudit]);

  // Auto-run audit periodically
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(runAudit, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [enabled, runAudit]);

  const getIssueIcon = (type: AccessibilityIssue['type']) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <Info className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getIssueColor = (type: AccessibilityIssue['type']) => {
    switch (type) {
      case 'error':
        return 'border-red-500 bg-red-50';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50';
      case 'info':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const criticalIssues = issues.filter(issue => issue.impact === 'critical');
  const seriousIssues = issues.filter(issue => issue.impact === 'serious');
  const moderateIssues = issues.filter(issue => issue.impact === 'moderate');
  const minorIssues = issues.filter(issue => issue.impact === 'minor');

  if (!enabled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <div className="rounded-lg border border-white/10 bg-black/80 backdrop-blur-md p-4 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-amber-100">Accessibility Audit</h3>
          <div className="flex items-center gap-2">
            {lastRun && (
              <span className="text-xs text-slate-400">
                {lastRun.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={runAudit}
              disabled={isRunning}
              className="rounded-full border border-white/15 bg-white/5 p-1 text-slate-200 transition hover:border-amber-300/70 hover:text-amber-200 disabled:opacity-50"
              title="Run accessibility audit"
            >
              <Eye className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-3">
          <div className="flex items-center gap-2 text-xs">
            {criticalIssues.length > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-1 text-white">
                {criticalIssues.length} Critical
              </span>
            )}
            {seriousIssues.length > 0 && (
              <span className="rounded-full bg-orange-500 px-2 py-1 text-white">
                {seriousIssues.length} Serious
              </span>
            )}
            {moderateIssues.length > 0 && (
              <span className="rounded-full bg-yellow-500 px-2 py-1 text-white">
                {moderateIssues.length} Moderate
              </span>
            )}
            {minorIssues.length > 0 && (
              <span className="rounded-full bg-blue-500 px-2 py-1 text-white">
                {minorIssues.length} Minor
              </span>
            )}
            {issues.length === 0 && (
              <span className="rounded-full bg-green-500 px-2 py-1 text-white">
                No Issues
              </span>
            )}
          </div>
        </div>

        {/* Issues List */}
        {showDetails && issues.length > 0 && (
          <div className="max-h-64 overflow-y-auto space-y-2">
            {issues.map(issue => (
              <div
                key={issue.id}
                className={`rounded border ${getIssueColor(issue.type)} p-2 cursor-pointer transition-all`}
                onClick={() => setExpandedIssue(expandedIssue === issue.id ? null : issue.id)}
              >
                <div className="flex items-start gap-2">
                  {getIssueIcon(issue.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-800">
                        {issue.rule}
                      </span>
                      <span className="text-xs text-slate-600">
                        {issue.impact}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1">
                      {issue.description}
                    </p>
                    
                    {expandedIssue === issue.id && (
                      <div className="mt-2 space-y-1">
                        <div className="text-xs text-slate-600">
                          <strong>Element:</strong> {issue.element}
                        </div>
                        <div className="text-xs text-slate-600">
                          <strong>Help:</strong> {issue.help}
                        </div>
                        {issue.helpUrl && issue.helpUrl !== '#' && (
                          <a
                            href={issue.helpUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Learn more →
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Running Indicator */}
        {isRunning && (
          <div className="flex items-center gap-2 text-xs text-amber-200">
            <div className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
            Running audit...
          </div>
        )}

        {/* Toggle Details */}
        {issues.length > 0 && (
          <button
            onClick={() => setExpandedIssue(null)}
            className="mt-2 text-xs text-amber-200 hover:text-amber-100"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
        )}
      </div>
    </div>
  );
}

export default AccessibilityAudit;
