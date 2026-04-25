/**
 * Balancer Config Compression
 * Compression system for balancer config export with multiple algorithms
 * 
 * @see NP-190 – Balancer Config Export Compression
 */

import pako from 'pako';
import {
  DEFAULT_COMPRESSION_CONFIG,
  type CompressionConfig,
  type CompressionResult,
  type DecompressionResult,
  type CompressionOptions,
  type CompressionAlgorithm,
  calculateCompressionRatio,
} from '../config/compressionConfig';

/**
 * Generate checksum for data integrity validation
 */
function generateChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Convert Uint8Array to Base64 string
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Config Compression Service
 * 
 * Provides compression and decompression for balancer configs with:
 * - Multiple compression algorithms (gzip, deflate)
 * - Configurable compression levels
 * - Multiple output formats (json, base64, binary)
 * - Checksum validation
 * - Telemetry integration
 */
export class ConfigCompression {
  private config: CompressionConfig;

  constructor(config: CompressionConfig = DEFAULT_COMPRESSION_CONFIG) {
    this.config = config;
  }

  /**
   * Compress data with specified options
   */
  compress<T = unknown>(
    data: T,
    options?: Partial<CompressionOptions>
  ): CompressionResult {
    const opts: CompressionOptions = {
      algorithm: options?.algorithm || this.config.defaultAlgorithm,
      level: options?.level || this.config.defaultLevel,
      format: options?.format || this.config.defaultFormat,
      includeMetadata: options?.includeMetadata ?? this.config.options.includeMetadata,
      validateChecksum: options?.validateChecksum ?? this.config.options.validateChecksum,
    };

    // Validate algorithm
    if (!this.config.validation.allowedAlgorithms.includes(opts.algorithm)) {
      throw new Error(`Algorithm ${opts.algorithm} not allowed`);
    }

    // Serialize data
    const jsonString = JSON.stringify(data);
    const originalSize = new Blob([jsonString]).size;

    // Check minimum size
    if (originalSize < this.config.options.minSizeForCompression) {
      return this.createUncompressedResult(jsonString, originalSize, opts);
    }

    // Check maximum size
    if (this.config.validation.strictMode && originalSize > this.config.validation.maxSize) {
      throw new Error(`Data size ${originalSize} exceeds maximum ${this.config.validation.maxSize}`);
    }

    // Generate checksum
    const checksum = generateChecksum(jsonString);

    // Compress based on algorithm
    let compressed: Uint8Array;
    
    if (opts.algorithm === 'none') {
      return this.createUncompressedResult(jsonString, originalSize, opts, checksum);
    }

    try {
      if (opts.algorithm === 'gzip') {
        compressed = pako.gzip(jsonString, { level: opts.level });
      } else if (opts.algorithm === 'deflate') {
        compressed = pako.deflate(jsonString, { level: opts.level });
      } else {
        throw new Error(`Unsupported algorithm: ${opts.algorithm}`);
      }
    } catch (error) {
      console.error('[ConfigCompression] Compression failed:', error);
      throw new Error(`Compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const compressedSize = compressed.byteLength;
    const compressionRatio = calculateCompressionRatio(originalSize, compressedSize);

    // Format output
    let output: string | Uint8Array;
    
    if (opts.format === 'base64') {
      output = uint8ArrayToBase64(compressed);
    } else if (opts.format === 'binary') {
      output = compressed;
    } else {
      output = uint8ArrayToBase64(compressed);
    }

    const result: CompressionResult = {
      compressed: output,
      originalSize,
      compressedSize,
      compressionRatio,
      algorithm: opts.algorithm,
      format: opts.format,
      checksum,
      timestamp: Date.now(),
    };

    // Add metadata if enabled
    if (opts.includeMetadata) {
      result.metadata = {
        level: opts.level,
        version: '1.0.0',
      };
    }

    // Emit telemetry
    if (this.config.telemetry.enabled) {
      this.emitTelemetry(result);
    }

    return result;
  }

  /**
   * Decompress data and validate
   */
  decompress<T = unknown>(
    result: CompressionResult,
    validateChecksum = true
  ): DecompressionResult<T> {
    const { compressed, algorithm, format, checksum, originalSize, compressedSize, compressionRatio } = result;

    // Validate algorithm
    if (!this.config.validation.allowedAlgorithms.includes(algorithm)) {
      throw new Error(`Algorithm ${algorithm} not allowed`);
    }

    // Handle uncompressed data
    if (algorithm === 'none') {
      const jsonString = typeof compressed === 'string' ? compressed : new TextDecoder().decode(compressed);
      const data = JSON.parse(jsonString) as T;
      
      // Validate checksum if required
      const checksumValid = validateChecksum ? generateChecksum(jsonString) === checksum : true;
      
      if (validateChecksum && !checksumValid) {
        throw new Error('Checksum validation failed');
      }

      return {
        data,
        originalSize,
        compressedSize,
        compressionRatio,
        algorithm,
        checksumValid,
        timestamp: Date.now(),
      };
    }

    // Convert to Uint8Array if needed
    let bytes: Uint8Array;
    
    if (typeof compressed === 'string') {
      if (format === 'base64') {
        bytes = base64ToUint8Array(compressed);
      } else {
        throw new Error('Invalid format for string compressed data');
      }
    } else {
      bytes = compressed;
    }

    // Decompress based on algorithm
    let decompressed: Uint8Array;
    
    try {
      if (algorithm === 'gzip') {
        decompressed = pako.ungzip(bytes);
      } else if (algorithm === 'deflate') {
        decompressed = pako.inflate(bytes);
      } else {
        throw new Error(`Unsupported algorithm: ${algorithm}`);
      }
    } catch (error) {
      console.error('[ConfigCompression] Decompression failed:', error);
      throw new Error(`Decompression failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Convert to string and parse
    const jsonString = new TextDecoder().decode(decompressed);
    
    // Validate checksum if required
    const checksumValid = validateChecksum ? generateChecksum(jsonString) === checksum : true;
    
    if (validateChecksum && !checksumValid) {
      throw new Error('Checksum validation failed');
    }

    const data = JSON.parse(jsonString) as T;

    return {
      data,
      originalSize,
      compressedSize,
      compressionRatio,
      algorithm,
      checksumValid,
      timestamp: Date.now(),
    };
  }

  /**
   * Compress and export as downloadable file
   */
  compressAndExport<T = unknown>(
    data: T,
    filename: string,
    options?: Partial<CompressionOptions>
  ): void {
    const result = this.compress(data, options);
    
    let blob: Blob;
    let finalFilename: string;

    if (typeof result.compressed === 'string') {
      blob = new Blob([result.compressed], { type: 'text/plain' });
      finalFilename = `${filename}.${result.algorithm}.txt`;
    } else {
      blob = new Blob([result.compressed.buffer], { type: 'application/octet-stream' });
      finalFilename = `${filename}.${result.algorithm}.bin`;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Auto-detect best compression algorithm
   */
  autoDetectBestAlgorithm<T = unknown>(data: T): CompressionAlgorithm {
    const jsonString = JSON.stringify(data);
    const originalSize = new Blob([jsonString]).size;

    if (originalSize < this.config.options.minSizeForCompression) {
      return 'none';
    }

    const algorithms: CompressionAlgorithm[] = ['gzip', 'deflate'];
    let bestAlgorithm: CompressionAlgorithm = 'gzip';
    let bestRatio = 0;

    for (const algorithm of algorithms) {
      if (!this.config.validation.allowedAlgorithms.includes(algorithm)) continue;

      try {
        const result = this.compress(data, { algorithm });
        if (result.compressionRatio > bestRatio) {
          bestRatio = result.compressionRatio;
          bestAlgorithm = algorithm;
        }
      } catch {
        continue;
      }
    }

    return bestAlgorithm;
  }

  /**
   * Create uncompressed result
   */
  private createUncompressedResult(
    jsonString: string,
    originalSize: number,
    opts: CompressionOptions,
    checksum?: string
  ): CompressionResult {
    return {
      compressed: jsonString,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
      algorithm: 'none',
      format: opts.format,
      checksum: checksum || generateChecksum(jsonString),
      timestamp: Date.now(),
      metadata: opts.includeMetadata ? { level: 0, version: '1.0.0' } : undefined,
    };
  }

  /**
   * Emit telemetry event
   */
  private emitTelemetry(result: CompressionResult): void {
    console.log(`[ConfigCompression] ${this.config.telemetry.event}`, {
      algorithm: result.algorithm,
      originalSize: result.originalSize,
      compressedSize: result.compressedSize,
      compressionRatio: result.compressionRatio,
      format: result.format,
    });
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<CompressionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): CompressionConfig {
    return { ...this.config };
  }
}

// Singleton instance
let instance: ConfigCompression | null = null;

export function getConfigCompression(config?: CompressionConfig): ConfigCompression {
  if (!instance) {
    instance = new ConfigCompression(config);
  }
  return instance;
}

// Utility functions
export function compressConfig<T = unknown>(
  data: T,
  options?: Partial<CompressionOptions>
): CompressionResult {
  return getConfigCompression().compress(data, options);
}

export function decompressConfig<T = unknown>(
  result: CompressionResult,
  validateChecksum = true
): DecompressionResult<T> {
  return getConfigCompression().decompress<T>(result, validateChecksum);
}
