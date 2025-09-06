// Effect Presets System for PIXI.js Video Effects App
// Defines sophisticated preset configurations for different visual styles

export interface EffectPreset {
  id: string;
  name: string;
  description: string;
  effects: {
    // Basic effects
    grain: boolean;
    lightLeak: boolean;
    
    // Preset-specific effects
    enableSimpleParticles: boolean;
    particleType?: 'dust' | 'snow' | 'sparkles' | 'haze';
    
    enableLensFlares: boolean;
    lensFlareConfig?: LensFlareConfig;
  };
}

export interface LensFlareConfig {
  // Main flare settings
  primaryFlareCount: number;
  primaryFlareSize: number;
  primaryFlareOpacity: number;
  
  // Rainbow ring settings
  rainbowRings: boolean;
  rainbowRingCount: number;
  rainbowRingSize: number;
  
  // Light streak settings
  lightStreaks: boolean;
  streakCount: number;
  streakLength: number;
  streakWidth: number;
  
  // Bokeh settings
  bokehParticles: boolean;
  bokehCount: number;
  bokehSizeRange: [number, number];
  
  // Animation settings
  movement: {
    enabled: boolean;
    speed: number;
    amplitude: number;
  };
  
  // Chromatic aberration
  chromaticAberration: boolean;
  aberrationStrength: number;
  
  // Color settings
  flareColors: string[];
  temperature: number; // Color temperature (warm/cool)
}

// Default Preset - Simple particles with basic effects
export const DEFAULT_PRESET: EffectPreset = {
  id: 'default',
  name: 'Default',
  description: 'Simple particle effects with grain and light leak',
  effects: {
    grain: true,
    lightLeak: true,
    enableSimpleParticles: true,
    particleType: 'dust',
    enableLensFlares: false
  }
};

// Lens Leak Preset - Sophisticated lens flare effects
export const LENS_LEAK_PRESET: EffectPreset = {
  id: 'lens-leak',
  name: 'Lens Leaks',
  description: 'Cinematic lens flares with rainbow effects and chromatic aberration',
  effects: {
    grain: true,
    lightLeak: true, // Keep basic light leak as backup
    enableSimpleParticles: true, // Keep some particles for atmosphere
    particleType: 'dust',
    enableLensFlares: true,
    lensFlareConfig: {
      // Primary flares
      primaryFlareCount: 3,
      primaryFlareSize: 200,
      primaryFlareOpacity: 0.6,
      
      // Rainbow rings
      rainbowRings: true,
      rainbowRingCount: 5,
      rainbowRingSize: 150,
      
      // Light streaks
      lightStreaks: true,
      streakCount: 8,
      streakLength: 400,
      streakWidth: 3,
      
      // Bokeh particles
      bokehParticles: true,
      bokehCount: 25,
      bokehSizeRange: [5, 25],
      
      // Animation
      movement: {
        enabled: true,
        speed: 0.5,
        amplitude: 50
      },
      
      // Chromatic aberration
      chromaticAberration: true,
      aberrationStrength: 2.0,
      
      // Colors
      flareColors: [
        '#FF6B6B', // Warm red
        '#4ECDC4', // Teal
        '#45B7D1', // Blue
        '#96CEB4', // Green
        '#FECA57', // Golden
        '#FF9FF3', // Pink
        '#54A0FF'  // Light blue
      ],
      temperature: 6500 // Slightly cool
    }
  }
};

// Future preset examples (structure ready for expansion)
export const VINTAGE_PRESET: EffectPreset = {
  id: 'vintage',
  name: 'Vintage Film',
  description: 'Classic film grain with warm color grading',
  effects: {
    grain: true,
    lightLeak: true,
    enableSimpleParticles: true,
    particleType: 'dust',
    enableLensFlares: false
  }
};

export const ETHEREAL_PRESET: EffectPreset = {
  id: 'ethereal',
  name: 'Ethereal',
  description: 'Dreamy particles with soft lighting',
  effects: {
    grain: false,
    lightLeak: true,
    enableSimpleParticles: true,
    particleType: 'sparkles',
    enableLensFlares: false
  }
};

// Master preset registry
export const EFFECT_PRESETS: EffectPreset[] = [
  DEFAULT_PRESET,
  LENS_LEAK_PRESET,
  VINTAGE_PRESET,
  ETHEREAL_PRESET
];

// Helper functions
export const getPresetById = (id: string): EffectPreset | undefined => {
  return EFFECT_PRESETS.find(preset => preset.id === id);
};

export const getPresetNames = (): { id: string; name: string }[] => {
  return EFFECT_PRESETS.map(preset => ({
    id: preset.id,
    name: preset.name
  }));
};

// Convert settings object to preset configuration
export const getActivePreset = (settings: any): EffectPreset => {
  const preset = getPresetById(settings.preset);
  if (!preset) return DEFAULT_PRESET;
  
  // Merge preset effects with current settings, allowing settings to override preset values
  const mergedEffects = {
    ...preset.effects,
    // Allow settings to override individual effect properties
    grain: settings.grain !== undefined ? settings.grain : preset.effects.grain,
    lightLeak: settings.lightLeak !== undefined ? settings.lightLeak : preset.effects.lightLeak,
    enableSimpleParticles: settings.enableSimpleParticles !== undefined ? settings.enableSimpleParticles : preset.effects.enableSimpleParticles,
    particleType: settings.particleType !== undefined ? settings.particleType : preset.effects.particleType,
    enableLensFlares: settings.enableLensFlares !== undefined ? settings.enableLensFlares : preset.effects.enableLensFlares,
  };
  
  return {
    ...preset,
    effects: mergedEffects
  };
};