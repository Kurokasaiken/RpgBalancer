# Physics Lab Asset Pipeline Documentation

## Overview

The Physics Lab Asset Pipeline is a CLI tool for downloading and managing free assets from external repositories. It provides a systematic way to acquire audio files and shader textures for the Physics Lab micro-app while ensuring proper licensing and integrity validation.

## Features

- **Free Audio Assets**: Downloads CC0/CC-BY licensed sounds from freesound.org
- **Shader Textures**: Acquires texture assets from opengame.org/textures.com
- **License Compliance**: Filters assets by compatible licenses only
- **Integrity Validation**: SHA256 checksum verification for all downloads
- **Config Generation**: Automatically generates asset mapping configuration
- **Placeholder Creation**: Generates fallback assets when downloads fail
- **Telemetry Integration**: Tracks download metrics and asset usage

## Installation

### Prerequisites

1. Node.js 20.19.6 or higher
2. API key for freesound.org (set as `FREESOUND_API_KEY` environment variable)

### Setup

```bash
# Install dependencies
npm install

# Set up environment variable
export FREESOUND_API_KEY="your-api-key-here"
```

## Usage

### CLI Commands

#### Download All Assets

```bash
# Download all required assets with default CC0 license
npm run asset-downloader download-all

# Download with CC-BY license
npm run asset-downloader download-all --audio-license=CC-BY
```

#### Download Audio Only

```bash
# Download specific audio sources
npm run asset-downloader download-audio --sources="thud,shimmer,slot-snap"

# Download with custom license
npm run asset-downloader download-audio --sources="power-up" --license="CC-BY"
```

#### Download Shaders Only

```bash
# Download specific texture types
npm run asset-downloader download-shaders --types="liquid,fog,foil"

# Download with custom resolution
npm run asset-downloader download-shaders --types="particle" --resolution=1024
```

#### Validate Assets

```bash
# Validate all downloaded assets
npm run asset-downloader validate --check-integrity
```

### Programmatic Usage

```typescript
import { AssetDownloader } from './scripts/physicsLab/assetDownloader';

const downloader = new AssetDownloader();

// Download audio assets
const audioResults = await downloader.downloadAudioAssets(
  ['thud', 'shimmer', 'slot-snap', 'power-up'],
  'CC0'
);

// Download shader textures
const shaderResults = await downloader.downloadShaderAssets([
  'liquid-gauge',
  'fog-slot', 
  'foil-card',
  'particle-sprite'
]);

// Generate mapping configuration
const mapping = downloader.generateAssetMapping(audioResults, shaderResults);

// Validate integrity
const isValid = await downloader.validateAssets(mapping);
```

## Asset Types

### Audio Assets

| Asset ID | Description | Use Case | License |
|----------|-------------|----------|---------|
| `ui-thud` | Button press sound | UI interactions | CC0/CC-BY |
| `ui-shimmer` | Hover/selection sound | Interactive elements | CC0/CC-BY |
| `slot-snap` | Drop slot sound | Drag & drop feedback | CC0/CC-BY |
| `power-up` | Level up sound | Achievement feedback | CC0/CC-BY |

**Format Requirements:**
- File formats: `.wav`, `.ogg`
- Sample rate: 44.1kHz
- Bit depth: 16-bit
- Channels: Mono or Stereo
- Max size: 2MB per file

### Shader Textures

| Asset ID | Description | Use Case | License |
|----------|-------------|----------|---------|
| `liquid-gauge` | Liquid fill texture | Progress indicators | CC-BY |
| `fog-slot` | Fog effect texture | Slot highlighting | CC-BY |
| `foil-card` | Metallic foil texture | Card effects | CC-BY |
| `particle-sprite` | Particle texture | Visual effects | CC-BY |

**Format Requirements:**
- File formats: `.png`, `.jpg`
- Resolution: 512x512 (power of 2)
- Max size: 1MB per file
- Color space: RGBA

## Configuration

### Asset Mapping Configuration

The pipeline generates `src/ui/styleLab/config/assetMappingConfig.ts` with the following structure:

```typescript
export const ASSET_MAPPING = {
  audio: {
    'ui-thud': '/audio/physics-lab/ui-thud.wav',
    'ui-shimmer': '/audio/physics-lab/ui-shimmer.wav',
    // ... more audio assets
  },
  shaders: {
    'liquid-gauge': '/assets/shaders/physics-lab/liquid-gauge.png',
    'fog-slot': '/assets/shaders/physics-lab/fog-slot.png',
    // ... more shader assets
  },
  metadata: {
    lastUpdated: '2026-02-19T12:00:00.000Z',
    totalAssets: 8,
    sourceInfo: {
      'ui-thud': {
        source: 'freesound.org',
        license: 'CC0',
        size: 1024,
        checksum: 'abc123...',
      },
      // ... more asset metadata
    },
  },
};
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `FREESOUND_API_KEY` | Yes | API key for freesound.org |
| `NODE_ENV` | No | Environment (development/production) |

## File Structure

```
public/
├── audio/
│   └── physics-lab/
│       ├── ui-thud.wav
│       ├── ui-shimmer.wav
│       ├── slot-snap.wav
│       └── power-up.wav
└── assets/
    └── shaders/
        └── physics-lab/
            ├── liquid-gauge.png
            ├── fog-slot.png
            ├── foil-card.png
            └── particle-sprite.png

src/
└── ui/
    └── styleLab/
        └── config/
            └── assetMappingConfig.ts

scripts/
└── physicsLab/
    ├── assetDownloader.ts
    └── __tests__/
        └── assetDownloader.test.ts
```

## Integration with Physics Lab

### Using Assets in Components

```typescript
import { ASSET_MAPPING, getAssetUrl } from '@/ui/styleLab/config/assetMappingConfig';

// Get audio asset URL
const thudUrl = getAssetUrl(ASSET_MAPPING, 'audio', 'ui-thud');

// Get shader texture URL
const liquidGaugeUrl = getAssetUrl(ASSET_MAPPING, 'shaders', 'liquid-gauge');

// Check if asset exists
if (hasAsset(ASSET_MAPPING, 'audio', 'ui-shimmer')) {
  // Asset is available
}
```

### Audio Integration

```typescript
// In audio hook or component
const playUISound = (assetId: string) => {
  const audioUrl = getAssetUrl(ASSET_MAPPING, 'audio', assetId);
  if (audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play();
  }
};

// Usage
playUISound('ui-thud');
```

### Shader Integration

```typescript
// In shader component
const shaderTexture = getAssetUrl(ASSET_MAPPING, 'shaders', 'liquid-gauge');

// In CSS or WebGL
const texture = new Image();
texture.src = shaderTexture;
```

## Telemetry

The pipeline emits telemetry events for tracking asset usage:

```typescript
// Event: physics_lab_asset_downloaded
{
  eventType: 'physics_lab_asset_downloaded',
  data: {
    assetType: 'audio',
    assetId: 'ui-thud',
    sourceUrl: 'https://freesound.org/s/123',
    license: 'CC0',
    fileSize: 1024,
    downloadTime: 1641894400000,
  }
}
```

## Troubleshooting

### Common Issues

#### API Key Errors

**Error**: `FREESOUND_API_KEY environment variable required`

**Solution**: Set the environment variable:
```bash
export FREESOUND_API_KEY="your-api-key"
```

#### Download Failures

**Error**: `FreeSound API error: 429`

**Solution**: Rate limit exceeded. Wait before retrying or check API quota.

#### File Permission Errors

**Error**: `Permission denied`

**Solution**: Ensure write permissions to output directories:
```bash
chmod -R 755 public/
```

#### Checksum Validation Failures

**Error**: `✗ Audio ui-thud: checksum mismatch`

**Solution**: Re-download the asset:
```bash
npm run asset-downloader download-audio --sources="ui-thud"
```

### Debug Mode

Enable verbose logging for debugging:

```typescript
const downloader = new AssetDownloader();
// Add console.log statements in the CLI for debugging
```

## Testing

### Run Unit Tests

```bash
# Run asset downloader tests
npm run test -- scripts/physicsLab/__tests__/assetDownloader.test.ts

# Run with coverage
npm run test -- scripts/physicsLab/__tests__/assetDownloader.test.ts --coverage
```

### Manual Testing

```bash
# Test download functionality
npm run asset-downloader download-audio --sources="thud" --license="CC0"

# Test validation
npm run asset-downloader validate --check-integrity
```

## License Compliance

### Supported Licenses

- **CC0**: Public domain - no attribution required
- **CC-BY**: Attribution required - must credit original creator

### Attribution Requirements

For CC-BY assets, ensure proper attribution in the application:

```typescript
// Display attribution in credits or about section
const attributions = [
  {
    asset: 'ui-thud',
    author: 'Sound Author Name',
    license: 'CC-BY',
    url: 'https://freesound.org/people/author/',
  },
  // ... more attributions
];
```

## Maintenance

### Regular Tasks

1. **Update Assets**: Re-download assets to get latest versions
2. **Validate Integrity**: Run validation checks regularly
3. **Review Licenses**: Ensure all assets comply with license requirements
4. **Monitor Usage**: Track asset usage through telemetry

### Asset Updates

```bash
# Refresh all assets
npm run asset-downloader download-all --audio-license="CC-BY"

# Validate after update
npm run asset-downloader validate --check-integrity
```

## Security Considerations

- API keys are stored in environment variables, not in code
- All downloads are validated with SHA256 checksums
- File size limits prevent malicious large files
- License filtering ensures only compatible assets are downloaded
- Placeholder assets prevent broken functionality when downloads fail

## Performance

- Downloads are parallelized when possible
- Checksum validation is efficient for file sizes under 2MB
- Asset mapping is generated once and cached
- Placeholder generation is fast and lightweight

## Future Enhancements

- Support for additional asset repositories
- Batch download optimization
- Asset preview functionality
- Automatic license attribution generation
- Asset versioning and rollback
- Integration with asset management systems

## API Reference

### AssetDownloader Class

#### Constructor
```typescript
constructor()
```
Creates a new AssetDownloader instance. Requires `FREESOUND_API_KEY` environment variable.

#### Methods

##### downloadAudioAssets(sources, license)
```typescript
async downloadAudioAssets(sources: string[], license: string): Promise<Record<string, any>>
```
Downloads audio assets from freesound.org.

**Parameters:**
- `sources`: Array of audio source identifiers
- `license`: License filter ('CC0' or 'CC-BY')

**Returns:** Object mapping source IDs to download results

##### downloadShaderAssets(types)
```typescript
async downloadShaderAssets(types: string[]): Promise<Record<string, any>>
```
Downloads shader texture assets from opengame.org.

**Parameters:**
- `types`: Array of texture type identifiers

**Returns:** Object mapping type IDs to download results

##### generateAssetMapping(audioResults, shaderResults)
```typescript
generateAssetMapping(audioResults: Record<string, any>, shaderResults: Record<string, any>): AssetMapping
```
Generates asset mapping configuration from download results.

##### validateAssets(mapping)
```typescript
async validateAssets(mapping: AssetMapping): Promise<boolean>
```
Validates asset integrity using checksums.

### Utility Functions

#### getAssetUrl(mapping, type, assetId)
```typescript
export function getAssetUrl(mapping: AssetMapping, type: 'audio' | 'shaders', assetId: string): string | null
```
Gets the URL for a specific asset.

#### getAssetMetadata(mapping, assetId)
```typescript
export function getAssetMetadata(mapping: AssetMapping, assetId: string): AssetMetadata | null
```
Gets metadata for a specific asset.

#### hasAsset(mapping, type, assetId)
```typescript
export function hasAsset(mapping: AssetMapping, type: 'audio' | 'shaders', assetId: string): boolean
```
Checks if an asset exists in the mapping.

---

*This documentation is maintained alongside the asset pipeline implementation. For the latest updates, refer to the source code and test files.*
