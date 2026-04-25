#!/usr/bin/env tsx

/**
 * Idle Village Fatigue Predictor CLI Report Generator - NP-019
 * 
 * Command-line interface for generating fatigue prediction reports
 * with sample data, export functionality, and analytics.
 * 
 * @since 2026-01-19
 */

import { FatiguePredictor, DEFAULT_FATIGUE_PREDICTION_CONFIG } from '../../src/balancing/idleVillage/FatiguePredictor';
import type { FatiguePrediction, FatiguePredictionConfig } from '../../src/balancing/idleVillage/FatiguePredictor';
import type { ResidentState, ResidentStatus } from '../../src/engine/game/idleVillage/TimeEngine';
import type { ActivityDefinition } from '../../src/balancing/config/idleVillage/types';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * CLI configuration
 */
interface CLIConfig {
  /** Output file path */
  outputFile?: string;
  /** Number of sample residents to generate */
  sampleResidents?: number;
  /** Number of sample activities to generate */
  sampleActivities?: number;
  /** Whether to include detailed analytics */
  includeAnalytics?: boolean;
  /** Whether to generate CSV export */
  generateCSV?: boolean;
  /** Custom prediction configuration */
  config?: Partial<FatiguePredictionConfig>;
}

/**
 * Sample residents data generator
 */
function generateSampleResidents(count: number): Record<string, ResidentState> {
  const residents: Record<string, ResidentState> = {};
  const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
  
  for (let i = 0; i < count; i++) {
    const id = `resident-${i + 1}`;
    residents[id] = {
      id,
      displayName: names[i % names.length] || `Resident ${i + 1}`,
      fatigue: Math.random() * 80, // 0-80 initial fatigue
      status: 'available' as ResidentStatus,
      homeId: `house-${i + 1}`,
      statProfileId: `resident-profile-${(i % 5) + 1}`,
      currentHp: 100,
      maxHp: 100,
      isHero: false,
      isInjured: false,
      survivalCount: 0,
      survivalScore: 0,
    };
  }
  
  return residents;
}

/**
 * Sample activities data generator
 */
function generateSampleActivities(count: number): Record<string, ActivityDefinition> {
  const activities: Record<string, ActivityDefinition> = {};
  const activityTypes = [
    { name: 'Forest Work', difficulty: 2, duration: '200', tags: ['job', 'outdoor'] },
    { name: 'Mining', difficulty: 4, duration: '400', tags: ['job', 'underground'] },
    { name: 'Farming', difficulty: 1, duration: '300', tags: ['job', 'outdoor'] },
    { name: 'Construction', difficulty: 3, duration: '500', tags: ['job', 'building'] },
    { name: 'Hunting', difficulty: 5, duration: '250', tags: ['job', 'combat'] },
    { name: 'Fishing', difficulty: 1, duration: '150', tags: ['job', 'water'] },
    { name: 'Crafting', difficulty: 2, duration: '350', tags: ['job', 'indoor'] },
    { name: 'Trading', difficulty: 1, duration: '100', tags: ['job', 'social'] },
  ];
  
  for (let i = 0; i < count; i++) {
    const template = activityTypes[i % activityTypes.length];
    const id = `activity-${i + 1}`;
    activities[id] = {
      id,
      label: template.name,
      description: `Sample activity: ${template.name}`,
      tags: template.tags,
      slotTags: ['village_job'],
      resolutionEngineId: 'job',
      level: Math.floor(Math.random() * 3) + 1,
      dangerRating: template.difficulty,
      durationFormula: template.duration,
      costs: [],
      rewards: [],
    };
  }
  
  return activities;
}

/**
 * Generate prediction report
 */
function generatePredictionReport(
  residents: Record<string, ResidentState>,
  activities: Record<string, ActivityDefinition>,
  config: FatiguePredictionConfig,
  includeAnalytics: boolean = true
): {
  summary: {
    totalResidents: number;
    totalActivities: number;
    totalPredictions: number;
    averageFatigue: number;
    highRiskResidents: number;
    averageConfidence: number;
  };
  predictions: Array<{
    residentId: string;
    residentName: string;
    activityId: string;
    activityName: string;
    prediction: FatiguePrediction;
  }>;
  analytics?: {
    riskDistribution: Record<string, number>;
    fatigueDistribution: Record<string, number>;
    confidenceDistribution: Record<string, number>;
    topRiskFactors: Array<{
      factor: string;
      impact: number;
      description: string;
    }>;
  };
} {
  const predictor = new FatiguePredictor(config);
  const predictions: Array<{
    residentId: string;
    residentName: string;
    activityId: string;
    activityName: string;
    prediction: FatiguePrediction;
  }> = [];
  
  const residentArray = Object.values(residents);
  const activityArray = Object.values(activities);
  
  // Generate predictions for all resident-activity combinations
  for (const resident of residentArray) {
    for (const activity of activityArray) {
      const prediction = predictor.predictFatigue(resident, activity, {
        environmentalConditions: ['normal'],
        crewSize: 3,
        timeOfDay: 'day',
      });
      
      predictions.push({
        residentId: resident.id,
        residentName: resident.displayName || resident.id,
        activityId: activity.id,
        activityName: activity.label,
        prediction,
      });
    }
  }
  
  // Calculate summary statistics
  const totalPredictions = predictions.length;
  const averageFatigue = predictions.reduce((sum, p) => sum + p.prediction.predictedFatigue, 0) / totalPredictions;
  const highRiskResidents = predictions.filter(p => 
    p.prediction.riskLevel === 'high' || p.prediction.riskLevel === 'critical'
  ).length;
  const averageConfidence = predictions.reduce((sum, p) => sum + p.prediction.confidence, 0) / totalPredictions;
  
  const summary = {
    totalResidents: residentArray.length,
    totalActivities: activityArray.length,
    totalPredictions,
    averageFatigue,
    highRiskResidents,
    averageConfidence,
  };
  
  let analytics;
  if (includeAnalytics) {
    // Risk distribution
    const riskDistribution = predictions.reduce((acc, p) => {
      acc[p.prediction.riskLevel] = (acc[p.prediction.riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Fatigue distribution
    const fatigueDistribution = {
      '0-20': predictions.filter(p => p.prediction.predictedFatigue <= 20).length,
      '21-40': predictions.filter(p => p.prediction.predictedFatigue > 20 && p.prediction.predictedFatigue <= 40).length,
      '41-60': predictions.filter(p => p.prediction.predictedFatigue > 40 && p.prediction.predictedFatigue <= 60).length,
      '61-80': predictions.filter(p => p.prediction.predictedFatigue > 60 && p.prediction.predictedFatigue <= 80).length,
      '81-100': predictions.filter(p => p.prediction.predictedFatigue > 80).length,
    };
    
    // Confidence distribution
    const confidenceDistribution = {
      '0-0.2': predictions.filter(p => p.prediction.confidence <= 0.2).length,
      '0.21-0.4': predictions.filter(p => p.prediction.confidence > 0.2 && p.prediction.confidence <= 0.4).length,
      '0.41-0.6': predictions.filter(p => p.prediction.confidence > 0.4 && p.prediction.confidence <= 0.6).length,
      '0.61-0.8': predictions.filter(p => p.prediction.confidence > 0.6 && p.prediction.confidence <= 0.8).length,
      '0.81-1.0': predictions.filter(p => p.prediction.confidence > 0.8).length,
    };
    
    // Top risk factors
    const factorImpacts = predictions.reduce((acc, p) => {
      const factors = p.prediction.factors;
      acc.currentFatigue = (acc.currentFatigue || 0) + factors.currentFatigue;
      acc.activityDifficulty = (acc.activityDifficulty || 0) + factors.activityDifficulty;
      acc.environmentalMultiplier = (acc.environmentalMultiplier || 0) + factors.environmentalMultiplier;
      return acc;
    }, {} as Record<string, number>);
    
    const topRiskFactors = Object.entries(factorImpacts)
      .map(([factor, impact]) => ({
        factor,
        impact: impact / totalPredictions,
        description: getFactorDescription(factor),
      }))
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 5);
    
    analytics = {
      riskDistribution,
      fatigueDistribution,
      confidenceDistribution,
      topRiskFactors,
    };
  }
  
  return { summary, predictions, analytics };
}

/**
 * Get factor description
 */
function getFactorDescription(factor: string): string {
  const descriptions: Record<string, string> = {
    currentFatigue: 'Current resident fatigue level',
    activityDifficulty: 'Activity difficulty rating',
    environmentalMultiplier: 'Environmental conditions multiplier',
    activityDuration: 'Activity duration impact',
    crewSynergyMultiplier: 'Crew size and synergy effects',
    timeOfDayMultiplier: 'Time of day effects',
  };
  
  return descriptions[factor] || factor;
}

/**
 * Generate CSV export
 */
function generateCSVExport(predictions: Array<{
  residentId: string;
  residentName: string;
  activityId: string;
  activityName: string;
  prediction: FatiguePrediction;
}>): string {
  const headers = [
    'Resident ID',
    'Resident Name',
    'Activity ID',
    'Activity Name',
    'Predicted Fatigue',
    'Fatigue Level',
    'Risk Level',
    'Confidence',
    'Time to Critical',
    'Recommended Rest',
    'Current Fatigue',
    'Activity Difficulty',
    'Environmental Multiplier',
    'Crew Synergy Multiplier',
  ];
  
  const rows = predictions.map(p => [
    p.residentId,
    p.residentName,
    p.activityId,
    p.activityName,
    p.prediction.predictedFatigue.toFixed(2),
    p.prediction.fatigueLevel,
    p.prediction.riskLevel,
    p.prediction.confidence.toFixed(3),
    p.prediction.timeToCritical,
    p.prediction.recommendedRest,
    p.prediction.factors.currentFatigue.toFixed(2),
    p.prediction.factors.activityDifficulty,
    p.prediction.factors.environmentalMultiplier.toFixed(2),
    p.prediction.factors.crewSynergyMultiplier.toFixed(2),
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

/**
 * Main CLI function
 */
async function main() {
  const args = process.argv.slice(2);
  const config: CLIConfig = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--output':
      case '-o':
        config.outputFile = args[++i];
        break;
      case '--residents':
      case '-r':
        config.sampleResidents = parseInt(args[++i], 10);
        break;
      case '--activities':
      case '-a':
        config.sampleActivities = parseInt(args[++i], 10);
        break;
      case '--no-analytics':
        config.includeAnalytics = false;
        break;
      case '--csv':
        config.generateCSV = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Idle Village Fatigue Predictor CLI Report Generator

Usage: tsx fatiguePredictorReport.ts [options]

Options:
  -o, --output <file>        Output file path (default: fatigue-predictor-report.json)
  -r, --residents <count>     Number of sample residents to generate (default: 8)
  -a, --activities <count>    Number of sample activities to generate (default: 6)
  --no-analytics              Skip detailed analytics generation
  --csv                       Generate CSV export alongside JSON
  -h, --help                  Show this help message

Examples:
  tsx fatiguePredictorReport.ts
  tsx fatiguePredictorReport.ts -o my-report.json -r 10 -a 8 --csv
  tsx fatiguePredictorReport.ts --no-analytics
        `);
        process.exit(0);
        break;
    }
  }
  
  // Set defaults
  const sampleResidents = config.sampleResidents || 8;
  const sampleActivities = config.sampleActivities || 6;
  const outputFile = config.outputFile || 'fatigue-predictor-report.json';
  const includeAnalytics = config.includeAnalytics !== false;
  const generateCSV = config.generateCSV || false;
  
  console.log('🔮 Generating Fatigue Predictor Report...');
  console.log(`📊 Sample data: ${sampleResidents} residents, ${sampleActivities} activities`);
  
  try {
    // Generate sample data
    console.log('🎲 Generating sample data...');
    const residents = generateSampleResidents(sampleResidents);
    const activities = generateSampleActivities(sampleActivities);
    
    // Generate predictions
    console.log('🧮 Calculating predictions...');
    const report = generatePredictionReport(
      residents,
      activities,
      DEFAULT_FATIGUE_PREDICTION_CONFIG,
      includeAnalytics
    );
    
    // Prepare output data
    const outputData = {
      timestamp: new Date().toISOString(),
      config: DEFAULT_FATIGUE_PREDICTION_CONFIG,
      sampleData: {
        residents: Object.keys(residents).length,
        activities: Object.keys(activities).length,
      },
      ...report,
    };
    
    // Ensure output directory exists
    const outputDir = dirname(outputFile);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    
    // Write JSON report
    console.log(`💾 Writing JSON report to ${outputFile}...`);
    writeFileSync(outputFile, JSON.stringify(outputData, null, 2));
    
    // Write CSV if requested
    if (generateCSV) {
      const csvFile = outputFile.replace('.json', '.csv');
      console.log(`💾 Writing CSV report to ${csvFile}...`);
      writeFileSync(csvFile, generateCSVExport(report.predictions));
    }
    
    // Print summary
    console.log('\n📈 Report Summary:');
    console.log(`   Total Residents: ${report.summary.totalResidents}`);
    console.log(`   Total Activities: ${report.summary.totalActivities}`);
    console.log(`   Total Predictions: ${report.summary.totalPredictions}`);
    console.log(`   Average Fatigue: ${report.summary.averageFatigue.toFixed(2)}`);
    console.log(`   High Risk Residents: ${report.summary.highRiskResidents}`);
    console.log(`   Average Confidence: ${(report.summary.averageConfidence * 100).toFixed(1)}%`);
    
    if (report.analytics) {
      console.log('\n🎯 Risk Distribution:');
      Object.entries(report.analytics.riskDistribution).forEach(([risk, count]) => {
        console.log(`   ${risk}: ${count}`);
      });
      
      console.log('\n⚠️  Top Risk Factors:');
      report.analytics.topRiskFactors.forEach((factor, index) => {
        console.log(`   ${index + 1}. ${factor.description}: ${factor.impact.toFixed(3)}`);
      });
    }
    
    console.log('\n✅ Report generation completed successfully!');
    
  } catch (error) {
    console.error('❌ Error generating report:', error);
    process.exit(1);
  }
}

/**
 * Get directory name from file path
 */
function dirname(path: string): string {
  return path.split('/').slice(0, -1).join('/');
}

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
