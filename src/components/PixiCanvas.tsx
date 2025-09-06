import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import * as PIXI from 'pixi.js';
import { createAdvancedMask, MaskOptions } from './Masking';
import { createHaze } from './effects/Haze';
import { createLightLeak } from './effects/LightLeak';
import { createLensFlareSystem, LensFlareSystem, createChromaticAberrationFilter } from './effects/LensFlares';
import { getActivePreset } from '../presets/EffectPresets';
import { createCustomGrain, updateGrainEffect } from './effects/CustomGrain';
import { getResolutionById } from '../types/resolutions';

interface PixiCanvasProps {
  image: string | null;
  secondaryImage?: string | null;
  audio: string | null;
  settings: any;
  isPlaying: boolean;
}

export interface PixiCanvasRef {
  getCanvas: () => HTMLCanvasElement | null;
  getApp: () => PIXI.Application | null;
  setExportMode: (enabled: boolean) => void;
  getExportMode: () => boolean;
}

const PixiCanvas: React.ForwardRefRenderFunction<PixiCanvasRef, PixiCanvasProps> = ({ image, secondaryImage, audio, settings, isPlaying }, ref) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const tickerListenerRef = useRef<((time: PIXI.Ticker) => void) | null>(null);
  const imageTextureRef = useRef<PIXI.Texture | null>(null);
  const grainRef = useRef<PIXI.TilingSprite | null>(null);
  const lightLeakRef = useRef<PIXI.Sprite | null>(null);
  const hazeRef = useRef<PIXI.TilingSprite | null>(null);
  const maskRef = useRef<PIXI.Sprite | null>(null);
  const lensFlareSystemRef = useRef<LensFlareSystem | null>(null);
  const chromaticAberrationRef = useRef<PIXI.Filter | null>(null);
  const exportModeRef = useRef<boolean>(false);
  const particlesContainerRef = useRef<PIXI.Container | null>(null);
  const lastSettingsRef = useRef<string>('');
  const isInitializedRef = useRef<boolean>(false);
  
  // Transition-related refs
  const secondaryImageTextureRef = useRef<PIXI.Texture | null>(null);
  const secondaryImageSpriteRef = useRef<PIXI.Sprite | null>(null);
  const textOverlaySpriteRef = useRef<PIXI.Sprite | null>(null);
  const transitionTimeRef = useRef<number>(0);
  const isTransitioningRef = useRef<boolean>(false);
  const primaryImageSpriteRef = useRef<PIXI.Sprite | null>(null);

  // Layer references
  const backgroundLayerRef = useRef<PIXI.Container | null>(null);
  const effectsLayerRef = useRef<PIXI.Container | null>(null);
  const textLayerRef = useRef<PIXI.Container | null>(null);

  useImperativeHandle(ref, () => ({
    getCanvas: () => {
      return appRef.current ? appRef.current.canvas : null;
    },
    setExportMode: (enabled: boolean) => {
      exportModeRef.current = enabled;
      
      if (appRef.current && effectsLayerRef.current) {
        if (enabled) {
          // PERFORMANCE: Disable expensive effects during export
          console.log('Export mode: ENABLED - Disabling visual effects for performance');
          
          // Store original filter states for restoration
          const stage = appRef.current.stage;
          (stage as any)._originalFilters = stage.filters;
          
          // Disable all stage-level filters (grain, chromatic aberration, etc.)
          stage.filters = null;
          
          // Disable or reduce particle effects during export
          const effectsLayer = effectsLayerRef.current;
          (effectsLayer as any)._originalVisible = effectsLayer.visible;
          
          // Temporarily hide effects layer to boost performance
          // User won't see this during export, and it significantly speeds up rendering
          effectsLayer.visible = false;
          
          // Disable haze effect if present
          if (hazeRef.current) {
            (hazeRef.current as any)._originalVisible = hazeRef.current.visible;
            hazeRef.current.visible = false;
          }
          
          // Disable grain effect if present  
          if (grainRef.current) {
            (grainRef.current as any)._originalVisible = grainRef.current.visible;
            grainRef.current.visible = false;
          }
          
          // Cache complex background elements for faster rendering
          if (backgroundLayerRef.current) {
            backgroundLayerRef.current.cacheAsBitmap = true;
          }
          
          // Ensure ticker is running for export
          if (!appRef.current.ticker.started) {
            appRef.current.ticker.start();
          }
          
          // Remove FPS limits for fastest possible frame capture
          appRef.current.ticker.maxFPS = 0; // No FPS limit for fast export
          appRef.current.ticker.minFPS = 0;
          
          console.log('Export mode optimizations applied: filters disabled, effects hidden, background cached');
        } else {
          // Restore all visual effects after export
          console.log('Export mode: DISABLED - Restoring visual effects');
          
          const stage = appRef.current.stage;
          
          // Restore original stage filters
          if ((stage as any)._originalFilters !== undefined) {
            stage.filters = (stage as any)._originalFilters;
            delete (stage as any)._originalFilters;
          }
          
          // Restore effects layer visibility
          const effectsLayer = effectsLayerRef.current;
          if ((effectsLayer as any)._originalVisible !== undefined) {
            effectsLayer.visible = (effectsLayer as any)._originalVisible;
            delete (effectsLayer as any)._originalVisible;
          }
          
          // Restore haze effect
          if (hazeRef.current && (hazeRef.current as any)._originalVisible !== undefined) {
            hazeRef.current.visible = (hazeRef.current as any)._originalVisible;
            delete (hazeRef.current as any)._originalVisible;
          }
          
          // Restore grain effect
          if (grainRef.current && (grainRef.current as any)._originalVisible !== undefined) {
            grainRef.current.visible = (grainRef.current as any)._originalVisible;
            delete (grainRef.current as any)._originalVisible;
          }
          
          // Disable background caching for live preview
          if (backgroundLayerRef.current) {
            backgroundLayerRef.current.cacheAsBitmap = false;
          }
          
          // Ensure ticker continues running for live preview
          if (!appRef.current.ticker.started) {
            appRef.current.ticker.start();
          }
          
          // Reset ticker to normal settings
          appRef.current.ticker.maxFPS = 0; // No FPS limit
          appRef.current.ticker.minFPS = 10;
          
          // Force a render to ensure preview is visible with all effects
          appRef.current.render();
          
          console.log('Export mode: All visual effects restored for live preview');
        }
      }
    },
    getApp: () => {
      return appRef.current;
    },
    getExportMode: () => exportModeRef.current
  }));

  useEffect(() => {
    const updateCanvas = async () => {
      try {
        // Debounce rapid updates to prevent ResizeObserver issues
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Check if we need to recreate the app or can reuse existing one
        const currentSettingsKey = JSON.stringify({
          preset: settings.preset,
          resolution: settings.resolution,
          grain: settings.grain,
          lightLeak: settings.lightLeak,
          dustIntensity: settings.dustIntensity,
          snowIntensity: settings.snowIntensity,
          sparklesIntensity: settings.sparklesIntensity,
          hazeIntensity: settings.hazeIntensity,
          enableLensFlares: settings.enableLensFlares,
          textMaskEnabled: settings.textMaskEnabled,
          textMaskThreshold: settings.textMaskThreshold,
          textMaskInvert: settings.textMaskInvert,
          textMaskEdgeStrength: settings.textMaskEdgeStrength,
          textMaskMorphologySize: settings.textMaskMorphologySize,
          textMaskPreview: settings.textMaskPreview
        });
        
        const needsRecreation = !appRef.current || !isInitializedRef.current || 
          lastSettingsRef.current !== currentSettingsKey || !image;
        
        lastSettingsRef.current = currentSettingsKey;
        
        if (needsRecreation) {
          // Destroy existing app if it exists
          if (appRef.current) {
            // Remove the ticker listener before destroying the app
            if (tickerListenerRef.current) {
              appRef.current.ticker.remove(tickerListenerRef.current);
              tickerListenerRef.current = null;
            }
            appRef.current.destroy(true, true);
            appRef.current = null;
            isInitializedRef.current = false;
          }
          
          // Clear the canvas container completely
          if (canvasRef.current) {
            canvasRef.current.innerHTML = '';
          }

          // Clean up references
          if (hazeRef.current) {
            hazeRef.current.destroy();
            hazeRef.current = null;
          }
          if (lightLeakRef.current) {
            lightLeakRef.current.destroy();
            lightLeakRef.current = null;
          }
          if (lensFlareSystemRef.current) {
            lensFlareSystemRef.current.destroy();
            lensFlareSystemRef.current = null;
          }
          if (maskRef.current) {
            maskRef.current.destroy();
            maskRef.current = null;
          }
          if (grainRef.current) {
            grainRef.current.destroy();
            grainRef.current = null;
          }
          backgroundLayerRef.current = null;
          effectsLayerRef.current = null;
          textLayerRef.current = null;

          // Recreate the Pixi Application
          console.log('Creating new PIXI application...');
          const app = new PIXI.Application();
          
          // Get resolution preset from settings
          const resolution = getResolutionById(settings.resolution || 'instagram-reel');
          const canvasWidth = resolution.width;
          const canvasHeight = resolution.height;
          
          console.log(`Using ${resolution.name} dimensions:`, canvasWidth, 'x', canvasHeight, `(${resolution.aspectRatio})`);
          
          await app.init({
            width: canvasWidth,
            height: canvasHeight,
            backgroundColor: 0x000000,
            preserveDrawingBuffer: true,
            autoStart: false, // Let us control ticker startup manually
            antialias: true,
            resolution: window.devicePixelRatio || 1,
          });
          appRef.current = app;
          
          console.log('PIXI app initialized, ticker will be started after listener setup');
          
          if (canvasRef.current) {
            console.log('Adding canvas to DOM...');
            
            // Add canvas to DOM
            const canvas = app.canvas as HTMLCanvasElement;
            canvasRef.current.appendChild(canvas);
            
            // Style the canvas to fit in the container while maintaining aspect ratio
            canvas.style.display = 'block';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.maxWidth = '100%';
            canvas.style.maxHeight = '100%';
            canvas.style.objectFit = 'contain';
            canvas.style.visibility = 'visible';
            canvas.style.opacity = '1';
            canvas.style.position = 'relative';
            canvas.style.zIndex = '1';
            
            // Style the container to ensure visibility
            canvasRef.current.style.display = 'block';
            canvasRef.current.style.visibility = 'visible';
            canvasRef.current.style.opacity = '1';
            canvasRef.current.style.position = 'relative';
            
            console.log(`Canvas styled with ${resolution.name} aspect ratio (${resolution.aspectRatio}) and added to DOM`);
            console.log('Canvas element:', canvas);
            console.log('Canvas parent:', canvasRef.current);
            console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
            console.log('Canvas computed style:', getComputedStyle(canvas));
          } else {
            console.error('Canvas ref is null!');
          }

          // Create the three layers
          const backgroundLayer = new PIXI.Container();
          const effectsLayer = new PIXI.Container();
          const textLayer = new PIXI.Container();

          backgroundLayerRef.current = backgroundLayer;
          effectsLayerRef.current = effectsLayer;
          textLayerRef.current = textLayer;

          // Add layers to stage in order
          app.stage.addChild(backgroundLayer);
          app.stage.addChild(effectsLayer);
          app.stage.addChild(textLayer);
          console.log("Added layers to stage. Stage children count:", app.stage.children.length);

          // Setup optimized ticker listener
          let lightLeakTime = 0;
          
          const listener = (ticker: PIXI.Ticker) => {
            try {
              // Update transition time and handle transitions (only if playing)
              if (settings.transitionEnabled && secondaryImageSpriteRef.current && isPlaying) {
                transitionTimeRef.current += ticker.deltaTime / 60; // Convert to seconds
                
                const transitionStart = settings.transitionTimestamp;
                const transitionEnd = transitionStart + settings.transitionDuration;
                
                if (transitionTimeRef.current >= transitionStart && transitionTimeRef.current <= transitionEnd) {
                  // Calculate transition progress (0 to 1)
                  const progress = (transitionTimeRef.current - transitionStart) / settings.transitionDuration;
                  
                  // Apply transition - fade the primary image background while keeping text overlay visible
                  if (settings.transitionType === 'fade') {
                    console.log(`Transition progress: ${(progress * 100).toFixed(1)}%`);
                    
                    // During transition: secondary image fades in, primary image fades out
                    // Text overlay always stays fully visible on top
                    if (primaryImageSpriteRef.current) {
                      primaryImageSpriteRef.current.alpha = 1 - progress;
                      console.log(`Primary image alpha: ${primaryImageSpriteRef.current.alpha.toFixed(2)}`);
                    }
                    secondaryImageSpriteRef.current.alpha = progress;
                    console.log(`Secondary image alpha: ${secondaryImageSpriteRef.current.alpha.toFixed(2)}`);
                    
                    // Ensure text overlay is always fully visible and on top
                    if (textOverlaySpriteRef.current) {
                      textOverlaySpriteRef.current.alpha = 1;
                      // Make sure text overlay is rendered above both background images
                      textOverlaySpriteRef.current.parent?.setChildIndex(textOverlaySpriteRef.current, textOverlaySpriteRef.current.parent.children.length - 1);
                      console.log(`Text overlay alpha: ${textOverlaySpriteRef.current.alpha}, visible: ${textOverlaySpriteRef.current.visible}`);
                    } else {
                      console.log("Text overlay sprite is null during transition");
                    }
                  }
                  
                  isTransitioningRef.current = true;
                } else if (transitionTimeRef.current > transitionEnd) {
                  // Transition complete - secondary image is now the background, text remains on top
                  if (primaryImageSpriteRef.current) {
                    primaryImageSpriteRef.current.alpha = 0;
                  }
                  secondaryImageSpriteRef.current.alpha = 1;
                  
                  // Ensure text overlay is fully visible and stays on top
                  if (textOverlaySpriteRef.current) {
                    textOverlaySpriteRef.current.alpha = 1;
                    // Final check to ensure text is rendered above the new background
                    textOverlaySpriteRef.current.parent?.setChildIndex(textOverlaySpriteRef.current, textOverlaySpriteRef.current.parent.children.length - 1);
                  }
                  isTransitioningRef.current = false;
                }
              }
              
              // Update effects (only when playing to preserve battery)
              if (isPlaying) {
                // Update haze effect - capture ref to prevent race condition
                const hazeSprite = hazeRef.current;
                if (hazeSprite && hazeSprite.visible) {
                  hazeSprite.tilePosition.x += ticker.deltaTime * 1;
                  hazeSprite.tilePosition.y += ticker.deltaTime * 1;
                }
                
                // Update basic light leak - capture ref to prevent race condition
                const lightLeakSprite = lightLeakRef.current;
                if (lightLeakSprite && lightLeakSprite.visible) {
                  lightLeakTime += ticker.deltaTime;
                  lightLeakSprite.alpha = (Math.sin(lightLeakTime * 0.01) + 1) / 2 * 0.2;
                }
                
                // Update lens flare system - capture ref to prevent race condition
                const lensFlareSystem = lensFlareSystemRef.current;
                if (lensFlareSystem && lensFlareSystem.container.visible) {
                  lensFlareSystem.update(ticker.deltaTime);
                }
                
                // Update grain effect - capture ref to prevent race condition
                const grainSprite = grainRef.current;
                if (grainSprite && grainSprite.visible) {
                  updateGrainEffect(grainSprite, ticker.deltaTime);
                }
              }
            } catch (error) {
              console.error('Error in ticker update:', error);
            }
          };
          app.ticker.add(listener);
          tickerListenerRef.current = listener;

          // Start the ticker once after everything is set up
          app.ticker.start();
          console.log('Ticker started after listener added. FPS:', app.ticker.maxFPS);
          
          // Force an immediate render to ensure canvas shows content
          app.render();
          console.log('Initial render forced after ticker start');

          // Initialize custom grain effect
          try {
            console.log('Creating custom grain effect...');
            grainRef.current = createCustomGrain(app.screen.width, app.screen.height);
            grainRef.current.visible = false; // Start hidden, will be shown if grain setting is enabled
            console.log('Custom grain effect created successfully');
          } catch (error) {
            console.error('Error initializing custom grain effect:', error);
            // Fallback - disable grain effect
            grainRef.current = null;
          }
          
          lightLeakRef.current = createLightLeak(app.screen.width, app.screen.height);

          try {
            // Destroy old image texture if it exists
            if (imageTextureRef.current) {
              imageTextureRef.current.destroy(true);
              imageTextureRef.current = null;
            }
            
            // Clean up text overlay sprite if it exists
            if (textOverlaySpriteRef.current) {
              textOverlaySpriteRef.current.destroy({ children: true });
              textOverlaySpriteRef.current = null;
            }

            if (!image) {
              console.log("No image to load. Canvas created but no image to display.");
              // Don't return early - let the canvas be created even without an image
              // Just force a render to show the black background
              app.render();
            } else {

            console.log("Loading image:", image);
            const texture = await PIXI.Assets.load(image);
            imageTextureRef.current = texture;

            const imageSprite = new PIXI.Sprite(texture);
            imageSprite.anchor.set(0.5);
            imageSprite.x = app.screen.width / 2;
            imageSprite.y = app.screen.height / 2;
            
            // Scale the image to fit the canvas while maintaining aspect ratio (contain behavior)
            const scaleX = app.screen.width / texture.width;
            const scaleY = app.screen.height / texture.height;
            const scale = Math.min(scaleX, scaleY); // Use Math.min to show the entire image without cropping
            imageSprite.scale.set(scale);

            console.log("Image sprite created successfully");
            console.log("Image dimensions:", texture.width, "x", texture.height);
            console.log("Canvas dimensions:", app.screen.width, "x", app.screen.height);
            console.log("Scale applied:", scale);
            console.log("Sprite position:", imageSprite.x, imageSprite.y);
            
            // Store reference to primary image sprite
            primaryImageSpriteRef.current = imageSprite;
            
            // Add image to background layer
            backgroundLayer.addChild(imageSprite);
            console.log("Image sprite added to background layer");
            console.log("Background layer children count:", backgroundLayer.children.length);
            console.log("Stage children count:", app.stage.children.length);
            
            // Force render after adding image
            app.render();
            console.log("Rendered after adding image to background layer");
            
            // Ensure canvas is visible in DOM
            const canvas = app.canvas as HTMLCanvasElement;
            if (canvas) {
              canvas.style.visibility = 'visible';
              canvas.style.display = 'block';
            }
            
            // Load secondary image if provided and transitions are enabled
            if (secondaryImage && settings.transitionEnabled) {
              try {
                console.log("Loading secondary image for transition:", secondaryImage);
                
                // Destroy old secondary texture if it exists
                if (secondaryImageTextureRef.current) {
                  secondaryImageTextureRef.current.destroy(true);
                  secondaryImageTextureRef.current = null;
                }
                
                const secondaryTexture = await PIXI.Assets.load(secondaryImage);
                secondaryImageTextureRef.current = secondaryTexture;
                
                const secondarySprite = new PIXI.Sprite(secondaryTexture);
                secondarySprite.anchor.set(0.5);
                secondarySprite.x = app.screen.width / 2;
                secondarySprite.y = app.screen.height / 2;
                
                // Apply same scale as primary image
                secondarySprite.scale.set(scale);
                secondarySprite.alpha = 0; // Start with secondary image invisible
                
                // Apply filters to secondary image
                const filters: PIXI.Filter[] = [];
                
                // Apply brightness adjustment
                if (settings.secondaryImageBrightness !== 1.0) {
                  const brightnessFilter = new PIXI.ColorMatrixFilter();
                  brightnessFilter.brightness(settings.secondaryImageBrightness, false);
                  filters.push(brightnessFilter);
                }
                
                // Apply grayscale if enabled
                if (settings.secondaryImageGrayscale) {
                  const grayscaleFilter = new PIXI.ColorMatrixFilter();
                  grayscaleFilter.desaturate();
                  filters.push(grayscaleFilter);
                }
                
                // Set filters if any exist
                if (filters.length > 0) {
                  secondarySprite.filters = filters;
                }
                
                secondaryImageSpriteRef.current = secondarySprite;
                
                // Add secondary image to background layer (above primary so it can fade in)
                backgroundLayer.addChild(secondarySprite);
                console.log("Secondary image sprite added to background layer");
                
                // Always create text overlay for transitions when text masking is available
                try {
                  console.log("Creating text extraction for transition effect...");
                  const maskOptions: MaskOptions = {
                    threshold: 180, // Higher threshold for white text extraction (bright pixels)
                    invert: false, // We want the bright text areas to be visible
                    edgeDetectionStrength: 2.0, // Strong edge detection for crisp text boundaries
                    morphologySize: 1, // Minimal morphology to keep text sharp
                    previewMode: false
                  };
                  
                  // Create text mask from primary image
                  const textMask = await createAdvancedMask(image, maskOptions);
                  
                  // Create a sprite with the original image that will show only the text areas
                  const textSprite = new PIXI.Sprite(texture);
                  textSprite.anchor.set(0.5);
                  textSprite.x = app.screen.width / 2;
                  textSprite.y = app.screen.height / 2;
                  textSprite.scale.set(scale);
                  
                  // Position the mask correctly to match the sprite
                  textMask.anchor.set(0.5);
                  textMask.x = app.screen.width / 2;
                  textMask.y = app.screen.height / 2;
                  textMask.scale.set(scale);
                  
                  // Apply the mask to show only text areas
                  textSprite.mask = textMask;
                  
                  // Add mask to the same container so it's rendered
                  textLayer.addChild(textMask);
                  textLayer.addChild(textSprite);
                  
                  textOverlaySpriteRef.current = textSprite;
                  
                  console.log("Text overlay created and added to text layer with mask");
                  console.log("Text sprite:", textSprite.width, "x", textSprite.height, "at position", textSprite.x, textSprite.y);
                  console.log("Text mask:", textMask.width, "x", textMask.height, "at position", textMask.x, textMask.y);
                  console.log("Text layer children count:", textLayer.children.length);
                } catch (error) {
                  console.error('Error creating text extraction for transition:', error);
                }
              } catch (error) {
                console.error("Error loading secondary image:", error);
              }
            }
            
            // Reset transition time when images change
            transitionTimeRef.current = 0;
            isTransitioningRef.current = false;
            } // Close the else block for if (!image)

            // Get active preset configuration
            const activePreset = getActivePreset(settings);
            console.log("Active preset:", activePreset.name, activePreset.effects);
            
            // Clean up any existing particle effects before creating new ones
            const cleanupParticleContainer = (containerRef: React.MutableRefObject<PIXI.Container | null>) => {
              if (containerRef.current) {
                try {
                  const updaters = (containerRef.current as any).particleUpdaters;
                  if (updaters && Array.isArray(updaters)) {
                    updaters.forEach((updater: (ticker: PIXI.Ticker) => void) => {
                      app.ticker.remove(updater);
                    });
                  }
                  effectsLayer.removeChild(containerRef.current);
                  containerRef.current.destroy({ children: true });
                  containerRef.current = null;
                } catch (error) {
                  console.error('Error cleaning up particle container:', error);
                }
              }
            };
            
            // Clean up the main particle container
            cleanupParticleContainer(particlesContainerRef);
            
            // Clean up existing haze effect
            if (hazeRef.current) {
              try {
                effectsLayer.removeChild(hazeRef.current);
                (hazeRef.current as PIXI.TilingSprite).destroy();
                hazeRef.current = null;
              } catch (error) {
                console.error('Error cleaning up haze effect:', error);
              }
            }
            
            // Create particle effects - simplified version like the original
            // Only create particles if at least one effect has intensity > 0
            const hasDust = settings.dustIntensity && settings.dustIntensity > 0;
            const hasSnow = settings.snowIntensity && settings.snowIntensity > 0;
            const hasSparkles = settings.sparklesIntensity && settings.sparklesIntensity > 0;
            
            if (hasDust || hasSnow || hasSparkles) {
              console.log("Creating particles - Dust:", settings.dustIntensity, "Snow:", settings.snowIntensity, "Sparkles:", settings.sparklesIntensity);
              
              // Create particle container
              const particlesContainer = new PIXI.Container();
              particlesContainerRef.current = particlesContainer;
              
              // Store particle update functions for cleanup
              const particleUpdaters: ((ticker: PIXI.Ticker) => void)[] = [];
              
              // Base particle count
              const baseCount = exportModeRef.current ? 15 : 33;
              
              // Create dust particles if enabled
              if (hasDust) {
                const dustCount = Math.floor(baseCount * settings.dustIntensity);
                for (let i = 0; i < dustCount; i++) {
                  const particle = new PIXI.Graphics();
                  
                  // Original dust properties
                  const size = Math.random() * 2.5 + 0.3;
                  particle.circle(0, 0, size);
                  particle.fill(0xffffff);
                  
                  // Original opacity variation
                  const opacityRoll = Math.random();
                  if (opacityRoll < 0.3) {
                    particle.alpha = Math.random() * 0.1 + 0.05;
                  } else if (opacityRoll < 0.7) {
                    particle.alpha = Math.random() * 0.2 + 0.15;
                  } else {
                    particle.alpha = Math.random() * 0.25 + 0.25;
                  }
                  
                  particle.x = Math.random() * app.screen.width;
                  particle.y = Math.random() * app.screen.height;
                  
                  const baseSpeed = 0.8 + (size / 2.5) * 1.2;
                  
                  const particleUpdate = (ticker: PIXI.Ticker) => {
                    if (!particle.destroyed) {
                      const normalizedDelta = ticker.deltaTime / 16.67;
                      particle.y += baseSpeed * normalizedDelta;
                      particle.x += Math.sin(particle.y * 0.01) * 0.3 * normalizedDelta;
                      
                      if (particle.y > app.screen.height) {
                        particle.y = -10;
                        particle.x = Math.random() * app.screen.width;
                      }
                      
                      if (particle.x > app.screen.width) {
                        particle.x = 0;
                      } else if (particle.x < 0) {
                        particle.x = app.screen.width;
                      }
                    }
                  };
                  
                  app.ticker.add(particleUpdate);
                  particleUpdaters.push(particleUpdate);
                  particlesContainer.addChild(particle);
                }
              }
              
              // Create snow particles if enabled
              if (hasSnow) {
                const snowCount = Math.floor(baseCount * settings.snowIntensity);
                for (let i = 0; i < snowCount; i++) {
                  const particle = new PIXI.Graphics();
                  
                  const size = Math.random() * 3 + 1;
                  particle.circle(0, 0, size);
                  particle.fill(0xffffff);
                  particle.alpha = Math.random() * 0.4 + 0.4;
                  
                  particle.x = Math.random() * app.screen.width;
                  particle.y = Math.random() * app.screen.height;
                  
                  const baseSpeed = 0.8 + (size / 3) * 1.2;
                  
                  const particleUpdate = (ticker: PIXI.Ticker) => {
                    if (!particle.destroyed) {
                      const normalizedDelta = ticker.deltaTime / 16.67;
                      particle.y += baseSpeed * normalizedDelta;
                      particle.x += Math.sin(particle.y * 0.01) * 1.5 * normalizedDelta;
                      
                      if (particle.y > app.screen.height) {
                        particle.y = -10;
                        particle.x = Math.random() * app.screen.width;
                      }
                      
                      if (particle.x > app.screen.width) {
                        particle.x = 0;
                      } else if (particle.x < 0) {
                        particle.x = app.screen.width;
                      }
                    }
                  };
                  
                  app.ticker.add(particleUpdate);
                  particleUpdaters.push(particleUpdate);
                  particlesContainer.addChild(particle);
                }
              }
              
              // Create sparkles if enabled
              if (hasSparkles) {
                const sparkleCount = Math.floor(baseCount * settings.sparklesIntensity);
                for (let i = 0; i < sparkleCount; i++) {
                  const particle = new PIXI.Graphics();
                  
                  const size = Math.random() * 1.5 + 0.5;
                  particle.circle(0, 0, size);
                  particle.fill(0xfffacd);
                  particle.alpha = Math.random() * 0.6 + 0.4;
                  
                  particle.x = Math.random() * app.screen.width;
                  particle.y = Math.random() * app.screen.height;
                  
                  const baseSpeed = 0.3 + Math.random() * 0.5;
                  const particleIndex = i; // Capture for twinkle effect
                  
                  const particleUpdate = (ticker: PIXI.Ticker) => {
                    if (!particle.destroyed) {
                      const normalizedDelta = ticker.deltaTime / 16.67;
                      particle.y += baseSpeed * normalizedDelta;
                      particle.x += Math.sin(particle.y * 0.01) * 0.2 * normalizedDelta;
                      
                      // Twinkle effect
                      particle.alpha = 0.4 + Math.sin(ticker.lastTime * 0.01 + particleIndex) * 0.3;
                      
                      if (particle.y > app.screen.height) {
                        particle.y = -10;
                        particle.x = Math.random() * app.screen.width;
                      }
                      
                      if (particle.x > app.screen.width) {
                        particle.x = 0;
                      } else if (particle.x < 0) {
                        particle.x = app.screen.width;
                      }
                    }
                  };
                  
                  app.ticker.add(particleUpdate);
                  particleUpdaters.push(particleUpdate);
                  particlesContainer.addChild(particle);
                }
              }
              
              // Store updaters for cleanup
              (particlesContainer as any).particleUpdaters = particleUpdaters;
              effectsLayer.addChild(particlesContainer);
            }
            
            // Create haze effect based on intensity
            if (settings.hazeIntensity && settings.hazeIntensity > 0) {
              console.log("Creating haze with intensity:", settings.hazeIntensity);
              try {
                hazeRef.current = createHaze(app.screen.width, app.screen.height);
                hazeRef.current.alpha = Math.min(settings.hazeIntensity, 1.0); // Apply intensity, max 1.0
                effectsLayer.addChild(hazeRef.current);
              } catch (error) {
                console.error('Error creating haze effect:', error);
              }
            }
            
            // Clean up existing lens flare system before creating a new one
            if (lensFlareSystemRef.current) {
              try {
                effectsLayer.removeChild((lensFlareSystemRef.current as any).container);
                (lensFlareSystemRef.current as any).destroy();
                lensFlareSystemRef.current = null;
              } catch (error) {
                console.error('Error cleaning up lens flare system:', error);
              }
            }
            
            // Clear chromatic aberration filter reference
            if (chromaticAberrationRef.current) {
              chromaticAberrationRef.current = null;
            }
            
            // Apply lens flare system if enabled
            if (activePreset.effects.enableLensFlares && activePreset.effects.lensFlareConfig) {
              try {
                console.log("Creating lens flare system with config:", activePreset.effects.lensFlareConfig);
                lensFlareSystemRef.current = createLensFlareSystem(
                  app.screen.width,
                  app.screen.height,
                  activePreset.effects.lensFlareConfig
                );
                effectsLayer.addChild(lensFlareSystemRef.current.container);
                
                // Apply chromatic aberration if enabled
                if (activePreset.effects.lensFlareConfig.chromaticAberration) {
                  chromaticAberrationRef.current = createChromaticAberrationFilter(
                    activePreset.effects.lensFlareConfig.aberrationStrength
                  );
                }
              } catch (error) {
                console.error('Error creating lens flare system:', error);
              }
            }

            // Apply text masking if enabled
            if (settings.textMaskEnabled) {
              try {
                console.log("Creating text mask...");
                const maskOptions: MaskOptions = {
                  threshold: settings.textMaskThreshold || 128,
                  invert: settings.textMaskInvert || false,
                  edgeDetectionStrength: settings.textMaskEdgeStrength || 1.5,
                  morphologySize: settings.textMaskMorphologySize || 2,
                  previewMode: settings.textMaskPreview || false
                };
                
                const maskSprite = await createAdvancedMask(image!, maskOptions);
                maskRef.current = maskSprite;
                
                if (settings.textMaskPreview) {
                  // In preview mode, show the mask as an overlay
                  maskSprite.alpha = 0.7;
                  maskSprite.anchor.set(0.5);
                  maskSprite.x = app.screen.width / 2;
                  maskSprite.y = app.screen.height / 2;
                  textLayer.addChild(maskSprite);
                } else {
                  // Apply mask to effects layer to hide effects where text is present
                  effectsLayer.mask = maskSprite;
                  maskSprite.anchor.set(0.5);
                  maskSprite.x = app.screen.width / 2;
                  maskSprite.y = app.screen.height / 2;
                  // Don't add mask to display list when using as mask
                }
                console.log("Text mask created successfully");
              } catch (error) {
                console.error('Error creating text mask:', error);
              }
            }

            // Apply filters based on preset (only chromatic aberration now)
            const filters: PIXI.Filter[] = [];
            
            console.log('Applying filters. Settings.grain:', settings.grain, 'grainRef.current:', !!grainRef.current);
            
            if (chromaticAberrationRef.current) {
              console.log('Adding ChromaticAberrationFilter to filters');
              filters.push(chromaticAberrationRef.current);
            }
            
            console.log('Total filters to apply:', filters.length);
            
            if (filters.length > 0) {
              app.stage.filters = filters;
              console.log('Filters applied to stage');
            } else {
              app.stage.filters = null;
              console.log('No filters applied, cleared stage filters');
            }

            // Add basic light leak if enabled in preset
            if (activePreset.effects.lightLeak && lightLeakRef.current) {
              lightLeakRef.current.visible = true;
              effectsLayer.addChild(lightLeakRef.current);
            }
            
            // Add custom grain effect if created successfully
            if (grainRef.current) {
              grainRef.current.visible = settings.grain;
              effectsLayer.addChild(grainRef.current);
              console.log('Custom grain effect added to effects layer, visible:', settings.grain);
            }

            console.log("Canvas setup completed successfully");
            
            // Force a render to make sure everything is displayed
            app.render();
            console.log("Forced render completed");
            
            // Ticker should already be started, just verify
            console.log('Ticker status after setup:', app.ticker.started);
            
            // Force multiple renders to ensure visibility
            setTimeout(() => {
              if (appRef.current) {
                appRef.current.render();
                console.log('Delayed render executed');
              }
            }, 50);
            
            setTimeout(() => {
              if (appRef.current) {
                appRef.current.render();
                console.log('Second delayed render executed');
              }
            }, 100);
            
            console.log('Final ticker state - started:', app.ticker.started, 'FPS:', app.ticker.FPS.toFixed(2));
            
            isInitializedRef.current = true;

          } catch (error) {
            console.error("Error loading image:", error);
            if (appRef.current) {
              appRef.current.stage.removeChildren();
            }
            isInitializedRef.current = false;
          }
        } else if (appRef.current && image) {
          // Fast path: just update the image texture if only image changed
          try {
            // Destroy old image texture if it exists
            if (imageTextureRef.current) {
              imageTextureRef.current.destroy(true);
              imageTextureRef.current = null;
            }
            
            // Clean up text overlay sprite if it exists
            if (textOverlaySpriteRef.current) {
              textOverlaySpriteRef.current.destroy({ children: true });
              textOverlaySpriteRef.current = null;
            }
            
            console.log("Fast update - loading new image:", image);
            const texture = await PIXI.Assets.load(image);
            imageTextureRef.current = texture;
            
            // Update existing image sprite if it exists
            if (backgroundLayerRef.current && backgroundLayerRef.current.children.length > 0) {
              const imageSprite = backgroundLayerRef.current.children[0] as PIXI.Sprite;
              if (imageSprite instanceof PIXI.Sprite) {
                imageSprite.texture = texture;
                console.log("Image sprite texture updated successfully");
              }
            }
          } catch (error) {
            console.error("Error updating image:", error);
            // Fall back to full recreation on error
            lastSettingsRef.current = '';
            updateCanvas();
            return;
          }
        }
      } catch (error) {
        console.error('Error in updateCanvas:', error);
        // Try to clean up any partial state
        if (appRef.current) {
          appRef.current.destroy(true, true);
          appRef.current = null;
        }
        isInitializedRef.current = false;
      }
    };

    updateCanvas();

    // Cleanup for when the component unmounts
    return () => {
      if (appRef.current) {
        appRef.current.ticker.stop();
        if (tickerListenerRef.current) {
          appRef.current.ticker.remove(tickerListenerRef.current);
          tickerListenerRef.current = null;
        }
        appRef.current.destroy(true, true);
        appRef.current = null;
      }
    };
  }, [image, secondaryImage, settings.preset, settings.resolution, settings.grain, settings.lightLeak, settings.enableLensFlares, settings.textMaskEnabled, settings.textMaskThreshold, settings.textMaskInvert, settings.textMaskEdgeStrength, settings.textMaskMorphologySize, settings.textMaskPreview, settings.transitionEnabled, settings.transitionTimestamp, settings.transitionDuration, settings.transitionType, isPlaying]); // Removed brightness/grayscale to prevent re-init

  // Handle secondary image filter updates without re-initialization
  useEffect(() => {
    if (secondaryImageSpriteRef.current) {
      console.log('Updating secondary image filters - brightness:', settings.secondaryImageBrightness, 'grayscale:', settings.secondaryImageGrayscale);
      
      // Create new filters array
      const filters: PIXI.Filter[] = [];
      
      // Apply brightness adjustment
      if (settings.secondaryImageBrightness !== 1.0) {
        const brightnessFilter = new PIXI.ColorMatrixFilter();
        brightnessFilter.brightness(settings.secondaryImageBrightness, false);
        filters.push(brightnessFilter);
      }
      
      // Apply grayscale if enabled
      if (settings.secondaryImageGrayscale) {
        const grayscaleFilter = new PIXI.ColorMatrixFilter();
        grayscaleFilter.desaturate();
        filters.push(grayscaleFilter);
      }
      
      // Update filters on the sprite
      secondaryImageSpriteRef.current.filters = filters.length > 0 ? filters : null;
      
      // Force a render to show the changes immediately
      if (appRef.current) {
        appRef.current.render();
      }
    }
  }, [settings.secondaryImageBrightness, settings.secondaryImageGrayscale]);

  // Handle play/pause - Keep ticker running but control animations
  useEffect(() => {
    if (appRef.current) {
      console.log('Play/pause useEffect triggered - isPlaying:', isPlaying);
      
      // CRITICAL: Always keep ticker running for live preview (PIXI requires this)
      if (!appRef.current.ticker.started) {
        appRef.current.ticker.start();
        console.log('Ticker restarted in play/pause handler');
      }
      
      if (!isPlaying) {
          // Reset transition time when paused
        transitionTimeRef.current = 0;
        isTransitioningRef.current = false;
        // Reset sprite alphas to initial state
        if (primaryImageSpriteRef.current) {
          primaryImageSpriteRef.current.alpha = 1;
        }
        if (secondaryImageSpriteRef.current) {
          secondaryImageSpriteRef.current.alpha = 0;
        }
        // Keep text overlay always visible
        if (textOverlaySpriteRef.current) {
          textOverlaySpriteRef.current.alpha = 1;
        }
      }
      
      // Force multiple renders to ensure display updates
      appRef.current.render();
      setTimeout(() => {
        if (appRef.current) {
          appRef.current.render();
        }
      }, 16); // Next frame
      
      console.log('Ticker.started after:', appRef.current.ticker.started);
    } else {
      console.log('Play/pause useEffect triggered but appRef.current is null');
    }
  }, [isPlaying]);

  // Handle grain effect changes
  useEffect(() => {
    if (grainRef.current && appRef.current) {
      grainRef.current.visible = settings.grain;
      console.log('Grain effect visibility set to:', settings.grain);
    }
  }, [settings.grain]);

  // Handle particle intensity changes without recreating the canvas
  useEffect(() => {
    if (!appRef.current || !effectsLayerRef.current || !isInitializedRef.current) return;
    
    console.log('Updating particle intensities:', settings.dustIntensity, settings.snowIntensity, settings.sparklesIntensity);
    
    const app = appRef.current;
    const effectsLayer = effectsLayerRef.current;
    
    // Clean up existing particles
    if (particlesContainerRef.current) {
      try {
        const updaters = (particlesContainerRef.current as any).particleUpdaters;
        if (updaters && Array.isArray(updaters)) {
          updaters.forEach((updater: (ticker: PIXI.Ticker) => void) => {
            app.ticker.remove(updater);
          });
        }
        effectsLayer.removeChild(particlesContainerRef.current);
        particlesContainerRef.current.destroy({ children: true });
        particlesContainerRef.current = null;
      } catch (error) {
        console.error('Error cleaning up particles:', error);
      }
    }
    
    // Clean up existing haze
    if (hazeRef.current) {
      try {
        effectsLayer.removeChild(hazeRef.current);
        hazeRef.current.destroy();
        hazeRef.current = null;
      } catch (error) {
        console.error('Error cleaning up haze:', error);
      }
    }
    
    // Recreate particles with new intensities
    const hasDust = settings.dustIntensity && settings.dustIntensity > 0;
    const hasSnow = settings.snowIntensity && settings.snowIntensity > 0;
    const hasSparkles = settings.sparklesIntensity && settings.sparklesIntensity > 0;
    
    if (hasDust || hasSnow || hasSparkles) {
      const particlesContainer = new PIXI.Container();
      particlesContainerRef.current = particlesContainer;
      
      const particleUpdaters: ((ticker: PIXI.Ticker) => void)[] = [];
      const baseCount = exportModeRef.current ? 15 : 33;
      
      // Create dust particles
      if (hasDust) {
        const dustCount = Math.floor(baseCount * settings.dustIntensity);
        for (let i = 0; i < dustCount; i++) {
          const particle = new PIXI.Graphics();
          const size = Math.random() * 2.5 + 0.3;
          particle.circle(0, 0, size);
          particle.fill(0xffffff);
          
          const opacityRoll = Math.random();
          if (opacityRoll < 0.3) {
            particle.alpha = Math.random() * 0.1 + 0.05;
          } else if (opacityRoll < 0.7) {
            particle.alpha = Math.random() * 0.2 + 0.15;
          } else {
            particle.alpha = Math.random() * 0.25 + 0.25;
          }
          
          particle.x = Math.random() * app.screen.width;
          particle.y = Math.random() * app.screen.height;
          
          const baseSpeed = 0.8 + (size / 2.5) * 1.2;
          
          const particleUpdate = (ticker: PIXI.Ticker) => {
            if (!particle.destroyed) {
              const normalizedDelta = ticker.deltaTime / 16.67;
              particle.y += baseSpeed * normalizedDelta;
              particle.x += Math.sin(particle.y * 0.01) * 0.3 * normalizedDelta;
              
              if (particle.y > app.screen.height) {
                particle.y = -10;
                particle.x = Math.random() * app.screen.width;
              }
              
              if (particle.x > app.screen.width) {
                particle.x = 0;
              } else if (particle.x < 0) {
                particle.x = app.screen.width;
              }
            }
          };
          
          app.ticker.add(particleUpdate);
          particleUpdaters.push(particleUpdate);
          particlesContainer.addChild(particle);
        }
      }
      
      // Create snow particles
      if (hasSnow) {
        const snowCount = Math.floor(baseCount * settings.snowIntensity);
        for (let i = 0; i < snowCount; i++) {
          const particle = new PIXI.Graphics();
          const size = Math.random() * 3 + 1;
          particle.circle(0, 0, size);
          particle.fill(0xffffff);
          particle.alpha = Math.random() * 0.4 + 0.4;
          
          particle.x = Math.random() * app.screen.width;
          particle.y = Math.random() * app.screen.height;
          
          const baseSpeed = 0.8 + (size / 3) * 1.2;
          
          const particleUpdate = (ticker: PIXI.Ticker) => {
            if (!particle.destroyed) {
              const normalizedDelta = ticker.deltaTime / 16.67;
              particle.y += baseSpeed * normalizedDelta;
              particle.x += Math.sin(particle.y * 0.01) * 1.5 * normalizedDelta;
              
              if (particle.y > app.screen.height) {
                particle.y = -10;
                particle.x = Math.random() * app.screen.width;
              }
              
              if (particle.x > app.screen.width) {
                particle.x = 0;
              } else if (particle.x < 0) {
                particle.x = app.screen.width;
              }
            }
          };
          
          app.ticker.add(particleUpdate);
          particleUpdaters.push(particleUpdate);
          particlesContainer.addChild(particle);
        }
      }
      
      // Create sparkles
      if (hasSparkles) {
        const sparkleCount = Math.floor(baseCount * settings.sparklesIntensity);
        for (let i = 0; i < sparkleCount; i++) {
          const particle = new PIXI.Graphics();
          const size = Math.random() * 1.5 + 0.5;
          particle.circle(0, 0, size);
          particle.fill(0xfffacd);
          particle.alpha = Math.random() * 0.6 + 0.4;
          
          particle.x = Math.random() * app.screen.width;
          particle.y = Math.random() * app.screen.height;
          
          const baseSpeed = 0.3 + Math.random() * 0.5;
          const particleIndex = i;
          
          const particleUpdate = (ticker: PIXI.Ticker) => {
            if (!particle.destroyed) {
              const normalizedDelta = ticker.deltaTime / 16.67;
              particle.y += baseSpeed * normalizedDelta;
              particle.x += Math.sin(particle.y * 0.01) * 0.2 * normalizedDelta;
              
              particle.alpha = 0.4 + Math.sin(ticker.lastTime * 0.01 + particleIndex) * 0.3;
              
              if (particle.y > app.screen.height) {
                particle.y = -10;
                particle.x = Math.random() * app.screen.width;
              }
              
              if (particle.x > app.screen.width) {
                particle.x = 0;
              } else if (particle.x < 0) {
                particle.x = app.screen.width;
              }
            }
          };
          
          app.ticker.add(particleUpdate);
          particleUpdaters.push(particleUpdate);
          particlesContainer.addChild(particle);
        }
      }
      
      (particlesContainer as any).particleUpdaters = particleUpdaters;
      effectsLayer.addChild(particlesContainer);
    }
    
    // Recreate haze with new intensity
    if (settings.hazeIntensity && settings.hazeIntensity > 0) {
      try {
        hazeRef.current = createHaze(app.screen.width, app.screen.height);
        hazeRef.current.alpha = Math.min(settings.hazeIntensity, 1.0);
        effectsLayer.addChild(hazeRef.current);
      } catch (error) {
        console.error('Error creating haze:', error);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.dustIntensity, settings.snowIntensity, settings.sparklesIntensity, settings.hazeIntensity]);

  return (
    <div 
      ref={canvasRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        display: 'block',
        visibility: 'visible',
        opacity: 1,
        position: 'relative',
        backgroundColor: '#000000',
        minHeight: '200px'
      }} 
    />
  );
};

export default forwardRef(PixiCanvas);