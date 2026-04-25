import type { IdleVillageTestHooks, AppNavControls } from './helpers/testTypes';
import type { MinimalGameplayDebugApi } from '@/ui/idleVillage/MinimalGameplayPage';

// Type declarations for global variables used in tests

declare global {
    interface Window extends IdleVillageTestHooks {
        __idleVillageReady?: boolean;
        __idleVillagePunchClubReady?: boolean;
        __IDLE_VILLAGE_FORCED_SHELL_PRESET?: string;
        __appNavControls?: AppNavControls;
        __MINIMAL_GAMEPLAY_DEBUG__?: MinimalGameplayDebugApi;
    }
}

export {}; // This file needs to be a module
