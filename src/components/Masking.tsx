
import * as PIXI from 'pixi.js';

export interface MaskOptions {
  threshold: number;
  invert: boolean;
  edgeDetectionStrength: number;
  morphologySize: number;
  previewMode: boolean;
}

// Sobel edge detection kernels
const SOBEL_X = [
  [-1, 0, 1],
  [-2, 0, 2],
  [-1, 0, 1]
];

const SOBEL_Y = [
  [-1, -2, -1],
  [ 0,  0,  0],
  [ 1,  2,  1]
];

/**
 * Apply Sobel edge detection to detect text boundaries
 */
const applyEdgeDetection = (imageData: ImageData, strength: number): ImageData => {
  const { width, height, data } = imageData;
  const result = new ImageData(width, height);
  const grayscale = new Float32Array(width * height);
  
  // Convert to grayscale
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    grayscale[i / 4] = gray;
  }
  
  // Apply Sobel operators
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;
      
      // Apply kernels
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixelIndex = (y + ky) * width + (x + kx);
          const pixel = grayscale[pixelIndex];
          
          gx += pixel * SOBEL_X[ky + 1][kx + 1];
          gy += pixel * SOBEL_Y[ky + 1][kx + 1];
        }
      }
      
      // Calculate gradient magnitude
      const magnitude = Math.sqrt(gx * gx + gy * gy) * strength;
      const resultIndex = (y * width + x) * 4;
      
      result.data[resultIndex] = magnitude;
      result.data[resultIndex + 1] = magnitude;
      result.data[resultIndex + 2] = magnitude;
      result.data[resultIndex + 3] = 255;
    }
  }
  
  return result;
};

/**
 * Apply morphological operations (dilation and erosion) to clean up the mask
 */
const applyMorphology = (imageData: ImageData, size: number): ImageData => {
  if (size <= 0) return imageData;
  
  const { width, height } = imageData;
  let current = new ImageData(new Uint8ClampedArray(imageData.data), width, height);
  
  // Dilation (expand white areas)
  for (let iter = 0; iter < size; iter++) {
    const temp = new ImageData(width, height);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let maxValue = 0;
        
        // Check 3x3 neighborhood
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4;
            maxValue = Math.max(maxValue, current.data[idx]);
          }
        }
        
        const resultIdx = (y * width + x) * 4;
        temp.data[resultIdx] = maxValue;
        temp.data[resultIdx + 1] = maxValue;
        temp.data[resultIdx + 2] = maxValue;
        temp.data[resultIdx + 3] = 255;
      }
    }
    current = temp;
  }
  
  // Erosion (contract white areas to original size)
  for (let iter = 0; iter < size; iter++) {
    const temp = new ImageData(width, height);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let minValue = 255;
        
        // Check 3x3 neighborhood
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4;
            minValue = Math.min(minValue, current.data[idx]);
          }
        }
        
        const resultIdx = (y * width + x) * 4;
        temp.data[resultIdx] = minValue;
        temp.data[resultIdx + 1] = minValue;
        temp.data[resultIdx + 2] = minValue;
        temp.data[resultIdx + 3] = 255;
      }
    }
    current = temp;
  }
  
  return current;
};

/**
 * Create an advanced text mask using brightness detection and morphological operations
 */
export const createAdvancedMask = async (
  imageUrl: string, 
  options: MaskOptions
): Promise<PIXI.Sprite> => {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = imageUrl;
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Could not get canvas context');
  }

  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  
  // For text extraction, we want to identify bright (white) text areas
  // Step 1: Create a brightness-based mask
  const data = imageData.data;
  const maskData = new ImageData(canvas.width, canvas.height);
  
  for (let i = 0; i < data.length; i += 4) {
    // Calculate brightness of the pixel
    const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    
    // For white text extraction, bright pixels (above threshold) should be visible
    const isText = brightness > options.threshold;
    const maskValue = options.invert ? (isText ? 0 : 255) : (isText ? 255 : 0);
    
    maskData.data[i] = maskValue;     // R
    maskData.data[i + 1] = maskValue; // G
    maskData.data[i + 2] = maskValue; // B
    maskData.data[i + 3] = maskValue; // A - This controls what's visible through the mask
  }
  
  // Step 2: Apply edge detection for better text boundary detection
  const edgeData = applyEdgeDetection(imageData, options.edgeDetectionStrength);
  
  // Step 3: Combine brightness mask with edge detection
  for (let i = 0; i < maskData.data.length; i += 4) {
    const edgeBrightness = 0.299 * edgeData.data[i] + 0.587 * edgeData.data[i + 1] + 0.114 * edgeData.data[i + 2];
    
    // If we have a strong edge AND the original pixel was bright, it's likely text
    if (edgeBrightness > 50 && maskData.data[i + 3] > 0) {
      // Strengthen the mask for text areas with clear edges
      maskData.data[i] = 255;
      maskData.data[i + 1] = 255;
      maskData.data[i + 2] = 255;
      maskData.data[i + 3] = 255;
    }
  }
  
  // Step 4: Apply morphological operations to clean up the mask
  const cleanedData = applyMorphology(maskData, options.morphologySize);
  
  // Step 5: Create final mask
  context.putImageData(cleanedData, 0, 0);
  
  // In preview mode, make the mask visible
  if (options.previewMode) {
    const previewData = context.getImageData(0, 0, canvas.width, canvas.height);
    const previewPixels = previewData.data;
    for (let i = 0; i < previewPixels.length; i += 4) {
      // Show mask as red overlay where text is detected
      if (previewPixels[i + 3] > 128) {
        previewPixels[i] = 255;     // Red
        previewPixels[i + 1] = 0;   // Green
        previewPixels[i + 2] = 0;   // Blue
        previewPixels[i + 3] = 128; // Semi-transparent
      } else {
        previewPixels[i + 3] = 0;   // Fully transparent
      }
    }
    context.putImageData(previewData, 0, 0);
  }

  return PIXI.Sprite.from(canvas);
};

/**
 * Legacy simple mask function for compatibility
 */
export const createMask = async (imageUrl: string, threshold: number): Promise<PIXI.Sprite> => {
  return createAdvancedMask(imageUrl, {
    threshold,
    invert: false,
    edgeDetectionStrength: 1,
    morphologySize: 1,
    previewMode: false
  });
};
