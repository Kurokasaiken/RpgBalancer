import type { CombatAnimationScript, CombatTimelineFrame } from './types';
import { mapTimelineToAnimationScripts } from './mapFrameToAnimations';

export interface AnimationQueueItem {
    scriptIndex: number;
    eventIndex: number;
    cumulativeDurationMs: number;
    script: CombatAnimationScript;
}

export interface AnimationQueueBuildResult {
    scripts: CombatAnimationScript[];
    queue: AnimationQueueItem[];
}

/**
 * Builds animation scripts + a flattened queue with cumulative timings.
 * Consumers can use the queue to look ahead or render HUD previews.
 */
export function buildAnimationQueue(frames: CombatTimelineFrame[]): AnimationQueueBuildResult {
    const scripts = mapTimelineToAnimationScripts(frames);
    const queue: AnimationQueueItem[] = [];
    scripts.forEach((script, scriptIndex) => {
        let cumulativeDurationMs = 0;
        script.events.forEach((_, eventIndex) => {
            cumulativeDurationMs += script.events[eventIndex].durationMs;
            queue.push({ scriptIndex, eventIndex, cumulativeDurationMs, script });
        });
    });

    return { scripts, queue };
}
