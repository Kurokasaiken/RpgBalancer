/**
 * NP-029 – Idle Village Quest Narrative Hooks Refactor
 * 
 * Narrative configuration management UI component for
 * editing and managing narrative hooks, templates, and
 * configuration settings.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Save, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Edit, 
  Copy, 
  Download,
  Upload,
  Settings,
  FileText,
  Layers,
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

import { useNarrativeConfig } from '../hooks/useNarrativeConfig';
import type { NarrativeConfig } from '../../../balancing/config/narrative/narrativeConfig';

interface NarrativeConfigManagerProps {
  className?: string;
  autoSave?: boolean;
  showValidation?: boolean;
  enableImport?: boolean;
  enableExport?: boolean;
}

export function NarrativeConfigManager({
  className = '',
  autoSave = true,
  showValidation = true,
  enableImport = true,
  enableExport = true,
}: NarrativeConfigManagerProps) {
  const [activeTab, setActiveTab] = useState('hooks');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const {
    config,
    isLoading,
    error,
    hooks,
    templates,
    variables,
    telemetry,
    hookIds,
    templateIds,
    variableNames,
    hooksByType,
    templatesByCategory,
    updateConfig,
    setHook,
    setTemplate,
    setVariable,
    removeHook,
    removeTemplate,
    removeVariable,
    validateConfig,
    resetToDefaults,
    exportConfig,
    importConfig,
  } = useNarrativeConfig({
    autoRefresh: true,
    enableValidation: true,
  });

  const [tempHook, setTempHook] = useState<any>(null);
  const [tempTemplate, setTempTemplate] = useState<any>(null);
  const [tempVariable, setTempVariable] = useState<any>(null);

  // Validate configuration on changes
  useEffect(() => {
    if (showValidation) {
      const validation = validateConfig();
      setValidationErrors(validation.errors);
    }
  }, [config, showValidation, validateConfig]);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Auto-save is handled by the hook
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate save delay
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    const configData = exportConfig();
    const blob = new Blob([configData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `narrative-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = importConfig(content);
      
      if (!result.success) {
        setValidationErrors(result.errors);
      } else {
        setValidationErrors([]);
      }
    };
    reader.readAsText(file);
  };

  const handleCreateHook = () => {
    const newHook = {
      id: `hook_${Date.now()}`,
      name: 'New Hook',
      description: 'Hook description',
      type: 'quest_start',
      priority: 50,
      conditions: [],
      templates: [],
      telemetry: {
        track: true,
        metrics: ['engagement'],
        customEvents: [],
      },
    };
    
    setTempHook(newHook);
    setEditingItem(newHook.id);
  };

  const handleSaveHook = () => {
    if (tempHook) {
      setHook(tempHook.id, tempHook);
      setTempHook(null);
      setEditingItem(null);
    }
  };

  const handleCreateTemplate = () => {
    const newTemplate = {
      id: `template_${Date.now()}`,
      name: 'New Template',
      category: 'introduction',
      text: 'Template text with {variable} placeholders',
      variables: [],
      weight: 50,
      conditions: [],
      tags: [],
    };
    
    setTempTemplate(newTemplate);
    setEditingItem(newTemplate.id);
  };

  const handleSaveTemplate = () => {
    if (tempTemplate) {
      setTemplate(tempTemplate.id, tempTemplate);
      setTempTemplate(null);
      setEditingItem(null);
    }
  };

  const handleCreateVariable = () => {
    const newVariable = {
      name: 'new_variable',
      type: 'string',
      description: 'Variable description',
      defaultValue: '',
    };
    
    setTempVariable(newVariable);
    setEditingItem(newVariable.name);
  };

  const handleSaveVariable = () => {
    if (tempVariable) {
      setVariable(tempVariable.name, tempVariable);
      setTempVariable(null);
      setEditingItem(null);
    }
  };

  const handleDeleteHook = (hookId: string) => {
    if (confirm('Are you sure you want to delete this hook?')) {
      removeHook(hookId);
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      removeTemplate(templateId);
    }
  };

  const handleDeleteVariable = (variableName: string) => {
    if (confirm('Are you sure you want to delete this variable?')) {
      removeVariable(variableName);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset to default configuration? This will lose all custom changes.')) {
      resetToDefaults();
    }
  };

  return (
    <div className={`narrative-config-manager ${className}`}>
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">Narrative Configuration Manager</CardTitle>
            <div className="flex items-center gap-2">
              {validationErrors.length > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {validationErrors.length} Errors
                </Badge>
              )}
              {validationErrors.length === 0 && (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Valid
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={isSaving || autoSave}
                className="flex items-center gap-1"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              {enableExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              )}
              {enableImport && (
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Upload className="w-4 h-4" />
                    Import
                  </Button>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </Button>
            </div>
          </div>
          
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded">
              <h4 className="font-semibold text-sm mb-2">Validation Errors:</h4>
              <ul className="text-sm space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <XCircle className="w-3 h-3 text-destructive" />
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="hooks" className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Hooks
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="variables" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Variables
              </TabsTrigger>
              <TabsTrigger value="telemetry" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Telemetry
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Hooks Tab */}
            <TabsContent value="hooks" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Narrative Hooks</h3>
                <Button
                  onClick={handleCreateHook}
                  className="flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Create Hook
                </Button>
              </div>

              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {Object.entries(hooks).map(([hookId, hook]) => (
                    <Card key={hookId}>
                      <CardContent className="p-4">
                        {editingItem === hookId && tempHook?.id === hookId ? (
                          // Edit mode
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="hook-name">Name</Label>
                                <Input
                                  id="hook-name"
                                  value={tempHook.name}
                                  onChange={(e) => setTempHook({ ...tempHook, name: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label htmlFor="hook-type">Type</Label>
                                <Select
                                  value={tempHook.type}
                                  onValueChange={(value) => setTempHook({ ...tempHook, type: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="quest_start">Quest Start</SelectItem>
                                    <SelectItem value="quest_progress">Quest Progress</SelectItem>
                                    <SelectItem value="quest_complete">Quest Complete</SelectItem>
                                    <SelectItem value="quest_fail">Quest Fail</SelectItem>
                                    <SelectItem value="resident_interaction">Resident Interaction</SelectItem>
                                    <SelectItem value="environmental_trigger">Environmental Trigger</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="hook-description">Description</Label>
                              <Textarea
                                id="hook-description"
                                value={tempHook.description}
                                onChange={(e) => setTempHook({ ...tempHook, description: e.target.value })}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="hook-priority">Priority</Label>
                                <Input
                                  id="hook-priority"
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={tempHook.priority}
                                  onChange={(e) => setTempHook({ ...tempHook, priority: parseInt(e.target.value) })}
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="hook-telemetry"
                                  checked={tempHook.telemetry.track}
                                  onCheckedChange={(checked) => 
                                    setTempHook({ 
                                      ...tempHook, 
                                      telemetry: { ...tempHook.telemetry, track: checked }
                                    })
                                  }
                                />
                                <Label htmlFor="hook-telemetry">Track Telemetry</Label>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={handleSaveHook} size="sm">
                                <Save className="w-4 h-4 mr-1" />
                                Save
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setTempHook(null);
                                  setEditingItem(null);
                                }}
                                size="sm"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // View mode
                          <div>
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold">{hook.name}</h4>
                                <p className="text-sm text-muted-foreground">{hook.description}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">{hook.type}</Badge>
                                <Badge variant="outline">Priority: {hook.priority}</Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                              <span>ID: {hookId}</span>
                              <Separator orientation="vertical" className="h-3" />
                              <span>Templates: {hook.templates?.length || 0}</span>
                              <Separator orientation="vertical" className="h-3" />
                              <span>Conditions: {hook.conditions?.length || 0}</span>
                              <Separator orientation="vertical" className="h-3" />
                              <span>Telemetry: {hook.telemetry?.track ? 'Enabled' : 'Disabled'}</span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setTempHook(hook);
                                  setEditingItem(hookId);
                                }}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const copied = { ...hook };
                                  copied.id = `hook_${Date.now()}`;
                                  copied.name = `${hook.name} (Copy)`;
                                  setHook(copied.id, copied);
                                }}
                              >
                                <Copy className="w-4 h-4 mr-1" />
                                Copy
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteHook(hookId)}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Narrative Templates</h3>
                <Button
                  onClick={handleCreateTemplate}
                  className="flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Create Template
                </Button>
              </div>

              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {Object.entries(templates).map(([templateId, template]) => (
                    <Card key={templateId}>
                      <CardContent className="p-4">
                        {editingItem === templateId && tempTemplate?.id === templateId ? (
                          // Edit mode
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="template-name">Name</Label>
                                <Input
                                  id="template-name"
                                  value={tempTemplate.name}
                                  onChange={(e) => setTempTemplate({ ...tempTemplate, name: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label htmlFor="template-category">Category</Label>
                                <Select
                                  value={tempTemplate.category}
                                  onValueChange={(value) => setTempTemplate({ ...tempTemplate, category: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="introduction">Introduction</SelectItem>
                                    <SelectItem value="progress">Progress</SelectItem>
                                    <SelectItem value="completion">Completion</SelectItem>
                                    <SelectItem value="failure">Failure</SelectItem>
                                    <SelectItem value="interaction">Interaction</SelectItem>
                                    <SelectItem value="environment">Environment</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="template-text">Text</Label>
                              <Textarea
                                id="template-text"
                                value={tempTemplate.text}
                                onChange={(e) => setTempTemplate({ ...tempTemplate, text: e.target.value })}
                                placeholder="Use {variable_name} for placeholders"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="template-weight">Weight</Label>
                                <Input
                                  id="template-weight"
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={tempTemplate.weight}
                                  onChange={(e) => setTempTemplate({ ...tempTemplate, weight: parseInt(e.target.value) })}
                                />
                              </div>
                              <div>
                                <Label htmlFor="template-tags">Tags (comma-separated)</Label>
                                <Input
                                  id="template-tags"
                                  value={tempTemplate.tags?.join(', ') || ''}
                                  onChange={(e) => setTempTemplate({ 
                                    ...tempTemplate, 
                                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                                  })}
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={handleSaveTemplate} size="sm">
                                <Save className="w-4 h-4 mr-1" />
                                Save
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setTempTemplate(null);
                                  setEditingItem(null);
                                }}
                                size="sm"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // View mode
                          <div>
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold">{template.name}</h4>
                                <p className="text-sm text-muted-foreground">{template.text}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">{template.category}</Badge>
                                <Badge variant="outline">Weight: {template.weight}</Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                              <span>ID: {templateId}</span>
                              <Separator orientation="vertical" className="h-3" />
                              <span>Variables: {template.variables?.length || 0}</span>
                              <Separator orientation="vertical" className="h-3" />
                              <span>Conditions: {template.conditions?.length || 0}</span>
                              <Separator orientation="vertical" className="h-3" />
                              <span>Tags: {template.tags?.join(', ') || 'None'}</span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setTempTemplate(template);
                                  setEditingItem(templateId);
                                }}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const copied = { ...template };
                                  copied.id = `template_${Date.now()}`;
                                  copied.name = `${template.name} (Copy)`;
                                  setTemplate(copied.id, copied);
                                }}
                              >
                                <Copy className="w-4 h-4 mr-1" />
                                Copy
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteTemplate(templateId)}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Variables Tab */}
            <TabsContent value="variables" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Narrative Variables</h3>
                <Button
                  onClick={handleCreateVariable}
                  className="flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Create Variable
                </Button>
              </div>

              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {Object.entries(variables).map(([variableName, variable]) => (
                    <Card key={variableName}>
                      <CardContent className="p-4">
                        {editingItem === variableName && tempVariable?.name === variableName ? (
                          // Edit mode
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="variable-name">Name</Label>
                                <Input
                                  id="variable-name"
                                  value={tempVariable.name}
                                  onChange={(e) => setTempVariable({ ...tempVariable, name: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label htmlFor="variable-type">Type</Label>
                                <Select
                                  value={tempVariable.type}
                                  onValueChange={(value) => setTempVariable({ ...tempVariable, type: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="string">String</SelectItem>
                                    <SelectItem value="number">Number</SelectItem>
                                    <SelectItem value="boolean">Boolean</SelectItem>
                                    <SelectItem value="array">Array</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="variable-description">Description</Label>
                              <Textarea
                                id="variable-description"
                                value={tempVariable.description}
                                onChange={(e) => setTempVariable({ ...tempVariable, description: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor="variable-default">Default Value</Label>
                              <Input
                                id="variable-default"
                                value={tempVariable.defaultValue || ''}
                                onChange={(e) => setTempVariable({ ...tempVariable, defaultValue: e.target.value })}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={handleSaveVariable} size="sm">
                                <Save className="w-4 h-4 mr-1" />
                                Save
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setTempVariable(null);
                                  setEditingItem(null);
                                }}
                                size="sm"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // View mode
                          <div>
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold">{variable.name}</h4>
                                <p className="text-sm text-muted-foreground">{variable.description}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">{variable.type}</Badge>
                                {variable.defaultValue !== undefined && (
                                  <Badge variant="outline">Default: {String(variable.defaultValue)}</Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setTempVariable(variable);
                                  setEditingItem(variableName);
                                }}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteVariable(variableName)}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Telemetry Tab */}
            <TabsContent value="telemetry" className="space-y-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Telemetry Configuration</h3>
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="telemetry-enabled"
                            checked={telemetry.enabled}
                            onCheckedChange={(checked) => 
                              updateConfig({ telemetry: { ...telemetry, enabled: checked } })
                            }
                          />
                          <Label htmlFor="telemetry-enabled">Enable Telemetry</Label>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="sampling-rate">Sampling Rate</Label>
                            <Input
                              id="sampling-rate"
                              type="number"
                              min="0"
                              max="1"
                              step="0.1"
                              value={telemetry.tracking.sampling.rate}
                              onChange={(e) => 
                                updateConfig({ 
                                  telemetry: { 
                                    ...telemetry, 
                                    tracking: { 
                                      ...telemetry.tracking, 
                                      sampling: { ...telemetry.tracking.sampling, rate: parseFloat(e.target.value) }
                                    } 
                                  } 
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="max-events">Max Events</Label>
                            <Input
                              id="max-events"
                              type="number"
                              min="0"
                              value={telemetry.tracking.sampling.maxEvents}
                              onChange={(e) => 
                                updateConfig({ 
                                  telemetry: { 
                                    ...telemetry, 
                                    tracking: { 
                                      ...telemetry.tracking, 
                                      sampling: { ...telemetry.tracking.sampling, maxEvents: parseInt(e.target.value) }
                                    } 
                                  } 
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Tracked Events</h4>
                  <div className="flex flex-wrap gap-2">
                    {telemetry.tracking.events.map((event, index) => (
                      <Badge key={index} variant="secondary">{event}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Tracked Metrics</h4>
                  <div className="flex flex-wrap gap-2">
                    {telemetry.tracking.metrics.map((metric, index) => (
                      <Badge key={index} variant="secondary">{metric}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Global Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="config-enabled"
                          checked={config.enabled}
                          onCheckedChange={(checked) => updateConfig({ enabled: checked })}
                        />
                        <Label htmlFor="config-enabled">Enable Narrative System</Label>
                      </div>
                      
                      <div>
                        <Label htmlFor="config-version">Version</Label>
                        <Input
                          id="config-version"
                          value={config.version}
                          onChange={(e) => updateConfig({ version: e.target.value })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{hookIds.length}</p>
                        <p className="text-sm text-muted-foreground">Hooks</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{templateIds.length}</p>
                        <p className="text-sm text-muted-foreground">Templates</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{variableNames.length}</p>
                        <p className="text-sm text-muted-foreground">Variables</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{telemetry.tracking.events.length}</p>
                        <p className="text-sm text-muted-foreground">Tracked Events</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
