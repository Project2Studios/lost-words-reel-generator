# PIXI.js Export Performance Investigation

## Context7 Research Findings

Based on official PixiJS documentation and performance guidance, here are the key insights that may explain our export performance issues:

### 🚨 Critical Performance Issues Identified

#### 1. **Extract Operations Are Inherently Slow**
From PIXI docs: *"Extract operations (like renderer.extract.pixels()) are expensive because they involve GPU → CPU data transfer"*

**Our Issue**: We're calling `renderer.extract.pixels()` or similar 300+ times in rapid succession
- Each frame capture forces a GPU → CPU transfer
- This is inherently slow and blocks the render pipeline
- **Major bottleneck identified**

#### 2. **Frequent Canvas Operations Are Expensive**  
From PIXI docs: *"Drawing to canvas and uploading to GPU can be expensive when done frequently"*

**Our Issue**: Frame-by-frame canvas extraction during export
- Each frame involves canvas pixel extraction
- Repeated GPU memory transfers
- No batching or optimization of extract operations

#### 3. **Missing Texture/Memory Management**
From PIXI docs: *"Manual texture destruction prevents memory leaks and performance degradation"*

**Our Issue**: We may be accumulating textures/frame data without proper cleanup
- 300 frames × image data = significant memory pressure
- Garbage collection during export could cause stutters
- Missing `texture.destroy()` calls for intermediate textures

#### 4. **Filter Performance During Export**
From PIXI docs: *"Filters have performance overhead and should be disabled when not needed"*

**Our Issue**: All visual effects (grain, haze, particles) are active during export
- Complex filter pipeline runs for every frame capture
- `sprite.filters = null` recommended when not displaying
- FilterArea optimization missing

### 🔧 Proven PIXI.js Solutions from Context7

#### 1. **RenderTexture for Frame Capture** (Recommended)
```typescript
// Instead of extract.pixels() - use RenderTexture
const renderTexture = PIXI.RenderTexture.create({width: canvasWidth, height: canvasHeight});
renderer.render(stage, renderTexture);
const pixels = renderer.extract.pixels(renderTexture);
renderTexture.destroy(); // Critical cleanup
```

#### 2. **Batch Extract Operations**
```typescript
// Don't extract every frame individually - batch them
const tempTextures: PIXI.RenderTexture[] = [];

// Render all frames to textures first (fast)
for (let i = 0; i < frameCount; i++) {
  const renderTexture = PIXI.RenderTexture.create({width, height});
  renderer.render(stage, renderTexture);
  tempTextures.push(renderTexture);
}

// Then extract all pixels (batched GPU → CPU transfer)
const allPixels = tempTextures.map(tex => {
  const pixels = renderer.extract.pixels(tex);
  tex.destroy(); // Cleanup
  return pixels;
});
```

#### 3. **Disable Filters During Export**
```typescript
// Store original filters
const originalFilters = stage.filters;
const originalChildFilters = new Map();

// Disable all filters during export
stage.filters = null;
stage.children.forEach(child => {
  if (child.filters) {
    originalChildFilters.set(child, child.filters);
    child.filters = null;
  }
});

// ... perform export ...

// Restore filters after export
stage.filters = originalFilters;
originalChildFilters.forEach((filters, child) => {
  child.filters = filters;
});
```

#### 4. **Manual Texture Garbage Collection**
```typescript
// Prevent auto-GC during export (can cause stutters)
renderer.textureGC.mode = PIXI.GC_MODES.MANUAL;

// ... perform export ...

// Force cleanup after export
renderer.textureGC.run();
renderer.textureGC.mode = PIXI.GC_MODES.AUTO;
```

#### 5. **CacheAsBitmap for Static Elements**
```typescript
// Cache complex static elements before export
complexContainer.cacheAsBitmap = true;

// ... export frames ...

// Disable cache after export
complexContainer.cacheAsBitmap = false;
```

### 📊 Performance Measurements Needed

Based on Context7 findings, we need to measure:

1. **GPU → CPU Transfer Time**: How long does each `extract.pixels()` take?
2. **Memory Usage Growth**: Are we leaking textures during export?
3. **Filter Overhead**: Performance difference with/without filters
4. **Garbage Collection**: GC pauses during export loop

### 🎯 Recommended Investigation Priority

1. **High Priority**: Replace direct `extract.pixels()` with RenderTexture approach
2. **High Priority**: Disable filters/effects during export
3. **Medium Priority**: Implement texture cleanup and manual GC
4. **Low Priority**: Investigate batching strategies

### 🔍 Root Cause Hypothesis

Based on Context7 research, the most likely cause is:
**Inefficient frame extraction method causing repeated GPU → CPU transfers**

Each frame capture is:
1. Rendering the scene (GPU)
2. Extracting pixels (GPU → CPU transfer) ← **BOTTLENECK**
3. Processing pixels (CPU)
4. Writing to FFmpeg (CPU)

The GPU → CPU transfer is inherently slow and doing it 300+ times sequentially explains the performance degradation.

### 💡 Next Session Action Plan

1. **Test RenderTexture approach** - Single biggest potential improvement
2. **Profile with/without filters** - Quick test to isolate filter overhead
3. **Implement manual GC control** - Prevent mid-export garbage collection
4. **Add texture cleanup** - Prevent memory leaks
5. **Measure frame extraction timing** - Quantify the bottleneck

This Context7 research provides a clear path forward based on official PixiJS performance guidance rather than trial-and-error optimization.