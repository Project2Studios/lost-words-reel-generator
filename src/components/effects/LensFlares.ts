import * as PIXI from 'pixi.js';

export interface LensFlareSystem {
  container: PIXI.Container;
  update: (deltaTime: number) => void;
  destroy: () => void;
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

export const createLensFlareSystem = (
  width: number, 
  height: number,
  config: LensFlareConfig
): LensFlareSystem => {
  const container = new PIXI.Container();
  const flareElements: PIXI.Container[] = [];
  let animationTime = 0;
  
  // Convert string colors to hex colors
  const hexColors = config.flareColors.map(color => {
    if (color.startsWith('#')) {
      return parseInt(color.slice(1), 16);
    }
    return parseInt(color, 16);
  });
  
  // Create primary flares
  const primaryFlares = createPrimaryFlares(width, height, config.primaryFlareCount, hexColors);
  primaryFlares.forEach(flare => {
    container.addChild(flare);
    flareElements.push(flare);
  });
  
  // Create rainbow rings if enabled
  if (config.rainbowRings) {
    const rainbowRings = createRainbowRings(width, height, config.rainbowRingCount);
    rainbowRings.forEach(ring => {
      container.addChild(ring);
      flareElements.push(ring);
    });
  }
  
  // Create light streaks if enabled
  if (config.lightStreaks) {
    const lightStreaks = createLightStreaks(width, height, config.streakCount);
    lightStreaks.forEach(streak => {
      container.addChild(streak);
      flareElements.push(streak);
    });
  }
  
  // Create bokeh particles if enabled
  if (config.bokehParticles) {
    const bokehParticles = createBokehParticles(width, height, config.bokehCount);
    bokehParticles.forEach(particle => {
      container.addChild(particle);
      flareElements.push(particle);
    });
  }
  
  // Position all elements
  positionFlareElements(flareElements, width, height);
  
  // Apply chromatic aberration effect to container
  if (config.chromaticAberration) {
    const chromaticFilter = createChromaticAberrationFilter(config.aberrationStrength);
    container.filters = [chromaticFilter];
  }

  const update = (deltaTime: number) => {
    if (!config.movement.enabled) return;
    
    animationTime += deltaTime;
    
    // Animate rainbow rings rotation
    container.children.forEach((child, index) => {
      if (child instanceof PIXI.Container && (child as any).isRainbowRing) {
        child.rotation += deltaTime * 0.005 * config.movement.speed * (index % 2 === 0 ? 1 : -1);
      }
    });
    
    // Animate primary flares with subtle movement
    flareElements.forEach((element, index) => {
      if ((element as any).isFlare) {
        const phase = animationTime * 0.001 * config.movement.speed + index * 0.5;
        const amplitude = config.movement.amplitude;
        element.x += Math.sin(phase) * amplitude * deltaTime * 0.01;
        element.y += Math.cos(phase * 0.7) * amplitude * deltaTime * 0.01;
        
        // Subtle alpha pulsing
        const baseAlpha = (element as any).baseAlpha || config.primaryFlareOpacity;
        element.alpha = baseAlpha + Math.sin(phase * 2) * 0.1;
      }
    });
    
    // Animate bokeh particles
    flareElements.forEach((element, index) => {
      if ((element as any).isBokeh) {
        const phase = animationTime * 0.002 * config.movement.speed + index * 0.3;
        const drift = config.movement.amplitude * 0.5;
        element.x += Math.sin(phase) * drift * deltaTime * 0.005;
        element.y += Math.cos(phase * 1.3) * drift * deltaTime * 0.005;
        
        // Keep within bounds
        element.x = Math.max(0, Math.min(width, element.x));
        element.y = Math.max(0, Math.min(height, element.y));
      }
    });
  };
  
  const destroy = () => {
    flareElements.forEach(element => element.destroy());
    container.destroy();
  };

  return { container, update, destroy };
};

const createPrimaryFlares = (width: number, height: number, count: number, colors: number[]): PIXI.Container[] => {
  const flares: PIXI.Container[] = [];
  
  for (let i = 0; i < count; i++) {
    const flareContainer = new PIXI.Container();
    (flareContainer as any).isFlare = true;
    (flareContainer as any).baseAlpha = 0.6 + Math.random() * 0.3;
    
    // Create simple circular flare using Graphics instead of complex gradients
    const flare = new PIXI.Graphics();
    const size = 80 + Math.random() * 100;
    const color = colors[i % colors.length];
    
    // Create multiple concentric circles for gradient effect
    for (let j = 0; j < 5; j++) {
      const radius = size * (1 - j * 0.2);
      const alpha = 0.8 * (1 - j * 0.15);
      flare.circle(0, 0, radius);
      flare.fill({ color, alpha });
    }
    
    flare.blendMode = 'add';
    flareContainer.addChild(flare);
    flares.push(flareContainer);
  }
  
  return flares;
};

const createRainbowRings = (width: number, height: number, count: number): PIXI.Container[] => {
  const rings: PIXI.Container[] = [];
  const colors = [0xff6b9d, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xffa726];
  
  for (let i = 0; i < count; i++) {
    const ringContainer = new PIXI.Container();
    (ringContainer as any).isRainbowRing = true;
    
    // Create simple colored circles instead of complex arcs
    const ring = new PIXI.Graphics();
    const radius = 60 + i * 25;
    const color = colors[i % colors.length];
    
    // Create a simple ring using two circles
    ring.circle(0, 0, radius + 10);
    ring.fill({ color, alpha: 0.3 });
    ring.circle(0, 0, radius);
    ring.cut();
    
    ring.blendMode = 'add';
    ringContainer.addChild(ring);
    rings.push(ringContainer);
  }
  
  return rings;
};

const createLightStreaks = (width: number, height: number, count: number): PIXI.Container[] => {
  const streaks: PIXI.Container[] = [];
  const colors = [0xffffff, 0xff6b9d, 0x4ecdc4, 0xffa726];
  
  for (let i = 0; i < count; i++) {
    const streakContainer = new PIXI.Container();
    (streakContainer as any).isStreak = true;
    
    const streak = new PIXI.Graphics();
    const length = 150 + Math.random() * 100;
    const width_streak = 2 + Math.random() * 4;
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    
    const color = colors[i % colors.length];
    
    // Create elongated streak
    streak.rect(-length/2, -width_streak/2, length, width_streak);
    streak.fill({ color, alpha: 0.7 });
    streak.rotation = angle;
    streak.blendMode = 'add';
    
    streakContainer.addChild(streak);
    streaks.push(streakContainer);
  }
  
  return streaks;
};

const createBokehParticles = (width: number, height: number, count: number): PIXI.Container[] => {
  const particles: PIXI.Container[] = [];
  const colors = [0xff6b9d, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xffa726, 0xff7043];
  
  for (let i = 0; i < count; i++) {
    const particleContainer = new PIXI.Container();
    (particleContainer as any).isBokeh = true;
    
    const particle = new PIXI.Graphics();
    const size = 8 + Math.random() * 16;
    const color = colors[i % colors.length];
    
    particle.circle(0, 0, size);
    particle.fill({ color, alpha: 0.3 + Math.random() * 0.4 });
    particle.blendMode = 'add';
    
    particleContainer.addChild(particle);
    particles.push(particleContainer);
  }
  
  return particles;
};

const positionFlareElements = (elements: PIXI.Container[], width: number, height: number) => {
  // Position flares to create depth and interest
  // Some behind text areas, some at edges, some floating
  
  elements.forEach((element, index) => {
    if ((element as any).isFlare) {
      // Primary flares positioned strategically around the canvas
      const positions = [
        { x: width * 0.2, y: height * 0.3 },
        { x: width * 0.8, y: height * 0.2 },
        { x: width * 0.15, y: height * 0.7 },
        { x: width * 0.85, y: height * 0.8 },
        { x: width * 0.5, y: height * 0.1 }
      ];
      const pos = positions[index % positions.length];
      element.x = pos.x;
      element.y = pos.y;
    } else if ((element as any).isRainbowRing) {
      // Rainbow rings centered but offset slightly
      element.x = width * 0.5 + (Math.random() - 0.5) * 100;
      element.y = height * 0.5 + (Math.random() - 0.5) * 100;
    } else if ((element as any).isStreak) {
      // Light streaks from center outward
      element.x = width * 0.5;
      element.y = height * 0.5;
    } else if ((element as any).isBokeh) {
      // Bokeh particles scattered randomly
      element.x = Math.random() * width;
      element.y = Math.random() * height;
    }
  });
};

export const createChromaticAberrationFilter = (strength: number = 1.0): PIXI.Filter => {
  const fragmentShader = `
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uTexture;
    uniform float uStrength;
    
    void main() {
      vec2 coord = vTextureCoord;
      vec2 offset = vec2(uStrength * 0.005);
      
      float r = texture2D(uTexture, coord - offset).r;
      float g = texture2D(uTexture, coord).g;
      float b = texture2D(uTexture, coord + offset).b;
      float a = texture2D(uTexture, coord).a;
      
      gl_FragColor = vec4(r, g, b, a);
    }
  `;
  
  const filter = new PIXI.Filter({
    glProgram: PIXI.GlProgram.from({
      vertex: `
        in vec2 aPosition;
        
        out vec2 vTextureCoord;
        
        uniform vec4 uInputSize;
        uniform vec4 uOutputFrame;
        uniform vec4 uOutputTexture;
        
        vec4 filterVertexPosition() {
          vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
          position = position * 2.0 - 1.0;
          return vec4(position, 0.0, 1.0);
        }
        
        vec2 filterTextureCoord() {
          return aPosition * (uOutputFrame.zw * uInputSize.zw);
        }
        
        void main() {
          gl_Position = filterVertexPosition();
          vTextureCoord = filterTextureCoord();
        }
      `,
      fragment: fragmentShader,
    }),
    resources: {
      uStrength: strength
    }
  });
  
  return filter;
};