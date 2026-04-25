/**
 * Social Share Configuration
 * 
 * Config-first social sharing system with Web Share API integration,
 * screenshot templates, and platform-specific content.
 * 
 * @author RPG Balancer Team
 * @since 2026-01-24
 */

import { z } from 'zod';

/**
 * Social media platform configuration
 */
export const SocialPlatformSchema = z.object({
  id: z.string(),
  name: z.string(),
  baseUrl: z.string(),
  icon: z.string(),
  color: z.string(),
  supported: z.boolean(),
  maxTextLength: z.number().optional(),
});

/**
 * Share content template configuration
 */
export const ShareTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  text: z.string(),
  url: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
});

/**
 * Screenshot configuration for sharing
 */
export const ScreenshotConfigSchema = z.object({
  enabled: z.boolean(),
  quality: z.number().min(0.1).max(1),
  format: z.enum(['png', 'jpeg', 'webp']),
  scale: z.number().min(0.5).max(3),
  backgroundColor: z.string(),
  padding: z.number(),
  watermark: z.object({
    enabled: z.boolean(),
    text: z.string(),
    position: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']),
    opacity: z.number().min(0).max(1),
  }).optional(),
});

/**
 * Social share configuration schema
 */
export const SocialShareConfigSchema = z.object({
  platforms: z.array(SocialPlatformSchema),
  templates: z.array(ShareTemplateSchema),
  screenshot: ScreenshotConfigSchema,
  fallback: z.object({
    copyToClipboard: z.boolean(),
    showShareDialog: z.boolean(),
    customShareUrl: z.string().optional(),
  }),
  telemetry: z.object({
    enabled: z.boolean(),
    events: z.array(z.string()),
  }),
});

export type SocialPlatform = z.infer<typeof SocialPlatformSchema>;
export type ShareTemplate = z.infer<typeof ShareTemplateSchema>;
export type ScreenshotConfig = z.infer<typeof ScreenshotConfigSchema>;
export type SocialShareConfig = z.infer<typeof SocialShareConfigSchema>;

/**
 * Default social share configuration
 */
export const DEFAULT_SOCIAL_SHARE_CONFIG: SocialShareConfig = {
  platforms: [
    {
      id: 'twitter',
      name: 'Twitter/X',
      baseUrl: 'https://twitter.com/intent/tweet',
      icon: '🐦',
      color: '#1DA1F2',
      supported: true,
      maxTextLength: 280,
    },
    {
      id: 'facebook',
      name: 'Facebook',
      baseUrl: 'https://www.facebook.com/sharer/sharer.php',
      icon: '📘',
      color: '#1877F2',
      supported: true,
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      baseUrl: 'https://www.linkedin.com/sharing/share-offsite/',
      icon: '💼',
      color: '#0077B5',
      supported: true,
    },
    {
      id: 'reddit',
      name: 'Reddit',
      baseUrl: 'https://reddit.com/submit',
      icon: '🤖',
      color: '#FF4500',
      supported: true,
    },
    {
      id: 'telegram',
      name: 'Telegram',
      baseUrl: 'https://t.me/share/url',
      icon: '✈️',
      color: '#0088CC',
      supported: true,
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      baseUrl: 'https://wa.me/',
      icon: '📱',
      color: '#25D366',
      supported: true,
    },
  ],
  templates: [
    {
      id: 'achievement',
      name: 'Achievement Unlocked',
      title: 'Achievement Unlocked!',
      text: 'Just unlocked {achievement} in RPG Balancer! 🎮 {stats}',
      hashtags: ['RPGBalancer', 'Gaming', 'Achievement'],
    },
    {
      id: 'character',
      name: 'Character Build',
      title: 'My Character Build',
      text: 'Check out my {character} build in RPG Balancer! ⚔️ {stats}',
      hashtags: ['RPGBalancer', 'CharacterBuild', 'Gaming'],
    },
    {
      id: 'victory',
      name: 'Victory',
      title: 'Victory!',
      text: 'Just achieved {result} in RPG Balancer! 🏆 {stats}',
      hashtags: ['RPGBalancer', 'Victory', 'Gaming'],
    },
    {
      id: 'milestone',
      name: 'Milestone',
      title: 'Milestone Reached',
      text: 'Reached {milestone} in RPG Balancer! 📈 {stats}',
      hashtags: ['RPGBalancer', 'Milestone', 'Progress'],
    },
  ],
  screenshot: {
    enabled: true,
    quality: 0.9,
    format: 'png',
    scale: 2,
    backgroundColor: '#1a1a1a',
    padding: 20,
    watermark: {
      enabled: true,
      text: 'RPG Balancer',
      position: 'bottom-right',
      opacity: 0.7,
    },
  },
  fallback: {
    copyToClipboard: true,
    showShareDialog: true,
    customShareUrl: 'https://rpg-balancer.com/share',
  },
  telemetry: {
    enabled: true,
    events: [
      'social_share_attempted',
      'social_share_completed',
      'social_share_failed',
      'screenshot_captured',
      'screenshot_failed',
    ],
  },
};

/**
 * Get platform by ID
 */
export function getPlatform(config: SocialShareConfig, platformId: string): SocialPlatform | undefined {
  return config.platforms.find(p => p.id === platformId);
}

/**
 * Get template by ID
 */
export function getTemplate(config: SocialShareConfig, templateId: string): ShareTemplate | undefined {
  return config.templates.find(t => t.id === templateId);
}

/**
 * Check if Web Share API is supported
 */
export function isWebShareSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

/**
 * Check if Clipboard API is supported
 */
export function isClipboardSupported(): boolean {
  return typeof navigator !== 'undefined' &&
    typeof navigator.clipboard !== 'undefined' &&
    typeof navigator.clipboard.writeText === 'function';
}

/**
 * Check if Screen Capture API is supported
 */
export function isScreenCaptureSupported(): boolean {
  return typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices !== 'undefined' &&
    typeof navigator.mediaDevices.getDisplayMedia === 'function';
}
