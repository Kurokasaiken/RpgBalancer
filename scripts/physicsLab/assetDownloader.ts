#!/usr/bin/env tsx

/**
 * Physics Lab Asset Downloader CLI
 * 
 * Downloads free assets from freesound.org and opengame.org/textures.com
 * for Physics Lab audio and shader texture requirements.
 * 
 * @author Cascade
 * @since 2026-02-19
 */

import { Command } from 'commander';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fetch } from 'undici';

// Configuration schema for asset types
const AssetConfigSchema = z.object({
  audio: z.object({
    sources: z.array(z.string()),
    license: z.enum(['CC0', 'CC-BY']),
    format: z.enum(['wav', 'ogg']),
    sampleRate: z.number().default(44100),
    bitDepth: z.number().default(16),
    maxSize: z.number().default(2 * 1024 * 1024), // 2MB
  }),
  shaders: z.object({
    types: z.array(z.string()),
    resolution: z.number().default(512),
    format: z.enum(['png', 'jpg']),
    maxSize: z.number().default(1024 * 1024), // 1MB
  }),
});

type AssetConfig = z.infer<typeof AssetConfigSchema>;

// Asset mapping configuration schema
export const AssetMappingSchema = z.object({
  audio: z.record(z.string(), z.string()),
  shaders: z.record(z.string(), z.string()),
  metadata: z.object({
    lastUpdated: z.string(),
    totalAssets: z.number(),
    sourceInfo: z.record(z.string(), z.object({
      source: z.string(),
      license: z.string(),
      size: z.number(),
      checksum: z.string(),
    })),
  }),
});

export type AssetMapping = z.infer<typeof AssetMappingSchema>;

// Type definitions for API responses
interface FreeSoundSound {
  id: string;
  name: string;
  url: string;
  duration: number;
  license: string;
  filesize: number;
  download: string;
}

interface FreeSoundResponse {
  results: FreeSoundSound[];
  count: number;
  next?: string;
  previous?: string;
}

interface TextureResult {
  name: string;
  url: string;
  license: string;
}

interface TextureSearchResponse {
  results: TextureResult[];
  message?: string;
}

/**
 * FreeSound API client for CC0/CC-BY audio assets
 */
class FreeSoundClient {
  private apiKey: string;
  private baseUrl = 'https://freesound.org/apiv2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Search for sounds with specific filters
   */
  async searchSounds(query: string, license: string, limit: number = 10): Promise<FreeSoundResponse> {
    const params = new URLSearchParams({
      query,
      filter: `license:${license}`,
      limit: limit.toString(),
      fields: 'id,name,url,duration,license,filesize',
    });

    const response = await fetch(`${this.baseUrl}/search/text/?${params}`, {
      headers: {
        'Authorization': `Token ${this.apiKey}`,
        'User-Agent': 'RPG-Balancer-PhysicsLab/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`FreeSound API error: ${response.status}`);
    }

    return response.json() as Promise<FreeSoundResponse>;
  }

  /**
   * Download sound file and validate integrity
   */
  async downloadSound(soundId: string, outputPath: string): Promise<{
    path: string;
    size: number;
    checksum: string;
  }> {
    // Get sound download URL
    const soundInfo = await fetch(`${this.baseUrl}/sounds/${soundId}/`, {
      headers: {
        'Authorization': `Token ${this.apiKey}`,
      },
    });

    if (!soundInfo.ok) {
      throw new Error(`Failed to get sound info: ${soundInfo.status}`);
    }

    const soundData = await soundInfo.json() as { download: string };
    const downloadUrl = soundData.download;

    // Download the file
    const response = await fetch(downloadUrl, {
      headers: {
        'Authorization': `Token ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
    
    // Write file
    await fs.writeFile(outputPath, buffer);

    return {
      path: outputPath,
      size: buffer.length,
      checksum,
    };
  }
}

/**
 * OpenGameArt/Textures.com client for shader textures
 */
class TextureClient {
  private baseUrl = 'https://opengameart.org';

  /**
   * Search for textures with CC-BY license
   */
  async searchTextures(query: string, license: string = 'CC-BY'): Promise<TextureSearchResponse> {
    // Note: This is a simplified implementation
    // In production, would need to parse HTML or use API if available
    const searchUrl = `${this.baseUrl}/content/search-texture?keys=${encodeURIComponent(query)}&license=${license}`;
    
    const response = await fetch(searchUrl);
    if (!response.ok) {
      throw new Error(`Texture search failed: ${response.status}`);
    }

    // Placeholder implementation - would need actual parsing logic
    return {
      results: [],
      message: 'Texture parsing not implemented - use manual download for now',
    };
  }

  /**
   * Download texture from URL
   */
  async downloadTexture(url: string, outputPath: string): Promise<{
    path: string;
    size: number;
    checksum: string;
  }> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Texture download failed: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
    
    await fs.writeFile(outputPath, buffer);

    return {
      path: outputPath,
      size: buffer.length,
      checksum,
    };
  }
}

/**
 * Main asset downloader class
 */
class AssetDownloader {
  private freeSoundClient: FreeSoundClient;
  private textureClient: TextureClient;
  private outputDirs: {
    audio: string;
    shaders: string;
  };

  constructor() {
    const apiKey = process.env.FREESOUND_API_KEY;
    if (!apiKey) {
      throw new Error('FREESOUND_API_KEY environment variable required');
    }

    this.freeSoundClient = new FreeSoundClient(apiKey);
    this.textureClient = new TextureClient();

    this.outputDirs = {
      audio: path.join(process.cwd(), 'public/audio/physics-lab'),
      shaders: path.join(process.cwd(), 'public/assets/shaders/physics-lab'),
    };
  }

  /**
   * Ensure output directories exist
   */
  private async ensureDirectories() {
    await fs.mkdir(this.outputDirs.audio, { recursive: true });
    await fs.mkdir(this.outputDirs.shaders, { recursive: true });
  }

  /**
   * Download audio assets for UI interactions
   */
  async downloadAudioAssets(sources: string[], license: string): Promise<Record<string, any>> {
    await this.ensureDirectories();
    
    const results: Record<string, any> = {};
    
    for (const source of sources) {
      try {
        console.log(`Searching for audio: ${source}`);
        const searchResults = await this.freeSoundClient.searchSounds(source, license, 5);
        
        if (searchResults.results && searchResults.results.length > 0) {
          const sound = searchResults.results[0];
          const fileName = `${source}.wav`;
          const outputPath = path.join(this.outputDirs.audio, fileName);
          
          console.log(`Downloading: ${sound.name} -> ${fileName}`);
          const downloadResult = await this.freeSoundClient.downloadSound(sound.id, outputPath);
          
          results[source] = {
            ...downloadResult,
            source: 'freesound.org',
            license: sound.license,
            originalName: sound.name,
          };
          
          console.log(`✓ Downloaded ${source} (${downloadResult.size} bytes)`);
        } else {
          console.log(`⚠ No results found for: ${source}`);
        }
      } catch (error) {
        console.error(`✗ Failed to download ${source}:`, error);
        results[source] = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
    
    return results;
  }

  /**
   * Download shader texture assets
   */
  async downloadShaderAssets(types: string[]): Promise<Record<string, any>> {
    await this.ensureDirectories();
    
    const results: Record<string, any> = {};
    
    for (const type of types) {
      try {
        console.log(`Searching for texture: ${type}`);
        const searchResults = await this.textureClient.searchTextures(type);
        
        if (searchResults.results && searchResults.results.length > 0) {
          const texture = searchResults.results[0];
          const fileName = `${type}.png`;
          const outputPath = path.join(this.outputDirs.shaders, fileName);
          
          console.log(`Downloading: ${texture.name} -> ${fileName}`);
          const downloadResult = await this.textureClient.downloadTexture(texture.url, outputPath);
          
          results[type] = {
            ...downloadResult,
            source: 'opengameart.org',
            license: 'CC-BY',
            originalName: texture.name,
          };
          
          console.log(`✓ Downloaded ${type} (${downloadResult.size} bytes)`);
        } else {
          console.log(`⚠ No results found for: ${type}`);
          // Create placeholder for missing textures
          const placeholderPath = path.join(this.outputDirs.shaders, `${type}.png`);
          await this.createPlaceholderTexture(placeholderPath, type);
          results[type] = {
            path: placeholderPath,
            size: 0,
            checksum: 'placeholder',
            source: 'placeholder',
            license: 'CC0',
            originalName: `${type} placeholder`,
          };
        }
      } catch (error) {
        console.error(`✗ Failed to download ${type}:`, error);
        results[type] = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
    
    return results;
  }

  /**
   * Create a simple placeholder texture
   */
  private async createPlaceholderTexture(outputPath: string, type: string) {
    // Create a simple 64x64 PNG placeholder
    const size = 64;
    const canvasData = Buffer.alloc(size * size * 4); // RGBA
    
    // Fill with a simple pattern based on type
    const hash = crypto.createHash('md5').update(type).digest();
    const r = hash[0] || 128;
    const g = hash[1] || 128;
    const b = hash[2] || 128;
    
    for (let i = 0; i < canvasData.length; i += 4) {
      canvasData[i] = r;     // R
      canvasData[i + 1] = g; // G
      canvasData[i + 2] = b; // B
      canvasData[i + 3] = 255; // A
    }
    
    await fs.writeFile(outputPath, canvasData);
  }

  /**
   * Generate asset mapping configuration
   */
  generateAssetMapping(audioResults: Record<string, any>, shaderResults: Record<string, any>): AssetMapping {
    const audio: Record<string, string> = {};
    const shaders: Record<string, string> = {};
    const metadata: any = {
      lastUpdated: new Date().toISOString(),
      totalAssets: 0,
      sourceInfo: {},
    };

    // Process audio assets
    for (const [key, result] of Object.entries(audioResults)) {
      if (!result.error) {
        audio[key] = `/audio/physics-lab/${key}.wav`;
        metadata.sourceInfo[key] = {
          source: result.source,
          license: result.license,
          size: result.size,
          checksum: result.checksum,
        };
        metadata.totalAssets++;
      }
    }

    // Process shader assets
    for (const [key, result] of Object.entries(shaderResults)) {
      if (!result.error) {
        shaders[key] = `/assets/shaders/physics-lab/${key}.png`;
        metadata.sourceInfo[key] = {
          source: result.source,
          license: result.license,
          size: result.size,
          checksum: result.checksum,
        };
        metadata.totalAssets++;
      }
    }

    return {
      audio,
      shaders,
      metadata,
    };
  }

  /**
   * Validate asset integrity
   */
  async validateAssets(mapping: AssetMapping): Promise<boolean> {
    let allValid = true;

    for (const [key, filePath] of Object.entries(mapping.audio)) {
      try {
        const fullPath = path.join(process.cwd(), 'public', filePath);
        const stats = await fs.stat(fullPath);
        const buffer = await fs.readFile(fullPath);
        const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
        
        const expectedChecksum = mapping.metadata.sourceInfo[key]?.checksum;
        if (checksum !== expectedChecksum) {
          console.error(`✗ Audio ${key}: checksum mismatch`);
          allValid = false;
        }
      } catch (error) {
        console.error(`✗ Audio ${key}: validation failed`, error);
        allValid = false;
      }
    }

    for (const [key, filePath] of Object.entries(mapping.shaders)) {
      try {
        const fullPath = path.join(process.cwd(), 'public', filePath);
        const stats = await fs.stat(fullPath);
        const buffer = await fs.readFile(fullPath);
        const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
        
        const expectedChecksum = mapping.metadata.sourceInfo[key]?.checksum;
        if (checksum !== expectedChecksum) {
          console.error(`✗ Shader ${key}: checksum mismatch`);
          allValid = false;
        }
      } catch (error) {
        console.error(`✗ Shader ${key}: validation failed`, error);
        allValid = false;
      }
    }

    return allValid;
  }
}

// CLI setup
const program = new Command();

program
  .name('asset-downloader')
  .description('Physics Lab Asset Downloader CLI')
  .version('1.0.0');

program
  .command('download-audio')
  .description('Download audio assets from freesound.org')
  .option('--sources <sources>', 'Comma-separated list of audio sources', 'thud,shimmer,slot-snap,power-up')
  .option('--license <license>', 'License filter (CC0 or CC-BY)', 'CC0')
  .action(async (options) => {
    try {
      const downloader = new AssetDownloader();
      const sources = options.sources.split(',').map((s: string) => s.trim());
      
      console.log('Downloading audio assets...');
      const results = await downloader.downloadAudioAssets(sources, options.license);
      
      console.log(`Audio download complete. Results:`, Object.keys(results).length, 'items processed');
    } catch (error) {
      console.error('Audio download failed:', error);
      process.exit(1);
    }
  });

program
  .command('download-shaders')
  .description('Download shader textures from opengame.org')
  .option('--types <types>', 'Comma-separated list of texture types', 'liquid,fog,foil,particle')
  .option('--resolution <resolution>', 'Texture resolution', '512')
  .action(async (options) => {
    try {
      const downloader = new AssetDownloader();
      const types = options.types.split(',').map((s: string) => s.trim());
      
      console.log('Downloading shader textures...');
      const results = await downloader.downloadShaderAssets(types);
      
      console.log(`Shader download complete. Results:`, Object.keys(results).length, 'items processed');
    } catch (error) {
      console.error('Shader download failed:', error);
      process.exit(1);
    }
  });

program
  .command('download-all')
  .description('Download all required assets')
  .option('--audio-license <license>', 'Audio license filter', 'CC0')
  .action(async (options) => {
    try {
      const downloader = new AssetDownloader();
      
      // Download audio
      const audioSources = ['thud', 'shimmer', 'slot-snap', 'power-up'];
      console.log('Downloading audio assets...');
      const audioResults = await downloader.downloadAudioAssets(audioSources, options.audioLicense);
      
      // Download shaders
      const shaderTypes = ['liquid-gauge', 'fog-slot', 'foil-card', 'particle-sprite'];
      console.log('Downloading shader textures...');
      const shaderResults = await downloader.downloadShaderAssets(shaderTypes);
      
      // Generate mapping
      const mapping = downloader.generateAssetMapping(audioResults, shaderResults);
      
      // Save mapping config
      const configPath = path.join(process.cwd(), 'src/ui/styleLab/config/assetMappingConfig.ts');
      const configContent = `/** Auto-generated asset mapping - DO NOT EDIT MANUALLY */
import { z } from 'zod';

export const ASSET_MAPPING = ${JSON.stringify(mapping, null, 2)} as const;

export const AssetMappingSchema = z.object({
  audio: z.record(z.string(), z.string()),
  shaders: z.record(z.string(), z.string()),
  metadata: z.object({
    lastUpdated: z.string(),
    totalAssets: z.number(),
    sourceInfo: z.record(z.string(), z.object({
      source: z.string(),
      license: z.string(),
      size: z.number(),
      checksum: z.string(),
    })),
  }),
});
`;
      await fs.writeFile(configPath, configContent);
      console.log(`✓ Asset mapping saved to: ${configPath}`);
      
      // Validate assets
      const isValid = await downloader.validateAssets(mapping);
      console.log(`Asset validation: ${isValid ? '✓ PASSED' : '✗ FAILED'}`);
      
      console.log('All downloads complete!');
    } catch (error) {
      console.error('Download failed:', error);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate asset integrity')
  .option('--check-integrity', 'Perform checksum validation')
  .action(async (options) => {
    try {
      // Load existing mapping
      const configPath = path.join(process.cwd(), 'src/ui/styleLab/config/assetMappingConfig.ts');
      const configContent = await fs.readFile(configPath, 'utf-8');
      
      // Extract mapping from config (simple regex approach)
      const match = configContent.match(/export const ASSET_MAPPING = ({[\s\S]*?}) as const;/);
      if (!match) {
        throw new Error('Could not find ASSET_MAPPING in config');
      }
      
      const mapping = JSON.parse(match[1]) as AssetMapping;
      
      const downloader = new AssetDownloader();
      const isValid = await downloader.validateAssets(mapping);
      
      console.log(`Asset validation: ${isValid ? '✓ PASSED' : '✗ FAILED'}`);
      
      if (!isValid) {
        process.exit(1);
      }
    } catch (error) {
      console.error('Validation failed:', error);
      process.exit(1);
    }
  });

if (require.main === module) {
  program.parse();
}

export { AssetDownloader, FreeSoundClient, TextureClient };
