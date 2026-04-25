/**
 * NP-036 – Idle Village Audio Cue Configurator
 * 
 * Audio cue playback engine for handling audio cue playback,
 * spatial audio, effects, and performance monitoring.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import type {
  AudioCue,
  AudioCueCategory,
  AudioCueConfig,
  AudioCueEventType,
  AudioCuePlaybackState,
  AudioCueTelemetry,
} from '../types/audioCue';
import { AUDIO_CUE_CATEGORIES, DEFAULT_AUDIO_CUE_CONFIG } from '../types/audioCue';

const createCategoryCounters = (): Record<AudioCueCategory, number> => {
  return AUDIO_CUE_CATEGORIES.reduce((acc, category) => {
    acc[category] = 0;
    return acc;
  }, {} as Record<AudioCueCategory, number>);
};

const getAudioContextConstructor = (): typeof AudioContext => {
  if (typeof window === 'undefined') {
    throw new Error('AudioContext is not available in this environment');
  }

  if ('AudioContext' in window && window.AudioContext) {
    return window.AudioContext;
  }

  const legacyContext = (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (legacyContext) {
    return legacyContext;
  }

  throw new Error('Web Audio API is not supported on this device');
};

/**
 * Audio cue playback instance
 */
interface PlaybackInstance {
  id: string;
  cueId: string;
  eventType: AudioCueEventType;
  audioBufferSource?: AudioBufferSourceNode;
  gainNode: GainNode;
  pannerNode?: PannerNode;
  filterNodes: BiquadFilterNode[];
  compressorNode?: DynamicsCompressorNode;
  reverbNode?: ConvolverNode;
  distortionNode?: WaveShaperNode;
  delayNode?: DelayNode;
  state: AudioCuePlaybackState;
  startTime: number;
  endTime?: number;
  volume: number;
  pitch: number;
  pan: number;
  position?: { x: number; y: number; z: number };
  scheduledStop?: number;
  fadeTimeout?: number;
}

/**
 * Audio cue engine for managing audio playback
 */
export class AudioCueEngine {
  private config: AudioCueConfig;
  private audioContext: AudioContext;
  private masterGainNode: GainNode;
  private categoryGainNodes: Map<string, GainNode>;
  private playbackInstances: Map<string, PlaybackInstance>;
  private activeInstances: Map<string, PlaybackInstance[]>;
  private audioBuffers: Map<string, AudioBuffer>;
  private reverbBuffers: Map<string, AudioBuffer>;
  private telemetry: AudioCueTelemetry;
  private sessionId: string;
  private lastCleanup: number;

  constructor(config: AudioCueConfig = DEFAULT_AUDIO_CUE_CONFIG) {
    this.config = { ...config };
    const AudioContextCtor = getAudioContextConstructor();
    this.audioContext = new AudioContextCtor();
    this.masterGainNode = this.audioContext.createGain();
    this.masterGainNode.connect(this.audioContext.destination);
    this.categoryGainNodes = new Map();
    this.playbackInstances = new Map();
    this.activeInstances = new Map();
    this.audioBuffers = new Map();
    this.reverbBuffers = new Map();
    this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.lastCleanup = Date.now();

    // Initialize telemetry
    this.telemetry = {
      id: `telemetry-${this.sessionId}`,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      playback: {
        totalPlays: 0,
        successfulPlays: 0,
        failedPlays: 0,
        averagePlayTime: 0,
        totalPlayTime: 0,
        cueStatistics: {},
      },
      performance: {
        averageLoadTime: 0,
        averagePlayTime: 0,
        bufferUnderruns: 0,
        audioContextState: this.audioContext.state,
        sampleRate: this.audioContext.sampleRate,
        bufferSize: 0, // Will be set when available
        cpuUsage: 0,
        memoryUsage: 0,
      },
      userInteraction: {
        muteToggles: 0,
        volumeChanges: 0,
        cueInteractions: {},
        categoryInteractions: createCategoryCounters(),
        settingsChanges: 0,
      },
      errors: {
        totalErrors: 0,
        errorTypes: {},
        errorMessages: [],
        affectedCues: [],
        recoveryAttempts: 0,
        successfulRecoveries: 0,
      },
      system: {
        audioContextSupported:
          typeof window !== 'undefined' &&
          (('AudioContext' in window && !!window.AudioContext) || 'webkitAudioContext' in window),
        webAudioSupported: true,
        supportedFormats: this.getSupportedFormats(),
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          hardwareConcurrency: navigator.hardwareConcurrency || 1,
          deviceMemory: (navigator as any).deviceMemory || 1,
        },
      },
      custom: {},
    };

    this.initializeCategoryGainNodes();
    this.initializeReverbBuffers();
  }

  /**
   * Initialize category gain nodes
   */
  private initializeCategoryGainNodes(): void {
    for (const [category, settings] of Object.entries(this.config.categorySettings)) {
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = settings.volume;
      gainNode.connect(this.masterGainNode);
      this.categoryGainNodes.set(category, gainNode);
    }
  }

  /**
   * Initialize reverb buffers
   */
  private initializeReverbBuffers(): void {
    // Create basic reverb impulse responses
    const createReverbBuffer = (duration: number, decay: number): AudioBuffer => {
      const sampleRate = this.audioContext.sampleRate;
      const length = sampleRate * duration;
      const impulse = this.audioContext.createBuffer(2, length, sampleRate);

      for (let channel = 0; channel < 2; channel++) {
        const channelData = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) {
          channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
        }
      }

      return impulse;
    };

    this.reverbBuffers.set('small', createReverbBuffer(0.5, 2));
    this.reverbBuffers.set('medium', createReverbBuffer(1, 2));
    this.reverbBuffers.set('large', createReverbBuffer(2, 1.5));
  }

  /**
   * Get supported audio formats
   */
  private getSupportedFormats(): string[] {
    const formats = [];
    const audio = document.createElement('audio');

    if (audio.canPlayType('audio/mpeg')) formats.push('mp3');
    if (audio.canPlayType('audio/ogg')) formats.push('ogg');
    if (audio.canPlayType('audio/wav')) formats.push('wav');
    if (audio.canPlayType('audio/aac')) formats.push('aac');
    if (audio.canPlayType('audio/webm')) formats.push('webm');

    return formats;
  }

  /**
   * Update configuration
   */
  updateConfig(config: AudioCueConfig): void {
    this.config = { ...config };
    this.applyConfigSettings();
    this.telemetry.userInteraction.settingsChanges++;
  }

  /**
   * Apply configuration settings
   */
  private applyConfigSettings(): void {
    // Update master volume
    this.masterGainNode.gain.value = this.config.settings.masterVolume;

    // Update category volumes
    for (const [category, settings] of Object.entries(this.config.categorySettings)) {
      const gainNode = this.categoryGainNodes.get(category);
      if (gainNode) {
        gainNode.gain.value = settings.volume;
      }
    }

    // Resume audio context if suspended
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  /**
   * Load audio buffer for a cue
   */
  private async loadAudioBuffer(cue: AudioCue): Promise<AudioBuffer | null> {
    const startTime = performance.now();

    try {
      switch (cue.source.type) {
        case 'file':
        case 'url':
          const response = await fetch(cue.source.url || cue.source.path!);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = await this.audioContext.decodeAudioData(arrayBuffer);
          this.audioBuffers.set(cue.id, buffer);
          return buffer;

        case 'generated':
          if (cue.source.waveform) {
            const buffer = this.generateWaveformBuffer(cue.source.waveform);
            this.audioBuffers.set(cue.id, buffer);
            return buffer;
          }
          return null;

        case 'silence':
          const silenceBuffer = this.audioContext.createBuffer(1, 
            (cue.source.duration || 0.1) * this.audioContext.sampleRate, 
            this.audioContext.sampleRate);
          this.audioBuffers.set(cue.id, silenceBuffer);
          return silenceBuffer;

        default:
          return null;
      }
    } catch (error) {
      this.recordError('buffer_load_failed', `Failed to load audio buffer for cue ${cue.id}: ${error}`, cue.id);
      return null;
    } finally {
      const loadTime = performance.now() - startTime;
      this.updatePerformanceMetrics('loadTime', loadTime);
    }
  }

  /**
   * Generate waveform buffer
   */
  private generateWaveformBuffer(waveform: any): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = waveform.duration;
    const length = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const phase = waveform.frequency * t * 2 * Math.PI;

      switch (waveform.type) {
        case 'sine':
          channelData[i] = Math.sin(phase) * waveform.amplitude;
          break;
        case 'square':
          channelData[i] = Math.sign(Math.sin(phase)) * waveform.amplitude;
          break;
        case 'sawtooth':
          channelData[i] = (2 * (t * waveform.frequency - Math.floor(t * waveform.frequency + 0.5))) * waveform.amplitude;
          break;
        case 'triangle':
          channelData[i] = (2 * Math.abs(2 * (t * waveform.frequency - Math.floor(t * waveform.frequency + 0.5))) - 1) * waveform.amplitude;
          break;
        case 'noise':
          channelData[i] = (Math.random() * 2 - 1) * waveform.amplitude;
          break;
      }

      // Apply envelope
      const envelope = waveform.envelope;
      if (t < envelope.attack) {
        channelData[i] *= t / envelope.attack;
      } else if (t < envelope.attack + envelope.decay) {
        channelData[i] *= 1 - (1 - envelope.sustain) * (t - envelope.attack) / envelope.decay;
      } else {
        channelData[i] *= envelope.sustain * Math.exp(-(t - envelope.attack - envelope.decay) / envelope.release);
      }
    }

    return buffer;
  }

  /**
   * Play audio cue
   */
  async playCue(cueId: string, eventType: AudioCueEventType, options: {
    volume?: number;
    pitch?: number;
    pan?: number;
    position?: { x: number; y: number; z: number };
    loop?: boolean;
    fadeIn?: number;
    fadeOut?: number;
    delay?: number;
  } = {}): Promise<string | null> {
    const cue = this.config.cues.find(c => c.id === cueId);
    if (!cue) {
      this.recordError('cue_not_found', `Audio cue ${cueId} not found`, cueId);
      return null;
    }

    // Check concurrency limits
    const categorySettings = this.config.categorySettings[cue.category];
    const activeInCategory = this.activeInstances.get(cue.category) || [];
    if (activeInCategory.length >= categorySettings.maxConcurrent) {
      // Stop lowest priority cue if needed
      const lowestPriority = activeInCategory.reduce((min, inst) => 
        this.getPriorityValue(inst.cueId) < this.getPriorityValue(min.cueId) ? inst : min
      );
      if (this.getPriorityValue(cueId) > this.getPriorityValue(lowestPriority.cueId)) {
        this.stopInstance(lowestPriority.id);
      } else {
        return null; // Cannot play due to concurrency limit
      }
    }

    // Load audio buffer if not cached
    let buffer = this.audioBuffers.get(cueId);
    if (!buffer) {
      buffer = await this.loadAudioBuffer(cue);
      if (!buffer) return null;
    }

    // Create playback instance
    const instanceId = `instance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const instance: PlaybackInstance = {
      id: instanceId,
      cueId,
      eventType,
      gainNode: this.audioContext.createGain(),
      filterNodes: [],
      state: 'loading',
      startTime: Date.now(),
      volume: options.volume ?? cue.playback.volume,
      pitch: options.pitch ?? cue.playback.pitch,
      pan: options.pan ?? cue.playback.pan,
      position: options.position,
    };

    // Connect to category gain node
    const categoryGainNode = this.categoryGainNodes.get(cue.category);
    if (categoryGainNode) {
      instance.gainNode.connect(categoryGainNode);
    } else {
      instance.gainNode.connect(this.masterGainNode);
    }

    // Create spatial audio if position provided
    if (instance.position || cue.spatial) {
      instance.pannerNode = this.audioContext.createPanner();
      instance.pannerNode.connect(instance.gainNode);
      instance.gainNode = this.audioContext.createGain();
      instance.gainNode.connect(instance.pannerNode);
    }

    // Apply effects
    this.applyEffects(instance, cue);

    // Create audio buffer source
    instance.audioBufferSource = this.audioContext.createBufferSource();
    instance.audioBufferSource.buffer = buffer;
    instance.audioBufferSource.playbackRate.value = instance.pitch;

    // Connect source to gain node
    if (instance.pannerNode) {
      instance.audioBufferSource.connect(instance.pannerNode);
    } else {
      instance.audioBufferSource.connect(instance.gainNode);
    }

    // Set volume with fade in
    const fadeIn = options.fadeIn ?? cue.playback.fadeIn;
    if (fadeIn > 0) {
      instance.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      instance.gainNode.gain.linearRampToValueAtTime(instance.volume, this.audioContext.currentTime + fadeIn);
    } else {
      instance.gainNode.gain.value = instance.volume;
    }

    // Set pan
    if (instance.pannerNode) {
      instance.pannerNode.positionX.value = instance.position?.x ?? cue.spatial?.position.x ?? 0;
      instance.pannerNode.positionY.value = instance.position?.y ?? cue.spatial?.position.y ?? 0;
      instance.pannerNode.positionZ.value = instance.position?.z ?? cue.spatial?.position.z ?? 0;
    }

    // Schedule playback
    const delay = options.delay ?? cue.playback.delay;
    const startTime = this.audioContext.currentTime + delay;
    instance.audioBufferSource.start(startTime);

    // Handle loop
    const loop = options.loop ?? (cue.playback.loop !== 'none');
    if (loop) {
      instance.audioBufferSource.loop = true;
    }

    // Schedule stop if max duration or fade out
    const maxDuration = cue.playback.maxDuration;
    const fadeOut = options.fadeOut ?? cue.playback.fadeOut;
    const endTime = startTime + (maxDuration || buffer.duration);

    if (fadeOut > 0 && !loop) {
      instance.gainNode.gain.setValueAtTime(instance.volume, endTime - fadeOut);
      instance.gainNode.gain.linearRampToValueAtTime(0, endTime);
      instance.scheduledStop = endTime;
    }

    instance.audioBufferSource.onended = () => {
      this.onPlaybackEnd(instanceId);
    };

    // Update state
    instance.state = 'playing';
    this.playbackInstances.set(instanceId, instance);
    this.addToActiveInstances(instance);

    // Update telemetry
    this.updatePlaybackMetrics(cueId, 'start');

    return instanceId;
  }

  /**
   * Apply audio effects to instance
   */
  private applyEffects(instance: PlaybackInstance, cue: AudioCue): void {
    let lastNode: AudioNode = instance.gainNode;

    // Filters
    for (const filter of cue.effects.filters) {
      const filterNode = this.audioContext.createBiquadFilter();
      filterNode.type = filter.type as BiquadFilterType;
      filterNode.frequency.value = filter.frequency;
      filterNode.Q.value = filter.Q;
      if (filter.gain !== undefined) {
        filterNode.gain.value = filter.gain;
      }

      lastNode.connect(filterNode);
      lastNode = filterNode;
      instance.filterNodes.push(filterNode);
    }

    // Compressor
    if (cue.effects.compression) {
      const compressor = this.audioContext.createDynamicsCompressor();
      compressor.threshold.value = cue.effects.compression.threshold;
      compressor.knee.value = cue.effects.compression.knee;
      compressor.ratio.value = cue.effects.compression.ratio;
      compressor.attack.value = cue.effects.compression.attack;
      compressor.release.value = cue.effects.compression.release;

      lastNode.connect(compressor);
      lastNode = compressor;
      instance.compressorNode = compressor;
    }

    // Reverb
    if (cue.effects.reverb) {
      const reverb = this.audioContext.createConvolver();
      const reverbBuffer = this.reverbBuffers.get('medium'); // Default to medium
      if (reverbBuffer) {
        reverb.buffer = reverbBuffer;
      }

      const wetGain = this.audioContext.createGain();
      wetGain.gain.value = cue.effects.reverb.wetLevel;
      const dryGain = this.audioContext.createGain();
      dryGain.gain.value = cue.effects.reverb.dryLevel;

      lastNode.connect(reverb);
      reverb.connect(wetGain);
      lastNode.connect(dryGain);

      const merger = this.audioContext.createChannelMerger(2);
      wetGain.connect(merger);
      dryGain.connect(merger);

      lastNode = merger;
      instance.reverbNode = reverb;
    }

    // Distortion
    if (cue.effects.distortion) {
      const distortion = this.audioContext.createWaveShaper();
      const k = cue.effects.distortion.amount;
      const samples = 44100;
      const curve = new Float32Array(samples);
      const deg = Math.PI / 180;

      for (let i = 0; i < samples; i++) {
        const x = (i * 2) / samples - 1;
        curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
      }

      distortion.curve = curve;
      distortion.oversample = cue.effects.distortion.oversample as OverSampleType;

      lastNode.connect(distortion);
      lastNode = distortion;
      instance.distortionNode = distortion;
    }

    // Delay
    if (cue.effects.delay) {
      const delay = this.audioContext.createDelay();
      delay.delayTime.value = cue.effects.delay.delayTime;

      const feedback = this.audioContext.createGain();
      feedback.gain.value = cue.effects.delay.feedback;

      const wetGain = this.audioContext.createGain();
      wetGain.gain.value = cue.effects.delay.wetLevel;

      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(wetGain);

      lastNode.connect(delay);
      lastNode.connect(wetGain);

      const merger = this.audioContext.createChannelMerger(2);
      lastNode.connect(merger, 0, 0);
      wetGain.connect(merger, 0, 1);

      lastNode = merger;
      instance.delayNode = delay;
    }

    // Connect to final destination
    if (instance.pannerNode) {
      lastNode.connect(instance.pannerNode);
    } else {
      lastNode.connect(instance.gainNode);
    }
  }

  /**
   * Stop playback instance
   */
  stopInstance(instanceId: string): void {
    const instance = this.playbackInstances.get(instanceId);
    if (!instance) return;

    if (instance.audioBufferSource) {
      try {
        instance.audioBufferSource.stop();
      } catch (e) {
        // Already stopped
      }
    }

    instance.state = 'stopped';
    this.removeFromActiveInstances(instance);
    this.updatePlaybackMetrics(instance.cueId, 'stop');
  }

  /**
   * Pause playback instance
   */
  pauseInstance(instanceId: string): void {
    const instance = this.playbackInstances.get(instanceId);
    if (!instance || instance.state !== 'playing') return;

    // Web Audio API doesn't support pausing, so we stop and remember position
    if (instance.audioBufferSource) {
      instance.audioBufferSource.stop();
    }

    instance.state = 'paused';
  }

  /**
   * Resume playback instance
   */
  resumeInstance(instanceId: string): void {
    const instance = this.playbackInstances.get(instanceId);
    if (!instance || instance.state !== 'paused') return;

    // Would need to restart from paused position - simplified for now
    instance.state = 'playing';
  }

  /**
   * Get priority value
   */
  private getPriorityValue(cueId: string): number {
    const cue = this.config.cues.find(c => c.id === cueId);
    if (!cue) return 0;

    switch (cue.priority) {
      case 'low': return 1;
      case 'medium': return 2;
      case 'high': return 3;
      case 'critical': return 4;
      default: return 0;
    }
  }

  /**
   * Add to active instances
   */
  private addToActiveInstances(instance: PlaybackInstance): void {
    const cue = this.config.cues.find(c => c.id === instance.cueId);
    if (!cue) return;

    const category = cue.category;
    if (!this.activeInstances.has(category)) {
      this.activeInstances.set(category, []);
    }
    this.activeInstances.get(category)!.push(instance);
  }

  /**
   * Remove from active instances
   */
  private removeFromActiveInstances(instance: PlaybackInstance): void {
    const cue = this.config.cues.find(c => c.id === instance.cueId);
    if (!cue) return;

    const category = cue.category;
    const instances = this.activeInstances.get(category) || [];
    const index = instances.indexOf(instance);
    if (index > -1) {
      instances.splice(index, 1);
    }
  }

  /**
   * Handle playback end
   */
  private onPlaybackEnd(instanceId: string): void {
    const instance = this.playbackInstances.get(instanceId);
    if (!instance) return;

    instance.state = 'completed';
    instance.endTime = Date.now();

    this.removeFromActiveInstances(instance);
    this.updatePlaybackMetrics(instance.cueId, 'end');

    // Cleanup after delay
    setTimeout(() => {
      this.playbackInstances.delete(instanceId);
    }, 1000);
  }

  /**
   * Update playback metrics
   */
  private updatePlaybackMetrics(cueId: string, event: 'start' | 'stop' | 'end'): void {
    if (!this.config.analytics.enabled || !this.config.analytics.tracking.playbackEvents) return;

    const stats = this.telemetry.playback.cueStatistics[cueId] || {
      plays: 0,
      successes: 0,
      failures: 0,
      averageDuration: 0,
      lastPlayed: 0,
    };

    switch (event) {
      case 'start':
        stats.plays++;
        stats.lastPlayed = Date.now();
        this.telemetry.playback.totalPlays++;
        break;
      case 'end':
        stats.successes++;
        this.telemetry.playback.successfulPlays++;
        break;
    }

    this.telemetry.playback.cueStatistics[cueId] = stats;
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(metric: string, value: number): void {
    if (!this.config.analytics.enabled || !this.config.analytics.tracking.performanceMetrics) return;

    switch (metric) {
      case 'loadTime':
        this.telemetry.performance.averageLoadTime = 
          (this.telemetry.performance.averageLoadTime + value) / 2;
        break;
      case 'playTime':
        this.telemetry.performance.averagePlayTime = 
          (this.telemetry.performance.averagePlayTime + value) / 2;
        break;
    }
  }

  /**
   * Record error
   */
  private recordError(type: string, message: string, cueId?: string): void {
    this.telemetry.errors.totalErrors++;
    
    if (!this.telemetry.errors.errorTypes[type]) {
      this.telemetry.errors.errorTypes[type] = 0;
    }
    this.telemetry.errors.errorTypes[type]++;

    this.telemetry.errors.errorMessages.push(message);
    if (cueId) {
      this.telemetry.errors.affectedCues.push(cueId);
    }
  }

  /**
   * Cleanup old instances
   */
  private cleanup(): void {
    const now = Date.now();
    if (now - this.lastCleanup < 30000) return; // Cleanup every 30 seconds

    for (const [id, instance] of this.playbackInstances) {
      if (instance.state === 'completed' && now - (instance.endTime || 0) > 5000) {
        this.playbackInstances.delete(id);
      }
    }

    this.lastCleanup = now;
  }

  /**
   * Get current telemetry
   */
  getTelemetry(): AudioCueTelemetry {
    return { ...this.telemetry };
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    this.config.settings.masterVolume = Math.max(0, Math.min(1, volume));
    this.masterGainNode.gain.value = volume;
    this.telemetry.userInteraction.volumeChanges++;
  }

  /**
   * Set category volume
   */
  setCategoryVolume(category: string, volume: number): void {
    if (this.config.categorySettings[category as keyof typeof this.config.categorySettings]) {
      this.config.categorySettings[category as keyof typeof this.config.categorySettings].volume = Math.max(0, Math.min(1, volume));
      const gainNode = this.categoryGainNodes.get(category);
      if (gainNode) {
        gainNode.gain.value = volume;
      }
    }
  }

  /**
   * Toggle master mute
   */
  toggleMasterMute(): void {
    this.config.settings.masterMute = !this.config.settings.masterMute;
    this.masterGainNode.gain.value = this.config.settings.masterMute ? 0 : this.config.settings.masterVolume;
    this.telemetry.userInteraction.muteToggles++;
  }

  /**
   * Get active instances count
   */
  getActiveInstancesCount(): number {
    return this.playbackInstances.size;
  }

  /**
   * Dispose engine
   */
  dispose(): void {
    // Stop all instances
    for (const instance of this.playbackInstances.values()) {
      this.stopInstance(instance.id);
    }

    // Close audio context
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }

    // Clear collections
    this.playbackInstances.clear();
    this.activeInstances.clear();
    this.audioBuffers.clear();
    this.reverbBuffers.clear();
  }
}
