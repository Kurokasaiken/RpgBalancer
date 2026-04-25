# ActivityCapsule Migration Guide
## IV-ACT-LEGACY-CLEANUP-006

### Overview
ActivityActionCard is deprecated and will be removed in a future release. This guide helps migrate to the new ActivityCapsule wrapper system.

### New Architecture
- **ActivityCapsuleWrapper**: Central component that uses `resolveActionCardProps` and renders appropriate wrapper
- **Specific Wrappers**: JobCard, QuestCard, TrainingCard, MaintenanceCard
- **Flag Control**: `VILLAGE_ACTIONCARDS_V2=true` enables new system

### Migration Steps

#### 1. Replace Imports
```typescript
// OLD
import ActivityActionCard from '@/ui/idleVillage/components/ActivityActionCard';

// NEW
import { ActivityCapsuleWrapper } from '@/ui/idleVillage/components/ActivityCapsuleWrapper';
```

#### 2. Update Component Usage
```typescript
// OLD
<ActivityActionCard
  slotId="slot-1"
  label="Job Name"
  helperText="Description"
  icon="⚔️"
  progressFraction={0.5}
  elapsedSeconds={60}
  totalDurationSeconds={120}
  variant="detail"
  dropState="idle"
  canAcceptDrop={true}
  onClick={handleClick}
  onWorkerDrop={handleDrop}
/>

// NEW (with config-first)
<ActivityCapsuleWrapper
  activity={config.activities.jobId}
  config={idleVillageConfig}
  residents={residents}
  onCollect={handleCollect}
  dataTestId={`activity-capsule-${jobId}`}
/>
```

#### 3. Update Props Structure
The new system uses `resolveActionCardProps` to generate wrapper props from:
- `activity`: ActivityDefinition from config
- `config`: IdleVillageConfig
- `residents`: Record<string, ResidentState>
- `scheduled?: ScheduledActivity` (optional)

#### 4. Component-Specific Migration

##### ActiveActivityHUD
```typescript
// Already migrated - uses conditional rendering
{config && residents ? (
  <ActivityCapsuleWrapper
    activity={summary.activity}
    scheduled={scheduled}
    config={config}
    residents={residents}
    onCollect={handleClick}
    dataTestId={`active-hud-${scheduled.id}`}
  />
) : (
  <ActivityActionCard {...legacyProps} />
)}
```

##### BoutCard & GymShiftCard
```typescript
// Already migrated - same pattern as ActiveActivityHUD
{config && residents ? (
  <ActivityCapsuleWrapper
    activity={activity}
    config={config}
    residents={residents}
    onCollect={handleCollect}
    dataTestId={`bout-${activity.id}`}
  />
) : (
  <ActivityActionCard {...legacyProps} />
)}
```

#### 5. Test Migration
Update test mocks to use ActionCardWrapper instead of ActivityActionCard:

```typescript
// OLD
vi.mock('@/ui/idleVillage/components/ActivityActionCard', () => ({
  default: vi.fn((props) => <div data-testid={`activity-card-${props.slotId}`} />),
}));

// NEW
vi.mock('@/ui/idleVillage/components/ActivityCapsuleWrapper', () => ({
  ActivityCapsuleWrapper: vi.fn((props) => <div data-testid={`activity-capsule-wrapper-${props.dataTestId}`} />),
}));
```

### Fallback Strategy
During migration, use conditional rendering to maintain compatibility:

```typescript
{useActionCardsV2() ? (
  <ActivityCapsuleWrapper {...newProps} />
) : (
  <ActivityActionCard {...legacyProps} />
)}
```

### Files to Update
1. ✅ `ActiveActivityHUD.tsx` - Already migrated
2. ✅ `BoutCard.tsx` - Already migrated  
3. ✅ `GymShiftCard.tsx` - Already migrated
4. ✅ `TestRosterPage.tsx` - Already migrated
5. ⏳ `ActivityActionCard.stories.tsx` - Update Storybook
6. ⏳ Test files - Update mocks

### Verification
- [ ] Set `VILLAGE_ACTIONCARDS_V2=true` in `.env.local`
- [ ] Test all surfaces render correctly
- [ ] Verify drag/drop functionality
- [ ] Check telemetry events
- [ ] Run test suite

### Removal Timeline
- **Phase 1**: Add deprecation warnings ✅
- **Phase 2**: Migrate all consumers 
- **Phase 3**: Remove ActivityActionCard component
- **Phase 4**: Remove fallback logic

### Help
For questions about migration, reference:
- IV-ACT-INTEG-004 integration log
- resolveActionCardProps documentation
- Individual wrapper component docs
