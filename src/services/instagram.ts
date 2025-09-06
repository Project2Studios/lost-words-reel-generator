// Instagram API Service
// Uses Instagram Basic Display API for personal accounts
// or Instagram Graph API for business accounts

interface InstagramConfig {
  clientId: string;
  redirectUri: string;
  scope: string[];
}

interface InstagramAuthResponse {
  access_token: string;
  user_id: string;
}

interface InstagramUser {
  id: string;
  username: string;
  account_type?: string;
  media_count?: number;
}

interface InstagramMediaUpload {
  caption: string;
  videoUrl: string;
  coverImageUrl?: string;
  shareToFeed?: boolean;
  locationId?: string;
  userTags?: Array<{ username: string; x: number; y: number }>;
}

class InstagramService {
  private config: InstagramConfig;
  private accessToken: string | null = null;
  private userId: string | null = null;

  constructor() {
    // These would come from environment variables in production
    this.config = {
      clientId: process.env.REACT_APP_INSTAGRAM_APP_ID || '',
      redirectUri: process.env.REACT_APP_INSTAGRAM_REDIRECT_URI || window.location.origin + '/auth/instagram/callback',
      scope: ['user_profile', 'user_media']
    };

    // Check for stored auth
    this.loadStoredAuth();
  }

  private loadStoredAuth() {
    const storedToken = localStorage.getItem('instagram_access_token');
    const storedUserId = localStorage.getItem('instagram_user_id');
    
    if (storedToken && storedUserId) {
      this.accessToken = storedToken;
      this.userId = storedUserId;
    }
  }

  private saveAuth(token: string, userId: string) {
    this.accessToken = token;
    this.userId = userId;
    localStorage.setItem('instagram_access_token', token);
    localStorage.setItem('instagram_user_id', userId);
  }

  clearAuth() {
    this.accessToken = null;
    this.userId = null;
    localStorage.removeItem('instagram_access_token');
    localStorage.removeItem('instagram_user_id');
  }

  isAuthenticated(): boolean {
    return !!this.accessToken && !!this.userId;
  }

  // Step 1: Generate OAuth URL
  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope.join(','),
      response_type: 'code'
    });

    return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
  }

  // Step 2: Exchange code for access token
  async exchangeCodeForToken(code: string): Promise<InstagramAuthResponse> {
    const response = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: process.env.REACT_APP_INSTAGRAM_CLIENT_SECRET || '',
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri,
        code: code
      })
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const data = await response.json();
    this.saveAuth(data.access_token, data.user_id);
    return data;
  }

  // Get user profile
  async getUserProfile(): Promise<InstagramUser> {
    if (!this.accessToken || !this.userId) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `https://graph.instagram.com/${this.userId}?fields=id,username,account_type,media_count&access_token=${this.accessToken}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    return response.json();
  }

  // Upload video to Instagram (requires Instagram Graph API for Business accounts)
  // For personal accounts, we'll need to use a different approach
  async createReelPost(videoBlob: Blob, caption: string, coverImageBlob?: Blob): Promise<string> {
    if (!this.accessToken || !this.userId) {
      throw new Error('Not authenticated');
    }

    // Note: Direct video upload to Instagram requires Instagram Graph API
    // which is only available for Business/Creator accounts
    // For personal accounts, we would need to:
    // 1. Upload to a cloud service (e.g., AWS S3, Cloudinary)
    // 2. Get a public URL
    // 3. Use Instagram's media creation endpoint

    // This is a simplified example for Business accounts
    try {
      // Step 1: Create media container
      const containerResponse = await fetch(
        `https://graph.instagram.com/${this.userId}/media`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            media_type: 'REELS',
            video_url: await this.uploadVideoToStorage(videoBlob), // Would need to implement cloud storage
            caption: caption,
            share_to_feed: true,
            cover_url: coverImageBlob ? await this.uploadImageToStorage(coverImageBlob) : undefined,
            access_token: this.accessToken
          })
        }
      );

      if (!containerResponse.ok) {
        throw new Error('Failed to create media container');
      }

      const { id: containerId } = await containerResponse.json();

      // Step 2: Publish the media container
      const publishResponse = await fetch(
        `https://graph.instagram.com/${this.userId}/media_publish`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            creation_id: containerId,
            access_token: this.accessToken
          })
        }
      );

      if (!publishResponse.ok) {
        throw new Error('Failed to publish media');
      }

      const { id: mediaId } = await publishResponse.json();
      return mediaId;

    } catch (error) {
      console.error('Error creating reel:', error);
      throw error;
    }
  }

  // Placeholder for video upload to cloud storage
  private async uploadVideoToStorage(videoBlob: Blob): Promise<string> {
    // In production, this would upload to S3, Cloudinary, etc.
    // and return a public URL
    
    // For now, we'll create a temporary URL (this won't work for actual Instagram API)
    const url = URL.createObjectURL(videoBlob);
    
    // You would implement actual cloud upload here:
    // const formData = new FormData();
    // formData.append('video', videoBlob);
    // const response = await fetch('your-upload-endpoint', { method: 'POST', body: formData });
    // return response.json().url;
    
    console.warn('Video upload to cloud storage not implemented. Using temporary URL.');
    return url;
  }

  // Placeholder for image upload to cloud storage
  private async uploadImageToStorage(imageBlob: Blob): Promise<string> {
    // Similar to video upload
    const url = URL.createObjectURL(imageBlob);
    console.warn('Image upload to cloud storage not implemented. Using temporary URL.');
    return url;
  }

  // Check media status (for async processing)
  async checkMediaStatus(containerId: string): Promise<string> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `https://graph.instagram.com/${containerId}?fields=status_code&access_token=${this.accessToken}`
    );

    if (!response.ok) {
      throw new Error('Failed to check media status');
    }

    const { status_code } = await response.json();
    return status_code; // FINISHED, IN_PROGRESS, ERROR, etc.
  }
}

export default new InstagramService();
export type { InstagramUser, InstagramMediaUpload };