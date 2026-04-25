#!/usr/bin/env node

/**
 * Synergy Heatmap API Server
 * 
 * Express server providing REST-like endpoints for synergy heatmap data.
 * Serves on port 3001 with CORS support and health checks.
 * 
 * @module StressTestingServer
 * @since 2026-01-12
 * @author Vector-Marginal
 */

import express from 'express';
import cors from 'cors';
import { 
  handleSynergyHeatmapRequest, 
  handleHealthCheck, 
  handleClearCache 
} from '../../src/api/stressTesting/synergy.js';

/** Server configuration */
const SERVER_CONFIG = {
  port: process.env.STRESS_TEST_API_PORT ? parseInt(process.env.STRESS_TEST_API_PORT, 10) : 3001,
  host: process.env.STRESS_TEST_API_HOST || 'localhost',
  enableCors: process.env.NODE_ENV !== 'production',
  logRequests: process.env.STRESS_TEST_API_LOG !== 'false',
};

/**
 * Create and configure Express app
 */
function createApp(): express.Application {
  const app = express();

  // CORS configuration for development
  if (SERVER_CONFIG.enableCors) {
    app.use(cors({
      origin: ['http://localhost:5173', 'http://localhost:3000'], // Vite dev server ports
      credentials: true,
    }));
  }

  // Request logging middleware
  if (SERVER_CONFIG.logRequests) {
    app.use((req, res, next) => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ${req.method} ${req.path}`);
      next();
    });
  }

  // JSON parsing with size limit
  app.use(express.json({ limit: '1mb' }));

  // Health check endpoint
  app.get('/health', async (req, res) => {
    try {
      const health = await handleHealthCheck();
      res.status(health.status === 'healthy' ? 200 : 503).json(health);
    } catch (error) {
      console.error('[Server] Health check failed:', error);
      res.status(500).json({
        status: 'error',
        timestamp: Date.now(),
        error: 'Health check failed',
      });
    }
  });

  // Main synergy heatmap endpoint
  app.get('/api/stress-testing/synergy', async (req, res) => {
    try {
      const result = await handleSynergyHeatmapRequest();
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('[Server] Synergy request failed:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  });

  // Cache management endpoint (admin/debug)
  app.delete('/api/stress-testing/cache', async (req, res) => {
    try {
      const result = await handleClearCache();
      res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      console.error('[Server] Cache clear failed:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear cache',
      });
    }
  });

  // API documentation endpoint
  app.get('/api/stress-testing', (req, res) => {
    res.json({
      name: 'Stress Testing API',
      version: '1.0.0',
      description: 'REST-like API for synergy heatmap data and stress testing results',
      endpoints: {
        'GET /api/stress-testing/synergy': {
          description: 'Get synergy heatmap data',
          response: {
            success: 'boolean',
            data: 'Record<string, Record<string, number>>',
            metadata: {
              analysisId: 'string',
              analysisTimestamp: 'number',
              cacheTimestamp: 'number',
              isFromCache: 'boolean',
            },
          },
        },
        'GET /health': {
          description: 'Health check endpoint',
          response: {
            status: 'string',
            timestamp: 'number',
            cacheInfo: {
              hasValidCache: 'boolean',
              cacheTimestamp: 'number | null',
              hasLatestExport: 'boolean',
              latestExportPath: 'string | null',
            },
          },
        },
        'DELETE /api/stress-testing/cache': {
          description: 'Clear API cache (admin/debug)',
          response: {
            success: 'boolean',
            message: 'string',
          },
        },
      },
      examples: {
        synergy: 'curl http://localhost:3001/api/stress-testing/synergy',
        health: 'curl http://localhost:3001/health',
        clearCache: 'curl -X DELETE http://localhost:3001/api/stress-testing/cache',
      },
    });
  });

  // 404 handler for unknown routes
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: `Endpoint not found: ${req.method} ${req.originalUrl}`,
      availableEndpoints: [
        'GET /api/stress-testing/synergy',
        'GET /health',
        'DELETE /api/stress-testing/cache',
        'GET /api/stress-testing',
      ],
    });
  });

  return app;
}

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  const app = createApp();

  return new Promise<void>((resolve, reject) => {
    const server = app.listen(SERVER_CONFIG.port, SERVER_CONFIG.host, () => {
      const address = server.address();
      const port = typeof address === 'string' ? address : address?.port;
      const host = typeof address === 'string' ? 'unknown' : address?.address || 'localhost';
      
      console.log(`\n🚀 Stress Testing API Server started`);
      console.log(`📍 Server: http://${host}:${port}`);
      console.log(`🔗 API Docs: http://${host}:${port}/api/stress-testing`);
      console.log(`❤️  Health: http://${host}:${port}/health`);
      console.log(`🔥 Synergy: http://${host}:${port}/api/stress-testing/synergy`);
      console.log(`🧹 Cache: DELETE http://${host}:${port}/api/stress-testing/cache`);
      console.log(`\n📝 Configuration:`);
      console.log(`   - Port: ${SERVER_CONFIG.port}`);
      console.log(`   - Host: ${SERVER_CONFIG.host}`);
      console.log(`   - CORS: ${SERVER_CONFIG.enableCors ? 'enabled' : 'disabled'}`);
      console.log(`   - Logging: ${SERVER_CONFIG.logRequests ? 'enabled' : 'disabled'}`);
      console.log(`\n🎯 Ready to serve synergy heatmap data!\n`);
      
      resolve();
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${SERVER_CONFIG.port} is already in use`);
        console.error(`💡 Try using a different port:`);
        console.error(`   STRESS_TEST_API_PORT=3002 npm run stress-api:server`);
        console.error(`   Or kill the existing process:`);
        console.error(`   lsof -ti:${SERVER_CONFIG.port} | xargs kill -9`);
      } else {
        console.error('❌ Failed to start server:', error);
      }
      reject(error);
    });

    // Graceful shutdown handling
    process.on('SIGTERM', () => {
      console.log('\n🛑 SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('\n🛑 SIGINT received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
  });
}

/**
 * CLI entry point
 */
async function main(): Promise<void> {
  try {
    await startServer();
  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
}

// Run server if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

export { createApp, startServer };
