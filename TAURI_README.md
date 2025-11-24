# Tauri Desktop Build - README

## What was done

Successfully integrated **Tauri v2** for cross-platform desktop publishing (Windows, macOS, Linux).

### Files Created
- `src-tauri/Cargo.toml` - Rust package configuration
- `src-tauri/src/main.rs` - Tauri application entry point
- `src-tauri/build.rs` - Build script
- `src-tauri/tauri.conf.json` - Tauri configuration
- `src-tauri/icons/` - Generated app icons (all formats)
- `app-icon.svg` - Source icon (placeholder emoji)

### Scripts Added to package.json
```bash
npm run tauri:dev     # Run in development mode (desktop app)
npm run tauri:build   # Build production binaries
```

## Testing the Desktop App

### Development Mode
```bash
npm run tauri:dev
```
This will:
1. Start the Vite dev server
2. Launch the desktop application window
3. Enable hot-reload (code changes update the app automatically)

### Production Build
```bash
npm run tauri:build
```

Builds will be output to `src-tauri/target/release/bundle/`:
- **Windows**: `.exe` installer and `.msi`
- **macOS**: `.dmg` and `.app`
- **Linux**: `.deb`, `.AppImage`

## Notes

### Icon Replacement
The current icon (`app-icon.svg`) is a placeholder emoji. For production:
1. Create a professional 1024x1024px PNG or SVG icon
2. Replace `app-icon.svg`
3. Regenerate icons: `npx @tauri-apps/cli icon app-icon.svg -o src-tauri/icons`

### Rust Installation
Tauri requires Rust. If you get "cargo: command not found":
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```
Then restart your terminal.

### Platform-Specific Dependencies
- **Windows**: Microsoft Visual Studio C++ Build Tools
- **macOS**: Xcode Command Line Tools (`xcode-select --install`)
- **Linux**: Various dev libraries (see Tauri docs)

## Next Steps
1. Test `npm run tauri:dev` to verify the desktop app launches
2. Add Steam API integration for achievements/cloud saves
3. Customize window behavior (min/max size, etc.) in `tauri.conf.json`
