/**
 * Unit Tests for Physics Lab Asset Downloader
 * 
 * Tests the CLI functionality for downloading and managing free assets
 * from freesound.org and opengame.org.
 * 
 * @author Cascade
 * @since 2026-02-19
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { AssetDownloader, FreeSoundClient, TextureClient, AssetMappingSchema } from '../assetDownloader';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock console methods to avoid noise in tests
const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};

describe('AssetDownloader', () => {
  let downloader: AssetDownloader;
  const testApiKey = 'test-api-key';

  beforeEach(() => {
    // Set up environment variable
    process.env.FREESOUND_API_KEY = testApiKey;
    
    // Mock console methods
    Object.assign(console, mockConsole);
    
    // Reset fetch mocks
    mockFetch.mockClear();
    
    downloader = new AssetDownloader();
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.FREESOUND_API_KEY;
  });

  describe('Constructor', () => {
    it('should throw error when API key is missing', () => {
      delete process.env.FREESOUND_API_KEY;
      expect(() => new AssetDownloader()).toThrow('FREESOUND_API_KEY environment variable required');
    });

    it('should create instance with valid API key', () => {
      expect(downloader).toBeInstanceOf(AssetDownloader);
    });
  });

  describe('FreeSoundClient', () => {
    let client: FreeSoundClient;

    beforeEach(() => {
      client = new FreeSoundClient(testApiKey);
    });

    it('should search sounds with correct parameters', async () => {
      const mockResponse = {
        results: [
          {
            id: '123',
            name: 'Test Thud',
            url: 'https://freesound.org/s/123',
            duration: 0.5,
            license: 'CC0',
            filesize: 1024,
            download: 'https://freesound.org/download/123',
          },
        ],
        count: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.searchSounds('thud', 'CC0', 5);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('query=thud'),
        expect.objectContaining({
          headers: {
            'Authorization': `Token ${testApiKey}`,
            'User-Agent': 'RPG-Balancer-PhysicsLab/1.0',
          },
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(client.searchSounds('test', 'CC0')).rejects.toThrow('FreeSound API error: 401');
    });

    it('should download sound file', async () => {
      const mockSoundInfo = { download: 'https://freesound.org/download/123' };
      const mockAudioBuffer = Buffer.from('fake audio data');

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSoundInfo,
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => mockAudioBuffer,
        });

      const outputPath = '/tmp/test.wav';
      const result = await client.downloadSound('123', outputPath);

      expect(result).toEqual({
        path: outputPath,
        size: mockAudioBuffer.length,
        checksum: crypto.createHash('sha256').update(mockAudioBuffer).digest('hex'),
      });
    });
  });

  describe('TextureClient', () => {
    let client: TextureClient;

    beforeEach(() => {
      client = new TextureClient();
    });

    it('should search textures with placeholder implementation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      const result = await client.searchTextures('liquid', 'CC-BY');

      expect(result).toEqual({
        results: [],
        message: 'Texture parsing not implemented - use manual download for now',
      });
    });

    it('should download texture from URL', async () => {
      const mockImageBuffer = Buffer.from('fake image data');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockImageBuffer,
      });

      const outputPath = '/tmp/test.png';
      const result = await client.downloadTexture('https://example.com/texture.png', outputPath);

      expect(result).toEqual({
        path: outputPath,
        size: mockImageBuffer.length,
        checksum: crypto.createHash('sha256').update(mockImageBuffer).digest('hex'),
      });
    });

    it('should handle download errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(
        client.downloadTexture('https://example.com/notfound.png', '/tmp/test.png')
      ).rejects.toThrow('Texture download failed: 404');
    });
  });

  describe('AssetDownloader Integration', () => {
    beforeEach(() => {
      // Mock fs operations
      vi.mocked(fs).mkdir = vi.fn().mockResolvedValue(undefined);
      vi.mocked(fs).writeFile = vi.fn().mockResolvedValue(undefined);
    });

    it('should download audio assets successfully', async () => {
      const mockSoundResponse = {
        results: [
          {
            id: '123',
            name: 'UI Thud',
            url: 'https://freesound.org/s/123',
            duration: 0.2,
            license: 'CC0',
            filesize: 512,
            download: 'https://freesound.org/download/123',
          },
        ],
        count: 1,
      };

      const mockSoundInfo = { download: 'https://freesound.org/download/123' };
      const mockAudioBuffer = Buffer.from('thud sound');

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSoundResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSoundInfo,
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => mockAudioBuffer,
        });

      const results = await downloader.downloadAudioAssets(['thud'], 'CC0');

      expect(results).toHaveProperty('thud');
      expect(results.thud).toMatchObject({
        source: 'freesound.org',
        license: 'CC0',
        originalName: 'UI Thud',
      });
    });

    it('should handle missing audio results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], count: 0 }),
      });

      const results = await downloader.downloadAudioAssets(['nonexistent'], 'CC0');

      expect(results).toHaveProperty('nonexistent');
      expect(console.log).toHaveBeenCalledWith('⚠ No results found for: nonexistent');
    });

    it('should download shader assets with placeholders', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      const results = await downloader.downloadShaderAssets(['liquid']);

      expect(results).toHaveProperty('liquid');
      expect(results.liquid).toMatchObject({
        source: 'placeholder',
        license: 'CC0',
        originalName: 'liquid placeholder',
      });
    });

    it('should generate asset mapping', () => {
      const audioResults = {
        thud: {
          path: '/audio/physics-lab/thud.wav',
          size: 1024,
          checksum: 'abc123',
          source: 'freesound.org',
          license: 'CC0',
          originalName: 'UI Thud',
        },
      };

      const shaderResults = {
        liquid: {
          path: '/assets/shaders/physics-lab/liquid.png',
          size: 2048,
          checksum: 'def456',
          source: 'placeholder',
          license: 'CC0',
          originalName: 'liquid placeholder',
        },
      };

      const mapping = downloader.generateAssetMapping(audioResults, shaderResults);

      expect(mapping).toMatchObject({
        audio: {
          thud: '/audio/physics-lab/thud.wav',
        },
        shaders: {
          liquid: '/assets/shaders/physics-lab/liquid.png',
        },
        metadata: {
          totalAssets: 2,
          sourceInfo: {
            thud: {
              source: 'freesound.org',
              license: 'CC0',
              size: 1024,
              checksum: 'abc123',
            },
            liquid: {
              source: 'placeholder',
              license: 'CC0',
              size: 2048,
              checksum: 'def456',
            },
          },
        },
      });

      // Validate against schema
      expect(() => AssetMappingSchema.parse(mapping)).not.toThrow();
    });

    it('should validate asset integrity', async () => {
      const mapping = {
        audio: {
          'test-thud': '/audio/physics-lab/test-thud.wav',
        },
        shaders: {
          'test-liquid': '/assets/shaders/physics-lab/test-liquid.png',
        },
        metadata: {
          lastUpdated: new Date().toISOString(),
          totalAssets: 2,
          sourceInfo: {
            'test-thud': {
              source: 'freesound.org',
              license: 'CC0',
              size: 1024,
              checksum: 'abc123',
            },
            'test-liquid': {
              source: 'placeholder',
              license: 'CC0',
              size: 0,
              checksum: 'placeholder',
            },
          },
        },
      };

      // Mock file system operations for validation
      const mockBuffer = Buffer.from('test data');
      vi.mocked(fs).stat = vi.fn().mockResolvedValue({ size: 1024 } as any);
      vi.mocked(fs).readFile = vi.fn().mockResolvedValue(mockBuffer);

      const isValid = await downloader.validateAssets(mapping);

      expect(isValid).toBe(true);
    });

    it('should detect checksum mismatch', async () => {
      const mapping = {
        audio: {
          'test-thud': '/audio/physics-lab/test-thud.wav',
        },
        shaders: {},
        metadata: {
          lastUpdated: new Date().toISOString(),
          totalAssets: 1,
          sourceInfo: {
            'test-thud': {
              source: 'freesound.org',
              license: 'CC0',
              size: 1024,
              checksum: 'wrong-checksum',
            },
          },
        },
      };

      const mockBuffer = Buffer.from('test data');
      vi.mocked(fs).stat = vi.fn().mockResolvedValue({ size: 1024 } as any);
      vi.mocked(fs).readFile = vi.fn().mockResolvedValue(mockBuffer);

      const isValid = await downloader.validateAssets(mapping);

      expect(isValid).toBe(false);
      expect(console.error).toHaveBeenCalledWith('✗ Audio test-thud: checksum mismatch');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const results = await downloader.downloadAudioAssets(['thud'], 'CC0');

      expect(results.thud).toHaveProperty('error');
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle file system errors', async () => {
      const mockSoundResponse = {
        results: [
          {
            id: '123',
            name: 'UI Thud',
            url: 'https://freesound.org/s/123',
            duration: 0.2,
            license: 'CC0',
            filesize: 512,
            download: 'https://freesound.org/download/123',
          },
        ],
        count: 1,
      };

      const mockSoundInfo = { download: 'https://freesound.org/download/123' };
      const mockAudioBuffer = Buffer.from('thud sound');

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSoundResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSoundInfo,
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => mockAudioBuffer,
        });

      // Mock file system error
      vi.mocked(fs).writeFile = vi.fn().mockRejectedValue(new Error('Permission denied'));

      const results = await downloader.downloadAudioAssets(['thud'], 'CC0');

      expect(results.thud).toHaveProperty('error');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Placeholder Generation', () => {
    it('should create placeholder textures', async () => {
      vi.mocked(fs).mkdir = vi.fn().mockResolvedValue(undefined);
      vi.mocked(fs).writeFile = vi.fn().mockResolvedValue(undefined);

      const outputPath = '/tmp/test-placeholder.png';
      
      // Access private method through reflection for testing
      const createPlaceholder = (downloader as any).createPlaceholderTexture.bind(downloader);
      await createPlaceholder(outputPath, 'test');

      expect(fs.writeFile).toHaveBeenCalledWith(
        outputPath,
        expect.any(Buffer)
      );
    });
  });
});
