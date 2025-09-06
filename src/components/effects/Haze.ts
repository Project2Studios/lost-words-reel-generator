
import * as PIXI from 'pixi.js';
import { SimplexNoise } from './SimplexNoise';

export const createHaze = (width: number, height: number): PIXI.TilingSprite => {
  const simplex = new SimplexNoise();
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Could not get canvas context');
  }

  const imageData = context.createImageData(256, 256);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const value = simplex.noise(i / 4 % 256, Math.floor(i / 4 / 256)) * 255;
    imageData.data[i] = value;
    imageData.data[i + 1] = value;
    imageData.data[i + 2] = value;
    imageData.data[i + 3] = 255;
  }
  context.putImageData(imageData, 0, 0);

  const texture = PIXI.Texture.from(canvas);
  const haze = new PIXI.TilingSprite({texture, width, height});
  haze.alpha = 0.1; // Original opacity

  return haze;
};
