import { z } from 'zod';

const PoiActivityConfigSchema = z.object({
  activityId: z.string(),
  slotSourceScenario: z.string().default('open'),
  label: z.string(),
  subtitle: z.string(),
  helperText: z.string().optional(),
  icon: z.string().optional(),
  collectLabel: z.string().default('Collect'),
  skinOverrideId: z.string().optional(),
});
export type SlotLabPoiConfig = z.infer<typeof PoiActivityConfigSchema>;

/**
 * Test harness configuration schema
 */
export const TestHarnessConfigSchema = z.object({
  /** Default harness slot ID */
  defaultSlotId: z.string(),
  /** Test activity metadata */
  activity: z.object({
    label: z.string(),
    helperText: z.string(),
    icon: z.string(),
  }),
  /** Default timer settings for test harness */
  timer: z.object({
    totalDurationSeconds: z.number(),
    elapsedSeconds: z.number(),
    progressFraction: z.number(),
  }),
  /** UI display labels */
  labels: z.object({
    elapsed: z.string(),
    remaining: z.string(),
  }),
  /** Resident defaults applied on harness load */
  residentDefaults: z.object({
    /** Starting fatigue percentage applied to every resident when the page loads */
    startingFatigue: z.number().min(0),
  }),
  /** Optional POI capsule configuration */
  poi: PoiActivityConfigSchema.optional(),
});

export type TestHarnessConfig = z.infer<typeof TestHarnessConfigSchema>;

/**
 * Default test harness configuration
 */
export const DEFAULT_TEST_HARNESS_CONFIG: TestHarnessConfig = {
  defaultSlotId: 'test-harness-slot',
  activity: {
    label: 'Test Activity Harness',
    helperText: 'Drag a resident here to test the ActionDetailHarness component',
    icon: '⚙️',
  },
  timer: {
    totalDurationSeconds: 60,
    elapsedSeconds: 0,
    progressFraction: 0,
  },
  labels: {
    elapsed: '0:00',
    remaining: '1:00',
  },
  residentDefaults: {
    startingFatigue: 0,
  },
  poi: {
    activityId: 'job_gold_mine_minimal',
    slotSourceScenario: 'open',
    label: 'Gold Mine · POI Test',
    subtitle: 'Estrazione oro + drag & drop test',
    helperText: 'Test drag & drop con activity gold mine reale. Monitor slot occupati e raccogli ricompense.',
    icon: '⛏️',
    collectLabel: 'Raccogli oro',
    skinOverrideId: 'poi_wilderness_amber',
  },
};
