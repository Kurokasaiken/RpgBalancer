import React, { useState } from 'react';

/**
 * MinimalResourceHUDPage
 *
 * Isolated test page for ResourceHUD component.
 * Shows village resources: gold, wood, food, iron.
 *
 * Route: /minimal-resourcehud
 * Spec: src/docs/docs/minimal_slice/06_resourcehud.md
 */

interface Resources {
  gold: number;
  wood: number;
  food: number;
  iron: number;
}

export default function MinimalResourceHUDPage() {
  const [resources, setResources] = useState<Resources>({
    gold: 1250,
    wood: 3400,
    food: 5120,
    iron: 840,
  });
  const [hoveredResource, setHoveredResource] = useState<keyof Resources | null>(null);

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const handleAddGold = () => {
    setResources((prev) => ({ ...prev, gold: prev.gold + 500 }));
  };

  const handleAddWood = () => {
    setResources((prev) => ({ ...prev, wood: prev.wood + 500 }));
  };

  const handleAddFood = () => {
    setResources((prev) => ({ ...prev, food: prev.food + 500 }));
  };

  const handleAddIron = () => {
    setResources((prev) => ({ ...prev, iron: prev.iron + 500 }));
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>ResourceHUD Isolated Test</h1>
      <p style={styles.subtitle}>Route: /minimal-resourcehud | Spec: src/docs/docs/minimal_slice/06_resourcehud.md</p>

      <div style={styles.hudPanel}>
        <div style={styles.resourceHud} data-testid="resource-hud">
          {/* Gold */}
          <div
            style={styles.resourceItem}
            data-testid="resource-gold"
            onMouseEnter={() => setHoveredResource('gold')}
            onMouseLeave={() => setHoveredResource(null)}
          >
            <div style={{ ...styles.resourceIcon, backgroundColor: '#FFD700' }} data-testid="resource-gold-icon">
              💰
            </div>
            <div style={styles.resourceValue} data-testid="resource-gold-value">
              {formatNumber(resources.gold)}
            </div>
            {hoveredResource === 'gold' && (
              <div style={styles.tooltip} data-testid="resource-gold-tooltip">
                Gold: {resources.gold}
              </div>
            )}
          </div>

          {/* Wood */}
          <div
            style={styles.resourceItem}
            data-testid="resource-wood"
            onMouseEnter={() => setHoveredResource('wood')}
            onMouseLeave={() => setHoveredResource(null)}
          >
            <div style={{ ...styles.resourceIcon, backgroundColor: '#8B4513' }} data-testid="resource-wood-icon">
              🪵
            </div>
            <div style={styles.resourceValue} data-testid="resource-wood-value">
              {formatNumber(resources.wood)}
            </div>
            {hoveredResource === 'wood' && (
              <div style={styles.tooltip} data-testid="resource-wood-tooltip">
                Wood: {resources.wood}
              </div>
            )}
          </div>

          {/* Food */}
          <div
            style={styles.resourceItem}
            data-testid="resource-food"
            onMouseEnter={() => setHoveredResource('food')}
            onMouseLeave={() => setHoveredResource(null)}
          >
            <div style={{ ...styles.resourceIcon, backgroundColor: '#FF6347' }} data-testid="resource-food-icon">
              🍞
            </div>
            <div style={styles.resourceValue} data-testid="resource-food-value">
              {formatNumber(resources.food)}
            </div>
            {hoveredResource === 'food' && (
              <div style={styles.tooltip} data-testid="resource-food-tooltip">
                Food: {resources.food}
              </div>
            )}
          </div>

          {/* Iron */}
          <div
            style={styles.resourceItem}
            data-testid="resource-iron"
            onMouseEnter={() => setHoveredResource('iron')}
            onMouseLeave={() => setHoveredResource(null)}
          >
            <div style={{ ...styles.resourceIcon, backgroundColor: '#696969' }} data-testid="resource-iron-icon">
              ⚒️
            </div>
            <div style={styles.resourceValue} data-testid="resource-iron-value">
              {formatNumber(resources.iron)}
            </div>
            {hoveredResource === 'iron' && (
              <div style={styles.tooltip} data-testid="resource-iron-tooltip">
                Iron: {resources.iron}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={styles.controlPanel}>
        <h2>Test Controls</h2>
        <div style={styles.buttonGroup}>
          <button onClick={handleAddGold} style={styles.button} data-testid="btn-add-gold">
            +500 Gold
          </button>
          <button onClick={handleAddWood} style={styles.button} data-testid="btn-add-wood">
            +500 Wood
          </button>
          <button onClick={handleAddFood} style={styles.button} data-testid="btn-add-food">
            +500 Food
          </button>
          <button onClick={handleAddIron} style={styles.button} data-testid="btn-add-iron">
            +500 Iron
          </button>
        </div>
      </div>

      <div style={styles.info}>
        <h2>Test Information</h2>
        <ul>
          <li><strong>Component:</strong> ResourceHUD</li>
          <li><strong>Test Cases:</strong> 26 (rendering, display, formatting, interactions, state, edge cases)</li>
          <li><strong>Test File:</strong> tests/e2e/minimal_slice_06_resourcehud.spec.ts</li>
          <li><strong>Resources:</strong> Gold, Wood, Food, Iron</li>
        </ul>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '900px',
    margin: '0 auto',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
  } as React.CSSProperties,
  title: {
    fontSize: '2rem',
    marginBottom: '0.5rem',
    color: '#333',
  } as React.CSSProperties,
  subtitle: {
    color: '#666',
    marginBottom: '2rem',
    fontSize: '0.9rem',
  } as React.CSSProperties,
  hudPanel: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '2rem',
  } as React.CSSProperties,
  resourceHud: {
    display: 'flex',
    gap: '2rem',
    justifyContent: 'center',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  resourceItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
    border: '1px solid #e0e0e0',
    cursor: 'pointer',
    position: 'relative',
    minWidth: '100px',
  } as React.CSSProperties,
  resourceIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
  } as React.CSSProperties,
  resourceValue: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'monospace',
  } as React.CSSProperties,
  tooltip: {
    position: 'absolute',
    bottom: '-40px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#333',
    color: '#fff',
    padding: '0.5rem 0.75rem',
    borderRadius: '4px',
    fontSize: '0.8rem',
    whiteSpace: 'nowrap',
    zIndex: 10,
  } as React.CSSProperties,
  controlPanel: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '2rem',
  } as React.CSSProperties,
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  button: {
    padding: '0.75rem 1.5rem',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    backgroundColor: '#4caf50',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  } as React.CSSProperties,
  info: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
};
