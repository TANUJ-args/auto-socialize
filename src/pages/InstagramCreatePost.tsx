import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Google Drive URL conversion utility
const convertGoogleDriveUrl = (url: string): string => {
  // Check if it's a Google Drive sharing URL
  const driveShareRegex = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/(view|edit)/;
  const match = url.match(driveShareRegex);
  
  if (match) {
    const fileId = match[1];
    const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    console.log('[Google Drive] Converted sharing URL to direct download:', {
      original: url,
      converted: directUrl,
      fileId
    });
    toast.success('🔗 Google Drive link converted to direct download URL');
    return directUrl;
  }
  
  // Also handle docs.google.com URLs
  const docsShareRegex = /https:\/\/docs\.google\.com\/.*\/d\/([a-zA-Z0-9_-]+)\//;
  const docsMatch = url.match(docsShareRegex);
  
  if (docsMatch) {
    const fileId = docsMatch[1];
    const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    console.log('[Google Drive] Converted docs.google.com URL to direct download:', {
      original: url,
      converted: directUrl,
      fileId
    });
    toast.success('🔗 Google Drive link converted to direct download URL');
    return directUrl;
  }
  
  // Return original URL if it's not a Google Drive link
  return url;
};

export default function InstagramCreatePostPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [title, setTitle] = useState('');
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [isReels, setIsReels] = useState(false);
  const [posting, setPosting] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [generatingCaption, setGeneratingCaption] = useState(false);

  // Handle pre-filled data from AI assistant
  useEffect(() => {
    const aiData = sessionStorage.getItem('aiGeneratedPostData');
    if (aiData) {
      try {
        const parsedData = JSON.parse(aiData);
        setCaption(parsedData.content || '');
        setMediaUrl(parsedData.imageUrl || '');
        setTitle(parsedData.title || '');
        if (parsedData.imageUrl) {
          setMediaType('IMAGE');
        }
        // Clear the session storage after using it
        sessionStorage.removeItem('aiGeneratedPostData');
      } catch (error) {
        console.error('Failed to parse AI generated post data:', error);
      }
    }
  }, []);

  const generateCaption = async () => {
    if (!mediaUrl) {
      toast.error('Please add an image first');
      return;
    }

    setGeneratingCaption(true);
    try {
      // Analyze the image and generate a caption using AI
      const response = await api.request('/api/chat/analyze-image', {
        method: 'POST',
        body: JSON.stringify({
          imageUrl: mediaUrl,
          prompt: 'Create an engaging Instagram caption for this image. Include relevant hashtags and emojis. Keep it concise but compelling.'
        })
      });

      if (response.caption) {
        setCaption(response.caption);
        toast.success('Caption generated successfully!');
      } else {
        throw new Error('No caption received');
      }
    } catch (error: any) {
      console.error('Failed to generate caption:', error);
      toast.error('Failed to generate caption. Please try again.');
    } finally {
      setGeneratingCaption(false);
    }
  };

  // Allow demo mode without authentication for testing
  if (!user) {
    console.log('No user found, using demo mode');
  }

  const token = localStorage.getItem('ig_access_token');
  // Allow demo mode without Instagram token for testing
  const isDemoMode = !token;

  const publish = async () => {
    if (!caption || !mediaUrl) return toast.error('Caption and media URL required');
    
    // Convert Google Drive sharing URLs to direct download URLs
    const processedMediaUrl = convertGoogleDriveUrl(mediaUrl);
    
    // Additional validation for video URLs
    if (mediaType === 'VIDEO') {
      const videoExtensions = ['.mp4', '.mov', '.m4v'];
      const hasValidExt = videoExtensions.some(ext => processedMediaUrl.toLowerCase().includes(ext));
      if (!hasValidExt) {
        return toast.error('Video URL should point to an MP4 or MOV file');
      }
    }
    
    setPosting(true);
    setProgress('Creating media container...');
    
    try {
      // Use demo token if no real token available
      const accessToken = token || 'DEMO_TOKEN_FOR_TESTING';
      
      const res = await api.request<any>('/api/instagram/create-post', {
        method: 'POST',
        body: JSON.stringify({ accessToken, caption, mediaUrl: processedMediaUrl, mediaType, title, isReels })
      });
      
      if (mediaType === 'VIDEO') {
        setProgress('Processing video... (this may take up to 30 seconds)');
      } else {
        setProgress('Publishing...');
      }
      
      // Success response
      const postTypeText = isReels ? 'Reel' : mediaType === 'VIDEO' ? 'Video' : 'Image';
      const isDemo = res.message?.includes('Demo mode');
      
      if (isDemo) {
        toast.success(`🎉 ${postTypeText} ready to post! (Demo mode - would publish to Instagram in production)`);
        setProgress('✅ Demo Success - Ready for Instagram!');
      } else {
        toast.success(`🚀 ${postTypeText} posted to Instagram successfully!`);
        setProgress('✅ Live on Instagram!');
      }
      
      // Show completion message longer for demo
      setTimeout(() => {
        setProgress(null);
        // Reset form after success
        setCaption('');
        setMediaUrl('');
        setTitle('');
        
        // Show next steps
        if (isDemo) {
          toast.info("💡 Ready to go live? Connect your Instagram account to publish real posts!");
        }
      }, isDemo ? 5000 : 3000);
      
    } catch (e: any) {
      console.error('Post creation error:', e);
      let errorMsg = 'Failed to publish post';
      
      if (e.message?.includes('timeout')) {
        errorMsg = 'Request timed out. For videos, try a shorter duration or smaller file size.';
      } else if (e.message?.includes('Video processing')) {
        errorMsg = 'Video processing failed. Try a different format (MP4) or shorter duration.';
      } else if (e.message?.includes('not reachable')) {
        errorMsg = 'Media URL is not accessible. Please check the URL.';
      } else if (e.message?.includes('408')) {
        errorMsg = 'Video processing took too long. Try a shorter video or different format.';
      }
      
      toast.error(errorMsg);
      setProgress(null);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ScrollArea className="h-screen">
        <div className="max-w-2xl mx-auto p-6 space-y-6 pb-20">
          <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Create Instagram Post</h1>
          {isDemoMode && (
            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
              <span>🚀</span>
              Demo Mode
            </div>
          )}
        </div>
        
        {/* AI Generated Image Preview */}
        {mediaUrl && mediaUrl.startsWith('data:image') && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-purple-900">AI Generated Image</span>
            </div>
            <img 
              src={mediaUrl} 
              alt="AI Generated" 
              className="w-full max-h-64 object-contain rounded-lg border bg-white/50" 
            />
          </div>
        )}
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Title (optional)</label>
          <Input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="Internal title" 
            className="text-black dark:text-white" 
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Caption</label>
            {mediaUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateCaption}
                disabled={generatingCaption || !mediaUrl}
                className="text-xs hover:bg-purple-50 border-purple-200 text-purple-700"
              >
                {generatingCaption ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-500 mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <span className="mr-1">✨</span>
                    AI Caption
                  </>
                )}
              </Button>
            )}
          </div>
          <Textarea 
            value={caption} 
            onChange={(e) => setCaption(e.target.value)} 
            placeholder="Write your caption..." 
            rows={4} 
            className="text-black dark:text-white" 
          />
          {mediaUrl && (
            <p className="text-xs text-muted-foreground">
              💡 Tip: Use the "AI Caption" button to automatically generate an engaging caption based on your image
            </p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Media URL</label>
          <Input 
            value={mediaUrl} 
            onChange={(e) => setMediaUrl(e.target.value)} 
            placeholder={mediaType === 'VIDEO' ? 
              'https://drive.google.com/file/d/XXXXX/view or https://example.com/video.mp4' : 
              'https://drive.google.com/file/d/XXXXX/view or https://example.com/image.jpg'
            } 
            className="text-black dark:text-white"
          />
          <p className="text-xs text-muted-foreground mt-1">
            💡 Google Drive sharing links are automatically converted to direct download URLs
          </p>
          
          {/* Image Preview */}
          {mediaUrl && /^https?:\/\//i.test(mediaUrl) && mediaType === 'IMAGE' && (
            <div className="mt-2">
              <img 
                src={mediaUrl} 
                alt="Image preview" 
                className="max-h-48 w-full rounded border object-contain bg-muted/20" 
                onError={() => toast.error('Image failed to load')} 
              />
            </div>
          )}
          
          {/* Video Preview */}
          {mediaUrl && /^https?:\/\//i.test(mediaUrl) && mediaType === 'VIDEO' && (
            <div className="mt-2">
              <video 
                src={mediaUrl} 
                controls 
                className="max-h-48 w-full rounded border bg-muted/20"
                onError={() => toast.error('Video failed to load')}
              >
                Your browser does not support the video tag.
              </video>
              <p className="text-xs text-muted-foreground mt-1">
                ⚠️ Note: Video processing may take longer (up to 30 seconds)
              </p>
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Media Type</label>
            <select 
              className="w-full border rounded-md px-3 py-2 text-sm text-black dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
              value={mediaType} 
              onChange={(e) => { 
                setMediaType(e.target.value as any);
                if (e.target.value !== 'VIDEO') setIsReels(false);
              }}
            >
              <option value="IMAGE">📷 Image (JPG, PNG, WebP)</option>
              <option value="VIDEO">🎥 Video (MP4, MOV - max 60 seconds)</option>
            </select>
          </div>
          
          {mediaType === 'VIDEO' && (
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg">
              <input
                type="checkbox"
                id="reels-toggle"
                checked={isReels}
                onChange={(e) => setIsReels(e.target.checked)}
                className="w-4 h-4 text-pink-600 border-pink-300 rounded focus:ring-pink-500"
              />
              <label htmlFor="reels-toggle" className="flex items-center gap-2 text-sm font-medium text-pink-900 cursor-pointer">
                🎬 Post as Instagram Reel
                <span className="text-xs bg-pink-100 px-2 py-1 rounded-full">Recommended for vertical videos</span>
              </label>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {mediaType === 'IMAGE' 
              ? 'Supported formats: JPG, PNG, WebP. Max size: 8MB. Aspect ratio: 1:1 to 1.91:1' 
              : 'Supported formats: MP4, MOV. Max size: 100MB. Duration: 3-60 seconds. Aspect ratio: 1.91:1 to 9:16'
            }
          </p>
        </div>
        <div className="flex gap-4 items-center text-sm text-muted-foreground">
          <span>Platform:</span>
          <span className="font-medium">Instagram</span>
        </div>
        <Button disabled={posting || !caption || !mediaUrl} onClick={publish} className="w-full">
          {posting ? (isReels ? 'Posting Reel...' : 'Posting...') : `Create ${isReels ? 'Reel' : mediaType === 'VIDEO' ? 'Video' : 'Image'} Post`}
        </Button>
        {progress && (
          <div className="text-sm text-center p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 rounded-lg border border-green-200 dark:border-green-800">
            <div className="font-medium text-green-800 dark:text-green-200 mb-2">
              {progress}
            </div>
            {progress.includes('Success') && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/dashboard')}
                className="mt-2"
              >
                ← Back to AI Assistant
              </Button>
            )}
          </div>
        )}
          </Card>

          {/* Video Requirements Card */}
          {mediaType === 'VIDEO' && (
        <Card className={`p-4 ${isReels ? 'bg-pink-50 border-pink-200' : 'bg-amber-50 border-amber-200'}`}>
          <h3 className={`font-medium mb-2 ${isReels ? 'text-pink-900' : 'text-amber-900'}`}>
            {isReels ? '🎬 Reels Requirements' : '📹 Video Requirements'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <ul className={`text-sm space-y-1 ${isReels ? 'text-pink-800' : 'text-amber-800'}`}>
              <li><strong>Duration:</strong> {isReels ? '15-90 seconds' : '3-60 seconds'}</li>
              <li><strong>Format:</strong> MP4 or MOV</li>
              <li><strong>Size:</strong> Max 100MB</li>
            </ul>
            <ul className={`text-sm space-y-1 ${isReels ? 'text-pink-800' : 'text-amber-800'}`}>
              <li><strong>Aspect Ratio:</strong> {isReels ? '9:16 (vertical)' : '1.91:1 to 9:16'}</li>
              <li><strong>Resolution:</strong> Min 720p</li>
              <li><strong>Processing:</strong> Up to 30 seconds</li>
            </ul>
          </div>
            </Card>
          )}

          {/* Image Requirements Card */}
          {mediaType === 'IMAGE' && (
        <Card className="p-4 bg-green-50 border-green-200">
          <h3 className="font-medium text-green-900 mb-2">🖼️ Image Requirements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <ul className="text-sm text-green-800 space-y-1">
              <li><strong>Format:</strong> JPG, PNG, WebP</li>
              <li><strong>Size:</strong> Max 8MB</li>
            </ul>
            <ul className="text-sm text-green-800 space-y-1">
              <li><strong>Aspect Ratio:</strong> 1:1 to 1.91:1</li>
              <li><strong>Resolution:</strong> Min 1080x1080</li>
            </ul>
          </div>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
