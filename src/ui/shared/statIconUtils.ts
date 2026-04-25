import type { ElementType } from 'react';
import {
  Axe,
  BookOpen,
  Crown,
  Droplets,
  Feather,
  Flame,
  Gem,
  Ghost,
  Hammer,
  Heart,
  Hourglass,
  Minus,
  Moon,
  Plus,
  RotateCcw,
  Scroll,
  Shield,
  Skull,
  Star,
  Sun,
  Swords,
  Wand2,
  Wind,
  Zap,
} from 'lucide-react';

export const lucideStatIcons: Record<string, ElementType> = {
  swords: Swords,
  shield: Shield,
  heart: Heart,
  zap: Zap,
  flame: Flame,
  droplets: Droplets,
  wind: Wind,
  skull: Skull,
  hourglass: Hourglass,
  crown: Crown,
  gem: Gem,
  scroll: Scroll,
  wand: Wand2,
  axe: Axe,
  hammer: Hammer,
  feather: Feather,
  sun: Sun,
  moon: Moon,
  star: Star,
  ghost: Ghost,
  book: BookOpen,
  rotate: RotateCcw,
  minus: Minus,
  plus: Plus,
};

export const statGlyphMap: Record<string, string> = {
  hp: '❤',
  damage: '⚔️',
  htk: '♜',
  txc: '🎯',
  evasion: '🌀',
  hitChance: '％',
  attacksPerKo: '⚖️',
  critChance: '✦',
  critMult: '✪',
  critTxCBonus: '➕',
  failChance: '⚠️',
  failMult: '⭘',
  failTxCMalus: '➖',
  ward: '🛡️',
  armor: '⛨',
  resistance: '🜃',
  armorPen: '⛏️',
  penPercent: '⤓',
  effectiveDamage: '🔥',
  lifesteal: '🌿',
  regen: '💧',
  ttk: '⏳',
  edpt: '📈',
  earlyImpact: '⚡',
};

export function getStatIconComponent(iconId?: string): ElementType | undefined {
  if (!iconId) return undefined;
  return lucideStatIcons[iconId];
}

export function getStatGlyph(statId?: string): string {
  if (!statId) return '◆';
  return statGlyphMap[statId] ?? '◆';
}
