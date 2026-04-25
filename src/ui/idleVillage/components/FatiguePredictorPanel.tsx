import React, { useState, useMemo } from 'react';
import { AlertTriangle, TrendingUp, BarChart3, Download, RefreshCw } from 'lucide-react';
import { useFatiguePredictor } from '@/ui/idleVillage/hooks/useFatiguePredictor';
import type { FatiguePrediction } from '@/balancing/idleVillage/FatiguePredictor';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';

/**
 * Fatigue Predictor Panel - NP-019
 * 
 * Interactive panel for predicting resident fatigue with sparkline visualizations
 * and risk assessment. Follows config-first design principles.
 */

interface FatiguePredictorPanelProps {
  /** Current residents data */
  residents: Record<string, ResidentState>;
  /** Available activities */
  activities: Record<string, ActivityDefinition>;
  /** Optional callback for resident selection */
  onResidentSelect?: (residentId: string) => void;
}

interface SparklineData {
  values: number[];
  max: number;
  min: number;
}

/**
 * Simple sparkline component for fatigue visualization
 */
function FatigueSparkline({ data, riskLevel }: { data: SparklineData; riskLevel: string }) {
  const width = 120;
  const height = 40;
  const points = data.values.map((value, index) => {
    const x = (index / (data.values.length - 1)) * width;
    const y = height - ((value - data.min) / (data.max - data.min)) * height;
    return `${x},${y}`;
  }).join(' ');

  const getStrokeColor = () => {
    switch (riskLevel) {
      case 'critical': return '#ef4444'; // red-500
      case 'high': return '#f97316'; // orange-500
      case 'medium': return '#f59e0b'; // amber-500
      default: return '#22c55e'; // green-500
    }
  };

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={getStrokeColor()}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Resident fatigue prediction card
 */
function ResidentFatigueCard({
  resident,
  prediction,
  onSelect,
}: {
  resident: ResidentState;
  prediction: FatiguePrediction;
  onSelect?: () => void;
}) {
  const getRiskColor = () => {
    switch (prediction.riskLevel) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-amber-500';
      default: return 'text-green-500';
    }
  };

  const getRiskBgColor = () => {
    switch (prediction.riskLevel) {
      case 'critical': return 'bg-red-900/20 border-red-700';
      case 'high': return 'bg-orange-900/20 border-orange-700';
      case 'medium': return 'bg-amber-900/20 border-amber-700';
      default: return 'bg-green-900/20 border-green-700';
    }
  };

  return (
    <div
      className={`p-4 rounded-lg border ${getRiskBgColor()} cursor-pointer hover:opacity-80 transition-opacity`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-white">{resident.displayName || resident.id}</h3>
        <span className={`text-xs font-medium ${getRiskColor()}`}>
          {prediction.riskLevel.toUpperCase()}
        </span>
      </div>
      
      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-300 mb-1">
          <span>Current: {resident.fatigue || 0}</span>
          <span>Predicted: {prediction.predictedFatigue.toFixed(1)}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              prediction.riskLevel === 'critical' ? 'bg-red-500' :
              prediction.riskLevel === 'high' ? 'bg-orange-500' :
              prediction.riskLevel === 'medium' ? 'bg-amber-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(100, prediction.predictedFatigue)}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>Confidence: {(prediction.confidence * 100).toFixed(0)}%</span>
        <span>Rest: {prediction.recommendedRest} units</span>
      </div>
    </div>
  );
}

/**
 * Main Fatigue Predictor Panel component
 */
export function FatiguePredictorPanel({
  residents,
  activities,
  onResidentSelect,
}: FatiguePredictorPanelProps) {
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [environmentalConditions, setEnvironmentalConditions] = useState<string[]>([]);
  const [crewSize, setCrewSize] = useState<number>(3);
  const [timeOfDay, setTimeOfDay] = useState<string>('day');

  const {
    predictBatch,
    getTopRiskResidents,
    exportPredictions,
    isLoading,
    error,
  } = useFatiguePredictor({
    enableHistoricalData: true,
    enableBatchPrediction: true,
  });

  const selectedActivity = useMemo(() => {
    return selectedActivityId ? activities[selectedActivityId] : null;
  }, [selectedActivityId, activities]);

  const predictions = useMemo(() => {
    if (!selectedActivity) return [];
    
    const residentArray = Object.values(residents);
    return predictBatch(
      residentArray.map(resident => ({
        resident,
        activity: selectedActivity,
        context: {
          environmentalConditions,
          crewSize,
          timeOfDay,
        },
      }))
    );
  }, [residents, selectedActivity, predictBatch, environmentalConditions, crewSize, timeOfDay]);

  const topRiskResidents = useMemo(() => {
    return getTopRiskResidents(predictions, 5);
  }, [predictions, getTopRiskResidents]);

  const handleExport = () => {
    if (!selectedActivity) return;
    
    const exportData = exportPredictions(predictions);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fatigue-predictions-${selectedActivity.id}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    // Force re-prediction
    if (selectedActivity) {
      predictBatch(
        Object.values(residents).map(resident => ({
          resident,
          activity: selectedActivity,
          context: {
            environmentalConditions,
            crewSize,
            timeOfDay,
          },
        }))
      );
    }
  };

  return (
    <div className="bg-slate-900 rounded-lg p-6 text-white max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Fatigue Predictor
          </h2>
          <p className="text-gray-400 text-sm">
            Predict resident fatigue based on activity and environmental factors
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading || !selectedActivity}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          
          <button
            onClick={handleExport}
            disabled={!selectedActivity || predictions.length === 0}
            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-700 rounded-md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Configuration */}
      <div className="mb-6 p-4 bg-slate-800 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Configuration</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Activity</label>
            <select
              value={selectedActivityId}
              onChange={(e) => setSelectedActivityId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
            >
              <option value="">Select an activity...</option>
              {Object.values(activities).map(activity => (
                <option key={activity.id} value={activity.id}>
                  {activity.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Crew Size</label>
            <select
              value={crewSize}
              onChange={(e) => setCrewSize(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
            >
              <option value={1}>Working Alone</option>
              <option value={2}>Small Crew (2)</option>
              <option value={3}>Small Crew (3)</option>
              <option value={4}>Small Crew (4)</option>
              <option value={5}>Optimal Crew (5)</option>
              <option value={6}>Optimal Crew (6)</option>
              <option value={8}>Large Crew (8)</option>
              <option value={10}>Overcrowded (10+)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Time of Day</label>
            <select
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
            >
              <option value="day">Day</option>
              <option value="night">Night</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Environmental Conditions</label>
            <div className="space-y-2">
              {['hot_weather', 'cold_weather', 'rough_terrain'].map(condition => (
                <label key={condition} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={environmentalConditions.includes(condition)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setEnvironmentalConditions(prev => [...prev, condition]);
                      } else {
                        setEnvironmentalConditions(prev => prev.filter(c => c !== condition));
                      }
                    }}
                    className="rounded border-slate-600 bg-slate-700"
                  />
                  <span className="text-sm text-gray-300 capitalize">
                    {condition.replace('_', ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Risk Residents */}
      {topRiskResidents.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Top Risk Residents
          </h3>
          <div className="space-y-3">
            {topRiskResidents.map((prediction) => {
              const resident = Object.values(residents).find(r => 
                r.fatigue === (prediction.factors.currentFatigue)
              );
              if (!resident) return null;
              
              return (
                <ResidentFatigueCard
                  key={resident.id}
                  resident={resident}
                  prediction={prediction}
                  onSelect={() => onResidentSelect?.(resident.id)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* All Predictions */}
      {predictions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            All Predictions ({predictions.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predictions.map((prediction) => {
              const resident = Object.values(residents).find(r => 
                r.fatigue === (prediction.factors.currentFatigue)
              );
              if (!resident) return null;
              
              return (
                <ResidentFatigueCard
                  key={resident.id}
                  resident={resident}
                  prediction={prediction}
                  onSelect={() => onResidentSelect?.(resident.id)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* No Data State */}
      {!selectedActivity && predictions.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          </div>
          <p className="text-gray-400">
            Select an activity to view fatigue predictions
          </p>
        </div>
      )}
    </div>
  );
}
