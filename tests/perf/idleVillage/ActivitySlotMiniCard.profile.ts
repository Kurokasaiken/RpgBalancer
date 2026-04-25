/**
 * ActivitySlotMiniCard Performance Test Script
 * 
 * Performance profiling script that renders 500 mini cards and records
 * FPS, render times, and performance metrics for Phase 12 optimization.
 * 
 * @fileoverview
 * This script creates a performance test environment for ActivitySlotMiniCard
 * components, measuring rendering performance with various configurations.
 * 
 * @author Atlas-Perf – Idle HUD
 * @since 2026-01-12
 */

import { performance } from 'perf_hooks';
import React from 'react';
import { render } from '@testing-library/react';
import { ActivitySlotMiniCard, type ActivitySlotMiniCardProps } from '../../../src/ui/idleVillage/components/ActivitySlotMiniCard';

/**
 * Performance test configuration
 */
interface PerformanceTestConfig {
  /** Number of cards to render */
  cardCount: number;
  /** Number of test iterations */
  iterations: number;
  /** Whether to enable profiling */
  enableProfiling: boolean;
  /** Test variants to run */
  variants: {
    sizes: Array<'compact' | 'normal' | 'expanded'>;
    visualVariants: Array<'azure' | 'ember' | 'jade' | 'amethyst' | 'solar'>;
    statuses: Array<'running' | 'completed' | 'paused'>;
  };
}

/**
 * Performance metrics result
 */
interface PerformanceMetrics {
  /** Test configuration */
  config: PerformanceTestConfig;
  /** Total render time in milliseconds */
  totalRenderTime: number;
  /** Average render time per card */
  avgRenderTimePerCard: number;
  /** Cards rendered per second */
  cardsPerSecond: number;
  /** FPS during rendering */
  fps: number;
  /** Memory usage before test */
  memoryBefore: number;
  /** Memory usage after test */
  memoryAfter: number;
  /** Memory delta */
  memoryDelta: number;
  /** Individual card render times */
  cardRenderTimes: number[];
  /** Performance marks data */
  performanceMarks: Array<{
    name: string;
    startTime: number;
    duration: number;
  }>;
}

/**
 * Generate test card data
 */
function generateTestCardData(count: number): ActivitySlotMiniCardProps[] {
  const cards: ActivitySlotMiniCardProps[] = [];
  const sizes: Array<'compact' | 'normal' | 'expanded'> = ['compact', 'normal', 'expanded'];
  const visualVariants: Array<'azure' | 'ember' | 'jade' | 'amethyst' | 'solar'> = ['azure', 'ember', 'jade', 'amethyst', 'solar'];
  const statuses: Array<'running' | 'completed' | 'paused'> = ['running', 'completed', 'paused'];
  
  for (let i = 0; i < count; i++) {
    cards.push({
      id: `test-card-${i}`,
      icon: ['⚙️', '⚔️', '🛡️', '🏹', '🔮'][i % 5],
      label: `Test Activity ${i}`,
      residentName: `Resident ${i % 10}`,
      progress: Math.random(),
      remainingSeconds: Math.floor(Math.random() * 3600),
      status: statuses[i % statuses.length],
      visualVariant: visualVariants[i % visualVariants.length],
      size: sizes[i % sizes.length],
      isHighlighted: i % 20 === 0,
      minimalChrome: i % 30 === 0,
      testId: `perf-test-card-${i}`,
      onClick: i % 10 === 0 ? () => {} : undefined,
    });
  }
  
  return cards;
}

/**
 * Get current memory usage
 */
function getMemoryUsage(): number {
  if (typeof window !== 'undefined' && (window as any).performance && (window as any).performance.memory) {
    return (window as any).performance.memory.usedJSHeapSize;
  }
  
  // Node.js environment fallback
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage().heapUsed;
  }
  
  return 0;
}

/**
 * Measure FPS during rendering
 */
function measureFPS(renderFunction: () => void): { fps: number; duration: number } {
  const startTime = performance.now();
  let frameCount = 0;
  let lastFrameTime = startTime;
  
  // Simple FPS measurement during render
  const measureFrame = () => {
    frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - lastFrameTime >= 1000) {
      return;
    }
    
    lastFrameTime = currentTime;
  };
  
  renderFunction();
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  const fps = (frameCount / duration) * 1000;
  
  return { fps, duration };
}

/**
 * Run performance test for a single configuration
 */
async function runPerformanceTest(config: PerformanceTestConfig): Promise<PerformanceMetrics> {
  console.log(`🚀 Starting performance test: ${config.cardCount} cards, ${config.iterations} iterations`);
  
  // Clear performance marks
  if (typeof window !== 'undefined' && window.performance && window.performance.clearMarks) {
    window.performance.clearMarks();
    window.performance.clearMeasures();
  }
  
  const memoryBefore = getMemoryUsage();
  const cardRenderTimes: number[] = [];
  const performanceMarks: Array<{ name: string; startTime: number; duration: number }> = [];
  
  // Generate test data
  const testData = generateTestCardData(config.cardCount);
  
  // Start overall test timing
  const testStartTime = performance.now();
  
  if (config.enableProfiling) {
    performance.mark('test-start');
  }
  
  // Render cards and measure performance
  for (let iteration = 0; iteration < config.iterations; iteration++) {
    const iterationStartTime = performance.now();
    
    if (config.enableProfiling) {
      performance.mark(`iteration-${iteration}-start`);
    }
    
    // Render all cards
    for (let i = 0; i < testData.length; i++) {
      const cardStartTime = performance.now();
      
      if (config.enableProfiling) {
        performance.mark(`card-${i}-start`);
      }
      
      // Render individual card
      const { unmount } = render(React.createElement(ActivitySlotMiniCard, testData[i]));
      
      // Immediately unmount to clean up
      unmount();
      
      const cardEndTime = performance.now();
      const cardRenderTime = cardEndTime - cardStartTime;
      
      cardRenderTimes.push(cardRenderTime);
      
      if (config.enableProfiling) {
        performance.mark(`card-${i}-end`);
        performance.measure(`card-${i}`, `card-${i}-start`, `card-${i}-end`);
        
        // Get performance entry
        const entries = performance.getEntriesByName(`card-${i}`, 'measure');
        if (entries.length > 0) {
          performanceMarks.push({
            name: `card-${i}`,
            startTime: entries[0].startTime,
            duration: entries[0].duration,
          });
        }
      }
    }
    
    const iterationEndTime = performance.now();
    
    if (config.enableProfiling) {
      performance.mark(`iteration-${iteration}-end`);
      performance.measure(`iteration-${iteration}`, `iteration-${iteration}-start`, `iteration-${iteration}-end`);
    }
    
    // Brief pause between iterations to allow garbage collection
    if (iteration < config.iterations - 1) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
  
  const testEndTime = performance.now();
  const memoryAfter = getMemoryUsage();
  
  if (config.enableProfiling) {
    performance.mark('test-end');
    performance.measure('test-total', 'test-start', 'test-end');
  }
  
  // Calculate metrics
  const totalRenderTime = testEndTime - testStartTime;
  const avgRenderTimePerCard = cardRenderTimes.reduce((sum, time) => sum + time, 0) / cardRenderTimes.length;
  const cardsPerSecond = (config.cardCount * config.iterations) / (totalRenderTime / 1000);
  const fps = 1000 / avgRenderTimePerCard;
  const memoryDelta = memoryAfter - memoryBefore;
  
  const metrics: PerformanceMetrics = {
    config,
    totalRenderTime,
    avgRenderTimePerCard,
    cardsPerSecond,
    fps,
    memoryBefore,
    memoryAfter,
    memoryDelta,
    cardRenderTimes,
    performanceMarks,
  };
  
  console.log(`✅ Performance test completed in ${totalRenderTime.toFixed(2)}ms`);
  console.log(`📊 Average render time per card: ${avgRenderTimePerCard.toFixed(2)}ms`);
  console.log(`⚡ Cards per second: ${cardsPerSecond.toFixed(2)}`);
  console.log(`🎯 FPS: ${fps.toFixed(2)}`);
  console.log(`💾 Memory delta: ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);
  
  return metrics;
}

/**
 * Run comprehensive performance test suite
 */
async function runPerformanceTestSuite(): Promise<void> {
  console.log('🧪 Starting ActivitySlotMiniCard Performance Test Suite');
  console.log('=' .repeat(60));
  
  const testConfigs: PerformanceTestConfig[] = [
    {
      cardCount: 100,
      iterations: 3,
      enableProfiling: true,
      variants: {
        sizes: ['normal'],
        visualVariants: ['azure'],
        statuses: ['running'],
      },
    },
    {
      cardCount: 250,
      iterations: 2,
      enableProfiling: true,
      variants: {
        sizes: ['normal'],
        visualVariants: ['azure'],
        statuses: ['running'],
      },
    },
    {
      cardCount: 500,
      iterations: 1,
      enableProfiling: true,
      variants: {
        sizes: ['normal'],
        visualVariants: ['azure'],
        statuses: ['running'],
      },
    },
    {
      cardCount: 500,
      iterations: 1,
      enableProfiling: false,
      variants: {
        sizes: ['compact', 'normal', 'expanded'],
        visualVariants: ['azure', 'ember', 'jade', 'amethyst', 'solar'],
        statuses: ['running', 'completed', 'paused'],
      },
    },
  ];
  
  const results: PerformanceMetrics[] = [];
  
  for (const config of testConfigs) {
    try {
      const metrics = await runPerformanceTest(config);
      results.push(metrics);
      
      console.log('\n📈 Detailed Results:');
      console.log(`   Min render time: ${Math.min(...metrics.cardRenderTimes).toFixed(2)}ms`);
      console.log(`   Max render time: ${Math.max(...metrics.cardRenderTimes).toFixed(2)}ms`);
      console.log(`   Median render time: ${metrics.cardRenderTimes.sort((a, b) => a - b)[Math.floor(metrics.cardRenderTimes.length / 2)].toFixed(2)}ms`);
      
      // Performance recommendations
      console.log('\n💡 Performance Analysis:');
      if (metrics.avgRenderTimePerCard > 5) {
        console.log('   ⚠️  Average render time > 5ms - consider optimization');
      }
      if (metrics.fps < 30) {
        console.log('   ⚠️  FPS < 30 - performance may be sluggish');
      }
      if (metrics.memoryDelta > 50 * 1024 * 1024) {
        console.log('   ⚠️  Memory usage increased by > 50MB - check for memory leaks');
      }
      
      console.log('\n' + '-'.repeat(60));
    } catch (error) {
      console.error(`❌ Test failed for config: ${JSON.stringify(config)}`, error);
    }
  }
  
  // Generate summary report
  console.log('\n📊 Performance Test Summary');
  console.log('=' .repeat(60));
  
  results.forEach((result, index) => {
    console.log(`\nTest ${index + 1}: ${result.config.cardCount} cards × ${result.config.iterations} iterations`);
    console.log(`   Total time: ${result.totalRenderTime.toFixed(2)}ms`);
    console.log(`   Avg per card: ${result.avgRenderTimePerCard.toFixed(2)}ms`);
    console.log(`   Cards/sec: ${result.cardsPerSecond.toFixed(2)}`);
    console.log(`   FPS: ${result.fps.toFixed(2)}`);
    console.log(`   Memory: ${(result.memoryDelta / 1024 / 1024).toFixed(2)}MB delta`);
  });
  
  // Performance recommendations summary
  console.log('\n🎯 Performance Recommendations:');
  const avgRenderTime = results.reduce((sum, r) => sum + r.avgRenderTimePerCard, 0) / results.length;
  const avgFPS = results.reduce((sum, r) => sum + r.fps, 0) / results.length;
  const maxMemoryDelta = Math.max(...results.map(r => r.memoryDelta));
  
  if (avgRenderTime > 3) {
    console.log('   • Consider React.memo optimization for expensive props');
    console.log('   • Implement virtual scrolling for large card lists');
  }
  
  if (avgFPS < 45) {
    console.log('   • Optimize CSS animations and transitions');
    console.log('   • Consider using CSS transforms instead of layout changes');
  }
  
  if (maxMemoryDelta > 30 * 1024 * 1024) {
    console.log('   • Implement proper cleanup in useEffect hooks');
    console.log('   • Consider object pooling for frequently created objects');
  }
  
  console.log('\n✅ Performance test suite completed');
}

/**
 * Export performance test utilities
 */
export {
  runPerformanceTest,
  runPerformanceTestSuite,
  generateTestCardData,
  getMemoryUsage,
  type PerformanceTestConfig,
  type PerformanceMetrics,
};

/**
 * Auto-run performance test if this file is executed directly
 */
if (typeof require !== 'undefined' && require.main === module) {
  runPerformanceTestSuite().catch(console.error);
}
