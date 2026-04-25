/**
 * Social Share System
 * 
 * Core social sharing functionality with Web Share API integration,
 * screenshot capture, and platform-specific sharing.
 * 
 * @author RPG Balancer Team
 * @since 2026-01-24
 */

import { 
  SocialShareConfig, 
  ShareTemplate, 
  SocialPlatform,
  getPlatform,
  getTemplate,
  isWebShareSupported,
  isClipboardSupported,
  isScreenCaptureSupported,
  DEFAULT_SOCIAL_SHARE_CONFIG
} from './config/socialShareConfig';

/**
 * Share data interface
 */
export interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  image?: string;
  templateId?: string;
  platformId?: string;
  metadata?: Record<string, any>;
}

/**
 * Screenshot options
 */
export interface ScreenshotOptions {
  element?: HTMLElement;
  quality?: number;
  format?: 'png' | 'jpeg' | 'webp';
  scale?: number;
  backgroundColor?: string;
  padding?: number;
  watermark?: {
    text: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    opacity: number;
  };
}

/**
 * Share result interface
 */
export interface ShareResult {
  success: boolean;
  platform?: string;
  method: 'web-share' | 'custom-url' | 'clipboard' | 'fallback';
  error?: string;
  screenshot?: string;
  timestamp: number;
}

/**
 * Social Share class
 */
export class SocialShare {
  private config: SocialShareConfig;
  private telemetryEnabled: boolean;

  constructor(config: SocialShareConfig = DEFAULT_SOCIAL_SHARE_CONFIG) {
    this.config = config;
    this.telemetryEnabled = config.telemetry.enabled;
  }

  /**
   * Share content using Web Share API or fallback methods
   */
  async share(data: ShareData): Promise<ShareResult> {
    const startTime = Date.now();
    
    try {
      this.emitTelemetry('social_share_attempted', { data, method: 'auto' });

      // Process template if provided
      const processedData = await this.processTemplate(data);
      
      // Try Web Share API first
      if (isWebShareSupported() && !data.platformId) {
        const result = await this.shareWithWebShare(processedData);
        this.emitTelemetry('social_share_completed', { ...result, duration: Date.now() - startTime });
        return result;
      }

      // Try platform-specific sharing
      if (data.platformId) {
        const result = await this.shareWithPlatform(processedData, data.platformId);
        this.emitTelemetry('social_share_completed', { ...result, duration: Date.now() - startTime });
        return result;
      }

      // Fallback to clipboard or custom URL
      const result = await this.shareFallback(processedData);
      this.emitTelemetry('social_share_completed', { ...result, duration: Date.now() - startTime });
      return result;

    } catch (error) {
      const result: ShareResult = {
        success: false,
        platform: data.platformId,
        method: 'fallback',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
      
      this.emitTelemetry('social_share_failed', { ...result, duration: Date.now() - startTime });
      return result;
    }
  }

  /**
   * Share using Web Share API
   */
  private async shareWithWebShare(data: ShareData): Promise<ShareResult> {
    if (!isWebShareSupported()) {
      throw new Error('Web Share API not supported');
    }

    try {
      await navigator.share({
        title: data.title,
        text: data.text,
        url: data.url,
      });

      return {
        success: true,
        method: 'web-share',
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`Web Share failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Share using platform-specific URL
   */
  private async shareWithPlatform(data: ShareData, platformId: string): Promise<ShareResult> {
    const platform = getPlatform(this.config, platformId);
    if (!platform) {
      throw new Error(`Platform ${platformId} not found`);
    }

    const shareUrl = this.buildShareUrl(platform, data);
    
    // Try to open in new window
    try {
      window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
      
      return {
        success: true,
        platform: platformId,
        method: 'custom-url',
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`Failed to open share dialog: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fallback sharing method
   */
  private async shareFallback(data: ShareData): Promise<ShareResult> {
    const { fallback } = this.config;

    // Try clipboard first
    if (fallback.copyToClipboard && isClipboardSupported()) {
      try {
        const textToCopy = `${data.title || ''}\n${data.text || ''}\n${data.url || ''}`.trim();
        await navigator.clipboard.writeText(textToCopy);
        
        return {
          success: true,
          method: 'clipboard',
          timestamp: Date.now(),
        };
      } catch (error) {
        console.warn('Clipboard fallback failed:', error);
      }
    }

    // Try custom share URL
    if (fallback.customShareUrl) {
      try {
        window.open(fallback.customShareUrl, '_blank');
        return {
          success: true,
          method: 'fallback',
          timestamp: Date.now(),
        };
      } catch (error) {
        console.warn('Custom share URL failed:', error);
      }
    }

    // Show share dialog if supported
    if (fallback.showShareDialog && isWebShareSupported()) {
      return this.shareWithWebShare(data);
    }

    throw new Error('All sharing methods failed');
  }

  /**
   * Build platform-specific share URL
   */
  private buildShareUrl(platform: SocialPlatform, data: ShareData): string {
    const params = new URLSearchParams();
    
    if (data.text) {
      if (platform.id === 'twitter') {
        params.set('text', data.text);
        if (data.url) params.set('url', data.url);
      } else if (platform.id === 'facebook') {
        params.set('u', data.url || window.location.href);
      } else if (platform.id === 'linkedin') {
        params.set('url', data.url || window.location.href);
        params.set('title', data.title || '');
        params.set('summary', data.text || '');
      } else if (platform.id === 'reddit') {
        params.set('url', data.url || window.location.href);
        params.set('title', data.title || '');
      } else if (platform.id === 'telegram') {
        params.set('url', data.url || window.location.href);
        params.set('text', data.text);
      } else if (platform.id === 'whatsapp') {
        const phone = ''; // Can be configured for specific phone numbers
        params.set('phone', phone);
        params.set('text', `${data.text || ''} ${data.url || ''}`.trim());
      }
    }

    return `${platform.baseUrl}?${params.toString()}`;
  }

  /**
   * Process template with data substitution
   */
  private async processTemplate(data: ShareData): Promise<ShareData> {
    if (!data.templateId) {
      return data;
    }

    const template = getTemplate(this.config, data.templateId);
    if (!template) {
      return data;
    }

    const processed = { ...data };
    
    // Substitute template variables
    processed.title = this.substituteVariables(template.title, data.metadata || {});
    processed.text = this.substituteVariables(template.text, data.metadata || {});
    
    // Add hashtags if supported
    if (template.hashtags && template.hashtags.length > 0) {
      const hashtags = template.hashtags.map(tag => `#${tag}`).join(' ');
      processed.text = `${processed.text} ${hashtags}`;
    }

    return processed;
  }

  /**
   * Substitute variables in template strings
   */
  private substituteVariables(text: string, variables: Record<string, any>): string {
    return text.replace(/\{(\w+)\}/g, (match, key) => {
      return variables[key] || match;
    });
  }

  /**
   * Capture screenshot of element
   */
  async captureScreenshot(options: ScreenshotOptions = {}): Promise<string> {
    try {
      this.emitTelemetry('screenshot_captured', { options });

      if (!isScreenCaptureSupported()) {
        throw new Error('Screen capture not supported');
      }

      const config = this.config.screenshot;
      const finalOptions = { ...config, ...options };

      // If element is provided, capture it
      if (finalOptions.element) {
        return this.captureElementScreenshot(finalOptions);
      }

      // Otherwise capture current tab
      return this.captureTabScreenshot(finalOptions);

    } catch (error) {
      this.emitTelemetry('screenshot_failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Capture screenshot of specific element
   */
  private async captureElementScreenshot(options: ScreenshotOptions): Promise<string> {
    const { element, quality = 0.9, format = 'png', scale = 2 } = options;

    if (!element) {
      throw new Error('Element not provided');
    }

    // Use html2canvas or similar library for element screenshots
    // For now, return a placeholder implementation
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Set canvas size based on element
    const rect = element.getBoundingClientRect();
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;

    // Draw element (simplified implementation)
    ctx.fillStyle = options.backgroundColor || '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add watermark if configured
    if (options.watermark) {
      this.addWatermark(ctx, canvas, options.watermark);
    }

    return canvas.toDataURL(`image/${format}`, quality);
  }

  /**
   * Capture screenshot of current tab
   */
  private async captureTabScreenshot(options: ScreenshotOptions): Promise<string> {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          mediaSource: 'screen',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      // Wait for video to load
      await new Promise(resolve => {
        video.onloadedmetadata = resolve;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      // Stop the stream
      stream.getTracks().forEach(track => track.stop());

      return canvas.toDataURL(`image/${options.format || 'png'}`, options.quality || 0.9);
    } catch (error) {
      throw new Error(`Screen capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add watermark to screenshot
   */
  private addWatermark(
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement, 
    watermark: { text: string; position: string; opacity: number }
  ): void {
    ctx.save();
    ctx.globalAlpha = watermark.opacity;
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const padding = 20;
    let x = padding;
    let y = padding;

    // Position watermark
    switch (watermark.position) {
      case 'top-right':
        x = canvas.width - ctx.measureText(watermark.text).width - padding;
        break;
      case 'bottom-left':
        y = canvas.height - 20 - padding;
        break;
      case 'bottom-right':
        x = canvas.width - ctx.measureText(watermark.text).width - padding;
        y = canvas.height - 20 - padding;
        break;
    }

    ctx.fillText(watermark.text, x, y);
    ctx.restore();
  }

  /**
   * Emit telemetry event
   */
  private emitTelemetry(event: string, data: any): void {
    if (!this.telemetryEnabled) return;

    // Emit to analytics system
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', event, data);
    }

    // Also emit to custom event system
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('social_share_telemetry', {
        detail: { event, data, timestamp: Date.now() }
      }));
    }
  }

  /**
   * Get supported platforms
   */
  getSupportedPlatforms(): SocialPlatform[] {
    return this.config.platforms.filter(p => p.supported);
  }

  /**
   * Get available templates
   */
  getAvailableTemplates(): ShareTemplate[] {
    return this.config.templates;
  }

  /**
   * Check if sharing is supported
   */
  isSupported(): boolean {
    return isWebShareSupported() || isClipboardSupported() || this.config.fallback.showShareDialog;
  }
}

/**
 * Default social share instance
 */
export const socialShare = new SocialShare();
