/**
 * NP-034 – Idle Village Resident Personality Config
 * 
 * Personality badge component for displaying traits, archetypes,
 * and compatibility information with interactive features.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import React, { useState, useCallback, useMemo } from 'react';
import type {
  PersonalityTrait,
  PersonalityArchetype,
  PersonalityCategory,
  TraitLevel,
  CompatibilityScore,
  PersonalityBadgeConfig,
  getTraitColor,
  getArchetypeDescription,
  getCategoryDescription,
} from '../types/residentPersonality';

export interface PersonalityBadgeProps {
  type: 'trait' | 'archetype' | 'compatibility' | 'custom';
  data: PersonalityTrait | PersonalityArchetype | CompatibilityScore | any;
  config?: Partial<PersonalityBadgeConfig>;
  size?: 'small' | 'medium' | 'large';
  shape?: 'circle' | 'square' | 'rounded' | 'pill';
  style?: 'minimal' | 'detailed' | 'iconic' | 'gradient';
  showValue?: boolean;
  showLabel?: boolean;
  showIcon?: boolean;
  showProgress?: boolean;
  clickable?: boolean;
  hoverable?: boolean;
  tooltip?: boolean;
  expandable?: boolean;
  filterable?: boolean;
  onClick?: () => void;
  onHover?: (isHovering: boolean) => void;
  onExpand?: (isExpanded: boolean) => void;
  onFilter?: (filter: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const PersonalityBadge: React.FC<PersonalityBadgeProps> = ({
  type,
  data,
  config = {},
  size = 'medium',
  shape = 'rounded',
  style: badgeStyle = 'minimal',
  showValue = true,
  showLabel = true,
  showIcon = true,
  showProgress = false,
  clickable = true,
  hoverable = true,
  tooltip = true,
  expandable = false,
  filterable = false,
  onClick,
  onHover,
  onExpand,
  onFilter,
  className = '',
  style: customStyle = {},
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Merge with default config
  const badgeConfig = useMemo(() => ({
    id: `badge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Personality Badge',
    description: 'Personality trait or archetype badge',
    type,
    display: {
      size,
      shape,
      style: badgeStyle,
      showValue,
      showLabel,
      showIcon,
      showProgress,
    },
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#f59e0b',
      text: '#1e293b',
      background: '#ffffff',
    },
    animation: {
      enabled: true,
      type: 'fade' as const,
      duration: 200,
      delay: 0,
    },
    interaction: {
      clickable,
      hoverable,
      tooltip,
      expandable,
      filterable,
    },
    conditions: {
      showWhen: [],
      hideWhen: [],
      highlightWhen: [],
    },
    metadata: {
      version: '1.0.0',
      tags: ['personality', 'badge'],
      category: 'personality',
    },
    ...config,
  }), [type, size, shape, badgeStyle, showValue, showLabel, showIcon, showProgress, clickable, hoverable, tooltip, expandable, filterable, config]);

  // Calculate badge content based on type
  const badgeContent = useMemo(() => {
    switch (type) {
      case 'trait': {
        const trait = data as PersonalityTrait;
        return {
          label: trait.name,
          value: trait.value,
          level: trait.level,
          color: trait.color || getTraitColor(trait.level),
          icon: trait.icon,
          description: trait.description,
          category: trait.category,
          weight: trait.weight,
        };
      }
      case 'archetype': {
        const archetype = data as PersonalityArchetype;
        return {
          label: archetype,
          value: 0,
          level: 'moderate' as TraitLevel,
          color: badgeConfig.colors.primary,
          icon: getArchetypeIcon(archetype),
          description: getArchetypeDescription(archetype),
          category: 'archetype' as PersonalityCategory,
          weight: 1,
        };
      }
      case 'compatibility': {
        const compatibility = data as CompatibilityScore;
        return {
          label: 'Compatibility',
          value: compatibility.overall,
          level: getCompatibilityLevel(compatibility.overall),
          color: getCompatibilityColor(compatibility.overall),
          icon: 'heart',
          description: `Overall compatibility: ${(compatibility.overall * 100).toFixed(1)}%`,
          category: 'compatibility' as PersonalityCategory,
          weight: 1,
        };
      }
      default:
        return {
          label: 'Custom',
          value: 0,
          level: 'moderate' as TraitLevel,
          color: badgeConfig.colors.primary,
          icon: 'star',
          description: 'Custom badge',
          category: 'custom' as PersonalityCategory,
          weight: 1,
        };
    }
  }, [type, data, badgeConfig.colors.primary]);

  // Get size dimensions
  const sizeDimensions = useMemo(() => {
    switch (badgeConfig.display.size) {
      case 'small':
        return { width: 60, height: 24, fontSize: 10, iconSize: 12 };
      case 'medium':
        return { width: 80, height: 32, fontSize: 12, iconSize: 16 };
      case 'large':
        return { width: 120, height: 40, fontSize: 14, iconSize: 20 };
      default:
        return { width: 80, height: 32, fontSize: 12, iconSize: 16 };
    }
  }, [badgeConfig.display.size]);

  // Get shape styles
  const shapeStyles = useMemo(() => {
    const base = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px',
      padding: '4px 8px',
      border: `1px solid ${badgeConfig.colors.primary}20`,
      backgroundColor: badgeConfig.colors.background,
      color: badgeConfig.colors.text,
      fontSize: `${sizeDimensions.fontSize}px`,
      fontWeight: '500',
      cursor: badgeConfig.interaction.clickable ? 'pointer' : 'default',
      transition: `all ${badgeConfig.animation.duration}ms ${badgeConfig.animation.type}`,
      userSelect: 'none',
      ...customStyle,
    };

    switch (badgeConfig.display.shape) {
      case 'circle':
        return {
          ...base,
          width: `${sizeDimensions.height}px`,
          height: `${sizeDimensions.height}px`,
          borderRadius: '50%',
        };
      case 'square':
        return {
          ...base,
          borderRadius: '4px',
        };
      case 'rounded':
        return {
          ...base,
          borderRadius: '8px',
        };
      case 'pill':
        return {
          ...base,
          borderRadius: '9999px',
        };
      default:
        return {
          ...base,
          borderRadius: '8px',
        };
    }
  }, [badgeConfig, sizeDimensions, customStyle]);

  // Get style-specific modifications
  const styleModifications = useMemo(() => {
    switch (badgeConfig.display.style) {
      case 'minimal':
        return {
          border: 'none',
          backgroundColor: 'transparent',
          color: badgeConfig.colors.text,
        };
      case 'detailed':
        return {
          border: `2px solid ${badgeConfig.colors.primary}`,
          backgroundColor: `${badgeConfig.colors.primary}10`,
          color: badgeConfig.colors.primary,
          boxShadow: `0 2px 4px ${badgeConfig.colors.primary}20`,
        };
      case 'iconic':
        return {
          border: 'none',
          backgroundColor: badgeConfig.colors.primary,
          color: badgeConfig.colors.background,
        };
      case 'gradient':
        return {
          border: 'none',
          background: `linear-gradient(135deg, ${badgeConfig.colors.primary}, ${badgeConfig.colors.secondary})`,
          color: badgeConfig.colors.background,
        };
      default:
        return {};
    }
  }, [badgeConfig]);

  // Handle events
  const handleClick = useCallback(() => {
    if (badgeConfig.interaction.clickable && onClick) {
      onClick();
    }
    
    if (badgeConfig.interaction.expandable) {
      const newExpanded = !isExpanded;
      setIsExpanded(newExpanded);
      onExpand?.(newExpanded);
    }
  }, [badgeConfig.interaction.clickable, badgeConfig.interaction.expandable, isExpanded, onClick, onExpand]);

  const handleMouseEnter = useCallback(() => {
    if (badgeConfig.interaction.hoverable) {
      setIsHovering(true);
      onHover?.(true);
      if (badgeConfig.interaction.tooltip) {
        setShowTooltip(true);
      }
    }
  }, [badgeConfig.interaction.hoverable, badgeConfig.interaction.tooltip, onHover]);

  const handleMouseLeave = useCallback(() => {
    if (badgeConfig.interaction.hoverable) {
      setIsHovering(false);
      onHover?.(false);
      setShowTooltip(false);
    }
  }, [badgeConfig.interaction.hoverable, onHover]);

  const handleFilter = useCallback(() => {
    if (badgeConfig.interaction.filterable && onFilter) {
      onFilter(badgeContent.label);
    }
  }, [badgeConfig.interaction.filterable, badgeContent.label, onFilter]);

  // Render icon
  const renderIcon = useCallback(() => {
    if (!badgeConfig.display.showIcon || !badgeContent.icon) {
      return null;
    }

    const iconStyle = {
      fontSize: `${sizeDimensions.iconSize}px`,
      color: badgeConfig.display.style === 'iconic' ? badgeConfig.colors.background : badgeContent.color,
    };

    // Simple icon representation (in real implementation, use icon library)
    return (
      <span style={iconStyle} className="badge-icon">
        {badgeContent.icon}
      </span>
    );
  }, [badgeConfig.display.showIcon, badgeConfig.display.style, badgeContent.icon, badgeContent.color, sizeDimensions.iconSize, badgeConfig.colors.background]);

  // Render label
  const renderLabel = useCallback(() => {
    if (!badgeConfig.display.showLabel) {
      return null;
    }

    const labelStyle = {
      fontSize: `${sizeDimensions.fontSize}px`,
      fontWeight: '500',
      color: badgeConfig.display.style === 'iconic' ? badgeConfig.colors.background : badgeConfig.colors.text,
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden' as const,
      textOverflow: 'ellipsis' as const,
    };

    return (
      <span style={labelStyle} className="badge-label">
        {badgeContent.label}
      </span>
    );
  }, [badgeConfig.display.showLabel, badgeConfig.display.style, sizeDimensions.fontSize, badgeConfig.colors.background, badgeConfig.colors.text, badgeContent.label]);

  // Render value
  const renderValue = useCallback(() => {
    if (!badgeConfig.display.showValue || type === 'archetype') {
      return null;
    }

    const valueStyle = {
      fontSize: `${sizeDimensions.fontSize - 2}px`,
      fontWeight: '600',
      color: badgeConfig.display.style === 'iconic' ? badgeConfig.colors.background : badgeContent.color,
      opacity: 0.8,
    };

    let displayValue = '';
    if (type === 'trait') {
      displayValue = `${badgeContent.value > 0 ? '+' : ''}${badgeContent.value}`;
    } else if (type === 'compatibility') {
      displayValue = `${(badgeContent.value * 100).toFixed(0)}%`;
    }

    return (
      <span style={valueStyle} className="badge-value">
        {displayValue}
      </span>
    );
  }, [badgeConfig.display.showValue, type, badgeConfig.display.style, sizeDimensions.fontSize, badgeConfig.colors.background, badgeContent.color, badgeContent.value]);

  // Render progress bar
  const renderProgress = useCallback(() => {
    if (!badgeConfig.display.showProgress || type === 'archetype') {
      return null;
    }

    const progressStyle = {
      width: '100%',
      height: '2px',
      backgroundColor: `${badgeContent.color}20`,
      borderRadius: '1px',
      overflow: 'hidden',
      marginTop: '2px',
    };

    const fillStyle = {
      width: type === 'compatibility' ? `${badgeContent.value * 100}%` : `${((badgeContent.value + 2) / 4) * 100}%`,
      height: '100%',
      backgroundColor: badgeContent.color,
      transition: `width ${badgeConfig.animation.duration}ms ${badgeConfig.animation.type}`,
    };

    return (
      <div style={progressStyle} className="badge-progress">
        <div style={fillStyle} className="badge-progress-fill" />
      </div>
    );
  }, [badgeConfig.display.showProgress, type, badgeConfig.animation.duration, badgeConfig.animation.type, badgeContent.color, badgeContent.value]);

  // Render tooltip
  const renderTooltip = useCallback(() => {
    if (!showTooltip || !badgeConfig.interaction.tooltip) {
      return null;
    }

    const tooltipStyle = {
      position: 'absolute' as const,
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginTop: '4px',
      padding: '8px 12px',
      backgroundColor: badgeConfig.colors.text,
      color: badgeConfig.colors.background,
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '400',
      whiteSpace: 'nowrap' as const,
      zIndex: 1000,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
      maxWidth: '200px',
    };

    return (
      <div style={tooltipStyle} className="badge-tooltip">
        <div style={{ fontWeight: '600', marginBottom: '2px' }}>
          {badgeContent.label}
        </div>
        <div style={{ fontSize: '11px', opacity: 0.9 }}>
          {badgeContent.description}
        </div>
        {type === 'trait' && (
          <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>
            Category: {getCategoryDescription(badgeContent.category)}
          </div>
        )}
      </div>
    );
  }, [showTooltip, badgeConfig.interaction.tooltip, badgeConfig.colors, badgeContent, type]);

  // Render expanded content
  const renderExpandedContent = useCallback(() => {
    if (!isExpanded || !badgeConfig.interaction.expandable) {
      return null;
    }

    const expandedStyle = {
      position: 'absolute' as const,
      top: '100%',
      left: '0',
      marginTop: '4px',
      padding: '12px',
      backgroundColor: badgeConfig.colors.background,
      border: `1px solid ${badgeConfig.colors.primary}30`,
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      zIndex: 1000,
      minWidth: '200px',
    };

    return (
      <div style={expandedStyle} className="badge-expanded">
        <div style={{ fontWeight: '600', marginBottom: '8px', color: badgeConfig.colors.text }}>
          {badgeContent.label}
        </div>
        <div style={{ fontSize: '12px', color: badgeConfig.colors.secondary, marginBottom: '8px' }}>
          {badgeContent.description}
        </div>
        
        {type === 'trait' && (
          <>
            <div style={{ fontSize: '11px', color: badgeConfig.colors.text, marginBottom: '4px' }}>
              <strong>Category:</strong> {getCategoryDescription(badgeContent.category)}
            </div>
            <div style={{ fontSize: '11px', color: badgeConfig.colors.text, marginBottom: '4px' }}>
              <strong>Level:</strong> {badgeContent.level}
            </div>
            <div style={{ fontSize: '11px', color: badgeConfig.colors.text, marginBottom: '4px' }}>
              <strong>Value:</strong> {badgeContent.value}
            </div>
            <div style={{ fontSize: '11px', color: badgeConfig.colors.text }}>
              <strong>Weight:</strong> {badgeContent.weight}
            </div>
          </>
        )}
        
        {type === 'compatibility' && (
          <>
            <div style={{ fontSize: '11px', color: badgeConfig.colors.text, marginBottom: '4px' }}>
              <strong>Score:</strong> {(badgeContent.value * 100).toFixed(1)}%
            </div>
            <div style={{ fontSize: '11px', color: badgeConfig.colors.text, marginBottom: '4px' }}>
              <strong>Level:</strong> {badgeContent.level}
            </div>
          </>
        )}
        
        {badgeConfig.interaction.filterable && (
          <button
            onClick={handleFilter}
            style={{
              marginTop: '8px',
              padding: '4px 8px',
              backgroundColor: badgeConfig.colors.primary,
              color: badgeConfig.colors.background,
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            Filter by {badgeContent.label}
          </button>
        )}
      </div>
    );
  }, [isExpanded, badgeConfig.interaction.expandable, badgeConfig.interaction.filterable, badgeConfig.colors, badgeContent, type, handleFilter]);

  // Combine all styles
  const finalStyle = useMemo(() => ({
    ...shapeStyles,
    ...styleModifications,
    position: 'relative' as const,
    opacity: isHovering ? 0.8 : 1,
    transform: isHovering ? 'scale(1.05)' : 'scale(1)',
  }), [shapeStyles, styleModifications, isHovering]);

  return (
    <div
      className={`personality-badge ${className}`}
      style={finalStyle}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {renderIcon()}
      {renderLabel()}
      {renderValue()}
      {renderProgress()}
      {renderTooltip()}
      {renderExpandedContent()}
    </div>
  );
};

// Utility functions
function getArchetypeIcon(archetype: PersonalityArchetype): string {
  const iconMap: Record<PersonalityArchetype, string> = {
    leader: '👑',
    team_player: '🤝',
    innovator: '💡',
    specialist: '🎯',
    generalist: '🔄',
    mentor: '👨‍🏫',
    rebel: '⚡',
    mediator: '⚖️',
    perfectionist: '✨',
    strategist: '♟️',
  };
  return iconMap[archetype] || '👤';
}

function getCompatibilityLevel(score: number): TraitLevel {
  if (score >= 0.8) return 'very_high';
  if (score >= 0.6) return 'high';
  if (score >= 0.4) return 'moderate';
  if (score >= 0.2) return 'low';
  return 'very_low';
}

function getCompatibilityColor(score: number): string {
  if (score >= 0.8) return '#10b981';
  if (score >= 0.6) return '#84cc16';
  if (score >= 0.4) return '#fbbf24';
  if (score >= 0.2) return '#f97316';
  return '#ef4444';
}

// Badge factory functions
export function createTraitBadge(trait: PersonalityTrait, config?: Partial<PersonalityBadgeConfig>): React.ReactElement {
  return (
    <PersonalityBadge
      type="trait"
      data={trait}
      config={config}
    />
  );
}

export function createArchetypeBadge(archetype: PersonalityArchetype, config?: Partial<PersonalityBadgeConfig>): React.ReactElement {
  return (
    <PersonalityBadge
      type="archetype"
      data={archetype}
      config={config}
    />
  );
}

export function createCompatibilityBadge(compatibility: CompatibilityScore, config?: Partial<PersonalityBadgeConfig>): React.ReactElement {
  return (
    <PersonalityBadge
      type="compatibility"
      data={compatibility}
      config={config}
    />
  );
}

// Badge collection component
export interface PersonalityBadgeCollectionProps {
  badges: Array<{
    type: 'trait' | 'archetype' | 'compatibility' | 'custom';
    data: any;
    config?: Partial<PersonalityBadgeConfig>;
  }>;
  layout?: 'horizontal' | 'vertical' | 'wrap';
  spacing?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const PersonalityBadgeCollection: React.FC<PersonalityBadgeCollectionProps> = ({
  badges,
  layout = 'horizontal',
  spacing = 4,
  className = '',
  style = {},
}) => {
  const containerStyle = useMemo(() => ({
    display: layout === 'horizontal' ? 'flex' : layout === 'vertical' ? 'flex' : 'flex',
    flexDirection: layout === 'vertical' ? 'column' : layout === 'horizontal' ? 'row' : 'row',
    flexWrap: layout === 'wrap' ? 'wrap' : 'nowrap',
    gap: `${spacing}px`,
    alignItems: 'center',
    ...style,
  }), [layout, spacing, style]);

  return (
    <div className={`personality-badge-collection ${className}`} style={containerStyle}>
      {badges.map((badge, index) => (
        <PersonalityBadge
          key={index}
          type={badge.type}
          data={badge.data}
          config={badge.config}
        />
      ))}
    </div>
  );
};

export default PersonalityBadge;
