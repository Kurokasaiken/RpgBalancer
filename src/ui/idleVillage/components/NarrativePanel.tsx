/**
 * NP-029 – Idle Village Quest Narrative Hooks Refactor
 * 
 * Narrative panel UI component for displaying and managing
 * quest narratives with real-time updates and telemetry.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Settings, 
  BarChart3, 
  FileText,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

import { useQuestNarrative } from '../hooks/useNarrativeHooks';
import { useNarrativeTelemetry } from '../hooks/useNarrativeTelemetry';
import { useNarrativeConfig } from '../hooks/useNarrativeConfig';
import { useTranslation } from '@/localization/useTranslation';
import type { GeneratedNarrative, NarrativeContext } from '../hooks/useNarrativeHooks';

interface NarrativePanelProps {
  questId?: string;
  residentId?: string;
  initialContext?: Partial<NarrativeContext>;
  className?: string;
  showTelemetry?: boolean;
  showConfig?: boolean;
  autoGenerate?: boolean;
}

export function NarrativePanel({
  questId,
  residentId,
  initialContext = {},
  className = '',
  showTelemetry = true,
  showConfig = true,
  autoGenerate = false,
}: NarrativePanelProps) {
  const [activeTab, setActiveTab] = useState('narratives');
  const [isPlaying, setIsPlaying] = useState(autoGenerate);
  const [selectedNarrative, setSelectedNarrative] = useState<GeneratedNarrative | null>(null);
  const [context, setContext] = useState<NarrativeContext>({
    questId: questId || '',
    residentId: residentId || '',
    questName: 'Sample Quest',
    questType: 'exploration',
    questDifficulty: 'normal',
    residentName: 'John Doe',
    residentLevel: 5,
    location: 'Forest',
    weather: 'clear',
    timeOfDay: 'day',
    progressPercentage: 0,
    ...initialContext,
  });

  const {
    generateQuestStart,
    generateQuestProgress,
    generateQuestComplete,
    generateQuestFail,
    generateNarrative,
    isLoading,
    error,
    availableHooks,
    hookTypes,
  } = useQuestNarrative({
    enableTelemetry: true,
    cacheResults: true,
  });

  const {
    events,
    metrics,
    isConnected,
    getStats,
    topEvents,
    topMetrics,
  } = useNarrativeTelemetry({
    enabled: showTelemetry,
  });

  const {
    config,
    hooks,
    templates,
    hookIds,
    hooksByType,
  } = useNarrativeConfig({
    autoRefresh: true,
  });

  const [narratives, setNarratives] = useState<GeneratedNarrative[]>([]);
  const { t } = useTranslation('idleVillage');

  // Auto-generate narratives when playing
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(async () => {
      const randomHook = availableHooks[Math.floor(Math.random() * availableHooks.length)];
      if (randomHook) {
        const narrative = await generateNarrative(randomHook, context);
        if (narrative) {
          setNarratives(prev => [narrative, ...prev].slice(0, 50)); // Keep last 50
        }
      }
    }, 3000); // Generate every 3 seconds

    return () => clearInterval(interval);
  }, [isPlaying, availableHooks, generateNarrative, context]);

  // Generate initial narrative
  useEffect(() => {
    if (questId && autoGenerate) {
      generateInitialNarrative();
    }
  }, [questId]);

  const generateInitialNarrative = async () => {
    const narrative = await generateQuestStart(context);
    if (narrative) {
      setNarratives([narrative]);
      setSelectedNarrative(narrative);
    }
  };

  const handleGenerateNarrative = async (hookId: string) => {
    const narrative = await generateNarrative(hookId, context);
    if (narrative) {
      setNarratives(prev => [narrative, ...prev]);
      setSelectedNarrative(narrative);
    }
  };

  const handleContextChange = (key: keyof NarrativeContext, value: unknown) => {
    setContext(prev => ({ ...prev, [key]: value }));
  };

  const handleProgressUpdate = (progress: number) => {
    setContext(prev => ({ ...prev, progressPercentage: progress }));
    
    // Generate progress narrative at milestones
    if (progress % 25 === 0 && progress > 0) {
      generateQuestProgress({ ...context, progressPercentage: progress }).then(narrative => {
        if (narrative) {
          setNarratives(prev => [narrative, ...prev]);
        }
      });
    }
  };

  const handleCompleteQuest = async () => {
    const narrative = await generateQuestComplete(context);
    if (narrative) {
      setNarratives(prev => [narrative, ...prev]);
      setSelectedNarrative(narrative);
    }
    setIsPlaying(false);
  };

  const handleFailQuest = async () => {
    const narrative = await generateQuestFail(context);
    if (narrative) {
      setNarratives(prev => [narrative, ...prev]);
      setSelectedNarrative(narrative);
    }
    setIsPlaying(false);
  };

  const stats = getStats();

  const telemetryData = useMemo(() => ({
    events: events.length,
    metrics: metrics.length,
    topEvents: topEvents.slice(0, 5),
    topMetrics: topMetrics.slice(0, 5),
    isConnected,
    lastActivity: stats.session.lastActivity,
  }), [events, metrics, topEvents, topMetrics, isConnected, stats]);

  return (
    <div className={`narrative-panel ${className}`}>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">{t('idleVillage:narrative.title', { defaultValue: 'Quest Narrative Panel' })}</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-1"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? t('idleVillage:narrative.pause', { defaultValue: 'Pause' }) : t('idleVillage:narrative.play', { defaultValue: 'Play' })}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={generateInitialNarrative}
                disabled={isLoading}
                className="flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                {t('idleVillage:narrative.refresh', { defaultValue: 'Refresh' })}
              </Button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{t('idleVillage:narrative.questProgress', { defaultValue: 'Quest Progress' })}</span>
              <span className="text-sm text-muted-foreground">{context.progressPercentage}%</span>
            </div>
            <Progress 
              value={context.progressPercentage} 
              className="w-full"
              onValueChange={handleProgressUpdate}
            />
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="narratives" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {t('idleVillage:narrative.tabs.narratives', { defaultValue: 'Narratives' })}
              </TabsTrigger>
              <TabsTrigger value="context" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                {t('idleVillage:narrative.tabs.context', { defaultValue: 'Context' })}
              </TabsTrigger>
              {showTelemetry && (
                <TabsTrigger value="telemetry" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  {t('idleVillage:narrative.tabs.telemetry', { defaultValue: 'Telemetry' })}
                </TabsTrigger>
              )}
              {showConfig && (
                <TabsTrigger value="config" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  {t('idleVillage:narrative.tabs.config', { defaultValue: 'Config' })}
                </TabsTrigger>
              )}
            </TabsList>

            {/* Narratives Tab */}
            <TabsContent value="narratives" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t('idleVillage:narrative.narratives.title', { defaultValue: 'Generated Narratives' })}</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{t('idleVillage:narrative.narratives.count', { count: narratives.length, defaultValue: '{count} narratives' })}</Badge>
                  {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                {hookIds.map(hookId => {
                  const hook = hooks[hookId];
                  return (
                    <Button
                      key={hookId}
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateNarrative(hookId)}
                      disabled={isLoading}
                      className="flex items-center gap-1"
                    >
                      {hook?.name || hookId}
                    </Button>
                  );
                })}
              </div>

              {/* Quest Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={handleCompleteQuest}
                  variant="default"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  {t('idleVillage:narrative.narratives.complete', { defaultValue: 'Complete Quest' })}
                </Button>
                <Button
                  onClick={handleFailQuest}
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <XCircle className="w-4 h-4" />
                  {t('idleVillage:narrative.narratives.fail', { defaultValue: 'Fail Quest' })}
                </Button>
              </div>

              {/* Narratives List */}
              <ScrollArea className="h-96 w-full">
                <div className="space-y-3">
                  {narratives.map((narrative, index) => (
                    <Card 
                      key={narrative.id}
                      className={`cursor-pointer transition-colors ${
                        selectedNarrative?.id === narrative.id ? 'border-primary' : ''
                      }`}
                      onClick={() => setSelectedNarrative(narrative)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{narrative.metadata.hookName}</Badge>
                            <Badge variant="outline">{narrative.metadata.templateName}</Badge>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {new Date(narrative.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                        <p className="text-sm mb-2">{narrative.text}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{t('idleVillage:narrative.narratives.details.id', { id: narrative.id, defaultValue: 'ID: {id}' })}</span>
                          <Separator orientation="vertical" className="h-3" />
                          <span>{t('idleVillage:narrative.narratives.details.hook', { defaultValue: 'Hook' })}: {narrative.hookId}</span>
                          <Separator orientation="vertical" className="h-3" />
                          <span>{t('idleVillage:narrative.narratives.details.template', { defaultValue: 'Template' })}: {narrative.templateId}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {narratives.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>{t('idleVillage:narrative.narratives.noNarratives', { defaultValue: 'No narratives generated yet' })}</p>
                      <p className="text-sm">{t('idleVillage:narrative.narratives.noNarrativesHint', { defaultValue: 'Click "Play" to start auto-generating or use the buttons above' })}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Selected Narrative Details */}
              {selectedNarrative && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('idleVillage:narrative.narratives.details.title', { defaultValue: 'Narrative Details' })}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">{t('idleVillage:narrative.narratives.details.text', { defaultValue: 'Text' })}</h4>
                        <p className="text-sm bg-muted p-3 rounded">{selectedNarrative.text}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">{t('idleVillage:narrative.narratives.details.variables', { defaultValue: 'Variables' })}</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(selectedNarrative.variables).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="font-medium">{key}:</span>
                              <span>{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">{t('idleVillage:narrative.narratives.details.metadata', { defaultValue: 'Metadata' })}</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">{t('idleVillage:narrative.narratives.details.hook', { defaultValue: 'Hook' })}:</span>
                            <span>{selectedNarrative.metadata.hookName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">{t('idleVillage:narrative.narratives.details.template', { defaultValue: 'Template' })}:</span>
                            <span>{selectedNarrative.metadata.templateName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">{t('idleVillage:narrative.narratives.details.telemetry', { defaultValue: 'Telemetry' })}:</span>
                            <span>{selectedNarrative.metadata.telemetryTracked ? t('idleVillage:narrative.narratives.details.telemetryTracked', { defaultValue: 'Tracked' }) : t('idleVillage:narrative.narratives.details.telemetryNotTracked', { defaultValue: 'Not Tracked' })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">{t('idleVillage:narrative.narratives.details.generated', { defaultValue: 'Generated' })}:</span>
                            <span>{new Date(selectedNarrative.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Context Tab */}
            <TabsContent value="context" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('idleVillage:narrative.context.questName', { defaultValue: 'Quest Name' })}</label>
                  <input
                    type="text"
                    value={context.questName || ''}
                    onChange={(e) => handleContextChange('questName', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('idleVillage:narrative.context.questType', { defaultValue: 'Quest Type' })}</label>
                  <select
                    value={context.questType || ''}
                    onChange={(e) => handleContextChange('questType', e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="exploration">{t('idleVillage:narrative.questTypes.exploration', { defaultValue: 'Exploration' })}</option>
                    <option value="combat">{t('idleVillage:narrative.questTypes.combat', { defaultValue: 'Combat' })}</option>
                    <option value="diplomacy">{t('idleVillage:narrative.questTypes.diplomacy', { defaultValue: 'Diplomacy' })}</option>
                    <option value="crafting">{t('idleVillage:narrative.questTypes.crafting', { defaultValue: 'Crafting' })}</option>
                    <option value="social">{t('idleVillage:narrative.questTypes.social', { defaultValue: 'Social' })}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('idleVillage:narrative.context.questDifficulty', { defaultValue: 'Quest Difficulty' })}</label>
                  <select
                    value={context.questDifficulty || ''}
                    onChange={(e) => handleContextChange('questDifficulty', e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="easy">{t('idleVillage:narrative.difficulty.easy', { defaultValue: 'Easy' })}</option>
                    <option value="normal">{t('idleVillage:narrative.difficulty.normal', { defaultValue: 'Normal' })}</option>
                    <option value="hard">{t('idleVillage:narrative.difficulty.hard', { defaultValue: 'Hard' })}</option>
                    <option value="nightmare">{t('idleVillage:narrative.difficulty.nightmare', { defaultValue: 'Nightmare' })}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('idleVillage:narrative.context.residentName', { defaultValue: 'Resident Name' })}</label>
                  <input
                    type="text"
                    value={context.residentName || ''}
                    onChange={(e) => handleContextChange('residentName', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('idleVillage:narrative.context.residentLevel', { defaultValue: 'Resident Level' })}</label>
                  <input
                    type="number"
                    value={context.residentLevel || ''}
                    onChange={(e) => handleContextChange('residentLevel', parseInt(e.target.value))}
                    className="w-full p-2 border rounded"
                    min="1"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('idleVillage:narrative.context.location', { defaultValue: 'Location' })}</label>
                  <input
                    type="text"
                    value={context.location || ''}
                    onChange={(e) => handleContextChange('location', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('idleVillage:narrative.context.weather', { defaultValue: 'Weather' })}</label>
                  <select
                    value={context.weather || ''}
                    onChange={(e) => handleContextChange('weather', e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="clear">{t('idleVillage:narrative.weather.clear', { defaultValue: 'Clear' })}</option>
                    <option value="rain">{t('idleVillage:narrative.weather.rain', { defaultValue: 'Rain' })}</option>
                    <option value="snow">{t('idleVillage:narrative.weather.snow', { defaultValue: 'Snow' })}</option>
                    <option value="storm">{t('idleVillage:narrative.weather.storm', { defaultValue: 'Storm' })}</option>
                    <option value="fog">{t('idleVillage:narrative.weather.fog', { defaultValue: 'Fog' })}</option>
                    <option value="windy">{t('idleVillage:narrative.weather.windy', { defaultValue: 'Windy' })}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('idleVillage:narrative.context.timeOfDay', { defaultValue: 'Time of Day' })}</label>
                  <select
                    value={context.timeOfDay || ''}
                    onChange={(e) => handleContextChange('timeOfDay', e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="dawn">{t('idleVillage:narrative.timeOfDay.dawn', { defaultValue: 'Dawn' })}</option>
                    <option value="day">{t('idleVillage:narrative.timeOfDay.day', { defaultValue: 'Day' })}</option>
                    <option value="dusk">{t('idleVillage:narrative.timeOfDay.dusk', { defaultValue: 'Dusk' })}</option>
                    <option value="night">{t('idleVillage:narrative.timeOfDay.night', { defaultValue: 'Night' })}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('idleVillage:narrative.context.progress', { progress: context.progressPercentage, defaultValue: 'Progress: {progress}%' })}</label>
                <Progress 
                  value={context.progressPercentage} 
                  className="w-full"
                  onValueChange={handleProgressUpdate}
                />
              </div>
            </TabsContent>

            {/* Telemetry Tab */}
            {showTelemetry && (
              <TabsContent value="telemetry" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span className="text-2xl font-bold">{telemetryData.events}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{t('idleVillage:narrative.telemetry.events', { defaultValue: 'Events' })}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-2xl font-bold">{telemetryData.metrics}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{t('idleVillage:narrative.telemetry.metrics', { defaultValue: 'Metrics' })}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        {isConnected ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm font-medium">
                          {isConnected ? t('idleVillage:narrative.telemetry.connected', { defaultValue: 'Connected' }) : t('idleVillage:narrative.telemetry.disconnected', { defaultValue: 'Disconnected' })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{t('idleVillage:narrative.telemetry.status', { defaultValue: 'Status' })}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-purple-500" />
                        <span className="text-sm font-medium">
                          {new Date(telemetryData.lastActivity).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{t('idleVillage:narrative.telemetry.lastActivity', { defaultValue: 'Last Activity' })}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{t('idleVillage:narrative.telemetry.topEvents', { defaultValue: 'Top Events' })}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {telemetryData.topEvents.map(([name, count], index) => (
                          <div key={name} className="flex justify-between items-center">
                            <span className="text-sm">{name}</span>
                            <Badge variant="secondary">{count}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{t('idleVillage:narrative.telemetry.topMetrics', { defaultValue: 'Top Metrics' })}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {telemetryData.topMetrics.map(({ name, avg, count }, index) => (
                          <div key={name} className="flex justify-between items-center">
                            <span className="text-sm">{name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{avg.toFixed(2)}</span>
                              <Badge variant="outline">{count}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}

            {/* Config Tab */}
            {showConfig && (
              <TabsContent value="config" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{t('idleVillage:narrative.config.availableHooks', { defaultValue: 'Available Hooks' })}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(hooksByType).map(([type, hookList]) => (
                          <div key={type}>
                            <h4 className="font-semibold text-sm mb-1 capitalize">{type}</h4>
                            <div className="space-y-1">
                              {hookList.map(hook => (
                                <div key={hook.id} className="flex justify-between items-center">
                                  <span className="text-sm">{hook.name}</span>
                                  <Badge variant="outline">{hook.priority}</Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{t('idleVillage:narrative.config.configurationStatus', { defaultValue: 'Configuration Status' })}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">{t('idleVillage:narrative.config.hooks', { defaultValue: 'Hooks' })}</span>
                          <Badge variant="secondary">{hookIds.length}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">{t('idleVillage:narrative.config.templates', { defaultValue: 'Templates' })}</span>
                          <Badge variant="secondary">{Object.keys(templates).length}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">{t('idleVillage:narrative.config.telemetryEnabled', { defaultValue: 'Telemetry Enabled' })}</span>
                          <Badge variant={config.telemetry.enabled ? 'default' : 'destructive'}>
                            {config.telemetry.enabled ? t('idleVillage:narrative.config.yes', { defaultValue: 'Yes' }) : t('idleVillage:narrative.config.no', { defaultValue: 'No' })}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">{t('idleVillage:narrative.config.configVersion', { defaultValue: 'Config Version' })}</span>
                          <Badge variant="outline">{config.version}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
