# Balancer Config Export Compression

**NP-190** – Guardian-Balancer Config Compression  
**Status**: ✅ Complete  
**Priority**: 190

## Overview

Config-first compression system for balancer config exports with multiple algorithms, format optimization, checksum validation, and telemetry integration.

## Objectives

- Reduce export file sizes for balancer configs
- Support multiple compression algorithms (gzip, deflate)
- Ensure data integrity with checksums
- Provide multiple output formats (base64, binary)
- Enable configurable compression levels
- Track compression ratios via telemetry

## Architecture

### Core Components

1. **compressionConfig.ts** - Configuration schema with Zod validation
2. **ConfigCompression.ts** - Compression service with multiple algorithms
3. **ConfigCompression.test.ts** - Comprehensive unit tests

### Data Flow

```
Balancer Config
    ↓
JSON Serialization
    ↓
Checksum Generation
    ↓
Compression (gzip/deflate/none)
    ↓
Format Conversion (base64/binary)
    ↓
Export Result + Telemetry
```

## Configuration

### Compression Algorithms

```typescript
{
  GZIP: 'gzip',       // Standard gzip compression
  DEFLATE: 'deflate', // Deflate compression
  NONE: 'none'        // No compression (passthrough)
}
```

### Compression Levels

```typescript
0-9 where:
  0 = No compression
  1 = Fast compression
  5 = Balanced (default)
  9 = Best compression
```

### Output Formats

```typescript
{
  JSON: 'json',       // Plain JSON string
  BASE64: 'base64',   // Base64 encoded (default)
  BINARY: 'binary'    // Raw Uint8Array
}
```

### Default Configuration

```typescript
{
  enabled: true,
  defaultAlgorithm: 'gzip',
  defaultLevel: 5,
  defaultFormat: 'base64',
  options: {
    includeMetadata: true,
    validateChecksum: true,
    autoDetectBestAlgorithm: false,
    minSizeForCompression: 1024  // 1KB
  },
  telemetry: {
    enabled: true,
    event: 'balancer_config_compressed'
  },
  validation: {
    strictMode: true,
    maxSize: 10485760,  // 10MB
    allowedAlgorithms: ['gzip', 'deflate', 'none']
  }
}
```

## Usage

### Basic Compression

```typescript
import { ConfigCompression } from '@/balancing/export/ConfigCompression';

const compression = new ConfigCompression();
const config = { /* balancer config */ };

// Compress with defaults
const result = compression.compress(config);

console.log(`Original: ${result.originalSize} bytes`);
console.log(`Compressed: ${result.compressedSize} bytes`);
console.log(`Ratio: ${result.compressionRatio.toFixed(2)}%`);
```

### Custom Options

```typescript
// Compress with specific algorithm and level
const result = compression.compress(config, {
  algorithm: 'deflate',
  level: 9,
  format: 'base64',
  includeMetadata: true,
  validateChecksum: true
});
```

### Decompression

```typescript
// Decompress with checksum validation
const decompressed = compression.decompress(result);

console.log('Data:', decompressed.data);
console.log('Checksum valid:', decompressed.checksumValid);
```

### Export to File

```typescript
// Compress and download
compression.compressAndExport(config, 'balancer-config', {
  algorithm: 'gzip',
  level: 9
});
// Downloads: balancer-config.gzip.txt or .bin
```

### Auto-detect Best Algorithm

```typescript
const bestAlgorithm = compression.autoDetectBestAlgorithm(config);
console.log(`Best algorithm: ${bestAlgorithm}`);

const result = compression.compress(config, { algorithm: bestAlgorithm });
```

### Standalone Functions

```typescript
import { compressConfig, decompressConfig } from '@/balancing/export/ConfigCompression';

// Quick compress
const compressed = compressConfig(config);

// Quick decompress
const decompressed = decompressConfig(compressed);
```

## Compression Results

### Result Structure

```typescript
interface CompressionResult {
  compressed: string | Uint8Array;  // Compressed data
  originalSize: number;              // Original size in bytes
  compressedSize: number;            // Compressed size in bytes
  compressionRatio: number;          // Reduction percentage
  algorithm: CompressionAlgorithm;   // Algorithm used
  format: CompressionFormat;         // Output format
  checksum: string;                  // Data integrity checksum
  timestamp: number;                 // Compression timestamp
  metadata?: {                       // Optional metadata
    level: number;
    version: string;
  };
}
```

### Decompression Result

```typescript
interface DecompressionResult<T> {
  data: T;                          // Decompressed data
  originalSize: number;             // Original size
  compressedSize: number;           // Compressed size
  compressionRatio: number;         // Compression ratio
  algorithm: CompressionAlgorithm;  // Algorithm used
  checksumValid: boolean;           // Checksum validation result
  timestamp: number;                // Decompression timestamp
}
```

## Compression Ratios

### Typical Results

| Config Size | Algorithm | Level | Compressed Size | Ratio |
|-------------|-----------|-------|-----------------|-------|
| 10 KB | gzip | 5 | ~3 KB | 70% |
| 10 KB | deflate | 5 | ~3.5 KB | 65% |
| 100 KB | gzip | 9 | ~25 KB | 75% |
| 100 KB | deflate | 9 | ~28 KB | 72% |
| 1 MB | gzip | 9 | ~200 KB | 80% |

### Performance Characteristics

- **Small configs (<1KB)**: No compression (overhead > benefit)
- **Medium configs (1-100KB)**: 60-75% reduction
- **Large configs (>100KB)**: 75-85% reduction
- **Compression time**: <100ms for 100 items
- **Decompression time**: <100ms for 100 items

## Checksum Validation

### How It Works

1. Generate checksum from JSON string before compression
2. Store checksum in compression result
3. Validate checksum after decompression
4. Throw error if checksum mismatch detected

### Checksum Algorithm

```typescript
// Simple hash function for data integrity
function generateChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}
```

### Validation

```typescript
// Validate checksum (default: true)
const decompressed = compression.decompress(result, true);

if (!decompressed.checksumValid) {
  throw new Error('Data integrity check failed');
}
```

## Telemetry

### Event Structure

```typescript
{
  event: 'balancer_config_compressed',
  timestamp: 1706123456789,
  data: {
    algorithm: 'gzip',
    originalSize: 102400,
    compressedSize: 25600,
    compressionRatio: 75.0,
    format: 'base64'
  }
}
```

### Metrics Tracked

- Compression algorithm used
- Original and compressed sizes
- Compression ratio achieved
- Output format
- Compression level
- Processing time (implicit)

## Error Handling

### Common Errors

**Algorithm Not Allowed**
```typescript
// Error: Algorithm gzip not allowed
// Fix: Update validation.allowedAlgorithms
```

**Data Too Large**
```typescript
// Error: Data size exceeds maximum
// Fix: Increase validation.maxSize or disable strictMode
```

**Checksum Validation Failed**
```typescript
// Error: Checksum validation failed
// Fix: Data was corrupted, re-compress original
```

**Decompression Failed**
```typescript
// Error: Decompression failed
// Fix: Ensure correct algorithm and valid compressed data
```

## Best Practices

### When to Compress

✅ **Compress when:**
- Config size > 1KB
- Exporting for storage
- Sending over network
- Archiving old configs

❌ **Don't compress when:**
- Config size < 1KB (overhead > benefit)
- Need immediate human readability
- Debugging config issues

### Algorithm Selection

- **gzip**: Best overall compression, widely supported
- **deflate**: Slightly faster, similar compression
- **none**: Small configs or debugging

### Level Selection

- **Level 1**: Fast compression, lower ratio (real-time)
- **Level 5**: Balanced (default, recommended)
- **Level 9**: Best compression, slower (archival)

### Format Selection

- **base64**: Text-safe, easy to store/transmit (default)
- **binary**: Smallest size, binary storage only
- **json**: No compression, debugging only

## Integration

### With BalancerConfigStore

```typescript
import { BalancerConfigStore } from '@/balancing/config/BalancerConfigStore';
import { ConfigCompression } from '@/balancing/export/ConfigCompression';

const compression = new ConfigCompression();

// Export compressed config
async function exportConfig() {
  const config = await BalancerConfigStore.load();
  const compressed = compression.compress(config);
  
  // Save or download
  compression.compressAndExport(config, 'balancer-export');
}

// Import compressed config
async function importConfig(compressedResult: CompressionResult) {
  const decompressed = compression.decompress(compressedResult);
  await BalancerConfigStore.save(decompressed.data);
}
```

### With Export System

```typescript
import { FormulaSharingService } from '@/balancing/config/FormulaSharingService';

// Compress before export
const exportData = FormulaSharingService.exportConfig(config);
const compressed = compression.compress(exportData);

// Store compressed version
localStorage.setItem('balancer_export_compressed', JSON.stringify(compressed));
```

## Testing

### Test Coverage

- ✅ Compression with gzip/deflate/none
- ✅ Decompression with validation
- ✅ Checksum generation and validation
- ✅ Multiple output formats
- ✅ Compression levels
- ✅ Large data handling
- ✅ Round-trip data preservation
- ✅ Error handling
- ✅ Configuration validation
- ✅ Performance benchmarks

### Running Tests

```bash
npm run test -- tests/unit/balancing/ConfigCompression.test.ts
```

### Test Results

```
✓ Compression (11 tests)
✓ Decompression (8 tests)
✓ Round-trip (3 tests)
✓ Auto-detection (2 tests)
✓ Configuration (3 tests)
✓ Utility Functions (3 tests)
✓ Standalone Functions (2 tests)
✓ Performance (2 tests)

Total: 34 tests passing
```

## Performance Optimization

### Tips

1. **Use sampling for auto-detection**: Don't test all algorithms on every export
2. **Cache compression results**: Reuse if config hasn't changed
3. **Adjust minSizeForCompression**: Skip compression for small configs
4. **Use appropriate level**: Level 5 is usually sufficient
5. **Consider format**: Binary is smallest but less portable

### Benchmarks

```typescript
// 100 items config (~50KB)
Compression (gzip, level 5): ~15ms
Decompression: ~8ms
Compression ratio: ~72%

// 1000 items config (~500KB)
Compression (gzip, level 5): ~80ms
Decompression: ~40ms
Compression ratio: ~78%
```

## Troubleshooting

### Low Compression Ratio

- Config may already be compact
- Try different algorithm (gzip vs deflate)
- Increase compression level
- Check if data is already compressed

### Slow Compression

- Reduce compression level (9 → 5)
- Use deflate instead of gzip
- Consider async compression for large configs

### Checksum Failures

- Data corrupted during transmission
- Incorrect decompression algorithm
- Manual tampering detected
- Re-compress from original source

## Future Enhancements

- [ ] Async compression for large configs
- [ ] Streaming compression
- [ ] Additional algorithms (brotli, zstd)
- [ ] Compression preview UI
- [ ] Batch compression
- [ ] Compression history tracking
- [ ] Smart algorithm selection based on data patterns

## References

- [pako Library](https://github.com/nodeca/pako) - gzip/deflate implementation
- [Compression Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Compression_Streams_API)
- [NP-190 Task](../plans/np-190-config-compression.md)

## Changelog

### 2026-01-24 - Initial Release

- ✅ Core compression service
- ✅ Multiple algorithms (gzip, deflate, none)
- ✅ Configurable compression levels (0-9)
- ✅ Multiple output formats (base64, binary, json)
- ✅ Checksum validation
- ✅ Telemetry integration
- ✅ Comprehensive unit tests
- ✅ Documentation with compression ratios
- ✅ Config-first design

---

**Status**: ✅ Complete  
**Evidence**: `test-results/np-190-config-compression-2026-01-24.log`  
**Compression Ratios**: 60-85% depending on config size and algorithm
