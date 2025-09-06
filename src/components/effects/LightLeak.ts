
import * as PIXI from 'pixi.js';

export const createLightLeak = (width: number, height: number): PIXI.Sprite => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Could not get canvas context');
  }

  const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);

  const texture = PIXI.Texture.from(canvas);
  const lightLeak = new PIXI.Sprite(texture);
  lightLeak.blendMode = 'add';
  lightLeak.width = width * 1.5;
  lightLeak.height = height * 1.5;
  lightLeak.x = -width * 0.25;
  lightLeak.y = -height * 0.25;
  lightLeak.alpha = 0;

  return lightLeak;
};
