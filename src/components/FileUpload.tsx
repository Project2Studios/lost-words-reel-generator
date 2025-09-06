import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Upload, Image, Music, FileImage, FileAudio, X, CheckCircle, Sparkles } from 'lucide-react';

interface FileUploadProps {
  onImageUpload: (image: string) => void;
  onSecondaryImageUpload?: (image: string) => void;
  onAudioUpload: (audio: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onImageUpload, onSecondaryImageUpload, onAudioUpload }) => {
  const [dragActive, setDragActive] = useState<'image' | 'secondary' | 'audio' | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [secondaryImageFile, setSecondaryImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<'image' | 'secondary' | 'audio' | null>(null);
  const [dragEnterCount, setDragEnterCount] = useState(0);

  const handleDrag = useCallback((e: React.DragEvent, type: 'image' | 'secondary' | 'audio') => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter") {
      setDragEnterCount(prev => prev + 1);
      setDragActive(type);
    } else if (e.type === "dragover") {
      setDragActive(type);
    } else if (e.type === "dragleave") {
      setDragEnterCount(prev => prev - 1);
      if (dragEnterCount <= 1) {
        setDragActive(null);
      }
    }
  }, [dragEnterCount]);

  const handleDrop = useCallback((e: React.DragEvent, type: 'image' | 'secondary' | 'audio') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(null);
    setDragEnterCount(0);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0], type);
    }
  }, []);

  const handleFile = (file: File, type: 'image' | 'secondary' | 'audio') => {
    const reader = new FileReader();
    reader.onload = () => {
      if (type === 'image') {
        setImageFile(file);
        onImageUpload(reader.result as string);
      } else if (type === 'secondary') {
        setSecondaryImageFile(file);
        if (onSecondaryImageUpload) {
          onSecondaryImageUpload(reader.result as string);
        }
      } else {
        setAudioFile(file);
        onAudioUpload(reader.result as string);
      }
      
      // Show success animation
      setUploadSuccess(type);
      setTimeout(() => setUploadSuccess(null), 2000);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'secondary' | 'audio') => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file, type);
    }
  };

  const clearFile = (type: 'image' | 'secondary' | 'audio') => {
    if (type === 'image') {
      setImageFile(null);
      onImageUpload('');
      // Also clear secondary image when primary is cleared
      setSecondaryImageFile(null);
      if (onSecondaryImageUpload) {
        onSecondaryImageUpload('');
      }
    } else if (type === 'secondary') {
      setSecondaryImageFile(null);
      if (onSecondaryImageUpload) {
        onSecondaryImageUpload('');
      }
    } else {
      setAudioFile(null);
      onAudioUpload('');
    }
    setUploadSuccess(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Image Upload */}
      <Card className={`card-hover transition-all duration-300 hover:shadow-lg ${dragActive === 'image' ? 'ring-2 ring-blue-400 ring-offset-2 shadow-lg scale-102' : ''} ${uploadSuccess === 'image' ? 'ring-2 ring-green-400 ring-offset-2' : ''}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 group">
            <div className="relative">
              <Image className={`w-5 h-5 transition-all duration-300 ${dragActive === 'image' ? 'text-blue-500 animate-bounce' : ''}`} />
              {uploadSuccess === 'image' && (
                <CheckCircle className="w-5 h-5 text-green-500 absolute inset-0 animate-ping" />
              )}
            </div>
            <span className={`transition-all duration-300 ${uploadSuccess === 'image' ? 'text-green-600' : ''}`}>
              Image Upload
              {uploadSuccess === 'image' && <span className="ml-2">✨</span>}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`relative border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-all duration-300 cursor-pointer group hover:scale-102
              ${dragActive === 'image' ? 'border-blue-400 bg-blue-50 transform scale-105 shadow-lg animate-pulse' : 'border-border hover:border-blue-400 hover:bg-blue-50/30'}
              ${imageFile ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-inner' : ''}
              ${uploadSuccess === 'image' ? 'animate-success-bounce' : ''}
            `}
            onDragEnter={(e) => handleDrag(e, 'image')}
            onDragLeave={(e) => handleDrag(e, 'image')}
            onDragOver={(e) => handleDrag(e, 'image')}
            onDrop={(e) => handleDrop(e, 'image')}
            onClick={() => document.getElementById('image-upload')?.click()}
          >
            {imageFile ? (
              <div className="space-y-3 animate-fade-in">
                <div className="relative">
                  <FileImage className="w-12 h-12 text-green-600 mx-auto animate-gentle-bounce" />
                  {uploadSuccess === 'image' && (
                    <Sparkles className="w-6 h-6 text-yellow-500 absolute -top-1 -right-1 animate-spin" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-green-800 flex items-center justify-center gap-2">
                    {imageFile.name}
                    <span className="text-lg animate-bounce">🎨</span>
                  </p>
                  <p className="text-sm text-green-600 font-mono bg-green-100 px-2 py-1 rounded-full inline-block">
                    {formatFileSize(imageFile.size)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile('image');
                  }}
                  className="mt-2 hover:scale-105 active:scale-95 transition-transform duration-150 hover:bg-red-50 hover:border-red-200 hover:text-red-600 focus-magic"
                >
                  <X className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-4 group-hover:scale-105 transition-transform duration-300">
                <div className="relative">
                  <Upload className={`w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto transition-all duration-300 ${
                    dragActive === 'image' ? 'animate-bounce text-blue-500' : 'group-hover:text-blue-400 group-hover:animate-float'
                  }`} />
                  {dragActive === 'image' && (
                    <div className="absolute inset-0 animate-ping">
                      <Upload className="w-8 h-8 sm:w-12 sm:h-12 text-blue-400 mx-auto opacity-50" />
                    </div>
                  )}
                </div>
                <div>
                  <p className={`text-base sm:text-lg font-medium transition-colors duration-300 ${
                    dragActive === 'image' ? 'text-blue-600' : 'group-hover:text-blue-600'
                  }`}>
                    {dragActive === 'image' ? '🎯 Drop it like it\'s hot!' : 'Drop your image here'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse files
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="hover:scale-105 active:scale-95 transition-all duration-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 focus-magic"
                >
                  Choose Image ✨
                </Button>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG up to 10MB · Perfect for your masterpiece!
                </p>
              </div>
            )}
            
            {/* Drag overlay effect for image */}
            {dragActive === 'image' && (
              <div className="absolute inset-0 border-2 border-blue-400 bg-blue-100/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <div className="text-blue-600 font-medium text-lg animate-bounce">
                  🎯 Drop it here!
                </div>
              </div>
            )}
          </div>
          <input
            id="image-upload"
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            onChange={(e) => handleFileInputChange(e, 'image')}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Secondary Image Upload - Only shown when primary image is uploaded */}
      {imageFile && onSecondaryImageUpload && (
        <Card className={`card-hover transition-all duration-300 hover:shadow-lg ${dragActive === 'secondary' ? 'ring-2 ring-indigo-400 ring-offset-2 shadow-lg scale-102' : ''} ${uploadSuccess === 'secondary' ? 'ring-2 ring-green-400 ring-offset-2' : ''} animate-fade-in`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 group">
              <div className="relative">
                <Image className={`w-5 h-5 transition-all duration-300 ${dragActive === 'secondary' ? 'text-indigo-500 animate-bounce' : ''}`} />
                {uploadSuccess === 'secondary' && (
                  <CheckCircle className="w-5 h-5 text-green-500 absolute inset-0 animate-ping" />
                )}
              </div>
              <span className={`transition-all duration-300 ${uploadSuccess === 'secondary' ? 'text-green-600' : ''}`}>
                Transition Image
                {uploadSuccess === 'secondary' && <span className="ml-2">✨</span>}
              </span>
              <span className="text-sm text-muted-foreground font-normal bg-indigo-100 px-2 py-1 rounded-full">
                (Optional)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`relative border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-all duration-300 cursor-pointer group hover:scale-102
                ${dragActive === 'secondary' ? 'border-indigo-400 bg-indigo-50 transform scale-105 shadow-lg animate-pulse' : 'border-border hover:border-indigo-400 hover:bg-indigo-50/30'}
                ${secondaryImageFile ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-300 shadow-inner' : ''}
                ${uploadSuccess === 'secondary' ? 'animate-success-bounce' : ''}
              `}
              onDragEnter={(e) => handleDrag(e, 'secondary')}
              onDragLeave={(e) => handleDrag(e, 'secondary')}
              onDragOver={(e) => handleDrag(e, 'secondary')}
              onDrop={(e) => handleDrop(e, 'secondary')}
              onClick={() => document.getElementById('secondary-image-upload')?.click()}
            >
              {secondaryImageFile ? (
                <div className="space-y-3 animate-fade-in">
                  <div className="relative">
                    <FileImage className="w-12 h-12 text-indigo-600 mx-auto animate-gentle-bounce" />
                    {uploadSuccess === 'secondary' && (
                      <Sparkles className="w-6 h-6 text-yellow-500 absolute -top-1 -right-1 animate-spin" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-indigo-800 flex items-center justify-center gap-2">
                      {secondaryImageFile.name}
                      <span className="text-lg animate-bounce">🎬</span>
                    </p>
                    <p className="text-sm text-indigo-600 font-mono bg-indigo-100 px-2 py-1 rounded-full inline-block">
                      {formatFileSize(secondaryImageFile.size)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFile('secondary');
                    }}
                    className="mt-2 hover:scale-105 active:scale-95 transition-transform duration-150 hover:bg-red-50 hover:border-red-200 hover:text-red-600 focus-magic"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 group-hover:scale-105 transition-transform duration-300">
                  <div className="relative">
                    <Upload className={`w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto transition-all duration-300 ${
                      dragActive === 'secondary' ? 'animate-bounce text-indigo-500' : 'group-hover:text-indigo-400 group-hover:animate-float'
                    }`} />
                    {dragActive === 'secondary' && (
                      <div className="absolute inset-0 animate-ping">
                        <Upload className="w-8 h-8 sm:w-12 sm:h-12 text-indigo-400 mx-auto opacity-50" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className={`text-base sm:text-lg font-medium transition-colors duration-300 ${
                      dragActive === 'secondary' ? 'text-indigo-600' : 'group-hover:text-indigo-600'
                    }`}>
                      {dragActive === 'secondary' ? '🎬 Ready for the transition!' : 'Add transition image'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Creates a smooth fade effect
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="hover:scale-105 active:scale-95 transition-all duration-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 focus-magic"
                  >
                    Choose Transition Image 🎬
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    The text will stay while the background transitions
                  </p>
                </div>
              )}
              
              {/* Drag overlay effect for secondary image */}
              {dragActive === 'secondary' && (
                <div className="absolute inset-0 border-2 border-indigo-400 bg-indigo-100/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <div className="text-indigo-600 font-medium text-lg animate-bounce">
                    🎬 Drop it here!
                  </div>
                </div>
              )}
            </div>
            <input
              id="secondary-image-upload"
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              onChange={(e) => handleFileInputChange(e, 'secondary')}
              className="hidden"
            />
          </CardContent>
        </Card>
      )}

      {/* Audio Upload */}
      <Card className={`card-hover transition-all duration-300 hover:shadow-lg ${dragActive === 'audio' ? 'ring-2 ring-purple-400 ring-offset-2 shadow-lg scale-102' : ''} ${uploadSuccess === 'audio' ? 'ring-2 ring-green-400 ring-offset-2' : ''}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 group">
            <div className="relative">
              <Music className={`w-5 h-5 transition-all duration-300 ${dragActive === 'audio' ? 'text-purple-500 animate-bounce' : ''}`} />
              {uploadSuccess === 'audio' && (
                <CheckCircle className="w-5 h-5 text-green-500 absolute inset-0 animate-ping" />
              )}
            </div>
            <span className={`transition-all duration-300 ${uploadSuccess === 'audio' ? 'text-green-600' : ''}`}>
              Audio Upload
              {uploadSuccess === 'audio' && <span className="ml-2">🎵</span>}
            </span>
            <span className="text-sm text-muted-foreground font-normal bg-blue-100 px-2 py-1 rounded-full">
              (Optional)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`relative border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-all duration-300 cursor-pointer group hover:scale-102
              ${dragActive === 'audio' ? 'border-purple-400 bg-purple-50 transform scale-105 shadow-lg animate-pulse' : 'border-border hover:border-purple-400 hover:bg-purple-50/30'}
              ${audioFile ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300 shadow-inner' : ''}
              ${uploadSuccess === 'audio' ? 'animate-success-bounce' : ''}
            `}
            onDragEnter={(e) => handleDrag(e, 'audio')}
            onDragLeave={(e) => handleDrag(e, 'audio')}
            onDragOver={(e) => handleDrag(e, 'audio')}
            onDrop={(e) => handleDrop(e, 'audio')}
            onClick={() => document.getElementById('audio-upload')?.click()}
          >
            {audioFile ? (
              <div className="space-y-3 animate-fade-in">
                <div className="relative">
                  <FileAudio className="w-12 h-12 text-blue-600 mx-auto animate-gentle-bounce" />
                  {uploadSuccess === 'audio' && (
                    <Sparkles className="w-6 h-6 text-yellow-500 absolute -top-1 -right-1 animate-spin" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-blue-800 flex items-center justify-center gap-2">
                    {audioFile.name}
                    <span className="text-lg animate-bounce">🎵</span>
                  </p>
                  <p className="text-sm text-blue-600 font-mono bg-blue-100 px-2 py-1 rounded-full inline-block">
                    {formatFileSize(audioFile.size)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile('audio');
                  }}
                  className="mt-2 hover:scale-105 active:scale-95 transition-transform duration-150 hover:bg-red-50 hover:border-red-200 hover:text-red-600 focus-magic"
                >
                  <X className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-4 group-hover:scale-105 transition-transform duration-300">
                <div className="relative">
                  <Upload className={`w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto transition-all duration-300 ${
                    dragActive === 'audio' ? 'animate-bounce text-purple-500' : 'group-hover:text-purple-400 group-hover:animate-float'
                  }`} />
                  {dragActive === 'audio' && (
                    <div className="absolute inset-0 animate-ping">
                      <Upload className="w-8 h-8 sm:w-12 sm:h-12 text-purple-400 mx-auto opacity-50" />
                    </div>
                  )}
                </div>
                <div>
                  <p className={`text-base sm:text-lg font-medium transition-colors duration-300 ${
                    dragActive === 'audio' ? 'text-purple-600' : 'group-hover:text-purple-600'
                  }`}>
                    {dragActive === 'audio' ? '🎵 Music to my ears!' : 'Drop your audio here'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse files
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="hover:scale-105 active:scale-95 transition-all duration-200 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 focus-magic"
                >
                  Choose Audio 🎶
                </Button>
                <p className="text-xs text-muted-foreground">
                  MP3, WAV up to 50MB · Add some rhythm to your story!
                </p>
              </div>
            )}
            
            {/* Drag overlay effect for audio */}
            {dragActive === 'audio' && (
              <div className="absolute inset-0 border-2 border-purple-400 bg-purple-100/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <div className="text-purple-600 font-medium text-lg animate-bounce">
                  🎵 Drop it here!
                </div>
              </div>
            )}
          </div>
          <input
            id="audio-upload"
            type="file"
            accept="audio/mp3, audio/wav, audio/m4a"
            onChange={(e) => handleFileInputChange(e, 'audio')}
            className="hidden"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default FileUpload;