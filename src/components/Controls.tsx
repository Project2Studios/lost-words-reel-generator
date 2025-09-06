import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Button } from './ui/button';
import { getPresetNames, getPresetById } from '../presets/EffectPresets';
import { RESOLUTION_PRESETS, getResolutionById } from '../types/resolutions';
import { 
  Settings, 
  Volume2, 
  Eye,
  ChevronDown,
  ChevronUp,
  Wand2,
  Music,
  Timer,
  Zap,
  Sparkles,
  Cloud,
  CloudSnow,
  Stars,
  Monitor,
  Film,
  Clock,
  Layers,
  Sun,
  Palette
} from 'lucide-react';

interface ControlsProps {
  settings: any;
  onSettingsChange: (settings: any) => void;
  onExport: () => void;
  isPlaying: boolean;
  onTogglePlayPause: () => void;
}

const Controls: React.FC<ControlsProps> = ({ 
  settings, 
  onSettingsChange, 
  onExport, 
  isPlaying, 
  onTogglePlayPause 
}) => {
  const [advancedOpen, setAdvancedOpen] = React.useState(false);
  const [recentlyChanged, setRecentlyChanged] = React.useState<string | null>(null);
  const settingsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (settingsTimeoutRef.current) {
        clearTimeout(settingsTimeoutRef.current);
      }
    };
  }, []);

  const handleSliderChange = (name: string, value: number[]) => {
    onSettingsChange({
      ...settings,
      [name]: value[0],
    });
    
    // Show satisfying feedback for slider changes
    setRecentlyChanged(name);
    setTimeout(() => setRecentlyChanged(null), 800);
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    onSettingsChange({
      ...settings,
      [name]: checked,
    });
    
    // Show satisfying feedback for switch changes
    setRecentlyChanged(name);
    setTimeout(() => setRecentlyChanged(null), 600);
  };

  const handleSelectChange = (name: string, value: string) => {
    // Debounce settings changes to prevent rapid updates
    if (settingsTimeoutRef.current) {
      clearTimeout(settingsTimeoutRef.current);
    }
    
    settingsTimeoutRef.current = setTimeout(() => {
      let newSettings = {
        ...settings,
        [name]: value,
      };
      
      // If changing preset, apply the preset's default effects
      if (name === 'preset') {
        const selectedPreset = getPresetById(value);
        if (selectedPreset) {
          newSettings = {
            ...newSettings,
            grain: selectedPreset.effects.grain,
            lightLeak: selectedPreset.effects.lightLeak,
            enableSimpleParticles: selectedPreset.effects.enableSimpleParticles,
            particleType: selectedPreset.effects.particleType || 'dust',
            enableLensFlares: selectedPreset.effects.enableLensFlares,
          };
        }
      }
      
      onSettingsChange(newSettings);
    }, 100);
    
    // Show satisfying feedback for preset changes
    setRecentlyChanged(name);
    setTimeout(() => setRecentlyChanged(null), 1000);
  };

  return (
    <div className="space-y-6">
      
      {/* Visual Effects */}
      <Card className="card-hover group hover:shadow-lg transition-all duration-300 hover:shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 group-hover:animate-spin transition-transform duration-500" />
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent group-hover:animate-pulse">
              Visual Effects
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Dust Effect */}
          <div className={`space-y-3 transition-all duration-300 ${recentlyChanged === 'dustIntensity' ? 'bg-orange-50/50 p-3 rounded-lg shadow-md' : ''}`}>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2 group">
                <Cloud className={`w-4 h-4 transition-all duration-300 ${recentlyChanged === 'dustIntensity' ? 'text-orange-500 animate-pulse' : 'group-hover:text-orange-500'}`} />
                <span className="group-hover:text-orange-600 transition-colors duration-200">
                  Dust Particles
                </span>
              </Label>
              <span className={`text-sm font-mono px-2 py-1 rounded-full transition-all duration-300 ${
                recentlyChanged === 'dustIntensity' 
                  ? 'bg-orange-100 text-orange-700 animate-pulse' 
                  : 'text-muted-foreground hover:bg-slate-100'
              }`}>
                {Math.round((settings.dustIntensity || 0) * 100)}%
              </span>
            </div>
            <Slider
              value={[settings.dustIntensity || 0]}
              onValueChange={(value: number[]) => handleSliderChange('dustIntensity', value)}
              min={0}
              max={1}
              step={0.1}
              className="w-full hover:shadow-sm transition-shadow duration-200"
            />
          </div>

          {/* Snow Effect */}
          <div className={`space-y-3 transition-all duration-300 ${recentlyChanged === 'snowIntensity' ? 'bg-blue-50/50 p-3 rounded-lg shadow-md' : ''}`}>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2 group">
                <CloudSnow className={`w-4 h-4 transition-all duration-300 ${recentlyChanged === 'snowIntensity' ? 'text-blue-500 animate-pulse' : 'group-hover:text-blue-500'}`} />
                <span className="group-hover:text-blue-600 transition-colors duration-200">
                  Snow Effect
                </span>
              </Label>
              <span className={`text-sm font-mono px-2 py-1 rounded-full transition-all duration-300 ${
                recentlyChanged === 'snowIntensity' 
                  ? 'bg-blue-100 text-blue-700 animate-pulse' 
                  : 'text-muted-foreground hover:bg-slate-100'
              }`}>
                {Math.round((settings.snowIntensity || 0) * 100)}%
              </span>
            </div>
            <Slider
              value={[settings.snowIntensity || 0]}
              onValueChange={(value: number[]) => handleSliderChange('snowIntensity', value)}
              min={0}
              max={1}
              step={0.1}
              className="w-full hover:shadow-sm transition-shadow duration-200"
            />
          </div>

          {/* Sparkles Effect */}
          <div className={`space-y-3 transition-all duration-300 ${recentlyChanged === 'sparklesIntensity' ? 'bg-purple-50/50 p-3 rounded-lg shadow-md' : ''}`}>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2 group">
                <Stars className={`w-4 h-4 transition-all duration-300 ${recentlyChanged === 'sparklesIntensity' ? 'text-purple-500 animate-pulse' : 'group-hover:text-purple-500'}`} />
                <span className="group-hover:text-purple-600 transition-colors duration-200">
                  Sparkles
                </span>
              </Label>
              <span className={`text-sm font-mono px-2 py-1 rounded-full transition-all duration-300 ${
                recentlyChanged === 'sparklesIntensity' 
                  ? 'bg-purple-100 text-purple-700 animate-pulse' 
                  : 'text-muted-foreground hover:bg-slate-100'
              }`}>
                {Math.round((settings.sparklesIntensity || 0) * 100)}%
              </span>
            </div>
            <Slider
              value={[settings.sparklesIntensity || 0]}
              onValueChange={(value: number[]) => handleSliderChange('sparklesIntensity', value)}
              min={0}
              max={1}
              step={0.1}
              className="w-full hover:shadow-sm transition-shadow duration-200"
            />
          </div>

          {/* Haze Effect */}
          <div className={`space-y-3 transition-all duration-300 ${recentlyChanged === 'hazeIntensity' ? 'bg-indigo-50/50 p-3 rounded-lg shadow-md' : ''}`}>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2 group">
                <Cloud className={`w-4 h-4 transition-all duration-300 ${recentlyChanged === 'hazeIntensity' ? 'text-indigo-500 animate-pulse' : 'group-hover:text-indigo-500'}`} />
                <span className="group-hover:text-indigo-600 transition-colors duration-200">
                  Atmospheric Haze
                </span>
              </Label>
              <span className={`text-sm font-mono px-2 py-1 rounded-full transition-all duration-300 ${
                recentlyChanged === 'hazeIntensity' 
                  ? 'bg-indigo-100 text-indigo-700 animate-pulse' 
                  : 'text-muted-foreground hover:bg-slate-100'
              }`}>
                {Math.round((settings.hazeIntensity || 0) * 100)}%
              </span>
            </div>
            <Slider
              value={[settings.hazeIntensity || 0]}
              onValueChange={(value: number[]) => handleSliderChange('hazeIntensity', value)}
              min={0}
              max={1}
              step={0.1}
              className="w-full hover:shadow-sm transition-shadow duration-200"
            />
          </div>

          {/* Grain Effect */}
          <div className={`flex items-center justify-between p-2 rounded-lg transition-all duration-300 ${recentlyChanged === 'grain' ? 'bg-amber-50 shadow-md' : 'hover:bg-slate-50'}`}>
            <Label className="text-sm font-medium flex items-center gap-2 group cursor-pointer">
              <Eye className={`w-4 h-4 transition-all duration-300 ${recentlyChanged === 'grain' ? 'text-amber-500 animate-pulse' : 'group-hover:text-amber-500'}`} />
              <span className="group-hover:text-amber-600 transition-colors duration-200">
                Film Grain {settings.grain && '🎞️'}
              </span>
            </Label>
            <Switch
              checked={settings.grain}
              onCheckedChange={(checked) => handleSwitchChange('grain', checked)}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-amber-400 data-[state=checked]:to-orange-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Basic Controls */}
      <Card className="card-hover group hover:shadow-lg transition-all duration-300 hover:shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform duration-500" />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:animate-pulse">
              Basic Settings
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Zoom Control */}
          <div className={`space-y-3 transition-all duration-300 ${recentlyChanged === 'zoom' ? 'bg-blue-50/50 p-3 rounded-lg shadow-md' : ''}`}>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2 group">
                <Zap className={`w-4 h-4 transition-all duration-300 ${recentlyChanged === 'zoom' ? 'text-blue-500 animate-pulse' : 'group-hover:text-yellow-500'}`} />
                <span className="group-hover:text-blue-600 transition-colors duration-200">
                  Zoom {recentlyChanged === 'zoom' && '⚡'}
                </span>
              </Label>
              <span className={`text-sm font-mono px-2 py-1 rounded-full transition-all duration-300 ${
                recentlyChanged === 'zoom' 
                  ? 'bg-blue-100 text-blue-700 animate-pulse' 
                  : 'text-muted-foreground hover:bg-slate-100'
              }`}>
                {settings.zoom}x
              </span>
            </div>
            <Slider
              value={[settings.zoom]}
              onValueChange={(value: number[]) => handleSliderChange('zoom', value)}
              min={1}
              max={2}
              step={0.1}
              className="w-full hover:shadow-sm transition-shadow duration-200"
            />
          </div>

          {/* Effect Preset - Now Hidden Since We Have Individual Controls */}
          {/* Keeping preset logic for backward compatibility but hiding from UI */}
          {false && (
            <div className={`space-y-3 transition-all duration-300 ${recentlyChanged === 'preset' ? 'bg-purple-50/50 p-3 rounded-lg shadow-md' : ''}`}>
              <Label className="text-sm font-medium flex items-center gap-2 group">
                <Wand2 className={`w-4 h-4 transition-all duration-300 ${recentlyChanged === 'preset' ? 'text-purple-500 animate-spin' : 'group-hover:text-purple-500'}`} />
                <span className="group-hover:text-purple-600 transition-colors duration-200">
                  Effect Preset {recentlyChanged === 'preset' && '🎭'}
                </span>
              </Label>
              <Select 
                value={settings.preset} 
                onValueChange={(value) => handleSelectChange('preset', value)}
              >
                <SelectTrigger className="hover:shadow-md transition-shadow duration-200">
                  <SelectValue placeholder="Select your magic ✨" />
                </SelectTrigger>
                <SelectContent>
                  {getPresetNames().map(preset => (
                    <SelectItem 
                      key={preset.id} 
                      value={preset.id}
                      className="hover:bg-purple-50 transition-colors duration-200"
                    >
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Separator />

          {/* Resolution */}
          <div className={`space-y-3 transition-all duration-300 ${recentlyChanged === 'resolution' ? 'bg-blue-50/50 p-3 rounded-lg shadow-md' : ''}`}>
            <Label className="text-sm font-medium flex items-center gap-2 group">
              <Monitor className={`w-4 h-4 transition-all duration-300 ${recentlyChanged === 'resolution' ? 'text-blue-500 animate-pulse' : 'group-hover:text-blue-500'}`} />
              <span className="group-hover:text-blue-600 transition-colors duration-200">
                Resolution {recentlyChanged === 'resolution' && '📱'}
              </span>
            </Label>
            <Select 
              value={settings.resolution || 'instagram-reel'} 
              onValueChange={(value) => handleSelectChange('resolution', value)}
            >
              <SelectTrigger className="hover:shadow-md transition-shadow duration-200">
                <SelectValue placeholder="Choose your format 📱" />
              </SelectTrigger>
              <SelectContent>
                {RESOLUTION_PRESETS.map(preset => (
                  <SelectItem 
                    key={preset.id} 
                    value={preset.id}
                    className="hover:bg-blue-50 transition-colors duration-200"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{preset.name}</span>
                      <span className="text-xs text-muted-foreground">{preset.width}×{preset.height} ({preset.aspectRatio})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {(() => {
                const currentResolution = getResolutionById(settings.resolution || 'instagram-reel');
                return `${currentResolution.description}`;
              })()}
            </p>
          </div>

          {/* Duration */}
          <div className={`space-y-3 transition-all duration-300 ${recentlyChanged === 'duration' ? 'bg-green-50/50 p-3 rounded-lg shadow-md' : ''}`}>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2 group">
                <Timer className={`w-4 h-4 transition-all duration-300 ${recentlyChanged === 'duration' ? 'text-green-500 animate-pulse' : 'group-hover:text-green-500'}`} />
                <span className="group-hover:text-green-600 transition-colors duration-200">
                  Duration {recentlyChanged === 'duration' && '⏰'}
                </span>
              </Label>
              <span className={`text-sm font-mono px-2 py-1 rounded-full transition-all duration-300 ${
                recentlyChanged === 'duration' 
                  ? 'bg-green-100 text-green-700 animate-pulse' 
                  : 'text-muted-foreground hover:bg-slate-100'
              }`}>
                {settings.duration}s
              </span>
            </div>
            <Slider
              value={[settings.duration]}
              onValueChange={(value: number[]) => handleSliderChange('duration', value)}
              min={5}
              max={20}
              step={1}
              className="w-full hover:shadow-sm transition-shadow duration-200"
            />
          </div>

          {/* Volume */}
          <div className={`space-y-3 transition-all duration-300 ${recentlyChanged === 'volume' ? 'bg-indigo-50/50 p-3 rounded-lg shadow-md' : ''}`}>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2 group">
                <Volume2 className={`w-4 h-4 transition-all duration-300 ${recentlyChanged === 'volume' ? 'text-indigo-500 animate-pulse' : 'group-hover:text-indigo-500'}`} />
                <span className="group-hover:text-indigo-600 transition-colors duration-200">
                  Volume {recentlyChanged === 'volume' && '🔊'}
                </span>
              </Label>
              <span className={`text-sm font-mono px-2 py-1 rounded-full transition-all duration-300 ${
                recentlyChanged === 'volume' 
                  ? 'bg-indigo-100 text-indigo-700 animate-pulse' 
                  : 'text-muted-foreground hover:bg-slate-100'
              }`}>
                {Math.round(settings.volume * 100)}%
              </span>
            </div>
            <Slider
              value={[settings.volume]}
              onValueChange={(value: number[]) => handleSliderChange('volume', value)}
              min={0}
              max={1}
              step={0.1}
              className="w-full hover:shadow-sm transition-shadow duration-200"
            />
          </div>

          {/* Loop Audio */}
          <div className={`flex items-center justify-between p-2 rounded-lg transition-all duration-300 ${recentlyChanged === 'audioLoop' ? 'bg-pink-50 shadow-md' : 'hover:bg-slate-50'}`}>
            <Label className="text-sm font-medium flex items-center gap-2 group cursor-pointer">
              <Music className={`w-4 h-4 transition-all duration-300 ${recentlyChanged === 'audioLoop' ? 'text-pink-500 animate-pulse' : 'group-hover:text-pink-500'}`} />
              <span className="group-hover:text-pink-600 transition-colors duration-200">
                Loop Audio {settings.audioLoop && '🔄'}
              </span>
            </Label>
            <Switch
              checked={settings.audioLoop}
              onCheckedChange={(checked) => handleSwitchChange('audioLoop', checked)}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-pink-400 data-[state=checked]:to-rose-500"
            />
          </div>

          <Separator />

          {/* Export Quality Preset */}
          <div className={`space-y-3 transition-all duration-300 ${recentlyChanged === 'exportQuality' ? 'shadow-md bg-emerald-50/50 p-3 rounded-lg' : ''}`}>
            <Label className="text-sm font-medium flex items-center gap-2 group">
              <Zap className={`w-4 h-4 transition-all duration-300 ${recentlyChanged === 'exportQuality' ? 'text-emerald-500 animate-spin' : 'group-hover:text-emerald-500'}`} />
              <span className="group-hover:text-emerald-600 transition-colors duration-200">
                Export Quality {recentlyChanged === 'exportQuality' && '⚡'}
              </span>
            </Label>
            <Select 
              value={settings.exportQuality || 'balanced'} 
              onValueChange={(value) => handleSelectChange('exportQuality', value)}
            >
              <SelectTrigger className="hover:shadow-md transition-shadow duration-200">
                <SelectValue placeholder="Choose speed vs quality ⚡" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fast" className="hover:bg-red-50 transition-colors duration-200">
                  🚀 Fast - Lower quality, 5x faster export
                </SelectItem>
                <SelectItem value="balanced" className="hover:bg-blue-50 transition-colors duration-200">
                  ⚖️ Balanced - Good quality, 2x faster export
                </SelectItem>
                <SelectItem value="quality" className="hover:bg-green-50 transition-colors duration-200">
                  🎨 Quality - Best quality, slower export
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {settings.exportQuality === 'fast' && '⚡ Optimized for speed with reduced visual effects and lower compression quality.'}
              {(settings.exportQuality === 'balanced' || !settings.exportQuality) && '⚖️ Balanced approach with moderate effects and good compression.'}
              {settings.exportQuality === 'quality' && '🎨 Maximum visual fidelity with all effects enabled and high compression quality.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Transition Settings */}
      <Card className="card-hover group hover:shadow-lg transition-all duration-300 hover:shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Film className="w-5 h-5 group-hover:animate-spin transition-transform duration-500" />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent group-hover:animate-pulse">
              Image Transition
            </span>
            {settings.transitionEnabled && <span className="text-lg animate-bounce">🎬</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Enable Transition */}
          <div className={`flex items-center justify-between p-2 rounded-lg transition-all duration-300 ${recentlyChanged === 'transitionEnabled' ? 'bg-indigo-50 shadow-md' : 'hover:bg-slate-50'}`}>
            <Label className="text-sm font-medium flex items-center gap-2 group cursor-pointer">
              <Layers className={`w-4 h-4 transition-all duration-300 ${recentlyChanged === 'transitionEnabled' ? 'text-indigo-500 animate-pulse' : 'group-hover:text-indigo-500'}`} />
              <span className="group-hover:text-indigo-600 transition-colors duration-200">
                Enable Transition {settings.transitionEnabled && '🎬'}
              </span>
            </Label>
            <Switch
              checked={settings.transitionEnabled}
              onCheckedChange={(checked) => handleSwitchChange('transitionEnabled', checked)}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-indigo-400 data-[state=checked]:to-purple-500"
            />
          </div>

          {/* Transition Controls - Only show when enabled */}
          {settings.transitionEnabled && (
            <>
              {/* Transition Timestamp */}
              <div className={`space-y-3 transition-all duration-300 ${recentlyChanged === 'transitionTimestamp' ? 'bg-blue-50/50 p-3 rounded-lg shadow-md' : ''}`}>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2 group">
                    <Clock className={`w-4 h-4 transition-all duration-300 ${recentlyChanged === 'transitionTimestamp' ? 'text-blue-500 animate-pulse' : 'group-hover:text-blue-500'}`} />
                    <span className="group-hover:text-blue-600 transition-colors duration-200">
                      Transition Time
                    </span>
                  </Label>
                  <span className={`text-sm font-mono px-2 py-1 rounded-full transition-all duration-300 ${
                    recentlyChanged === 'transitionTimestamp' 
                      ? 'bg-blue-100 text-blue-700 animate-pulse' 
                      : 'text-muted-foreground hover:bg-slate-100'
                  }`}>
                    {settings.transitionTimestamp}s
                  </span>
                </div>
                <Slider
                  value={[settings.transitionTimestamp]}
                  onValueChange={(value: number[]) => handleSliderChange('transitionTimestamp', value)}
                  min={1}
                  max={settings.duration - 2} // Leave at least 2 seconds after transition
                  step={0.5}
                  className="w-full hover:shadow-sm transition-shadow duration-200"
                />
                <p className="text-xs text-muted-foreground">
                  When to switch to the second image
                </p>
              </div>

              {/* Transition Duration */}
              <div className={`space-y-3 transition-all duration-300 ${recentlyChanged === 'transitionDuration' ? 'bg-purple-50/50 p-3 rounded-lg shadow-md' : ''}`}>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2 group">
                    <Timer className={`w-4 h-4 transition-all duration-300 ${recentlyChanged === 'transitionDuration' ? 'text-purple-500 animate-pulse' : 'group-hover:text-purple-500'}`} />
                    <span className="group-hover:text-purple-600 transition-colors duration-200">
                      Fade Duration
                    </span>
                  </Label>
                  <span className={`text-sm font-mono px-2 py-1 rounded-full transition-all duration-300 ${
                    recentlyChanged === 'transitionDuration' 
                      ? 'bg-purple-100 text-purple-700 animate-pulse' 
                      : 'text-muted-foreground hover:bg-slate-100'
                  }`}>
                    {settings.transitionDuration}s
                  </span>
                </div>
                <Slider
                  value={[settings.transitionDuration]}
                  onValueChange={(value: number[]) => handleSliderChange('transitionDuration', value)}
                  min={0.5}
                  max={3}
                  step={0.5}
                  className="w-full hover:shadow-sm transition-shadow duration-200"
                />
                <p className="text-xs text-muted-foreground">
                  How long the fade effect takes
                </p>
              </div>

              {/* Transition Type */}
              <div className={`space-y-3 transition-all duration-300 ${recentlyChanged === 'transitionType' ? 'shadow-md bg-pink-50/50 p-3 rounded-lg' : ''}`}>
                <Label className="text-sm font-medium flex items-center gap-2 group">
                  <Wand2 className={`w-4 h-4 transition-all duration-300 ${recentlyChanged === 'transitionType' ? 'text-pink-500 animate-spin' : 'group-hover:text-pink-500'}`} />
                  <span className="group-hover:text-pink-600 transition-colors duration-200">
                    Transition Effect {recentlyChanged === 'transitionType' && '✨'}
                  </span>
                </Label>
                <Select 
                  value={settings.transitionType || 'fade'} 
                  onValueChange={(value) => handleSelectChange('transitionType', value)}
                >
                  <SelectTrigger className="hover:shadow-md transition-shadow duration-200">
                    <SelectValue placeholder="Choose transition type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="fade" className="hover:bg-slate-50 transition-colors duration-150">
                      <span className="flex items-center gap-2">
                        <span>Fade</span>
                        <span className="text-xs text-muted-foreground">Smooth cross-fade</span>
                      </span>
                    </SelectItem>
                    <SelectItem value="slide" className="hover:bg-slate-50 transition-colors duration-150">
                      <span className="flex items-center gap-2">
                        <span>Slide</span>
                        <span className="text-xs text-muted-foreground">Slide in from side</span>
                      </span>
                    </SelectItem>
                    <SelectItem value="dissolve" className="hover:bg-slate-50 transition-colors duration-150">
                      <span className="flex items-center gap-2">
                        <span>Dissolve</span>
                        <span className="text-xs text-muted-foreground">Particle dissolve</span>
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Secondary Image Brightness */}
              <div className={`space-y-3 transition-all duration-300 ${recentlyChanged === 'secondaryImageBrightness' ? 'bg-amber-50/50 p-3 rounded-lg shadow-md' : ''}`}>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2 group">
                    <Sun className={`w-4 h-4 transition-all duration-300 ${recentlyChanged === 'secondaryImageBrightness' ? 'text-amber-500 animate-pulse' : 'group-hover:text-amber-500'}`} />
                    <span className="group-hover:text-amber-600 transition-colors duration-200">
                      Secondary Image Brightness
                    </span>
                  </Label>
                  <span className={`text-sm font-mono px-2 py-1 rounded-full transition-all duration-300 ${
                    recentlyChanged === 'secondaryImageBrightness' 
                      ? 'bg-amber-100 text-amber-700 animate-pulse' 
                      : 'text-muted-foreground hover:bg-slate-100'
                  }`}>
                    {Math.round(settings.secondaryImageBrightness * 100)}%
                  </span>
                </div>
                <Slider
                  value={[settings.secondaryImageBrightness]}
                  onValueChange={([value]) => onSettingsChange({ ...settings, secondaryImageBrightness: value })}
                  min={0.3}
                  max={1.7}
                  step={0.1}
                  className="w-full hover:shadow-sm transition-shadow duration-200"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Darker</span>
                  <span>Normal</span>
                  <span>Brighter</span>
                </div>
              </div>

              {/* Secondary Image Grayscale */}
              <div className={`flex items-center justify-between p-2 rounded-lg transition-all duration-300 ${recentlyChanged === 'secondaryImageGrayscale' ? 'bg-gray-50 shadow-md' : 'hover:bg-slate-50'}`}>
                <Label className="text-sm font-medium flex items-center gap-2 group cursor-pointer">
                  <Palette className={`w-4 h-4 transition-all duration-300 ${recentlyChanged === 'secondaryImageGrayscale' ? 'text-gray-500 animate-pulse' : 'group-hover:text-gray-500'}`} />
                  <span className="group-hover:text-gray-600 transition-colors duration-200">
                    Black & White Mode {settings.secondaryImageGrayscale && '🎨'}
                  </span>
                </Label>
                <Switch
                  checked={settings.secondaryImageGrayscale}
                  onCheckedChange={(checked) => handleSwitchChange('secondaryImageGrayscale', checked)}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-gray-400 data-[state=checked]:to-gray-600"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Advanced Text Masking */}
      <Card className="card-hover group hover:shadow-lg transition-all duration-300 hover:shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="w-5 h-5 group-hover:animate-pulse text-slate-600" />
            <span className="bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-transparent">
              Text Masking
            </span>
            {settings.textMaskEnabled && <span className="text-lg animate-bounce">🎭</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Enable Text Masking */}
          <div className={`flex items-center justify-between p-2 rounded-lg transition-all duration-300 ${recentlyChanged === 'textMaskEnabled' ? 'bg-slate-50 shadow-md' : 'hover:bg-slate-50'}`}>
            <Label className="text-sm font-medium flex items-center gap-2 group cursor-pointer">
              <Eye className={`w-4 h-4 transition-all duration-300 ${recentlyChanged === 'textMaskEnabled' ? 'text-slate-500 animate-pulse' : 'group-hover:text-slate-500'}`} />
              <span className="group-hover:text-slate-600 transition-colors duration-200">
                Enable Text Masking {settings.textMaskEnabled && '✨'}
              </span>
            </Label>
            <Switch
              checked={settings.textMaskEnabled}
              onCheckedChange={(checked) => handleSwitchChange('textMaskEnabled', checked)}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-slate-400 data-[state=checked]:to-slate-600"
            />
          </div>

          {/* Advanced Text Masking Controls */}
          {settings.textMaskEnabled && (
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-2 h-auto hover:bg-slate-100 rounded-lg transition-all duration-200 group">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Settings className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                    Advanced Settings
                  </span>
                  {advancedOpen ? (
                    <ChevronUp className="w-4 h-4 animate-bounce" />
                  ) : (
                    <ChevronDown className="w-4 h-4 group-hover:animate-bounce" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4 animate-fade-in">
                
                {/* Threshold */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Threshold</Label>
                    <span className="text-sm text-muted-foreground font-mono">
                      {settings.textMaskThreshold}
                    </span>
                  </div>
                  <Slider
                    value={[settings.textMaskThreshold]}
                    onValueChange={(value: number[]) => handleSliderChange('textMaskThreshold', value)}
                    min={50}
                    max={200}
                    step={5}
                    className="w-full"
                  />
                </div>

                {/* Edge Detection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Edge Detection</Label>
                    <span className="text-sm text-muted-foreground font-mono">
                      {parseFloat(settings.textMaskEdgeStrength).toFixed(1)}
                    </span>
                  </div>
                  <Slider
                    value={[settings.textMaskEdgeStrength]}
                    onValueChange={(value: number[]) => handleSliderChange('textMaskEdgeStrength', value)}
                    min={0.5}
                    max={3}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                {/* Morphology Size */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Morphology Size</Label>
                    <span className="text-sm text-muted-foreground font-mono">
                      {settings.textMaskMorphologySize}
                    </span>
                  </div>
                  <Slider
                    value={[settings.textMaskMorphologySize]}
                    onValueChange={(value: number[]) => handleSliderChange('textMaskMorphologySize', value)}
                    min={0}
                    max={5}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Invert Mask */}
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Invert Mask</Label>
                  <Switch
                    checked={settings.textMaskInvert}
                    onCheckedChange={(checked) => handleSwitchChange('textMaskInvert', checked)}
                  />
                </div>

                {/* Preview Mask */}
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Preview Mask</Label>
                  <Switch
                    checked={settings.textMaskPreview}
                    onCheckedChange={(checked) => handleSwitchChange('textMaskPreview', checked)}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Controls;