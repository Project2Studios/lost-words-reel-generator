import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Instagram, Upload, LogOut, User, Hash, MapPin, Loader2, Check, X } from 'lucide-react';
import instagramService, { InstagramUser } from '../services/instagram';

interface InstagramPostProps {
  videoBlob?: Blob;
  onPost?: (success: boolean) => void;
  isExporting?: boolean;
}

const InstagramPost: React.FC<InstagramPostProps> = ({ videoBlob, onPost, isExporting }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<InstagramUser | null>(null);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [location, setLocation] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  // Pre-filled caption templates
  const captionTemplates = [
    "✨ Lost in the magic of moments captured ✨\n\nCreated with Lost Words Reel Generator",
    "Every frame tells a story 🎬✨\n\n#LostWords #ReelMagic",
    "Bringing memories to life, one particle at a time ✨\n\n",
    "Where words fail, visuals speak 🎨\n\n"
  ];

  // Common hashtag sets
  const hashtagSets = {
    creative: '#creative #art #design #visual #aesthetic',
    reels: '#reels #reelsinstagram #reelitfeelit #explore #viral',
    video: '#videoart #motiongraphics #videoedit #contentcreator',
    mood: '#mood #vibes #aesthetic #dreamy #magical'
  };

  useEffect(() => {
    // Check authentication status
    setIsAuthenticated(instagramService.isAuthenticated());
    
    if (instagramService.isAuthenticated()) {
      loadUserProfile();
    }

    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      handleOAuthCallback(code);
    }
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await instagramService.getUserProfile();
      setUser(profile);
    } catch (err) {
      console.error('Failed to load user profile:', err);
      setError('Failed to load Instagram profile');
    }
  };

  const handleOAuthCallback = async (code: string) => {
    try {
      await instagramService.exchangeCodeForToken(code);
      setIsAuthenticated(true);
      await loadUserProfile();
      
      // Clear the code from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      console.error('OAuth callback failed:', err);
      setError('Failed to connect to Instagram');
    }
  };

  const handleConnect = () => {
    // Check if we have Instagram app credentials
    if (!process.env.REACT_APP_INSTAGRAM_APP_ID) {
      setShowAuth(true);
      setError('Instagram API credentials not configured. Please add your Instagram App ID to continue.');
      return;
    }

    // Redirect to Instagram OAuth
    const authUrl = instagramService.getAuthUrl();
    window.location.href = authUrl;
  };

  const handleDisconnect = () => {
    instagramService.clearAuth();
    setIsAuthenticated(false);
    setUser(null);
    setCaption('');
    setHashtags('');
    setSuccess(false);
  };

  const handlePost = async () => {
    if (!videoBlob) {
      setError('No video available to post');
      return;
    }

    setIsPosting(true);
    setError(null);

    try {
      // Combine caption with hashtags
      const fullCaption = `${caption}\n\n${hashtags}`;
      
      // Create cover image from first frame (optional)
      // For now, we'll skip this as it requires extracting a frame from the video
      
      const mediaId = await instagramService.createReelPost(
        videoBlob,
        fullCaption
      );

      setSuccess(true);
      if (onPost) {
        onPost(true);
      }

      // Reset form after successful post
      setTimeout(() => {
        setCaption('');
        setHashtags('');
        setSuccess(false);
      }, 5000);

    } catch (err: any) {
      console.error('Failed to post to Instagram:', err);
      setError(err.message || 'Failed to post to Instagram. Please try again.');
      if (onPost) {
        onPost(false);
      }
    } finally {
      setIsPosting(false);
    }
  };

  const applyTemplate = (template: string) => {
    setCaption(template);
  };

  const addHashtagSet = (setName: keyof typeof hashtagSets) => {
    const currentHashtags = hashtags.trim();
    const newHashtags = hashtagSets[setName];
    
    if (currentHashtags) {
      setHashtags(`${currentHashtags} ${newHashtags}`);
    } else {
      setHashtags(newHashtags);
    }
  };

  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Instagram className="w-5 h-5 text-pink-500" />
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Share to Instagram Reels
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isAuthenticated ? (
          <div className="space-y-4">
            <Alert>
              <Instagram className="w-4 h-4" />
              <AlertDescription>
                Connect your Instagram account to share your reels directly!
              </AlertDescription>
            </Alert>
            
            {showAuth && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertDescription className="text-sm">
                  <strong>Setup Required:</strong> To use this feature, you need to:
                  <ol className="mt-2 ml-4 list-decimal space-y-1">
                    <li>Create an Instagram App in Meta Developer Console</li>
                    <li>Add your App ID and Client Secret to environment variables</li>
                    <li>Configure OAuth redirect URLs</li>
                  </ol>
                  <a 
                    href="https://developers.facebook.com/docs/instagram-basic-display-api/getting-started" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline mt-2 inline-block"
                  >
                    View Setup Guide →
                  </a>
                </AlertDescription>
              </Alert>
            )}
            
            <Button
              onClick={handleConnect}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Instagram className="w-4 h-4 mr-2" />
              Connect Instagram Account
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* User Info */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">@{user?.username}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDisconnect}
                className="text-red-600 hover:text-red-700"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>

            {/* Caption Input */}
            <div className="space-y-2">
              <Label htmlFor="caption">Caption</Label>
              <Textarea
                id="caption"
                placeholder="Write a caption for your reel..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                className="resize-none"
                maxLength={2200}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {caption.length}/2200 characters
                </span>
                <div className="flex gap-1">
                  {captionTemplates.map((template, idx) => (
                    <Button
                      key={idx}
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => applyTemplate(template)}
                    >
                      Template {idx + 1}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Hashtags */}
            <div className="space-y-2">
              <Label htmlFor="hashtags">
                <Hash className="w-3 h-3 inline mr-1" />
                Hashtags
              </Label>
              <Textarea
                id="hashtags"
                placeholder="#lostwords #reels #creative..."
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                rows={2}
                className="resize-none"
              />
              <div className="flex flex-wrap gap-1">
                {Object.keys(hashtagSets).map((setName) => (
                  <Button
                    key={setName}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => addHashtagSet(setName as keyof typeof hashtagSets)}
                  >
                    +{setName}
                  </Button>
                ))}
              </div>
            </div>

            {/* Location (optional) */}
            <div className="space-y-2">
              <Label htmlFor="location">
                <MapPin className="w-3 h-3 inline mr-1" />
                Location (optional)
              </Label>
              <Input
                id="location"
                placeholder="Add location..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Error/Success Messages */}
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <X className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <Check className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Successfully posted to Instagram Reels! 🎉
                </AlertDescription>
              </Alert>
            )}

            {/* Post Button */}
            <div className="flex gap-2">
              <Button
                onClick={handlePost}
                disabled={!videoBlob || isPosting || isExporting || !caption.trim()}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isPosting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Posting to Instagram...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Post to Reels
                  </>
                )}
              </Button>
            </div>

            {!videoBlob && !isExporting && (
              <p className="text-xs text-center text-muted-foreground">
                Export your video first, then share it to Instagram
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InstagramPost;