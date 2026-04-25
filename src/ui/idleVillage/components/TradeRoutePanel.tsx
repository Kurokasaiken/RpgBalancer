/**
 * TradeRoutePanel Component
 *
 * UI panel for managing trade routes between villages.
 * Allows creating, executing, and monitoring trade routes using multi-village APIs.
 */

import React, { useId, useState } from 'react';
import type { TradeRoute, TradeResult } from '@/ui/idleVillage/state/VillageRegistry';

export interface TradeRoutePanelProps {
  /** Available village IDs for trade */
  villageIds: string[];
  /** Current trade routes */
  tradeRoutes: TradeRoute[];
  /** Last trade execution result */
  lastTradeResult: TradeResult | null;
  /** Create trade route callback */
  onCreateTradeRoute: (route: TradeRoute) => boolean;
  /** Execute trade route callback */
  onExecuteTradeRoute: (routeId: string) => boolean;
  className?: string;
}

export const TradeRoutePanel: React.FC<TradeRoutePanelProps> = ({
  villageIds,
  tradeRoutes,
  lastTradeResult,
  onCreateTradeRoute,
  onExecuteTradeRoute,
  className,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const baseId = useId();
  const formFieldIds = {
    fromVillage: `${baseId}-from-village`,
    toVillage: `${baseId}-to-village`,
    sendResources: `${baseId}-send-resources`,
    receiveResources: `${baseId}-receive-resources`,
    duration: `${baseId}-duration`,
    risk: `${baseId}-risk`,
  };
  const [formData, setFormData] = useState({
    fromVillageId: '',
    toVillageId: '',
    sendResources: {} as Record<string, number>,
    receiveResources: {} as Record<string, number>,
    duration: 3,
    risk: 0.1,
  });

  const handleCreateTradeRoute = () => {
    const route: TradeRoute = {
      id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fromVillageId: formData.fromVillageId,
      toVillageId: formData.toVillageId,
      sendResources: { ...formData.sendResources },
      receiveResources: { ...formData.receiveResources },
      duration: formData.duration,
      risk: formData.risk,
    };

    if (onCreateTradeRoute(route)) {
      setFormData({
        fromVillageId: '',
        toVillageId: '',
        sendResources: {},
        receiveResources: {},
        duration: 3,
        risk: 0.1,
      });
      setShowCreateForm(false);
    }
  };

  const formatResources = (resources?: Record<string, number> | null): string => {
    if (!resources || Object.keys(resources).length === 0) {
      return '—';
    }
    return Object.entries(resources)
      .map(([resource, amount]) => `${amount} ${resource}`)
      .join(', ');
  };

  return (
    <section className={`space-y-4 ${className}`} data-testid="trade-route-panel" aria-label="Trade routes panel">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-amber-200">Trade Routes</h3>
        <button
          type="button"
          onClick={() => setShowCreateForm(!showCreateForm)}
          aria-expanded={showCreateForm}
          aria-controls={`${baseId}-create-form`}
          className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-sm text-amber-200 hover:bg-amber-500/20 transition-colors"
        >
          {showCreateForm ? 'Cancel' : '+ Create Route'}
        </button>
      </div>

      {showCreateForm && (
        <div
          id={`${baseId}-create-form`}
          data-testid="trade-route-create-form"
          className="rounded-lg border border-white/20 bg-black/40 p-4"
        >
          <h4 className="text-sm font-medium text-slate-200 mb-3" id={`${baseId}-create-form-title`}>
            Create Trade Route
          </h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1" htmlFor={formFieldIds.fromVillage}>
                  From Village
                </label>
                <select
                  id={formFieldIds.fromVillage}
                  value={formData.fromVillageId}
                  onChange={(e) => setFormData(prev => ({ ...prev, fromVillageId: e.target.value }))}
                  className="w-full rounded border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-slate-200"
                >
                  <option value="">Select village</option>
                  {villageIds.map(id => (
                    <option key={id} value={id}>{id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1" htmlFor={formFieldIds.toVillage}>
                  To Village
                </label>
                <select
                  id={formFieldIds.toVillage}
                  value={formData.toVillageId}
                  onChange={(e) => setFormData(prev => ({ ...prev, toVillageId: e.target.value }))}
                  className="w-full rounded border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-slate-200"
                >
                  <option value="">Select village</option>
                  {villageIds.map(id => (
                    <option key={id} value={id}>{id}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1" htmlFor={formFieldIds.sendResources}>
                  Send Resources
                </label>
                <input
                  type="text"
                  id={formFieldIds.sendResources}
                  placeholder="gold: 50, food: 25"
                  className="w-full rounded border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-slate-200"
                  onChange={(e) => {
                    const resources: Record<string, number> = {};
                    e.target.value.split(',').forEach(pair => {
                      const [resource, amount] = pair.trim().split(':');
                      if (resource && amount) {
                        resources[resource.trim()] = parseInt(amount.trim()) || 0;
                      }
                    });
                    setFormData(prev => ({ ...prev, sendResources: resources }));
                  }}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1" htmlFor={formFieldIds.receiveResources}>
                  Receive Resources
                </label>
                <input
                  type="text"
                  id={formFieldIds.receiveResources}
                  placeholder="wood: 30"
                  className="w-full rounded border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-slate-200"
                  onChange={(e) => {
                    const resources: Record<string, number> = {};
                    e.target.value.split(',').forEach(pair => {
                      const [resource, amount] = pair.trim().split(':');
                      if (resource && amount) {
                        resources[resource.trim()] = parseInt(amount.trim()) || 0;
                      }
                    });
                    setFormData(prev => ({ ...prev, receiveResources: resources }));
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1" htmlFor={formFieldIds.duration}>
                  Duration (time units)
                </label>
                <input
                  type="number"
                  id={formFieldIds.duration}
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 3 }))}
                  className="w-full rounded border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1" htmlFor={formFieldIds.risk}>
                  Risk (0-1)
                </label>
                <input
                  type="number"
                  id={formFieldIds.risk}
                  step="0.1"
                  min="0"
                  max="1"
                  value={formData.risk}
                  onChange={(e) => setFormData(prev => ({ ...prev, risk: parseFloat(e.target.value) || 0.1 }))}
                  className="w-full rounded border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-slate-200"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateTradeRoute}
              disabled={!formData.fromVillageId || !formData.toVillageId}
              className="w-full rounded bg-amber-600 px-3 py-2 text-sm text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Trade Route
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {tradeRoutes.map(route => (
          <div
            key={route.id}
            className="rounded-lg border border-white/10 bg-black/20 p-3"
            data-testid={`trade-route-card-${route.id}`}
            aria-label={`Trade route ${route.fromVillageId} to ${route.toVillageId}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm text-slate-200">
                  {route.fromVillageId} → {route.toVillageId}
                </div>
                <div className="text-xs text-slate-400">
                  Send: {formatResources(route.sendResources)} | Receive: {formatResources(route.receiveResources)}
                </div>
                <div className="text-xs text-slate-500">
                  Duration: {route.duration} TU | Risk: {(route.risk * 100).toFixed(0)}%
                </div>
              </div>
              <button
                type="button"
                onClick={() => onExecuteTradeRoute(route.id)}
                aria-label={`Execute trade route ${route.id}`}
                className="rounded border border-green-400/40 bg-green-500/10 px-2 py-1 text-xs text-green-200 hover:bg-green-500/20"
              >
                Execute
              </button>
            </div>
          </div>
        ))}

        {tradeRoutes.length === 0 && (
          <div
            className="rounded-lg border border-dashed border-slate-600 bg-slate-900/20 p-4 text-center"
            data-testid="trade-route-empty-state"
          >
            <p className="text-sm text-slate-400">No trade routes created yet</p>
          </div>
        )}
      </div>

      {lastTradeResult && (
        <div
          className={`rounded-lg border p-3 ${
            lastTradeResult.success
              ? 'border-green-400/40 bg-green-500/10'
              : 'border-red-400/40 bg-red-500/10'
          }`}
          role="status"
          aria-live="polite"
          data-testid="trade-route-last-result"
        >
          <div className="text-sm font-medium text-slate-200 mb-1">
            Last Trade Result
          </div>
          <div className="text-xs text-slate-300">
            Route: {lastTradeResult.routeId}
          </div>
          <div className="text-xs text-slate-300">
            Sent: {formatResources(lastTradeResult.resourcesSent)}
          </div>
          <div className="text-xs text-slate-300">
            Received: {formatResources(lastTradeResult.resourcesReceived)}
          </div>
          {lastTradeResult.riskEvent && (
            <div className="text-xs text-red-300 mt-1">
              ⚠️ {lastTradeResult.riskEvent}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default TradeRoutePanel;
