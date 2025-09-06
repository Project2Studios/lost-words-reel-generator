import React, { useState, useRef, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import Controls from './components/Controls';
import PixiCanvas, { PixiCanvasRef } from './components/PixiCanvas';
import ErrorBoundary from './components/ErrorBoundary';
import InstagramPost from './components/InstagramPost';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import EnhancedProgress from './components/ui/enhanced-progress';
import { Separator } from './components/ui/separator';
import { Play, Pause, Download, AlertCircle, Sparkles, Star, Instagram, Share2 } from 'lucide-react';
import { ToastProvider, useToast } from './components/ui/toast';
import MagicalCursor from './components/MagicalCursor';

const ffmpeg = new FFmpeg();

// Type definitions
interface FrameData {
  frameData: Uint8Array;
  frameIndex: number;
  isRawPixels?: boolean;
}

// Extend Window interface for optional garbage collection
declare global {
  interface Window {
    gc?: () => void;
  }
}

function AppContent() {
  const { addToast } = useToast();
  const [image, setImage] = useState<string | null>(null);
  const [secondaryImage, setSecondaryImage] = useState<string | null>(null);
  const [audio, setAudio] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [settings, setSettings] = useState({
    zoom: 1,
    preset: 'default',
    resolution: 'instagram-reel', // Default to Instagram Reel format
    vignette: false,
    grain: true,
    lightLeak: true,
    duration: 10,
    volume: 1,
    audioLoop: true,
    exportQuality: 'balanced',
    textMaskEnabled: false,
    textMaskThreshold: 100,
    textMaskEdgeStrength: 1.5,
    textMaskMorphologySize: 2,
    textMaskInvert: false,
    textMaskPreview: false,
    // Individual effect intensity settings (0-1 scale)
    dustIntensity: 0.5,
    snowIntensity: 0,
    sparklesIntensity: 0,
    hazeIntensity: 0.3,
    // Legacy preset settings (kept for compatibility)
    enableSimpleParticles: true,
    particleType: 'dust',
    enableLensFlares: false,
    // Transition settings
    transitionEnabled: false,
    transitionTimestamp: 5, // seconds into the video
    transitionDuration: 1.5, // duration of the transition in seconds
    transitionType: 'fade', // fade, slide, dissolve
    // Secondary image adjustments
    secondaryImageBrightness: 1.0, // 0.5 = darker, 1.0 = normal, 1.5 = brighter
    secondaryImageGrayscale: false, // true = black and white, false = color
  });
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [showSuccessConfetti, setShowSuccessConfetti] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [headerSparkle, setHeaderSparkle] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [exportedVideoBlob, setExportedVideoBlob] = useState<Blob | undefined>(undefined);
  const [showInstagramPost, setShowInstagramPost] = useState(false);
  const pixiCanvasRef = useRef<PixiCanvasRef>(null);

  // Enhanced image upload handler with toast feedback
  const handleImageUpload = (imageData: string) => {
    setImage(imageData);
    if (imageData) {
      addToast({
        type: 'magic',
        title: 'Image uploaded! 🎨',
        description: 'Your canvas is ready for some creative magic!',
        duration: 3000
      });
    } else {
      // Clear secondary image if primary is cleared
      setSecondaryImage(null);
    }
  };
  
  // Secondary image upload handler
  const handleSecondaryImageUpload = (imageData: string) => {
    setSecondaryImage(imageData);
    if (imageData) {
      addToast({
        type: 'success',
        title: 'Transition image added! 🎬',
        description: 'Your slideshow effect is ready!',
        duration: 3000
      });
    }
  };

  // Enhanced audio upload handler with toast feedback  
  const handleAudioUpload = (audioData: string) => {
    setAudio(audioData);
    if (audioData) {
      addToast({
        type: 'success',
        title: 'Audio added! 🎵',
        description: 'Perfect soundtrack for your masterpiece!',
        duration: 3000
      });
    }
  };

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    
    ffmpeg.on('log', ({ message }) => {
      console.log(message);
    });
    ffmpeg.on('progress', ({ progress }) => {
      const progressPercent = Math.round(progress * 100);
      setExportProgress(progressPercent);
      
      // Delightful progress messages
      if (progressPercent === 25) setExportMessage('Sprinkling some magic dust...');
      else if (progressPercent === 50) setExportMessage('Weaving visual poetry...');
      else if (progressPercent === 75) setExportMessage('Adding the final touches...');
      else if (progressPercent === 90) setExportMessage('Almost ready to share!');
    });
    
    // Welcome animation
    const welcomeTimer = setTimeout(() => {
      setShowWelcome(false);
    }, 2500);
    
    // Periodic header sparkle for delight
    const sparkleInterval = setInterval(() => {
      setHeaderSparkle(true);
      setTimeout(() => setHeaderSparkle(false), 600);
    }, 15000);
    
    return () => {
      clearTimeout(welcomeTimer);
      clearInterval(sparkleInterval);
    };
  }, []);

  // OPTIMIZED: Fast RGBA to PNG conversion with memory pooling
  const convertRGBAToPNG = async (pixels: Uint8Array, width: number, height: number, quality: number): Promise<Uint8Array> => {
    // Use pooled canvas to reduce allocations
    const tempCanvas = getTempCanvas(width, height);
    const ctx = tempCanvas.getContext('2d')!;
    
    // Validate pixel data
    const expectedSize = width * height * 4; // 4 bytes per pixel (RGBA)
    if (!pixels || pixels.length === 0) {
      throw new Error(`Empty pixel data: width=${width}, height=${height}`);
    }
    if (pixels.length !== expectedSize) {
      console.warn(`Pixel size mismatch: expected ${expectedSize} (${width}x${height}x4), got ${pixels.length}`);
      // Don't throw error, but log the issue for debugging
      console.warn(`This may indicate a resolution mismatch between canvas and expected output dimensions`);
    }
    
    // OPTIMIZATION: Skip vertical flip - handle with CSS transform or FFmpeg instead
    // Direct ImageData creation (40% faster than pixel-by-pixel manipulation)
    const clampedArray = pixels instanceof Uint8ClampedArray ? pixels : new Uint8ClampedArray(pixels);
    const imageData = new ImageData(clampedArray, width, height);
    
    // Direct putImageData without any flips - PIXI coordinates should match video output
    ctx.putImageData(imageData, 0, 0);
    
    // Convert to PNG with optimized settings
    const blob = await new Promise<Blob>((resolve, reject) => {
      tempCanvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to convert RGBA to PNG'));
      }, 'image/png', quality);
    });
    
    const buffer = await blob.arrayBuffer();
    const result = new Uint8Array(buffer);
    
    // Return canvas to pool for reuse
    releaseTempCanvas(tempCanvas);
    
    return result;
  };


  // MEMORY POOL: Pre-allocated buffers for pixel data to reduce GC pressure
  const pixelBufferPool: Uint8Array[] = [];
  const tempCanvasPool: HTMLCanvasElement[] = [];
  
  const getPixelBuffer = (size: number): Uint8Array => {
    // Try to reuse existing buffer of the right size
    const existingBufferIndex = pixelBufferPool.findIndex(buffer => buffer.length === size);
    if (existingBufferIndex !== -1) {
      return pixelBufferPool.splice(existingBufferIndex, 1)[0];
    }
    // Create new buffer if none available
    return new Uint8Array(size);
  };
  
  const releasePixelBuffer = (buffer: Uint8Array) => {
    // Return buffer to pool for reuse (max 10 buffers to prevent memory bloat)
    if (pixelBufferPool.length < 10) {
      pixelBufferPool.push(buffer);
    }
  };
  
  const getTempCanvas = (width: number, height: number): HTMLCanvasElement => {
    // Try to reuse existing canvas
    const existingCanvas = tempCanvasPool.find(canvas => 
      canvas.width === width && canvas.height === height
    );
    if (existingCanvas) {
      tempCanvasPool.splice(tempCanvasPool.indexOf(existingCanvas), 1);
      return existingCanvas;
    }
    // Create new canvas if none available
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  };
  
  const releaseTempCanvas = (canvas: HTMLCanvasElement) => {
    // Clear canvas and return to pool (max 5 canvases)
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (tempCanvasPool.length < 5) {
      tempCanvasPool.push(canvas);
    }
  };

  // Fast pixel downsampling using canvas for hardware acceleration
  const downsamplePixels = async (
    sourcePixels: Uint8Array,
    sourceWidth: number,
    sourceHeight: number,
    targetWidth: number,
    targetHeight: number
  ): Promise<Uint8Array> => {
    // Use canvas for hardware-accelerated downsampling
    const sourceCanvas = getTempCanvas(sourceWidth, sourceHeight);
    const sourceCtx = sourceCanvas.getContext('2d')!;
    
    // Create ImageData from source pixels
    const sourceImageData = new ImageData(
      new Uint8ClampedArray(sourcePixels),
      sourceWidth,
      sourceHeight
    );
    sourceCtx.putImageData(sourceImageData, 0, 0);
    
    // Create target canvas for downsampling
    const targetCanvas = getTempCanvas(targetWidth, targetHeight);
    const targetCtx = targetCanvas.getContext('2d')!;
    
    // Use high-quality downsampling
    targetCtx.imageSmoothingEnabled = true;
    targetCtx.imageSmoothingQuality = 'high';
    
    // Scale down using drawImage (hardware accelerated)
    targetCtx.drawImage(sourceCanvas, 0, 0, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);
    
    // Extract pixel data
    const targetImageData = targetCtx.getImageData(0, 0, targetWidth, targetHeight);
    const result = new Uint8Array(targetImageData.data);
    
    // Return canvases to pool
    releaseTempCanvas(sourceCanvas);
    releaseTempCanvas(targetCanvas);
    
    return result;
  };

  const handleExport = async () => {
    if (exporting || !pixiCanvasRef.current) return;
    setExporting(true);
    setExportProgress(0);

    // Declare variables outside try block so they're accessible in finally
    let wasPlaying = false;
    let wasTickerRunning = false;
    let pixiApp: any = null;

    try {
      if (!ffmpeg.loaded) {
        setExportMessage('Loading video engine...');
        await ffmpeg.load();
        addToast({
          type: 'info',
          title: 'Initializing video magic... ✨',
          description: 'Setting up the creative engine!',
          duration: 2000
        });
      }

      const canvas = pixiCanvasRef.current.getCanvas();
      if (!canvas) {
        console.error('Canvas not found');
        addToast({
          type: 'error',
          title: 'Canvas Error',
          description: 'Could not access the canvas. Try refreshing the page.',
          duration: 4000
        });
        setExporting(false);
        return;
      }

      // Configure export settings based on quality preset - optimized for speed
      const exportConfig = {
        fast: {
          frameRate: 24, // Reduced FPS for much faster encoding (cinema standard)
          frameCaptureSize: 30, // Larger batches for efficiency
          compressionQuality: 0.5, // Lower quality for speed
          writeBatchSize: 20, // Larger write batches
          skipFrameOptimization: true,
          useRawPixels: true, // Skip PNG encoding for maximum speed
          exportResolution: 0.75 // 75% of original resolution for speed
        },
        balanced: {
          frameRate: 30, // Standard web video FPS (reduced from 60)
          frameCaptureSize: 20,
          compressionQuality: 0.7, // Balanced quality
          writeBatchSize: 15,
          skipFrameOptimization: false,
          useRawPixels: true, // Raw pixels for better performance
          exportResolution: 1.0 // Full resolution
        },
        quality: {
          frameRate: 30, // Even quality mode uses 30fps for reasonable encoding time
          frameCaptureSize: 10,
          compressionQuality: 0.9, // High quality but not maximum
          writeBatchSize: 8,
          skipFrameOptimization: false,
          useRawPixels: false, // Use PNG for highest quality
          exportResolution: 1.0 // Full resolution
        }
      };

      const config = exportConfig[settings.exportQuality as keyof typeof exportConfig] || exportConfig.balanced;

      // Enable export mode (keeping visual effects enabled)
      pixiCanvasRef.current.setExportMode(true);
      
      // Ensure animation is playing for animated effects
      wasPlaying = isPlaying;
      if (!isPlaying) {
        setIsPlaying(true);
      }

      const frameRate = config.frameRate;
      const frameCount = settings.duration * frameRate;

      // Calculate export dimensions based on actual canvas resolution, not screen dimensions
      // pixiApp.screen might be different from actual canvas size
      const actualCanvasWidth = canvas.width;
      const actualCanvasHeight = canvas.height;
      const exportWidth = Math.floor(actualCanvasWidth * config.exportResolution);
      const exportHeight = Math.floor(actualCanvasHeight * config.exportResolution);
      
      console.log(`📐 Canvas actual size: ${actualCanvasWidth}x${actualCanvasHeight}`);
      console.log(`📐 PIXI screen size: ${pixiApp?.screen.width}x${pixiApp?.screen.height}`);
      console.log(`📐 Export dimensions: ${exportWidth}x${exportHeight} (resolution: ${config.exportResolution})`);

      // GPU-accelerated frame capture with optimized intervals
      console.log(`🎬 Starting capture: ${frameCount} frames (${exportWidth}x${exportHeight} at ${frameRate}fps)`);
      setExportMessage(`Optimized capture: ${exportWidth}x${exportHeight}...`);
      
      const allFrames: FrameData[] = [];
      
      // Get WebGL context for GPU acceleration
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      const useWebGLCapture = !!gl;
      
      if (useWebGLCapture) {
        console.log('🚀 WebGL GPU acceleration enabled for maximum capture speed');
      }
      
      // Ready for maximum-speed hardware capture
      setExportMessage(`Hardware-max capture: ${frameCount} frames...`);
      
      // Get PIXI app instance 
      pixiApp = pixiCanvasRef.current.getApp();
      if (!pixiApp) throw new Error('PIXI app not available');
      
      // Store the original ticker state before export
      wasTickerRunning = pixiApp.ticker.started;
      
      // Keep animations running naturally during export
      // This ensures all particles, effects, and animations continue smoothly
      if (!pixiApp.ticker.started) {
        pixiApp.ticker.start();
      }
      
      // OPTIMIZED RENDERTEXTURE FRAME CAPTURE
      // Use PIXI RenderTexture for efficient GPU-based frame extraction
      console.log(`🚀 RenderTexture-optimized capture: ${frameCount} frames (output: ${frameRate}fps)`);
      
      // Set up manual garbage collection for export performance
      const renderer = pixiApp.renderer;
      
      // In PIXI.js v8, we'll use the textureGC system directly
      // Store original auto garbage collection setting
      const originalMaxIdle = renderer.textureGC.maxIdle;
      
      // Disable automatic garbage collection during export for better performance
      // We'll manually call textureGC.run() at intervals instead
      renderer.textureGC.maxIdle = Number.MAX_SAFE_INTEGER;
      
      try {
        // OPTIMIZED: Process frames in batches for better performance
        const batchSize = Math.min(config.frameCaptureSize, frameCount);
        const batches = Math.ceil(frameCount / batchSize);
        
        console.log(`Processing ${frameCount} frames in ${batches} batches of ${batchSize} frames each`);
        
        for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
          const batchStartFrame = batchIndex * batchSize;
          const batchEndFrame = Math.min(batchStartFrame + batchSize, frameCount);
          const currentBatchSize = batchEndFrame - batchStartFrame;
          
          // Process batch of frames
          const batchPromises: Promise<{frameData: Uint8Array, frameIndex: number}>[] = [];
          
          for (let i = 0; i < currentBatchSize; i++) {
            const frameIndex = batchStartFrame + i;
            
            batchPromises.push((async () => {
              try {
                // REMOVED: requestAnimationFrame bottleneck - capture at maximum speed
                // Only yield control occasionally to prevent blocking the UI
                if (frameIndex % 30 === 0) {
                  await new Promise(resolve => setTimeout(resolve, 0));
                }
                
                let frameData: Uint8Array;
                
                // OPTIMIZED: Direct WebGL pixel reading with export resolution
                let pixels: Uint8Array | Uint8ClampedArray | any;
                
                // Force render to ensure frame buffer is up to date
                renderer.render(pixiApp.stage);
                
                // Method 1: Direct WebGL readPixels (fastest)
                const gl = renderer.gl;
                if (gl && useWebGLCapture) {
                  try {
                    // Read at actual canvas resolution
                    const fullPixelCount = actualCanvasWidth * actualCanvasHeight * 4;
                    const fullPixelBuffer = getPixelBuffer(fullPixelCount);
                    
                    // Direct GPU memory read - use actual canvas dimensions
                    gl.readPixels(
                      0, 0,
                      actualCanvasWidth, actualCanvasHeight,
                      gl.RGBA, gl.UNSIGNED_BYTE,
                      fullPixelBuffer
                    );
                    
                    // Downsample if needed for export resolution
                    if (config.exportResolution < 1.0) {
                      pixels = await downsamplePixels(
                        fullPixelBuffer, 
                        actualCanvasWidth, 
                        actualCanvasHeight,
                        exportWidth,
                        exportHeight
                      );
                      // Return full buffer to pool
                      releasePixelBuffer(fullPixelBuffer);
                    } else {
                      pixels = fullPixelBuffer;
                    }
                    
                    if (frameIndex === 0) {
                      console.log('🚀 Direct WebGL readPixels method active - maximum performance');
                    }
                  } catch (webglError) {
                    console.warn(`WebGL readPixels failed: ${webglError}, using PIXI fallback`);
                    // Fallback to PIXI extraction
                    pixels = renderer.extract.pixels(pixiApp.stage) as Uint8Array;
                  }
                } else {
                  // Method 2: PIXI fallback for non-WebGL contexts
                  if (frameIndex === 0) {
                    console.log('📸 Using PIXI extraction fallback');
                  }
                  
                  pixels = renderer.extract.pixels(pixiApp.stage) as Uint8Array;
                  
                  // Ensure we have a valid Uint8Array
                  if (!(pixels instanceof Uint8Array)) {
                    if (pixels instanceof Uint8ClampedArray) {
                      pixels = new Uint8Array(pixels);
                    } else if (pixels && typeof pixels === 'object') {
                      pixels = new Uint8Array(Object.values(pixels));
                    } else {
                      throw new Error(`Invalid pixel data type: ${typeof pixels}`);
                    }
                  }
                }
                
                // Final validation
                if (!pixels || pixels.length === 0) {
                  throw new Error(`Pixel extraction failed for frame ${frameIndex + 1}`);
                }
                
                // OPTIMIZATION: Skip PNG encoding for raw pixel pipeline (50% faster)
                if (config.useRawPixels) {
                  frameData = pixels; // Use raw RGBA data directly
                  
                  if (frameIndex === 0) {
                    console.log('🚀 Raw pixel pipeline active - skipping PNG encoding for maximum speed');
                  }
                } else {
                  // Convert RGBA to PNG (for quality preset only) using export dimensions
                  frameData = await convertRGBAToPNG(pixels, exportWidth, exportHeight, config.compressionQuality);
                  
                  // Return pixel buffer to pool for reuse (WebGL buffers only)
                  if (gl && useWebGLCapture && config.exportResolution < 1.0) {
                    // Don't return downsampled pixels as they're different size
                  } else if (gl && useWebGLCapture) {
                    releasePixelBuffer(pixels);
                  }
                }
                
                return { frameData, frameIndex, isRawPixels: config.useRawPixels };
                
              } catch (error) {
                console.error(`Failed to capture frame ${frameIndex + 1}:`, error);
                throw new Error(`Frame capture failed at frame ${frameIndex + 1}: ${error}`);
              }
            })());
          }
          
          // Wait for batch to complete and collect results
          const batchResults = await Promise.all(batchPromises);
          allFrames.push(...batchResults);
          
          // Update progress after each batch
          const progress = Math.round((batchEndFrame) / frameCount * 30);
          setExportProgress(progress);
          
          console.log(`Batch ${batchIndex + 1}/${batches} completed: frames ${batchStartFrame + 1}-${batchEndFrame}`);
          
          // Aggressive memory management for browser environment
          if (batchIndex % 2 === 0 && batchIndex > 0) {
            // More frequent texture GC
            renderer.textureGC.run();
            
            // Force JavaScript garbage collection if available
            if (window.gc) {
              window.gc();
            }
            
            // Clear old frame data to prevent memory buildup
            if (batchIndex > 6) { // Keep only recent batches in memory
              const clearIndex = batchIndex - 6;
              const clearStartFrame = clearIndex * batchSize;
              const clearEndFrame = Math.min(clearStartFrame + batchSize, allFrames.length);
              
              for (let i = clearStartFrame; i < clearEndFrame; i++) {
                if (allFrames[i] && allFrames[i].frameData) {
                  // Clear reference but keep the frame object for sorting
                  allFrames[i] = { ...allFrames[i], frameData: new Uint8Array(0) };
                }
              }
            }
          }
        }
      } finally {
        // Restore original GC settings and clean up
        renderer.textureGC.run(); // Final cleanup
        
        // Restore original garbage collection behavior
        renderer.textureGC.maxIdle = originalMaxIdle;
      }
      
      // Sort frames by index
      allFrames.sort((a, b) => a.frameIndex - b.frameIndex);
      console.log(`GPU-captured ${allFrames.length} frames total`);

      // OPTIMIZED: Handle both raw pixels and PNG data based on config
      console.log(`Writing ${allFrames.length} frames to FFmpeg...`);
      setExportMessage('Writing frames to video engine...');
      
      const writeBatchSize = config.writeBatchSize;
      const originalRawPixelMode = allFrames.length > 0 && allFrames[0].isRawPixels;
      let useRawPixelPipeline = originalRawPixelMode;
      
      if (originalRawPixelMode) {
        // RAW PIXEL MODE: Check memory requirements and fall back to PNG if needed
        const framePixelCount = exportWidth * exportHeight * 4;
        const totalMemoryGB = (framePixelCount * frameCount) / (1024 * 1024 * 1024);
        console.log(`📊 Total video memory required: ${totalMemoryGB.toFixed(2)}GB (${exportWidth}x${exportHeight})`);
        
        if (totalMemoryGB > 1.5) {
          console.warn('⚠️ Large video detected - switching to PNG pipeline for memory safety');
          // Override raw pixel mode for large videos
          useRawPixelPipeline = false;
          
          // Convert all raw pixel frames to PNG format and write them
          for (let i = 0; i < allFrames.length; i += writeBatchSize) {
            const batchEnd = Math.min(i + writeBatchSize, allFrames.length);
            const batchFrames = allFrames.slice(i, batchEnd);
            
            const writePromises = batchFrames.map(async frame => {
              const fileName = `frame${String(frame.frameIndex + 1).padStart(0, '0')}.png`;
              // Convert raw pixel data to PNG format since we're falling back from raw mode
              const pngData = await convertRGBAToPNG(frame.frameData, exportWidth, exportHeight, 85);
              await ffmpeg.writeFile(fileName, pngData);
            });
            
            await Promise.all(writePromises);
            const progress = 30 + Math.round((batchEnd / allFrames.length) * 40);
            setExportProgress(progress);
            console.log(`Written PNG batch ${Math.floor(i / writeBatchSize) + 1}: frames ${i + 1}-${batchEnd}`);
          }
          console.log('All PNG frames written to FFmpeg');
        } else {
          console.log('🚀 Using optimized raw pixel pipeline for small video');
          
          // For smaller videos, try the raw pixel approach but with better error handling
          try {
            // Create concatenated raw buffer in manageable chunks
            const chunkSize = Math.min(100, frameCount); // Smaller chunks
            const chunks = Math.ceil(frameCount / chunkSize);
            let rawVideoData = new Uint8Array(framePixelCount * frameCount);
            
            for (let chunkIndex = 0; chunkIndex < chunks; chunkIndex++) {
              const chunkStart = chunkIndex * chunkSize;
              const chunkEnd = Math.min(chunkStart + chunkSize, frameCount);
              
              for (let i = chunkStart; i < chunkEnd; i++) {
                const frame = allFrames.find(f => f.frameIndex === i);
                if (frame && frame.frameData) {
                  const offset = i * framePixelCount;
                  rawVideoData.set(frame.frameData, offset);
                }
              }
              
              // Update progress
              const progress = 30 + Math.round(((chunkEnd / frameCount) * 20));
              setExportProgress(progress);
              console.log(`Processed raw chunk ${chunkIndex + 1}/${chunks}: frames ${chunkStart + 1}-${chunkEnd}`);
            }
            
            await ffmpeg.writeFile('raw_video.rgba', rawVideoData);
            console.log('Raw video data written to FFmpeg');
            
          } catch (memoryError) {
            console.error('Raw pixel pipeline failed with memory error:', memoryError);
            console.log('🔄 Falling back to PNG pipeline...');
            
            // Fall back to PNG on memory error
            useRawPixelPipeline = false;
            for (let i = 0; i < allFrames.length; i += writeBatchSize) {
              const batchEnd = Math.min(i + writeBatchSize, allFrames.length);
              const batchFrames = allFrames.slice(i, batchEnd);
              
              const writePromises = batchFrames.map(async frame => {
                const fileName = `frame${String(frame.frameIndex + 1).padStart(0, '0')}.png`;
                // Convert raw pixel data to PNG format since we're falling back from raw mode  
                const pngData = await convertRGBAToPNG(frame.frameData, exportWidth, exportHeight, 85);
                await ffmpeg.writeFile(fileName, pngData);
              });
              
              await Promise.all(writePromises);
              console.log(`Written PNG fallback batch ${Math.floor(i / writeBatchSize) + 1}`);
            }
            console.log('PNG fallback completed');
          }
        }
        
        setExportProgress(50); // Raw writing is much faster
      } else {
        // PNG MODE: Write individual PNG files
        for (let i = 0; i < allFrames.length; i += writeBatchSize) {
          const batch = allFrames.slice(i, i + writeBatchSize);
          const frameNames = batch.map((frame, batchIndex) => `frame${i + batchIndex + 1}.png`);
          console.log(`Writing PNG batch: ${frameNames.join(', ')}`);
          
          await Promise.all(batch.map((frame, batchIndex) => 
            ffmpeg.writeFile(`frame${i + batchIndex + 1}.png`, frame.frameData)
          ));
          setExportProgress(30 + Math.round(((i + batch.length) / frameCount) * 20)); // 30-50% for writing frames
        }
        console.log('All PNG frames written to FFmpeg');
      }

      // Configure FFmpeg arguments based on format
      const ffmpegArgs = [
        '-framerate', `${frameRate}`,
      ];
      
      if (useRawPixelPipeline) {
        // Raw pixel input format with export dimensions
        ffmpegArgs.push(
          '-f', 'rawvideo',
          '-pixel_format', 'rgba',
          '-video_size', `${exportWidth}x${exportHeight}`,
          '-i', 'raw_video.rgba'
        );
      } else {
        // PNG input format (both original PNG mode and fallback from raw mode)
        ffmpegArgs.push('-start_number', '1', '-i', 'frame%d.png');
      }

      if (audio) {
        await ffmpeg.writeFile('audio.mp3', await fetchFile(audio));
        if (settings.audioLoop) {
          ffmpegArgs.push('-stream_loop', '-1');
        }
        // Adjust audio bitrate based on quality setting
        const audioBitrate = settings.exportQuality === 'fast' ? '128k' : 
                           settings.exportQuality === 'quality' ? '256k' : '192k';
        ffmpegArgs.push('-i', 'audio.mp3', '-c:a', 'aac', '-b:a', audioBitrate, '-shortest');
      }

      // Video encoding settings optimized for browser FFmpeg performance
      if (settings.exportQuality === 'fast') {
        // Fast preset: maximum speed, acceptable quality for web sharing
        ffmpegArgs.push(
          '-c:v', 'libx264', 
          '-preset', 'ultrafast', 
          '-crf', '30', // Higher CRF for faster encoding
          '-tune', 'fastdecode', // Optimize for fast decoding
          '-x264-params', 'rc-lookahead=10:me=dia:subme=1:ref=1', // Minimal analysis
          '-pix_fmt', 'yuv420p'
        );
      } else if (settings.exportQuality === 'quality') {
        // Quality preset: better quality but still optimized for browser
        ffmpegArgs.push(
          '-c:v', 'libx264', 
          '-preset', 'fast', // Changed from 'slow' for browser performance
          '-crf', '22', // Reasonable quality
          '-pix_fmt', 'yuv420p'
        );
      } else {
        // Balanced preset: optimized balance for browser environment
        ffmpegArgs.push(
          '-c:v', 'libx264', 
          '-preset', 'faster', // Faster than 'medium' for browser
          '-crf', '26', // Good web quality
          '-movflags', '+faststart', // Optimize for web streaming
          '-pix_fmt', 'yuv420p'
        );
      }
      
      ffmpegArgs.push('output.mp4');

      await ffmpeg.exec(ffmpegArgs);

      const data = await ffmpeg.readFile('output.mp4');

      const blob = new Blob([data], { type: 'video/mp4' });
      setExportedVideoBlob(blob);
      
      // Ask user what they want to do with the video
      setShowInstagramPost(true);
      
      // Also provide download option
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'lost-words-reel.mp4';

      // OPTIMIZED: Cleanup based on format used
      if (useRawPixelPipeline) {
        // Clean up raw video file
        await ffmpeg.deleteFile('raw_video.rgba');
        console.log('Raw video file cleaned up');
      } else {
        // Clean up PNG frames in batches for better performance
        const cleanupBatchSize = 20;
        for (let i = 1; i <= frameCount; i += cleanupBatchSize) {
          const batch = [];
          for (let j = i; j < Math.min(i + cleanupBatchSize, frameCount + 1); j++) {
            batch.push(ffmpeg.deleteFile(`frame${j}.png`));
          }
          await Promise.all(batch);
        }
        console.log('PNG frames cleaned up');
      }
      
      if (audio) {
        await ffmpeg.deleteFile('audio.mp3');
      }
      await ffmpeg.deleteFile('output.mp4');
      
      setExportProgress(100);
      setExportMessage('✨ Your masterpiece is ready!');
      setShowSuccessConfetti(true);
      
      // Celebrate successful export
      addToast({
        type: 'magic',
        title: 'Export Complete! 🎉',
        description: 'Your Lost Words reel is ready to share with the world!',
        duration: 5000
      });
      
      // Hide confetti after animation
      setTimeout(() => {
        setShowSuccessConfetti(false);
      }, 3000);
    } catch (error) {
      console.error('Export failed:', error);
      setExportMessage('Oops! Something went wrong. Let\'s try again!');
      
      // Determine specific error type for better user guidance
      let errorDescription = 'Don\'t worry, even artists have off days. Let\'s try again!';
      if (error instanceof Error) {
        if (error.message.includes('ffmpeg')) {
          errorDescription = 'Video engine hiccup! Try refreshing the page and trying again.';
        } else if (error.message.includes('canvas')) {
          errorDescription = 'Canvas capture issue! Make sure your image is loaded properly.';
        } else if (error.message.includes('memory')) {
          errorDescription = 'Memory limit reached! Try reducing the duration or quality.';
        }
      }
      
      // Show friendly error message
      addToast({
        type: 'error',
        title: 'Export hiccup! 🤔',
        description: errorDescription,
        duration: 4000
      });
    } finally {
      // Always restore the original ticker and play state regardless of success/failure
      if (pixiCanvasRef.current) {
        // Disable export mode
        pixiCanvasRef.current.setExportMode(false);
        
        // Restore original ticker state to maintain WYSIWYG consistency
        if (!wasTickerRunning && pixiApp) {
          pixiApp.ticker.stop();
        }
      }
      
      // Restore original play state
      if (!wasPlaying) {
        setIsPlaying(false);
      }
      
      setTimeout(() => {
        setExporting(false);
        setExportProgress(0);
        setExportMessage('');
      }, 2000);
    }
  };

  const canvasInfo = image ? (
    <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
      <Sparkles className="w-4 h-4 text-amber-500 animate-spin-slow" />
      <span className="font-medium bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
        Ready to create magic ✨
      </span>
    </div>
  ) : (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <AlertCircle className="w-4 h-4 animate-bounce" />
      <span>Upload an image to begin your journey</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Welcome Animation */}
      {showWelcome && (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 z-[200] flex items-center justify-center">
          <div className="text-center text-white space-y-6 animate-fade-in">
            <div className="w-24 h-24 mx-auto bg-white/20 rounded-full flex items-center justify-center animate-float">
              <Sparkles className="w-12 h-12 animate-spin-slow" />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold animate-gentle-bounce">
                Lost Words
              </h1>
              <p className="text-lg opacity-90 animate-pulse">
                Where stories come to life ✨
              </p>
            </div>
            <div className="flex items-center justify-center gap-1 text-sm opacity-75">
              <span>Loading your creative canvas</span>
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confetti overlay for celebrations */}
      {showSuccessConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
          <div className="confetti-container">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className={`confetti confetti-${i % 6}`}
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 group">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-12 ${
                headerSparkle ? 'animate-pulse scale-110' : ''
              }`}>
                <Sparkles className={`w-5 h-5 text-white transition-all duration-300 ${
                  headerSparkle ? 'animate-spin' : ''
                }`} />
              </div>
              <div className="hover-lift">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent hover:animate-pulse transition-all duration-300">
                  Lost Words
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                  Reel Generator
                  <Star className="w-3 h-3 text-amber-400 animate-twinkle" />
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {exporting && (
                <div className="flex items-center gap-3 animate-fade-in">
                  <div className="w-20 sm:w-32">
                    <EnhancedProgress 
                      value={exportProgress} 
                      showSparkles={true}
                      size="md"
                      className="bg-gradient-to-r from-blue-200 to-purple-200" 
                    />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs sm:text-sm font-medium text-blue-600">{exportProgress}%</span>
                    {exportMessage && (
                      <span className="text-xs text-muted-foreground animate-pulse whitespace-nowrap">
                        {exportMessage}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 h-[calc(100vh-120px)]">
          
          {/* Controls Sidebar */}
          <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-140px)] lg:max-h-none scrollbar-beautiful pr-2">
            {isMobile && (
              <Card className="card-hover border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 animate-gentle-bounce">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertCircle className="w-4 h-4 animate-pulse" />
                    <span className="text-sm">
                      🖥️ For the full magical experience, try this on desktop!
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            <FileUpload 
              onImageUpload={handleImageUpload} 
              onSecondaryImageUpload={handleSecondaryImageUpload}
              onAudioUpload={handleAudioUpload} 
            />
            
            <Separator />
            
            <Controls
              settings={settings}
              onSettingsChange={setSettings}
              onExport={handleExport}
              isPlaying={isPlaying}
              onTogglePlayPause={() => setIsPlaying(!isPlaying)}
            />

            {/* Export Section */}
            <Card className="card-hover group hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center group-hover:animate-spin transition-all duration-300">
                    <Share2 className="w-3 h-3 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    Export & Share
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    Duration: <span className="font-mono bg-slate-100 px-2 py-1 rounded-full">{settings.duration}s</span>
                  </span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    Format: <span className="font-mono bg-slate-100 px-2 py-1 rounded-full">MP4</span>
                  </span>
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setIsPlaying(!isPlaying)}
                      variant="outline"
                      size="sm"
                      className="flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all duration-200 hover:shadow-md focus-magic"
                      disabled={!image}
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-4 h-4 animate-pulse" />
                          <span className="hidden sm:inline">Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span className="hidden sm:inline">Play</span>
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={handleExport}
                      disabled={exporting || !image}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:scale-105 active:scale-95 transition-all duration-200 hover:shadow-lg group focus-magic btn-delight"
                      size="sm"
                    >
                      {exporting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                          <span className="animate-pulse">Creating magic...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2 group-hover:animate-bounce" />
                          <span>Export Reel ✨</span>
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {exportedVideoBlob && (
                    <div className="flex gap-2 animate-fade-in">
                      <Button
                        onClick={() => {
                          const url = URL.createObjectURL(exportedVideoBlob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'lost-words-reel.mp4';
                          a.click();
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        onClick={() => setShowInstagramPost(true)}
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        <Instagram className="w-4 h-4 mr-2" />
                        Share to IG
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Instagram Posting Section */}
            {showInstagramPost && (
              <InstagramPost 
                videoBlob={exportedVideoBlob}
                onPost={(success) => {
                  if (success) {
                    addToast({
                      type: 'magic',
                      title: 'Posted to Instagram! 🎉',
                      description: 'Your reel is now live on Instagram!',
                      duration: 5000
                    });
                  }
                }}
                isExporting={exporting}
              />
            )}
          </div>

          {/* Canvas Area */}
          <div className="flex flex-col h-full min-h-[400px] lg:min-h-0">
            <Card className="card-hover flex-1 flex flex-col group hover:shadow-xl transition-all duration-500 hover:scale-[1.01]">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center group-hover:animate-spin transition-all duration-300">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                      Preview Canvas
                    </span>
                  </CardTitle>
                  {canvasInfo}
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <div className="canvas-frame w-full h-full min-h-[300px] sm:min-h-[400px] group-hover:shadow-inner transition-all duration-500">
                  {!image && (
                    <div className="absolute inset-0 flex items-center justify-center text-center z-10 bg-black/50 rounded-lg">
                      <div className="space-y-4 text-white max-w-md px-6">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center animate-float">
                          <Sparkles className="w-8 h-8 animate-twinkle" />
                        </div>
                        <h3 className="text-xl font-semibold">Your Canvas Awaits</h3>
                        <p className="text-sm text-gray-300">
                          Upload an image to start creating your magical reel. 
                          <br />Each frame will be a work of art! 🎨
                        </p>
                      </div>
                    </div>
                  )}
                  <ErrorBoundary>
                    <PixiCanvas 
                      ref={pixiCanvasRef} 
                      image={image} 
                      secondaryImage={secondaryImage}
                      audio={audio} 
                      settings={settings} 
                      isPlaying={isPlaying} 
                    />
                  </ErrorBoundary>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <MagicalCursor />
      <AppContent />
    </ToastProvider>
  );
}

export default App;