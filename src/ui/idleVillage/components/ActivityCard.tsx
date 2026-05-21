/**
 * ActivityCard — POI Container (Point of Interest)
 *
 * Mostra un'attività (Job/Quest) con:
 *  - Title + type badge
 *  - SlotRack inline (occupancy view)
 *  - Expandable detail view
 *
 * Props:
 *  - activityId: string
 *  - title: string
 *  - type: 'job' | 'quest'
 *  - occupancy: number (0-4)
 *  - maxSlots: number
 *  - onExpand?: () => void
 *  - expanded?: boolean
 *  - children?: ReactNode (ActivityDetail component)
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export interface ActivityCardProps {
  activityId: string;
  title: string;
  type: 'job' | 'quest';
  occupancy: number;
  maxSlots: number;
  icon?: string;
  onExpand?: (expanded: boolean) => void;
  expanded?: boolean;
  children?: React.ReactNode;
}

export function ActivityCard({
  activityId,
  title,
  type,
  occupancy,
  maxSlots,
  icon = type === 'job' ? '⚙️' : '⚔️',
  onExpand,
  expanded = false,
  children,
}: ActivityCardProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const typeColor = type === 'job' ? '#FF9800' : '#2196F3';
  const occupancyPercent = Math.round((occupancy / maxSlots) * 100);

  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (onExpand) onExpand(newState);
  };

  return (
    <motion.div
      layout
      style={{
        border: `2px solid ${typeColor}`,
        borderRadius: '8px',
        backgroundColor: 'white',
        overflow: 'hidden',
        marginBottom: '15px',
      }}
    >
      {/* Card Header */}
      <div
        onClick={handleToggle}
        style={{
          padding: '15px',
          backgroundColor: typeColor,
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>{icon}</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px' }}>{title}</h3>
            <span style={{ fontSize: '12px', opacity: 0.9 }}>
              {occupancy}/{maxSlots} slots filled
            </span>
          </div>
        </div>

        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ fontSize: '20px' }}
        >
          ▼
        </motion.div>
      </div>

      {/* Occupancy Bar */}
      <div
        style={{
          height: '4px',
          backgroundColor: '#e0e0e0',
          position: 'relative',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${occupancyPercent}%` }}
          transition={{ duration: 0.5 }}
          style={{
            height: '100%',
            backgroundColor: occupancyPercent === 100 ? '#4caf50' : typeColor,
          }}
        />
      </div>

      {/* Expanded Content */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: isExpanded ? 1 : 0, height: isExpanded ? 'auto' : 0 }}
        transition={{ duration: 0.3 }}
        style={{ overflow: 'hidden' }}
      >
        <div style={{ padding: '15px', borderTop: `1px solid ${typeColor}` }}>
          {children || (
            <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
              No details available
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
