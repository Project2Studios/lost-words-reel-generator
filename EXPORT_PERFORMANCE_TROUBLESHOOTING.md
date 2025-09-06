# Export Performance Troubleshooting Guide

## Issue Summary
Video export is extremely slow, taking much longer than expected. Originally was fast (1/300 → 31/300 → 62/300 rapid progression), now stuck at frame 1/300 for extended periods.

## Fixes Attempted (In Chronological Order)

### 1. Fixed Race Condition Null Reference Errors
**Problem**: 10,000+ console errors: "Cannot read properties of null (reading 'position')"
**Root Cause**: Race condition in ticker update where sprite refs became null during canvas recreation
**Files Modified**:
- `src/components/PixiCanvas.tsx:309-331` - Added reference capturing
- `src/components/effects/CustomGrain.ts:55-71` - Added safety checks

**Code Changes**:
```typescript
// Before (vulnerable to null references)
if (hazeRef.current && hazeRef.current.visible) {
  hazeRef.current.tilePosition.x += ticker.deltaTime * 1;
}

// After (race condition safe)  
const hazeSprite = hazeRef.current;
if (hazeSprite && hazeSprite.visible) {
  hazeSprite.tilePosition.x += ticker.deltaTime * 1;
}
```

**Result**: Console errors eliminated, but export still slow

### 2. Removed Try-Catch Performance Overhead
**Problem**: Try-catch blocks in animation loops cause performance degradation
**Files Modified**: `src/components/effects/CustomGrain.ts`
**Code Changes**:
```typescript
// Before (expensive in animation loop)
try {
  grainSprite.tilePosition.x += deltaTime * 0.5;
} catch (error) { ... }

// After (fast null checks)
if (!grainSprite || grainSprite.destroyed || !grainSprite.tilePosition) {
  return;
}
grainSprite.tilePosition.x += deltaTime * 0.5;
```

**Result**: Minor improvement, but export still slow

### 3. Fixed Multiple Ticker Startup Issue
**Problem**: PIXI ticker was being started multiple times during initialization
**Files Modified**: `src/components/PixiCanvas.tsx`
**Code Changes**:
- Set `autoStart: false` in PIXI init
- Single `app.ticker.start()` call after listener setup
- Removed redundant ticker restart checks

**Result**: Cleaner initialization, but export still slow

### 4. Removed Export Mode FPS Caps
**Problem**: Export mode was limiting ticker to 60fps max, 30fps min
**Files Modified**: `src/components/PixiCanvas.tsx:72-74`
**Code Changes**:
```typescript
// Before (limited speed)
appRef.current.ticker.maxFPS = 60;
appRef.current.ticker.minFPS = 30;

// After (unlimited for export)
appRef.current.ticker.maxFPS = 0; // No FPS limit
appRef.current.ticker.minFPS = 0;
```

**Result**: Should have helped, but export actually got slower (30fps)

### 5. Removed setTimeout Frame Capture Delays
**Problem**: Major bottleneck - artificial 26.7ms delay per frame in export loop
**Files Modified**: `src/App.tsx:299`
**Code Changes**:
```typescript
// Before (SLOW - ~27ms delay per frame)
const captureInterval = Math.max(msPerFrame * 0.8, 16);
await new Promise(resolve => setTimeout(resolve, captureInterval));

// After (FAST - hardware limited)
await new Promise(resolve => requestAnimationFrame(resolve));
```

**Result**: Should dramatically improve speed, but still slow

### 6. Increased Output FPS and Batch Sizes
**Problem**: Low output FPS and small batch sizes limiting throughput
**Files Modified**: `src/App.tsx:224-243`
**Code Changes**:
```typescript
// NEW: Higher quality and larger batches
fast: { frameRate: 30, frameCaptureSize: 20, writeBatchSize: 12 }     // Was: 24fps, 15 frames, 8 batch
balanced: { frameRate: 60, frameCaptureSize: 15, writeBatchSize: 8 }  // Was: 30fps, 10 frames, 5 batch  
quality: { frameRate: 60, frameCaptureSize: 10, writeBatchSize: 5 }   // Was: 30fps, 5 frames, 3 batch
```

**Result**: Better final video quality, but capture speed unchanged

## Current Status
- ❌ Export still extremely slow despite all optimizations
- ✅ Console errors eliminated
- ✅ Code architecture cleaner  
- ✅ Higher output video quality (30-60fps)
- ❓ Core performance bottleneck still unidentified

## Key Observations
1. **Original Issue**: Race condition errors flooding console (FIXED)
2. **Performance Regression**: All timing fixes should have made it faster, but it's slower
3. **Architecture**: Separation of capture speed vs output FPS is correct
4. **Missing Factor**: There's likely a fundamental bottleneck we haven't identified

## Potential Areas to Investigate Next
1. **Canvas/WebGL Context Issues**: Canvas operations might be blocking
2. **Memory Issues**: Frame accumulation causing GC pressure
3. **FFmpeg Integration**: Bottleneck might be in frame writing to FFmpeg
4. **Browser Threading**: requestAnimationFrame might be on wrong thread
5. **PIXI Render Pipeline**: Something in the render process is slow

## Files Modified Summary
- `src/components/PixiCanvas.tsx` (multiple sections)
- `src/components/effects/CustomGrain.ts` 
- `src/App.tsx` (export configuration and timing)

## Next Steps Recommended
1. Profile the exact bottleneck (GPU, CPU, memory, I/O)
2. Test with minimal scene (no effects) to isolate issue
3. Compare before/after performance with browser dev tools
4. Check if issue is in frame capture, frame processing, or frame writing
5. Research PIXI.js specific export performance patterns