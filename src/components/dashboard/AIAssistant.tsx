import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, Save, Bot, User, Image, Plus, MessageCircle } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface AIAssistantProps {
  onUpdate?: () => void;
}

export default function AIAssistant({ onUpdate }: AIAssistantProps) {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadSession = async () => {
    setLoading(true);
    try {
      const { session } = await api.chat.getSession();
      setSession(session);
      
      // Process messages to handle image metadata
      const processedMessages = (session.messages || []).map((msg: any) => {
        if (msg.metadata) {
          try {
            const metadata = typeof msg.metadata === 'string' ? JSON.parse(msg.metadata) : msg.metadata;
            if (metadata.type === 'image') {
              return {
                ...msg,
                type: 'image',
                imageUrl: metadata.imageUrl,
                model: metadata.modelName
              };
            }
          } catch (e) {
            console.warn('Failed to parse message metadata:', e);
          }
        }
        return msg;
      });
      
      setMessages(processedMessages);
      
      // Add welcome message for empty sessions
      if (processedMessages.length === 0) {
        const welcomeMessage = {
          id: 'welcome',
          role: 'assistant',
          content: `👋 Welcome to your AI Content Assistant! I can help you create amazing social media content.\n\n✨ **What I can do:**\n• Generate stunning images with AI\n• Create engaging captions and posts\n• Provide content ideas and hashtags\n• Help with Instagram, Twitter & LinkedIn content\n\n🎨 **Try these commands:**\n• "Generate image of a sunset over mountains"\n• "Create Instagram post about coffee shops"\n• "Write a LinkedIn post about productivity"\n\nWhat would you like to create today?`,
          timestamp: new Date().toISOString(),
          type: 'welcome'
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Failed to load chat session:', error);
      toast.error("Failed to load chat session");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !session || thinking || generatingImage) return;

    const userInput = input;
    setInput("");

    // Check if it's an image generation request (but not if they're referencing existing images)
    const imageGenerationKeywords = [
      'generate image', 'create image', 'make image', 'draw image',
      'generate picture', 'create picture', 'make picture', 'draw picture', 
      'generate photo', 'create photo', 'make photo', 'draw photo',
      'image of', 'picture of', 'photo of', 'generate an image', 'create an image'
    ];

    // Exclude phrases that reference existing content
    const contextualPhrases = [
      'using that image', 'with that image', 'using this image', 'with this image',
      'using the image', 'with the image', 'from that image', 'from this image',
      'post using', 'caption for', 'write about', 'describe', 'use that', 'use this'
    ];

    const hasContextualReference = contextualPhrases.some(phrase => 
      userInput.toLowerCase().includes(phrase.toLowerCase())
    );

    const isImageGenerationRequest = !hasContextualReference && (
      imageGenerationKeywords.some(keyword => 
        userInput.toLowerCase().includes(keyword.toLowerCase())
      ) || userInput.toLowerCase().match(/^(draw|generate)\s+.*image/i)
    );

    if (isImageGenerationRequest) {
      await generateImage(userInput);
      return;
    }

    setThinking(true);

    // Prepare message content with reply context
    let messageContent = userInput;
    if (replyingTo) {
      messageContent = `[Replying to: "${replyingTo.content.slice(0, 50)}${replyingTo.content.length > 50 ? '...' : ''}"] ${userInput}`;
    }

    // Add user message optimistically
    const tempUserMsg = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: messageContent,
      replyingTo: replyingTo,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    // Clear reply state
    setReplyingTo(null);

    try {
      const { userMessage, assistantMessage } = await api.chat.sendMessage(session.id, messageContent, replyingTo);
      
      // Replace temp message with real messages
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempUserMsg.id),
        userMessage,
        assistantMessage
      ]);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      toast.error("Failed to send message");
      
      // Remove the temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
    } finally {
      setThinking(false);
    }
  };

  const generateImage = async (prompt: string) => {
    setGeneratingImage(true);

    // Add generating message with progress
    const tempImageMsg = {
      id: `temp-img-${Date.now()}`,
      role: 'assistant',
      type: 'image-generating',
      content: `🎨 Creating your masterpiece...\n\n"${prompt}"\n\n⚡ Using AI to generate high-quality image...`,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempImageMsg]);

    try {
      const result = await api.chat.generateImage(prompt, undefined, session?.id);
      
      // If backend returned saved messages, use those, otherwise create local ones
      if (result.userMessage && result.assistantMessage) {
        // Use messages from backend (includes database IDs)
        const imageMessage = {
          ...result.assistantMessage,
          type: 'image',
          imageUrl: result.imageUrl,
          model: result.modelName
        };
        
        setMessages(prev => [
          ...prev.filter(m => m.id !== tempImageMsg.id),
          result.userMessage,
          imageMessage
        ]);
      } else {
        // Fallback to local message creation
        const userMsg = {
          id: `user-${Date.now()}`,
          role: 'user',
          content: prompt,
          timestamp: new Date().toISOString()
        };
        
        const imageMessage = {
          id: `img-${Date.now()}`,
          role: 'assistant',
          type: 'image',
          content: prompt,
          imageUrl: result.imageUrl,
          model: result.modelName,
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [
          ...prev.filter(m => m.id !== tempImageMsg.id),
          userMsg,
          imageMessage
        ]);
      }
      
    } catch (error: any) {
      console.error('Failed to generate image:', error);
      
      let errorMessage = 'Failed to generate image';
      if (error.message?.includes('Model is loading')) {
        errorMessage = 'Model is loading, please try again in a few seconds';
      } else if (error.message?.includes('Rate limit')) {
        errorMessage = 'Rate limit exceeded, please wait a moment';
      } else if (error.message?.includes('token')) {
        errorMessage = 'Authentication error - check Hugging Face token';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      
      // Replace loading message with error message
      const errorMsg = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        type: 'text',
        content: `❌ Failed to generate image: ${errorMessage}`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempImageMsg.id),
        errorMsg
      ]);
    } finally {
      setGeneratingImage(false);
    }
  };

  const saveAsDraft = async (content: string, imageUrl?: string) => {
    try {
      if (imageUrl) {
        // Save image post as draft
        const { post } = await api.posts.create({
          title: `AI Generated: ${content.slice(0, 30)}${content.length > 30 ? '...' : ''}`,
          content: content,
          postType: 'image',
          mediaUrl: imageUrl,
          status: 'draft',
          platforms: ['instagram'],
          aiGenerated: true,
          prompt: content
        });
        toast.success("Image saved as draft post!");
      } else {
        // Save text content as draft
        const { post } = await api.chat.saveAsDraft(content, 'instagram');
        toast.success("Saved as draft post!");
      }
      onUpdate?.();
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast.error("Failed to save as draft");
    }
  };

  const createPost = (content: string, imageUrl?: string) => {
    // Navigate to create post page with pre-filled data
    const postData = {
      content,
      imageUrl,
      postType: imageUrl ? 'image' : 'text',
      title: imageUrl 
        ? `AI Generated: ${content.slice(0, 30)}${content.length > 30 ? '...' : ''}`
        : `AI Content: ${content.slice(0, 30)}${content.length > 30 ? '...' : ''}`
    };
    
    // Store the data in sessionStorage to pass to the create post page
    sessionStorage.setItem('aiGeneratedPostData', JSON.stringify(postData));
    navigate('/instagram/create');
  };

  if (loading) {
    return (
      <Card className="glass p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">AI Content Assistant</h2>
          <Badge variant="secondary">GPT-4o Mini</Badge>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass flex flex-col h-[600px]">
      <div className="flex items-center gap-3 p-6 pb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">AI Content Assistant</h2>
        <Badge variant="secondary">GPT-4o Mini</Badge>
      </div>

      <ScrollArea className="flex-1 px-6">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Hi there! How can I assist you today?</h3>
              <p className="text-muted-foreground">Are you looking for help with social media content?</p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-4"
                onClick={() => saveAsDraft("Hi there! How can I assist you today? Are you looking for help with social media content?")}
              >
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
            </div>
          )}

          {messages.map((message, index) => (
            <motion.div
              key={message.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground order-2' 
                  : 'bg-muted'
              }`}>
                {message.role === 'user' ? (
                  <User className="h-5 w-5" />
                ) : (
                  <Bot className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className={`flex-1 ${message.role === 'user' ? 'order-1' : ''}`}>
                <div className={`rounded-lg p-3 max-w-[80%] ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground ml-auto' 
                    : 'bg-muted'
                }`}>
                  {message.type === 'image-generating' ? (
                    <div className="flex items-center gap-2">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                        <Image className="h-4 w-4 text-primary" />
                      </motion.div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  ) : message.type === 'image' ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Image className="h-3 w-3" />
                        <span>Generated with {message.model}</span>
                      </div>
                      <img
                        src={message.imageUrl}
                        alt={message.content}
                        className="w-full max-w-sm rounded-lg border shadow-sm"
                      />
                      <p className="text-sm font-medium">"{message.content}"</p>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                </div>
                {/* Reply button only for assistant messages */}
                <div className="flex gap-2 mt-2">
                  {message.role === 'assistant' && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setReplyingTo(message)}
                    >
                      <MessageCircle className="h-3 w-3 mr-2" />
                      Reply
                    </Button>
                  )}
                  
                  {message.role === 'assistant' && (
                    <>
                      {message.type === 'image' ? (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => saveAsDraft(message.content, message.imageUrl)}
                          >
                            <Save className="h-3 w-3 mr-2" />
                            Save as Draft
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => createPost(message.content, message.imageUrl)}
                          >
                            <Plus className="h-3 w-3 mr-2" />
                            Create Post
                          </Button>
                        </>
                      ) : message.type !== 'image-generating' && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => saveAsDraft(message.content)}
                          >
                            <Save className="h-3 w-3 mr-2" />
                            Save as Draft
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => createPost(message.content)}
                          >
                            <Plus className="h-3 w-3 mr-2" />
                            Create Post
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {thinking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary animate-pulse" />
              </div>
              <div className="bg-muted rounded-lg p-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="space-y-3 p-6 pt-4 relative">
        {/* Reply Preview */}
        {replyingTo && (
          <div className="bg-muted/50 border border-muted rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  Replying to {replyingTo.role === 'user' ? 'You' : 'AI Assistant'}:
                </div>
                <div className="flex gap-2">
                  {replyingTo.imageUrl && (
                    <img 
                      src={replyingTo.imageUrl} 
                      alt="Reply context" 
                      className="w-8 h-8 rounded object-cover"
                    />
                  )}
                  <div className="text-sm text-foreground/80 line-clamp-2 flex-1">
                    {replyingTo.content.length > 100 
                      ? `${replyingTo.content.substring(0, 100)}...` 
                      : replyingTo.content}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(null)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Ask for content ideas, captions, or type 'generate image of...' to create images"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              disabled={thinking || generatingImage}
            />
          </div>
          <Button 
            variant="gradient" 
            onClick={sendMessage}
            disabled={!input.trim() || thinking || generatingImage}
            className="px-6"
          >
            {thinking || generatingImage ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <Bot className="h-4 w-4" />
              </motion.div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div className="space-y-3">
            <div className="text-xs text-center text-muted-foreground font-medium">Quick Start</div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput("Generate image of a modern coffee shop with plants")}
                className="text-xs justify-start"
              >
                🎨 Coffee Shop Image
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput("Create Instagram post about productivity tips")}
                className="text-xs justify-start"
              >
                📱 Productivity Post
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput("Generate image of a sunset over mountains")}
                className="text-xs justify-start"
              >
                🏔️ Sunset Image
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput("Write LinkedIn post about AI in business")}
                className="text-xs justify-start"
              >
                💼 LinkedIn AI Post
              </Button>
            </div>
          </div>
        )}

        {/* Helper Text */}
        <div className="flex items-center justify-center text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-center text-muted-foreground max-w-2xl">
            <div className="space-y-1">
              <div className="font-medium text-purple-600">🎨 Image Generation</div>
              <div>"Generate image of a cozy coffee shop"</div>
              <div>"Create picture of modern workspace"</div>
            </div>
            <div className="space-y-1">
              <div className="font-medium text-blue-600">✍️ Content Creation</div>
              <div>"Write LinkedIn post about AI trends"</div>
              <div>"Create Instagram caption for this image"</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}