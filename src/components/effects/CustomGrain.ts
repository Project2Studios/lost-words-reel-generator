import * as PIXI from 'pixi.js';

/**
 * Creates a custom grain effect using PIXI Graphics instead of SimplexNoiseFilter
 * This provides more control and avoids compatibility issues
 */
export const createCustomGrain = (width: number, height: number): PIXI.TilingSprite => {
  // Create a small grain texture (64x64 for performance)
  const grainSize = 64;
  const canvas = document.createElement('canvas');
  canvas.width = grainSize;
  canvas.height = grainSize;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Could not get canvas context for grain effect');
  }

  // Generate grain pattern using ImageData for better performance
  const imageData = context.createImageData(grainSize, grainSize);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Generate random grayscale noise
    const noise = Math.random() * 255;
    data[i] = noise;     // Red
    data[i + 1] = noise; // Green  
    data[i + 2] = noise; // Blue
    data[i + 3] = 255;   // Alpha (fully opaque)
  }

  context.putImageData(imageData, 0, 0);

  // Create PIXI texture from canvas
  const grainTexture = PIXI.Texture.from(canvas);
  
  // Create tiling sprite to cover the entire canvas
  const grainSprite = new PIXI.TilingSprite({
    texture: grainTexture,
    width,
    height
  });

  // Set blend mode for grain effect
  grainSprite.blendMode = 'overlay'; // This creates a subtle grain overlay
  grainSprite.alpha = 0.05; // Very subtle effect, similar to SimplexNoiseFilter strength

  return grainSprite;
};

/**
 * Updates the grain effect animation
 * Call this in your ticker to animate the grain
 */
export const updateGrainEffect = (grainSprite: PIXI.TilingSprite, deltaTime: number) => {
  // Additional safety check to prevent null reference errors
  if (!grainSprite || grainSprite.destroyed || !grainSprite.tilePosition) {
    return;
  }
  
  // Slowly move the grain pattern to create subtle animation
  grainSprite.tilePosition.x += deltaTime * 0.5;
  grainSprite.tilePosition.y += deltaTime * 0.3;
  
  // Optional: slightly vary the alpha for more dynamic effect
  grainSprite.alpha = 0.03 + Math.sin(Date.now() * 0.001) * 0.02;
};