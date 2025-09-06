export interface ResolutionPreset {
  id: string;
  name: string;
  width: number;
  height: number;
  description: string;
  aspectRatio: string;
}

export const RESOLUTION_PRESETS: ResolutionPreset[] = [
  {
    id: 'instagram-reel',
    name: 'Instagram Reel',
    width: 1080,
    height: 1920,
    description: 'Perfect for Instagram Reels and TikTok',
    aspectRatio: '9:16'
  },
  {
    id: 'instagram-post',
    name: 'Instagram Post',
    width: 1080,
    height: 1350,
    description: 'Standard Instagram feed post',
    aspectRatio: '4:5'
  },
  {
    id: 'instagram-story',
    name: 'Instagram Story',
    width: 1080,
    height: 1920,
    description: 'Instagram Story format',
    aspectRatio: '9:16'
  },
  {
    id: 'youtube-shorts',
    name: 'YouTube Shorts',
    width: 1080,
    height: 1920,
    description: 'YouTube Shorts vertical format',
    aspectRatio: '9:16'
  },
  {
    id: 'square',
    name: 'Square',
    width: 1080,
    height: 1080,
    description: 'Classic square format',
    aspectRatio: '1:1'
  },
  {
    id: 'landscape',
    name: 'Landscape',
    width: 1920,
    height: 1080,
    description: 'Standard landscape format',
    aspectRatio: '16:9'
  }
];

export const getResolutionById = (id: string): ResolutionPreset => {
  return RESOLUTION_PRESETS.find(preset => preset.id === id) || RESOLUTION_PRESETS[0];
};

export const getResolutionNames = (): string[] => {
  return RESOLUTION_PRESETS.map(preset => preset.name);
};