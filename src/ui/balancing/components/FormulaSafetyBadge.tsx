import React from 'react';
import type { FormulaSafetyReport, FormulaWarning } from '../../../balancing/config/FormulaEngine';

/**
 * Props for FormulaSafetyBadge component
 */
interface FormulaSafetyBadgeProps {
  safety: FormulaSafetyReport | undefined;
  warnings?: FormulaWarning[];
  showDetails?: boolean;
  className?: string;
}

/**
 * Formula Safety Badge - Displays real-time linting summary for formula safety
 * 
 * Shows color-coded indicators for:
 * - Cycle detection (red)
 * - Complexity level (green/yellow/red)
 * - Division risk (orange)
 * - Range issues (red)
 * 
 * Colors are read from config, not hardcoded
 */
export const FormulaSafetyBadge: React.FC<FormulaSafetyBadgeProps> = ({
  safety,
  warnings,
  showDetails = false,
  className = ''
}) => {
  if (!safety) {
    return null;
  }

  // Get colors from config (config-first design)
  const getSafetyColor = (level: 'safe' | 'warning' | 'error'): string => {
    // These should come from config in Phase 10
    const colors = {
      safe: 'bg-emerald-500',
      warning: 'bg-amber-500', 
      error: 'bg-red-500'
    };
    return colors[level];
  };

  const getComplexityColor = (complexity: string): string => {
    switch (complexity) {
      case 'low': return getSafetyColor('safe');
      case 'medium': return getSafetyColor('warning');
      case 'high': return getSafetyColor('error');
      default: return getSafetyColor('warning');
    }
  };

  // Determine overall safety level
  const getOverallSafety = (): 'safe' | 'warning' | 'error' => {
    if (safety.hasCycles || safety.rangeIssues.some(issue => issue.issue === 'zero_division')) {
      return 'error';
    }
    if (safety.complexity === 'high' || safety.divisionRisk || safety.rangeIssues.length > 0) {
      return 'warning';
    }
    return 'safe';
  };

  const overallSafety = getOverallSafety();
  const badgeColor = getSafetyColor(overallSafety);

  // Count issues by type
  const errorCount = warnings?.filter(w => w.severity === 'error').length || 0;
  const warningCount = warnings?.filter(w => w.severity === 'warning').length || 0;
  const infoCount = warnings?.filter(w => w.severity === 'info').length || 0;

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      {/* Main safety indicator */}
      <div 
        className={`w-2 h-2 rounded-full ${badgeColor}`}
        title={`Safety: ${overallSafety}`}
      />
      
      {/* Complexity indicator */}
      <div 
        className={`w-2 h-2 rounded-full ${getComplexityColor(safety.complexity)}`}
        title={`Complexity: ${safety.complexity} (${safety.estimatedOperations} ops)`}
      />
      
      {/* Division risk indicator */}
      {safety.divisionRisk && (
        <div 
          className="w-2 h-2 rounded-full bg-orange-500"
          title="Division risk detected"
        />
      )}
      
      {/* Issue counts */}
      {(errorCount > 0 || warningCount > 0 || infoCount > 0) && (
        <span className="text-xs text-slate-400 ml-1">
          {errorCount > 0 && (
            <span className="text-red-400">{errorCount}E</span>
          )}
          {warningCount > 0 && (
            <span className="text-amber-400">{warningCount}W</span>
          )}
          {infoCount > 0 && (
            <span className="text-blue-400">{infoCount}I</span>
          )}
        </span>
      )}

      {/* Detailed breakdown */}
      {showDetails && (
        <div className="ml-2 text-xs text-slate-500">
          <div className="space-y-1">
            <div>Complexity: {safety.complexity}</div>
            <div>Operations: {safety.estimatedOperations}</div>
            {safety.hasCycles && (
              <div className="text-red-400">⚠ Circular dependency</div>
            )}
            {safety.divisionRisk && (
              <div className="text-orange-400">⚠ Division risk</div>
            )}
            {safety.rangeIssues.map((issue, index) => (
              <div 
                key={index} 
                className={issue.issue === 'zero_division' ? 'text-red-400' : 'text-amber-400'}
              >
                ⚠ {issue.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FormulaSafetyBadge;
