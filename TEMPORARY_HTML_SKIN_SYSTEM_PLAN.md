# Temporary HTML Skin System Plan

## 1. Objective
Create a **temporary skin system** that allows easy HTML/CSS replacement when high-quality versions are ready (being developed with Claude). Current skins are placeholders that can be swapped out without touching component logic.

## 2. Temporary Skin Architecture

### 2.1 Core Concept
- **Temporary Skins**: Placeholder HTML/CSS that can be easily replaced
- **Skin Slots**: Component-specific containers that accept any HTML/CSS skin
- **Hot-Swap System**: Replace skin content without recompiling components
- **Fallback System**: Always have a working skin even if replacement fails

### 2.2 Skin Structure
```typescript
export interface TemporarySkinConfig {
  id: string;
  name: string;
  version: 'temporary' | 'final';
  
  // HTML Content
  htmlTemplate: string;           // HTML template or component reference
  cssStyles: string;              // CSS styles or stylesheet reference
  
  // Component Mapping
  componentSlots: {
    [componentName: string]: {
      container: string;          // CSS selector for container
      replaceContent: boolean;    // Whether to replace innerHTML or just styles
      preserveStructure: boolean; // Keep existing HTML structure
    };
  };
  
  // Metadata
  author: string;                  // 'temporary' | 'claude' | 'designer'
  quality: 'placeholder' | 'wip' | 'final';
  notes?: string;                 // Development notes
  
  // Replacement Info
  targetVersion?: string;         // Target final version
  compatibility: string[];        // Compatible component versions
}
```

## 3. Implementation Plan

### Phase 1: Temporary Skin Manager (High Priority)

#### 3.1 TemporarySkinManager
**File**: `src/ui/idleVillage/skins/temporary/TemporarySkinManager.ts`

**Responsibilities**:
- Load and manage temporary skin configs
- Handle hot-swapping of skin content
- Validate skin compatibility
- Provide fallback mechanisms

**Key Methods**:
```typescript
class TemporarySkinManager {
  loadSkinConfig(skinId: string): Promise<TemporarySkinConfig>;
  applySkinToComponent(componentName: string, skinId: string): void;
  replaceSkinContent(oldSkinId: string, newSkinId: string): void;
  validateSkinCompatibility(skin: TemporarySkinConfig, component: string): boolean;
  getActiveSkins(): Record<string, TemporarySkinConfig>;
}
```

#### 3.2 Temporary Skin Registry
**File**: `src/ui/idleVillage/skins/temporary/temporarySkinRegistry.ts`

**Content**: Current placeholder skins with easy replacement structure
```typescript
export const TEMPORARY_SKIN_REGISTRY: Record<string, TemporarySkinConfig> = {
  // VillageRosterSection - Current placeholder
  'village_roster_temporary': {
    id: 'village_roster_temporary',
    name: 'Village Roster (Temporary)',
    version: 'temporary',
    htmlTemplate: '<div class="roster-frame">...</div>',
    cssStyles: '.roster-frame { border: 2px solid #666; }',
    componentSlots: {
      VillageRosterSection: {
        container: '.roster-container',
        replaceContent: true,
        preserveStructure: false
      }
    },
    author: 'temporary',
    quality: 'placeholder',
    notes: 'Basic placeholder - will be replaced with high-quality version'
  },
  
  // Target for Claude's high-quality version
  'village_roster_claude_v1': {
    id: 'village_roster_claude_v1',
    name: 'Village Roster (Claude v1)',
    version: 'final',
    htmlTemplate: '', // Will be filled by Claude
    cssStyles: '',     // Will be filled by Claude
    componentSlots: {
      VillageRosterSection: {
        container: '.roster-container',
        replaceContent: true,
        preserveStructure: false
      }
    },
    author: 'claude',
    quality: 'final',
    targetVersion: 'v1.0',
    notes: 'High-quality version being developed with Claude'
  }
};
```

### Phase 2: Component Skin Slots (High Priority)

#### 3.3 Skin Slot Component
**File**: `src/ui/idleVillage/skins/temporary/SkinSlot.tsx`

```typescript
interface SkinSlotProps {
  componentName: string;
  skinId?: string;
  fallbackSkinId?: string;
  className?: string;
  children?: React.ReactNode;
}

export const SkinSlot: React.FC<SkinSlotProps> = ({
  componentName,
  skinId,
  fallbackSkinId = 'default_temporary',
  className,
  children
}) => {
  const { activeSkin, isLoading, error } = useTemporarySkin(componentName, skinId, fallbackSkinId);
  
  if (isLoading) return <div className="skin-loading">Loading skin...</div>;
  if (error) return <div className="skin-error">Skin error: {error}</div>;
  
  return (
    <div 
      className={`skin-slot ${className}`}
      data-skin-id={activeSkin?.id}
      data-component={componentName}
    >
      {children}
    </div>
  );
};
```

#### 3.4 useTemporarySkin Hook
**File**: `src/ui/idleVillage/hooks/useTemporarySkin.ts`

```typescript
export const useTemporarySkin = (
  componentName: string,
  skinId?: string,
  fallbackSkinId?: string
) => {
  const [activeSkin, setActiveSkin] = useState<TemporarySkinConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadSkin = async () => {
      try {
        setIsLoading(true);
        const skin = await TemporarySkinManager.loadSkinConfig(skinId || fallbackSkinId);
        setActiveSkin(skin);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load skin');
        // Try fallback
        if (skinId && fallbackSkinId) {
          const fallback = await TemporarySkinManager.loadSkinConfig(fallbackSkinId);
          setActiveSkin(fallback);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSkin();
  }, [componentName, skinId, fallbackSkinId]);
  
  return { activeSkin, isLoading, error };
};
```

### Phase 3: Convert Existing Components (High Priority)

#### 3.5 VillageRosterSectionSkin Temporary
**File**: `src/ui/idleVillage/components/VillageRosterSectionSkin.tsx`

```typescript
// Before: Permanent skin wrapper
// After: Temporary skin system

export const VillageRosterSectionSkin: React.FC<VillageRosterSectionProps> = (props) => {
  return (
    <SkinSlot 
      componentName="VillageRosterSection"
      skinId="village_roster_temporary"
      fallbackSkinId="village_roster_default"
    >
      <VillageRosterSection {...props} />
    </SkinSlot>
  );
};
```

#### 3.6 ResidentSlotRackSkin Temporary
**File**: `src/ui/idleVillage/components/ResidentSlotRackSkin.tsx`

```typescript
export const ResidentSlotRackSkin: React.FC<ResidentSlotRackProps> = (props) => {
  return (
    <SkinSlot 
      componentName="ResidentSlotRack"
      skinId="slot_rack_temporary"
      fallbackSkinId="slot_rack_default"
    >
      <ResidentSlotRack {...props} />
    </SkinSlot>
  );
};
```

### Phase 4: Hot-Swap System (Medium Priority)

#### 4.1 Skin Replacement API
**File**: `src/ui/idleVillage/skins/temporary/SkinReplacementAPI.ts`

```typescript
export class SkinReplacementAPI {
  // Replace skin for all components
  static replaceGlobalSkin(oldSkinId: string, newSkinId: string): void {
    TemporarySkinManager.replaceSkinContent(oldSkinId, newSkinId);
  }
  
  // Replace skin for specific component
  static replaceComponentSkin(componentName: string, newSkinId: string): void {
    TemporarySkinManager.applySkinToComponent(componentName, newSkinId);
  }
  
  // Load new skin from external source (Claude's output)
  static loadExternalSkin(skinConfig: TemporarySkinConfig): void {
    TEMPORARY_SKIN_REGISTRY[skinConfig.id] = skinConfig;
    TemporarySkinManager.loadSkinConfig(skinConfig.id);
  }
  
  // Preview skin without applying
  static previewSkin(skinId: string): void {
    // Add preview overlay
    document.body.setAttribute('data-skin-preview', skinId);
  }
  
  // Clear preview
  static clearPreview(): void {
    document.body.removeAttribute('data-skin-preview');
  }
}
```

#### 4.2 Developer Tools
**File**: `src/ui/idleVillage/devtools/SkinDevTools.tsx`

```typescript
export const SkinDevTools: React.FC = () => {
  const [availableSkins, setAvailableSkins] = useState<TemporarySkinConfig[]>([]);
  const [activeSkins, setActiveSkins] = useState<Record<string, string>>({});
  
  return (
    <div className="skin-dev-tools">
      <h3>Skin Development Tools</h3>
      
      {/* Skin Selector */}
      <div className="skin-selector">
        <label>Component:</label>
        <select onChange={(e) => setSelectedComponent(e.target.value)}>
          <option value="VillageRosterSection">Village Roster</option>
          <option value="ResidentSlotRack">Slot Rack</option>
          <option value="TimeEngineStrip">Time Engine</option>
        </select>
        
        <label>Skin:</label>
        <select onChange={(e) => applySkin(e.target.value)}>
          {availableSkins.map(skin => (
            <option key={skin.id} value={skin.id}>
              {skin.name} ({skin.author})
            </option>
          ))}
        </select>
      </div>
      
      {/* Import Claude's Skin */}
      <div className="skin-import">
        <h4>Import Claude's Skin</h4>
        <textarea 
          placeholder="Paste Claude's skin JSON here..."
          onChange={(e) => setImportData(e.target.value)}
        />
        <button onClick={() => importClaudeSkin(importData)}>
          Import Skin
        </button>
      </div>
      
      {/* Preview Controls */}
      <div className="preview-controls">
        <button onClick={() => SkinReplacementAPI.previewSkin(selectedSkin)}>
          Preview
        </button>
        <button onClick={() => SkinReplacementAPI.clearPreview()}>
          Clear Preview
        </button>
      </div>
    </div>
  );
};
```

## 4. Claude Integration Workflow

### 4.1 Claude's Output Format
When Claude creates high-quality skins, they should follow this structure:

```typescript
// Claude's skin output
const claudeSkinOutput = {
  id: 'village_roster_claude_v1',
  name: 'Village Roster (Claude High-Quality)',
  version: 'final',
  htmlTemplate: `
    <div class="roster-frame-claude">
      <div class="roster-header-claude">
        <h2 class="roster-title-claude">Village Roster</h2>
      </div>
      <div class="roster-content-claude">
        <!-- High-quality roster content -->
      </div>
    </div>
  `,
  cssStyles: `
    .roster-frame-claude {
      background: linear-gradient(135deg, #2a1810 0%, #4a2818 100%);
      border: 3px solid #8b6914;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      padding: 20px;
    }
    
    .roster-header-claude {
      border-bottom: 2px solid #8b6914;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    
    .roster-title-claude {
      font-family: 'Cinzel', serif;
      font-size: 24px;
      color: #ffd700;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    }
  `,
  componentSlots: {
    VillageRosterSection: {
      container: '.roster-container',
      replaceContent: true,
      preserveStructure: false
    }
  },
  author: 'claude',
  quality: 'final',
  targetVersion: 'v1.0',
  notes: 'High-quality version with detailed styling and animations'
};
```

### 4.2 Import Process
1. Claude generates skin config with HTML/CSS
2. Developer copies JSON into SkinDevTools import textarea
3. System validates and imports the skin
4. Preview mode allows testing before applying
5. One-click replacement of temporary skin

## 5. Implementation Benefits

### 5.1 Easy Replacement
- Zero code changes to swap skins
- Hot-swapping without recompilation
- Preview mode for testing
- Fallback system prevents breakage

### 5.2 Development Workflow
- Work with temporary skins now
- Claude develops high-quality versions in parallel
- Seamless upgrade when ready
- No component logic changes

### 5.3 Quality Assurance
- Validation system for skin compatibility
- Preview mode before applying
- Rollback capability if issues arise
- Version tracking for skin updates

## 6. Success Criteria

### 6.1 Functional Requirements
✅ Temporary skins work as placeholders
✅ Easy replacement with high-quality versions
✅ Hot-swapping without recompilation
✅ Preview mode for testing
✅ Fallback system prevents breakage

### 6.2 Developer Experience
✅ Simple import process for Claude's output
✅ Visual preview of new skins
✅ One-click skin replacement
✅ Clear version tracking
✅ Rollback capability

### 6.3 Technical Requirements
✅ Zero breaking changes to existing components
✅ Backward compatibility with current system
✅ Performance impact < 5ms per skin swap
✅ Full test coverage for skin lifecycle

## 7. Implementation Timeline

### Week 1: Core System (High Priority)
- TemporarySkinManager implementation
- Skin registry with placeholder configs
- SkinSlot component and hook
- Basic component conversion

### Week 2: Hot-Swap System (High Priority)
- SkinReplacementAPI implementation
- SkinDevTools component
- Import/export functionality
- Preview system

### Week 3: Integration & Testing (Medium Priority)
- Complete component conversion
- Integration with TestRosterPage
- Test suite coverage
- Documentation

### Week 4: Claude Integration (Medium Priority)
- Import workflow for Claude's output
- Validation system
- Preview enhancements
- Performance optimization

## 8. Files to Create/Modify

### New Files
- `src/ui/idleVillage/skins/temporary/TemporarySkinManager.ts`
- `src/ui/idleVillage/skins/temporary/temporarySkinRegistry.ts`
- `src/ui/idleVillage/skins/temporary/SkinSlot.tsx`
- `src/ui/idleVillage/hooks/useTemporarySkin.ts`
- `src/ui/idleVillage/skins/temporary/SkinReplacementAPI.ts`
- `src/ui/idleVillage/devtools/SkinDevTools.tsx`

### Modified Files
- `src/ui/idleVillage/components/VillageRosterSectionSkin.tsx`
- `src/ui/idleVillage/components/ResidentSlotRackSkin.tsx`
- `src/ui/idleVillage/components/SlottedMedalSkin.tsx`
- `src/ui/idleVillage/components/ActivityCapsule.tsx`
- `src/ui/idleVillage/TestRosterPage.tsx`

This system allows you to work with temporary skins now and easily replace them with Claude's high-quality versions when ready, without touching component logic.
