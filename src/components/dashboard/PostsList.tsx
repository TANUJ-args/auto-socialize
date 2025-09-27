import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Edit, Trash, Plus, Calendar, Image, Video, Type, Instagram, Twitter, Linkedin, Upload, PlayCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

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
  
  // Check if it's a Dropbox sharing URL (handles new scl/fi format with multiple query params)
  const dropboxShareRegex = /https:\/\/www\.dropbox\.com\/scl\/fi\/[^?]+/;
  const dropboxMatch = url.match(dropboxShareRegex);
  
  if (dropboxMatch && url.includes('dl=0')) {
    // Convert Dropbox sharing URL to direct download by changing dl=0 to dl=1
    const directUrl = url.replace('dl=0', 'dl=1');
    console.log('[Dropbox] Converted sharing URL to direct download:', {
      original: url,
      converted: directUrl
    });
    toast.success('🔗 Dropbox link converted to direct download URL');
    return directUrl;
  }
  
  // Also handle dropbox.com/s/ URLs (legacy format)
  const dropboxLegacyRegex = /https:\/\/(www\.)?dropbox\.com\/s\/[^?]+/;
  const dropboxLegacyMatch = url.match(dropboxLegacyRegex);
  
  if (dropboxLegacyMatch) {
    const directUrl = url.includes('?') ? url.replace(/dl=0/, 'dl=1') : url + '?dl=1';
    console.log('[Dropbox Legacy] Converted sharing URL to direct download:', {
      original: url,
      converted: directUrl
    });
    toast.success('🔗 Dropbox link converted to direct download URL');
    return directUrl;
  }

  // Check if it's already a direct Google Drive download URL
  if (url.includes('drive.google.com/uc?export=download')) {
    console.log('[Google Drive] URL already in direct download format');
    return url;
  }
  
  // Return original URL if it's not a supported cloud storage link
  return url;
};

// Video URL validation utility
const validateVideoUrl = (url: string, isReels: boolean = false): { valid: boolean; message?: string } => {
  // Check for common video platforms that might not work
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return {
      valid: false,
      message: 'YouTube URLs are not supported. Please download the video and upload to Google Drive.'
    };
  }
  
  if (url.includes('vimeo.com')) {
    return {
      valid: false,
      message: 'Vimeo URLs are not supported. Please download the video and upload to Google Drive.'
    };
  }
  
  // Validate file extensions for direct URLs
  const videoExtensions = ['.mp4', '.mov', '.m4v', '.avi', '.mkv'];
  const lowerUrl = url.toLowerCase();
  const hasVideoExtension = videoExtensions.some(ext => lowerUrl.includes(ext));
  
  if (!hasVideoExtension && !url.includes('drive.google.com') && !url.includes('dropbox.com')) {
    return {
      valid: false,
      message: 'URL should point to a video file (MP4, MOV) or use Google Drive/Dropbox sharing.'
    };
  }
  
  return { valid: true };
};

interface PostsListProps {
  onUpdate?: () => void;
}

export default function PostsList({ onUpdate }: PostsListProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [editingPost, setEditingPost] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    postType: "text",
    mediaUrl: "",
    scheduledDate: "",
    platforms: ["instagram"],
    status: "draft"
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [posting, setPosting] = useState(false);
  const [isReels, setIsReels] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPosts();
  }, [filter]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const params = filter !== "all" ? { status: filter } : undefined;
      const { posts } = await api.posts.list(params);
      setPosts(posts);
    } catch (error) {
      console.error('Failed to load posts:', error);
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setPosting(true);
    try {
      // Basic validation
      if (!formData.content?.trim()) {
        toast.error('Please add content for your post');
        throw new Error('Content is required');
      }
      
      // If Instagram is selected and we have media, post directly to Instagram
      if (formData.platforms.includes('instagram') && (formData.mediaUrl || selectedFile)) {
        // Get Instagram access token
        // Get Instagram access token or use demo token
        const accessToken = localStorage.getItem('ig_access_token') || 'DEMO_TOKEN_FOR_TESTING';
        const isDemoMode = !localStorage.getItem('ig_access_token');
        
        if (!accessToken && !isDemoMode) {
          toast.info('Using demo mode - connect Instagram account for live posting');
        }
        
        // Handle media URL - Instagram needs publicly accessible URLs
        let mediaUrl = formData.mediaUrl;
        
        if (selectedFile) {
          // For now, we need a publicly accessible URL for Instagram API
          // TODO: Implement file upload to cloud storage
          toast.error('File upload not yet supported. Please use a publicly accessible URL (https://...) for now.');
          throw new Error('Local file upload requires cloud storage setup. Please use a public URL instead.');
        }
        
        if (!mediaUrl) {
          toast.error('Please provide a media URL or upload a file.');
          throw new Error('Media URL is required');
        }
        
        // Validate URL format
        if (!mediaUrl.startsWith('http://') && !mediaUrl.startsWith('https://')) {
          toast.error('Please enter a valid HTTP/HTTPS URL');
          throw new Error('Media URL must be a valid http(s) URL');
        }
        
        // Convert cloud storage sharing links to direct download URLs
        mediaUrl = convertGoogleDriveUrl(mediaUrl);
        
        const mediaType = formData.postType === 'video' ? 'VIDEO' : 'IMAGE';
        
        // Enhanced video validation
        if (mediaType === 'VIDEO') {
          const validation = validateVideoUrl(mediaUrl, isReels);
          if (!validation.valid) {
            toast.error(validation.message || 'Invalid video URL');
            throw new Error(validation.message || 'Invalid video URL format');
          }
          
          // Validate Reels requirements
          if (isReels) {
            console.log('Creating Instagram Reel - ensuring proper format');
          }
        }
        
        const requestData = {
          accessToken,
          mediaUrl,
          mediaType,
          caption: formData.content,
          isReels
        };
        
        console.log('Posting to Instagram - Request data:', requestData);
        console.log('Form data:', formData);
        
        // Show specific loading message for videos with longer duration
        let loadingToastId;
        if (mediaType === 'VIDEO') {
          const videoMessage = isReels ? 
            '📹 Creating Instagram Reel - this may take 1-2 minutes for video processing...' :
            '🎥 Uploading video to Instagram - this may take 1-2 minutes for processing...';
          loadingToastId = toast.loading(videoMessage, { duration: 120000 }); // 2 minutes
        }
        
        const res = await api.request<any>('/api/instagram/create-post', {
          method: 'POST',
          body: JSON.stringify(requestData)
        });
        
        if (res.success) {
          const postTypeText = isReels ? 'Reel' : mediaType.toLowerCase() === 'video' ? 'Video' : 'Image';
          const isDemo = res.message?.includes('Demo mode');
          
          if (isDemo) {
            toast.success(`🎉 ${postTypeText} ready to post! (Demo mode - would publish to Instagram in production)`);
          } else {
            toast.success(`🚀 ${postTypeText} posted to Instagram successfully!`);
          }
        } else {
          throw new Error(res.error || 'Failed to post to Instagram');
        }
      }
      
      // Save to database
      if (editingPost) {
        await api.posts.update(editingPost.id, formData);
        toast.success("Post updated successfully");
      } else {
        await api.posts.create(formData);
        toast.success("Post created successfully");
      }
      
      setShowCreateDialog(false);
      setEditingPost(null);
      resetForm();
      loadPosts();
      onUpdate?.();
    } catch (error: any) {
      console.error('Post creation error:', error);
      
      // Extract meaningful error message
      let errorMessage = "Failed to save post";
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error) {
        errorMessage = error.error;
      }
      
      // Dismiss any loading toasts
      toast.dismiss();
      toast.error(errorMessage);
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    
    try {
      await api.posts.delete(id);
      toast.success("Post deleted successfully");
      loadPosts();
      onUpdate?.();
    } catch (error) {
      toast.error("Failed to delete post");
    }
  };

  const handleEdit = (post: any) => {
    setEditingPost(post);
    setFormData({
      title: post.title || "",
      content: post.content,
      postType: post.postType,
      mediaUrl: post.mediaUrl || "",
      scheduledDate: post.scheduledDate ? format(new Date(post.scheduledDate), "yyyy-MM-dd'T'HH:mm") : "",
      platforms: post.platforms,
      status: post.status
    });
    setShowCreateDialog(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      postType: "text",
      mediaUrl: "",
      scheduledDate: "",
      platforms: ["instagram"],
      status: "draft"
    });
    setSelectedFile(null);
    setPreviewUrl("");
    setPosting(false);
    setIsReels(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isVideo = formData.postType === 'video';
    const isImage = formData.postType === 'image';
    
    if (isVideo && !file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }
    
    if (isImage && !file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate video requirements
    if (isVideo) {
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        toast.error('Video file must be under 100MB');
        return;
      }
      
      // Create video element to check duration
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        if (video.duration < 3 || video.duration > 60) {
          toast.error('Video must be between 3-60 seconds long');
          return;
        }
        
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setFormData(prev => ({ ...prev, mediaUrl: file.name }));
      };
      video.src = URL.createObjectURL(file);
    } else {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, mediaUrl: file.name }));
    }
  };

  const togglePlatform = (platform: string) => {
    if (platform !== "instagram") {
      toast.error(`${platform} is coming soon!`);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const getPostIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      default: return <Type className="h-4 w-4" />;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <>
      <Card className="glass p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Posts
          </h2>
          
          <div className="flex gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="gradient"
              onClick={() => {
                resetForm();
                setEditingPost(null);
                setShowCreateDialog(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No posts found</p>
            <p className="text-sm mt-2">Create your first post to get started</p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-300px)] min-h-[400px]">
            <div className="space-y-3 pr-4">
              {posts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border rounded-lg hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getPostIcon(post.postType)}
                        {post.title && (
                          <h3 className="font-semibold">{post.title}</h3>
                        )}
                        <Badge variant={
                          post.status === 'published' ? 'default' :
                          post.status === 'scheduled' ? 'secondary' :
                          post.status === 'failed' ? 'destructive' :
                          'outline'
                        }>
                          {post.status}
                        </Badge>
                        {post.aiGenerated && (
                          <Badge variant="secondary">AI</Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {post.content}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex gap-1">
                          {post.platforms.map((platform: string) => (
                            <span key={platform}>
                              {getPlatformIcon(platform)}
                            </span>
                          ))}
                        </div>
                        
                        {post.scheduledDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(post.scheduledDate), 'MMM d, h:mm a')}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(post)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(post.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        )}
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="flex-shrink-0 px-6 py-4 border-b">
            <DialogTitle>
              {editingPost ? 'Edit Post' : 'Create New Post'}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 px-6 max-h-[calc(90vh-140px)] overflow-y-auto">
            <div className="space-y-4 py-4 pb-6">
              <div>
              <label className="text-sm font-medium">Title (optional)</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Post title..."
                className="text-white bg-gray-800/50 border-gray-600 placeholder:text-gray-400"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your post content..."
                rows={4}
                className="text-white bg-gray-800/50 border-gray-600 placeholder:text-gray-400"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Post Type</label>
              <div className="space-y-3">
                <Select
                  value={formData.postType}
                  onValueChange={(value) => { 
                    setFormData(prev => ({ ...prev, postType: value }));
                    if (value !== 'video') setIsReels(false);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
                
                {formData.postType === 'video' && (
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg">
                    <input
                      type="checkbox"
                      id="reels-toggle-modal"
                      checked={isReels}
                      onChange={(e) => setIsReels(e.target.checked)}
                      className="w-4 h-4 text-pink-600 border-pink-300 rounded focus:ring-pink-500"
                    />
                    <label htmlFor="reels-toggle-modal" className="flex items-center gap-2 text-sm font-medium text-pink-900 cursor-pointer">
                      🎬 Post as Instagram Reel
                      <Badge variant="secondary" className="bg-pink-100 text-pink-800">Vertical videos</Badge>
                    </label>
                  </div>
                )}
              </div>
            </div>
            
            {(formData.postType === 'image' || formData.postType === 'video') && (
              <div className="space-y-4">
                {/* File Upload */}
                <div>
                  <label className="text-sm font-medium">Upload {formData.postType === 'video' ? 'Video' : 'Image'}</label>
                  <div className="mt-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept={formData.postType === 'video' ? 'video/mp4,video/mov' : 'image/*'}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose {formData.postType === 'video' ? 'Video' : 'Image'} File
                    </Button>
                  </div>
                </div>

                {/* Preview */}
                {previewUrl && (
                  <div>
                    <label className="text-sm font-medium">Preview</label>
                    <div className="mt-2 border rounded-lg overflow-hidden">
                      {formData.postType === 'video' ? (
                        <video
                          src={previewUrl}
                          controls
                          className="w-full max-h-64 object-cover"
                        />
                      ) : (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full max-h-64 object-cover"
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Alternative URL Input */}
                <div>
                  <label className="text-sm font-medium">{formData.postType === 'video' ? 'Video' : 'Image'} URL (Required)</label>
                  <Input
                    value={formData.mediaUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, mediaUrl: e.target.value }))}
                    placeholder={formData.postType === 'video' ? 
                      "https://drive.google.com/file/d/XXXXX/view or https://example.com/video.mp4" : 
                      "https://drive.google.com/file/d/XXXXX/view or https://example.com/image.jpg"
                    }
                    className="mt-1 text-white bg-gray-800/50 border-gray-600 placeholder:text-gray-400"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 Supports Google Drive sharing links (auto-converted) and direct URLs. Must be publicly accessible.
                  </p>
                </div>

                {/* Requirements Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.postType === 'video' ? (
                    <Card className={`p-4 ${isReels ? 'bg-pink-50 border-pink-200' : 'bg-blue-50 border-blue-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Video className={`h-4 w-4 ${isReels ? 'text-pink-600' : 'text-blue-600'}`} />
                        <span className={`text-sm font-semibold ${isReels ? 'text-pink-900' : 'text-blue-900'}`}>
                          {isReels ? '🎬 Reels Requirements' : '📹 Video Requirements'}
                        </span>
                      </div>
                      <ul className={`text-xs space-y-1 ${isReels ? 'text-pink-800' : 'text-blue-800'}`}>
                        <li>• <strong>Format: MP4 REQUIRED</strong> (H.264 video codec + AAC audio)</li>
                        <li>• Duration: {isReels ? '15-90 seconds' : '3-60 seconds'}</li>
                        <li>• Max size: 100MB</li>
                        <li>• Aspect ratio: {isReels ? '9:16 (vertical)' : '1:1 or 4:5'}</li>
                        <li>• Frame rate: 30 FPS max</li>
                        {isReels && (
                          <>
                            <li>• Best for: Vertical videos</li>
                            <li>• Auto-shared to Reels tab</li>
                          </>
                        )}
                        <li className="mt-2 font-medium">⚠️ Instagram is STRICT about format:</li>
                        <li>• <strong>Must be MP4 with H.264 codec</strong></li>
                        <li>• Need to convert? Use: <a href="https://handbrake.fr" target="_blank" className="underline">HandBrake</a> (free)</li>
                        <li>• Online converter: <a href="https://cloudconvert.com" target="_blank" className="underline">CloudConvert</a></li>
                        <li>• Google Drive works best for sharing</li>
                        <li>• Try shorter duration if processing fails</li>
                      </ul>
                    </Card>
                  ) : (
                    <Card className="p-4 bg-green-50 border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Image className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-900">🖼️ Image Requirements</span>
                      </div>
                      <ul className="text-xs text-green-800 space-y-1">
                        <li>• Format: JPG, PNG, WebP</li>
                        <li>• Min size: 320x320px</li>
                        <li>• Max size: 8MB</li>
                        <li>• Aspect ratio: 1:1 or 4:5</li>
                      </ul>
                    </Card>
                  )}
                </div>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium">Platforms</label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={formData.platforms.includes('instagram') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => togglePlatform('instagram')}
                >
                  <Instagram className="h-4 w-4 mr-1" />
                  Instagram
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => togglePlatform('twitter')}
                  disabled
                >
                  <Twitter className="h-4 w-4 mr-1" />
                  Twitter
                  <Badge variant="secondary" className="ml-2">Soon</Badge>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => togglePlatform('linkedin')}
                  disabled
                >
                  <Linkedin className="h-4 w-4 mr-1" />
                  LinkedIn
                  <Badge variant="secondary" className="ml-2">Soon</Badge>
                </Button>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Schedule (optional)</label>
              <Input
                type="datetime-local"
                value={formData.scheduledDate}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  scheduledDate: e.target.value,
                  status: e.target.value ? 'scheduled' : 'draft'
                }))}
                className="text-white bg-gray-800/50 border-gray-600 placeholder:text-gray-400 [color-scheme:dark]"
              />
            </div>
            </div>
          </ScrollArea>
          
          <DialogFooter className="flex-shrink-0 border-t px-6 py-4">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={handleSave} disabled={posting}>
              {posting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="mr-2"
                  >
                    <PlayCircle className="h-4 w-4" />
                  </motion.div>
                  {formData.postType === 'video' ? 'Processing Video...' : 'Posting...'}
                </>
              ) : (
                editingPost ? 'Update Post' : `Create ${isReels ? 'Reel' : formData.postType === 'video' ? 'Video' : formData.postType === 'image' ? 'Image' : ''} Post`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}