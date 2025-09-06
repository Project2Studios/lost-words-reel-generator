# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the application
- `npm start` - Start development server at http://localhost:3000
- `npm run build` - Build for production to the `build` folder
- `npm test` - Run tests in watch mode
- `npm test -- --coverage` - Run tests with coverage report
- `npm test -- --watchAll=false` - Run tests once without watching

### Testing specific files
- `npm test -- MyComponent.test.tsx` - Run tests for a specific file
- `npm test -- --testNamePattern="specific test name"` - Run specific test by name

## Project Architecture

This is a React TypeScript application for generating video reels with visual effects, built using Create React App. The application combines React for UI, PIXI.js for graphics rendering, and FFmpeg for video processing.

### Core Technology Stack
- **React 19** with TypeScript for component architecture
- **PIXI.js 8** for WebGL-accelerated graphics and particle effects
- **@ffmpeg/ffmpeg** for client-side video encoding
- **@pixi/particle-emitter** for particle system effects

### Component Architecture

The application follows a clear separation of concerns:

1. **App.tsx** - Main orchestrator managing state for image/audio inputs, playback control, settings, and video export functionality. Handles FFmpeg initialization and frame-by-frame video encoding.

2. **PixiCanvas Component** - Core rendering engine using PIXI.js. Manages:
   - WebGL canvas lifecycle and ticker control
   - Image sprite rendering with centering
   - Particle effects (dust, snow, sparkles)
   - Visual filters (grain, vignette, light leaks)
   - Effect animations synchronized to ticker updates

3. **Supporting Components**:
   - **FileUpload** - Handles image and audio file selection
   - **Controls** - Settings UI for effects, duration, zoom, audio options
   - **Masking** - Creates mask overlays for visual effects

4. **Effects System** (`src/components/effects/`):
   - **Particles.ts** - Particle emitter configurations for different effects
   - **Haze.ts** - Animated haze overlay effect
   - **LightLeak.ts** - Dynamic light leak visual effect
   - **SimplexNoise.ts** - Noise generation for grain effects

### Key Architectural Patterns

- **Ref Forwarding**: PixiCanvas exposes canvas via `useImperativeHandle` for export functionality
- **Resource Management**: Careful cleanup of PIXI resources, textures, and emitters to prevent memory leaks
- **Ticker Control**: Centralized animation control through PIXI ticker with play/pause support
- **Async Asset Loading**: Uses `PIXI.Assets.load` for texture management

### State Management

Application state is centralized in App.tsx with settings object containing:
- Visual effect toggles (vignette, grain, lightLeak)
- Effect type selection (dust, snow, sparkles)
- Playback settings (duration, volume, audioLoop)
- Export state management

### Video Export Pipeline

1. Frame capture from PIXI canvas at 30fps
2. PNG frame writing to FFmpeg virtual filesystem
3. Audio integration with optional looping
4. H.264 encoding with yuv420p pixel format
5. Automatic cleanup of temporary files