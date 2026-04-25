/**
 * NP-255 – Surge Tutorial Narration Configuration
 *
 * Centralized description of narration segments, script entries, and timing
 * settings for the Punch Club Surge tutorial experience.
 */

export type NarrationChannel = 'mentor_voice' | 'sfx' | 'accessibility_text';

export interface VoiceProfile {
  /** Unique identifier for the voice actor / preset */
  id: string;
  /** Target language (IETF tag) */
  locale: string;
  /** Optional pitch offset (-12 .. +12 semitones) */
  pitchSemitones?: number;
  /** Playback rate multiplier */
  rateMultiplier?: number;
  /** Gain applied to the clip */
  gainDb?: number;
}

export interface SfxCue {
  /** Cue identifier in the audio system */
  cueId: string;
  /** Optional gain applied to cue */
  gainDb?: number;
  /** Optional ducking amount for mentor voice (negative dB) */
  duckingDb?: number;
}

export interface NarrationSegmentConfig {
  /** Segment identifier referenced by the engine */
  id: string;
  /** Channel to activate for the segment */
  channel: NarrationChannel;
  /** Key referencing script content */
  scriptKey?: string;
  /** Optional explicit localized text keyed by locale */
  inlineText?: Record<string, string>;
  /** Text announced to screen readers if different from script */
  accessibleText?: Record<string, string>;
  /** Mentor voice configuration */
  voice?: VoiceProfile;
  /** Optional SFX cue */
  sfx?: SfxCue;
  /** Duration hint in milliseconds */
  durationMs?: number;
  /** Crossfade time when transitioning in */
  fadeInMs?: number;
  /** Crossfade time when transitioning out */
  fadeOutMs?: number;
  /** Minimum delay before this segment can repeat */
  minReplayIntervalMs?: number;
  /** Optional prerequisites (other segment ids that must be played first) */
  requires?: string[];
}

export interface TutorialNarrationScriptEntry {
  key: string;
  /** Localized text per locale */
  locales: Record<string, string>;
  /** Optional SSML markup string overriding plain text */
  ssml?: Record<string, string>;
}

export interface TutorialNarrationTimingConfig {
  defaultDurationMs: number;
  defaultFadeMs: number;
  accessibilityAnnouncementDelayMs: number;
}

export interface TutorialNarrationConfig {
  defaultLocale: string;
  fallbackLocale: string;
  timing: TutorialNarrationTimingConfig;
  segments: NarrationSegmentConfig[];
  script: TutorialNarrationScriptEntry[];
}

export const DEFAULT_TUTORIAL_NARRATION_CONFIG: TutorialNarrationConfig = {
  defaultLocale: 'en',
  fallbackLocale: 'en',
  timing: {
    defaultDurationMs: 3500,
    defaultFadeMs: 320,
    accessibilityAnnouncementDelayMs: 200,
  },
  segments: [
    {
      id: 'mentor_intro',
      channel: 'mentor_voice',
      scriptKey: 'mentor.intro',
      voice: {
        id: 'mentor_seraphina',
        locale: 'en',
        pitchSemitones: -1,
      },
      fadeInMs: 250,
      fadeOutMs: 350,
      durationMs: 4200,
    },
    {
      id: 'mentor_combo_hint',
      channel: 'mentor_voice',
      scriptKey: 'mentor.combo_hint',
      voice: {
        id: 'mentor_seraphina',
        locale: 'en',
        pitchSemitones: 1,
        rateMultiplier: 1.05,
      },
      minReplayIntervalMs: 8000,
    },
    {
      id: 'sfx_focus_chime',
      channel: 'sfx',
      sfx: {
        cueId: 'tutorial_chime_glow',
        gainDb: -6,
        duckingDb: -12,
      },
      durationMs: 1200,
    },
    {
      id: 'accessibility_prompt',
      channel: 'accessibility_text',
      scriptKey: 'accessibility.prompt',
      accessibleText: {
        en: 'Mentor guidance available. Swipe right to hear narration.',
        it: 'Guida del mentore disponibile. Scorri a destra per ascoltare.',
      },
    },
  ],
  script: [
    {
      key: 'mentor.intro',
      locales: {
        en: 'Welcome back, fighter. Let me guide you through Surge timing.',
        it: 'Bentornato, combattente. Ti guiderò nel tempismo di Surge.',
      },
    },
    {
      key: 'mentor.combo_hint',
      locales: {
        en: 'Chain your jabs until the meter glows, then unleash Surge.',
        it: 'Concatena i jab finché la barra brilla, poi scatena Surge.',
      },
    },
    {
      key: 'accessibility.prompt',
      locales: {
        en: 'Mentor narration ready. Use accessibility controls to replay.',
        it: 'Narrazione del mentore pronta. Usa i controlli accessibili per riascoltare.',
      },
    },
  ],
};
