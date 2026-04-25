/**
 * NP-036 – Idle Village Audio Cue Configurator
 *
 * React component for configuring audio cues with playback testing,
 * telemetry visualization, and configuration management.
 *
 * @since 2026-01-13
 * @author Cascade
 */

import React, { useState, useEffect } from 'react';
import { useAudioCueConfig } from '../hooks/useAudioCueConfig';
import type {
  AudioCue,
  AudioCueEventType,
  AudioCueCategory,
  AudioCuePriority,
  AudioCueConfig,
} from '../types/audioCue';
import {
  getEventTypeDescription,
  getCategoryDescription,
  getPriorityDescription,
  AUDIO_CUE_EVENT_TYPES,
  AUDIO_CUE_CATEGORIES,
  AUDIO_CUE_PRIORITIES,
} from '../types/audioCue';

interface AudioCueConfiguratorProps {
  className?: string;
  initialConfig?: AudioCueConfig;
}

/**
 * Audio Cue Configurator Component
 */
export const AudioCueConfigurator: React.FC<AudioCueConfiguratorProps> = ({
  className = '',
  initialConfig,
}) => {
  const {
    config,
    isInitialized,
    isLoading,
    error,
    telemetry,
    playCue,
    updateConfig,
    addCue,
    updateCue,
    removeCue,
    duplicateCue,
    setMasterVolume,
    setCategoryVolume,
    toggleMasterMute,
    analyzeConfig,
    getActiveInstancesCount,
    exportConfig,
    importConfig,
    validateConfig,
  } = useAudioCueConfig(initialConfig);

  const [selectedCueId, setSelectedCueId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'cues' | 'settings' | 'telemetry' | 'analysis'>('cues');
  const [playingInstances, setPlayingInstances] = useState<Set<string>>(new Set());

  // Auto-analyze on config changes
  useEffect(() => {
    if (isInitialized) {
      analyzeConfig();
    }
  }, [config, isInitialized, analyzeConfig]);

  /**
   * Handle cue play test
   */
  const handlePlayTest = async (cueId: string) => {
    const cue = config.cues.find(c => c.id === cueId);
    if (!cue) return;

    try {
      const instanceId = await playCue(cueId, cue.eventType, {
        volume: 0.5, // Test volume
        fadeIn: 0.1,
        fadeOut: 0.1,
      });

      if (instanceId) {
        setPlayingInstances(prev => new Set(prev).add(instanceId));
      }
    } catch (err) {
      console.error('Failed to play test cue:', err);
    }
  };

  /**
   * Handle cue selection
   */
  const handleCueSelect = (cueId: string) => {
    setSelectedCueId(cueId === selectedCueId ? null : cueId);
  };

  /**
   * Handle export configuration
   */
  const handleExport = () => {
    const configData = exportConfig();
    const dataStr = JSON.stringify(configData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `audio-cue-config-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  /**
   * Handle import configuration
   */
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const configData = JSON.parse(e.target?.result as string);
        const success = importConfig(configData);
        if (success) {
          alert('Configuration imported successfully!');
        } else {
          alert('Failed to import configuration. Please check the file format.');
        }
      } catch {
        alert('Invalid JSON file. Please select a valid configuration file.');
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };

  /**
   * Handle cue update
   */
  const handleCueUpdate = (cueId: string, updates: Partial<AudioCue>) => {
    updateCue(cueId, updates);
  };

  const handleAddCue = () => {
    const newCueId = addCue({
      name: 'New Audio Cue',
      description: 'A new audio cue',
      eventType: 'notification',
      category: 'ui',
      priority: 'medium',
      source: { type: 'silence', duration: 0.5 },
      playback: {
        volume: 0.8,
        pitch: 1,
        pan: 0,
        rate: 1,
        loop: 'none',
        fadeIn: 0,
        fadeOut: 0,
        delay: 0,
        maxDuration: 10,
        autoStop: true,
      },
      effects: { filters: [] },
      triggers: {
        events: ['notification'],
        conditions: [],
        probability: 1,
        cooldown: 0,
        maxPlaysPerMinute: 60,
        playOnce: false,
      },
      analytics: {
        enabled: true,
        trackPlayback: true,
        trackPerformance: true,
        trackUserInteraction: true,
        customMetrics: {},
      },
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
        score: 1,
      },
    });
    setSelectedCueId(newCueId);
  };

  if (isLoading) {
    return (
      <div className={`audio-cue-configurator ${className}`}>
        <div className="flex items-center justify-center p-8">
          <div className="text-lg">Initializing Audio Engine...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`audio-cue-configurator ${className}`}>
        <div className="p-4 bg-red-100 border border-red-300 rounded">
          <div className="text-red-700 font-semibold">Audio Engine Error</div>
          <div className="text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className={`audio-cue-configurator ${className}`}>
        <div className="flex items-center justify-center p-8">
          <div className="text-lg">Audio Engine Not Initialized</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`audio-cue-configurator bg-amber-50 border border-amber-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-amber-200 bg-amber-100">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-amber-900">Audio Cue Configurator</h2>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-amber-700">
              Active: {getActiveInstancesCount()}
            </div>
            <button
              onClick={handleExport}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
            >
              Export
            </button>
            <label className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium cursor-pointer">
              Import
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            <button
              onClick={toggleMasterMute}
              className={`px-3 py-1 rounded text-sm font-medium ${
                config.settings.masterMute
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'bg-green-100 text-green-700 border border-green-300'
              }`}
            >
              {config.settings.masterMute ? 'Muted' : 'Unmuted'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-amber-200">
        {[
          { id: 'cues', label: 'Audio Cues', count: config.cues.length },
          { id: 'settings', label: 'Settings' },
          { id: 'telemetry', label: 'Telemetry' },
          { id: 'analysis', label: 'Analysis' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'cues' | 'settings' | 'telemetry' | 'analysis')}
            className={`px-4 py-2 text-sm font-medium border-r border-amber-200 last:border-r-0 ${
              activeTab === tab.id
                ? 'bg-amber-200 text-amber-900'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            {tab.label} {tab.count !== undefined && `(${tab.count})`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'cues' && (
          <div className="space-y-4">
            {/* Add Cue Button */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-amber-900">Audio Cues</h3>
              <button
                onClick={handleAddCue}
                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 text-sm font-medium"
              >
                Add Cue
              </button>
            </div>

            {/* Cue List */}
            <div className="grid gap-4">
              {config.cues.map(cue => (
                <div
                  key={cue.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedCueId === cue.id
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-amber-200 bg-white hover:bg-amber-25'
                  }`}
                  onClick={() => handleCueSelect(cue.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{cue.name}</h4>
                        <span className={`px-2 py-1 text-xs rounded ${
                          cue.validation.isValid
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {cue.validation.isValid ? 'Valid' : 'Invalid'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {getEventTypeDescription(cue.eventType)} • {getCategoryDescription(cue.category)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        cue.priority === 'critical' ? 'bg-red-100 text-red-700' :
                        cue.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                        cue.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {cue.priority}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayTest(cue.id);
                        }}
                        disabled={playingInstances.size > 0}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        Test
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateCue(cue.id);
                        }}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                      >
                        Duplicate
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCue(cue.id);
                        }}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedCueId === cue.id && (
                    <div className="mt-4 pt-4 border-t border-amber-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Name</label>
                          <input
                            type="text"
                            value={cue.name}
                            onChange={(e) => handleCueUpdate(cue.id, { name: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Event Type</label>
                          <select
                            value={cue.eventType}
                            onChange={(e) => handleCueUpdate(cue.id, { eventType: e.target.value as AudioCueEventType })}
                            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          >
                            {AUDIO_CUE_EVENT_TYPES.map(type => (
                              <option key={type} value={type}>{getEventTypeDescription(type as AudioCueEventType)}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Category</label>
                          <select
                            value={cue.category}
                            onChange={(e) => handleCueUpdate(cue.id, { category: e.target.value as AudioCueCategory })}
                            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          >
                            {AUDIO_CUE_CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{getCategoryDescription(cat as AudioCueCategory)}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Priority</label>
                          <select
                            value={cue.priority}
                            onChange={(e) => handleCueUpdate(cue.id, { priority: e.target.value as AudioCuePriority })}
                            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          >
                            {AUDIO_CUE_PRIORITIES.map(pri => (
                              <option key={pri} value={pri}>{getPriorityDescription(pri as AudioCuePriority)}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Volume</label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={cue.playback.volume}
                            onChange={(e) => handleCueUpdate(cue.id, {
                              playback: { ...cue.playback, volume: parseFloat(e.target.value) }
                            })}
                            className="mt-1 block w-full"
                          />
                          <div className="text-xs text-gray-500 mt-1">{(cue.playback.volume * 100).toFixed(0)}%</div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Pitch</label>
                          <input
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={cue.playback.pitch}
                            onChange={(e) => handleCueUpdate(cue.id, {
                              playback: { ...cue.playback, pitch: parseFloat(e.target.value) }
                            })}
                            className="mt-1 block w-full"
                          />
                          <div className="text-xs text-gray-500 mt-1">{cue.playback.pitch.toFixed(1)}x</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-amber-900">Global Settings</h3>

            {/* Master Controls */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Master Volume</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.settings.masterVolume}
                  onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                  className="mt-1 block w-full"
                />
                <div className="text-xs text-gray-500 mt-1">{(config.settings.masterVolume * 100).toFixed(0)}%</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Max Concurrent Sounds</label>
                <input
                  type="number"
                  min="1"
                  max="16"
                  value={config.settings.maxConcurrentSounds}
                  onChange={(e) => updateConfig({
                    settings: { ...config.settings, maxConcurrentSounds: parseInt(e.target.value) }
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Category Settings */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Category Settings</h4>
              <div className="space-y-3">
                {Object.entries(config.categorySettings).map(([category, settings]) => (
                  <div key={category} className="border border-gray-200 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 capitalize">{category}</span>
                      <button
                        onClick={() => setCategoryVolume(category, settings.volume > 0 ? 0 : 0.8)}
                        className={`px-2 py-1 text-xs rounded ${
                          settings.volume === 0
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {settings.volume === 0 ? 'Muted' : 'Unmuted'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600">Volume</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={settings.volume}
                          onChange={(e) => setCategoryVolume(category, parseFloat(e.target.value))}
                          className="mt-1 block w-full"
                        />
                        <div className="text-xs text-gray-500 mt-1">{(settings.volume * 100).toFixed(0)}%</div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600">Max Concurrent</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={settings.maxConcurrent}
                          onChange={(e) => updateConfig({
                            categorySettings: {
                              ...config.categorySettings,
                              [category]: { ...settings, maxConcurrent: parseInt(e.target.value) }
                            }
                          })}
                          className="mt-1 block w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'telemetry' && telemetry && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-amber-900">Telemetry Data</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded p-4">
                <h4 className="font-medium text-gray-900 mb-2">Playback Metrics</h4>
                <div className="space-y-1 text-sm">
                  <div>Total Plays: {telemetry.playback.totalPlays}</div>
                  <div>Successful: {telemetry.playback.successfulPlays}</div>
                  <div>Failed: {telemetry.playback.failedPlays}</div>
                  <div>Average Play Time: {telemetry.playback.averagePlayTime.toFixed(2)}s</div>
                  <div>Total Play Time: {telemetry.playback.totalPlayTime.toFixed(2)}s</div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded p-4">
                <h4 className="font-medium text-gray-900 mb-2">Performance Metrics</h4>
                <div className="space-y-1 text-sm">
                  <div>Avg Load Time: {telemetry.performance.averageLoadTime.toFixed(2)}ms</div>
                  <div>Avg Play Time: {telemetry.performance.averagePlayTime.toFixed(2)}ms</div>
                  <div>Buffer Underruns: {telemetry.performance.bufferUnderruns}</div>
                  <div>Sample Rate: {telemetry.performance.sampleRate}Hz</div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded p-4">
                <h4 className="font-medium text-gray-900 mb-2">User Interactions</h4>
                <div className="space-y-1 text-sm">
                  <div>Mute Toggles: {telemetry.userInteraction.muteToggles}</div>
                  <div>Volume Changes: {telemetry.userInteraction.volumeChanges}</div>
                  <div>Settings Changes: {telemetry.userInteraction.settingsChanges}</div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded p-4">
                <h4 className="font-medium text-gray-900 mb-2">System Info</h4>
                <div className="space-y-1 text-sm">
                  <div>Web Audio: {telemetry.system.webAudioSupported ? 'Yes' : 'No'}</div>
                  <div>Formats: {telemetry.system.supportedFormats.join(', ')}</div>
                  <div>Hardware Concurrency: {telemetry.system.deviceInfo.hardwareConcurrency}</div>
                  <div>Memory: {telemetry.system.deviceInfo.deviceMemory}GB</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-amber-900">Configuration Analysis</h3>

            <button
              onClick={analyzeConfig}
              className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 text-sm font-medium"
            >
              Refresh Analysis
            </button>

            {config.cues.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Cue Metrics</h4>
                  <div className="space-y-1 text-sm">
                    <div>Total Cues: {config.cues.length}</div>
                    <div>Valid Cues: {config.cues.filter(c => c.validation.isValid).length}</div>
                    <div>Invalid Cues: {config.cues.filter(c => !c.validation.isValid).length}</div>
                    <div>Average Volume: {(config.cues.reduce((sum, c) => sum + c.playback.volume, 0) / config.cues.length * 100).toFixed(0)}%</div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Validation Status</h4>
                  <div className="space-y-1 text-sm">
                    <div className={`font-medium ${validateConfig() ? 'text-green-700' : 'text-red-700'}`}>
                      Configuration: {validateConfig() ? 'Valid' : 'Invalid'}
                    </div>
                    <div>Total Errors: {config.cues.reduce((sum, c) => sum + c.validation.errors.length, 0)}</div>
                    <div>Total Warnings: {config.cues.reduce((sum, c) => sum + c.validation.warnings.length, 0)}</div>
                  </div>
                </div>
              </div>
            )}

            {config.cues.some(c => c.validation.errors.length > 0 || c.validation.warnings.length > 0) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <h4 className="font-medium text-yellow-900 mb-2">Issues Found</h4>
                <div className="space-y-2">
                  {config.cues.flatMap(cue =>
                    cue.validation.errors.map((error, idx) => (
                      <div key={`${cue.id}-error-${idx}`} className="text-sm text-red-700">
                        <strong>{cue.name}:</strong> {error}
                      </div>
                    )).concat(
                      cue.validation.warnings.map((warning, idx) => (
                        <div key={`${cue.id}-warning-${idx}`} className="text-sm text-yellow-700">
                          <strong>{cue.name}:</strong> {warning}
                        </div>
                      ))
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
