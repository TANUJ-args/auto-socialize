import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Instagram, CheckCircle, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function InstagramSetup() {
  const [tokenStatus, setTokenStatus] = useState<'none' | 'demo' | 'real'>('none');
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  // Your long-lived Instagram token
  const INSTAGRAM_LONG_LIVED_TOKEN = 'EAAXeRTcivhQBPh4uG23CZB5At11Tz33kolMDmkmEhATZBUzXVnt2a7wJcNDvMlxZBChT2vjmwCbzh9LZBPMXLEY2WJoehfdcxHuvgFJBkFySR7aaoQfK2AHQDBEmOAQrXaMu1LuqSj8u9Sgq1qn2ZAssCwCZAsSCNFK5SPaIDye8l21Q18atFPtXZBsXjBD';

  useEffect(() => {
    checkTokenStatus();
  }, []);

  const checkTokenStatus = () => {
    const token = localStorage.getItem('ig_access_token');
    if (!token) {
      setTokenStatus('none');
      setIsSetupComplete(false);
    } else if (token === 'DEMO_TOKEN_FOR_TESTING') {
      setTokenStatus('demo');
      setIsSetupComplete(true);
    } else if (token.length > 50) {
      setTokenStatus('real');
      setIsSetupComplete(true);
    } else {
      setTokenStatus('none');
      setIsSetupComplete(false);
    }
  };

  const setupRealToken = () => {
    localStorage.setItem('ig_access_token', INSTAGRAM_LONG_LIVED_TOKEN);
    localStorage.setItem('instagram_connected', 'true');
    setTokenStatus('real');
    setIsSetupComplete(true);
    toast.success('🎬 Instagram Reels ready! Long-lived token configured.');
  };

  const setupDemoToken = () => {
    localStorage.setItem('ig_access_token', 'DEMO_TOKEN_FOR_TESTING');
    localStorage.setItem('instagram_connected', 'true');
    setTokenStatus('demo');
    setIsSetupComplete(true);
    toast.success('🧪 Demo mode enabled! Test Reel posting without real Instagram.');
  };

  const clearToken = () => {
    localStorage.removeItem('ig_access_token');
    localStorage.removeItem('instagram_connected');
    setTokenStatus('none');
    setIsSetupComplete(false);
    toast.info('Instagram token cleared');
  };

  const copyTokenToClipboard = () => {
    navigator.clipboard.writeText(INSTAGRAM_LONG_LIVED_TOKEN);
    toast.success('Token copied to clipboard!');
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Instagram className="h-8 w-8 text-pink-600" />
        <div>
          <h2 className="text-2xl font-bold">Instagram Reels Setup</h2>
          <p className="text-muted-foreground">Configure your Instagram access token for Reel posting</p>
        </div>
      </div>

      {/* Current Status */}
      <div className="mb-6 p-4 border rounded-lg bg-muted/20">
        <div className="flex items-center gap-2 mb-2">
          {isSetupComplete ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <RefreshCw className="h-5 w-5 text-orange-500" />
          )}
          <span className="font-medium">
            Status: {isSetupComplete ? 'Ready' : 'Not Configured'}
          </span>
        </div>
        
        {tokenStatus === 'real' && (
          <div className="text-sm">
            <Badge variant="default" className="bg-green-100 text-green-800">
              ✅ Real Instagram Token (60 days)
            </Badge>
            <p className="mt-2 text-muted-foreground">
              Ready to post Reels to Instagram! Token expires in ~60 days.
            </p>
          </div>
        )}
        
        {tokenStatus === 'demo' && (
          <div className="text-sm">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              🧪 Demo Mode
            </Badge>
            <p className="mt-2 text-muted-foreground">
              Test mode active. Simulates Reel posting without real Instagram API.
            </p>
          </div>
        )}
        
        {tokenStatus === 'none' && (
          <div className="text-sm">
            <Badge variant="outline" className="bg-orange-100 text-orange-800">
              ⚠️ No Token Set
            </Badge>
            <p className="mt-2 text-muted-foreground">
              Instagram token required for Reel posting. Choose setup option below.
            </p>
          </div>
        )}
      </div>

      {/* Setup Options */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Real Token Setup */}
          <Card className="p-4 border-2 border-green-200 bg-green-50">
            <div className="flex items-center gap-2 mb-3">
              <Instagram className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-900">Production Setup</h3>
            </div>
            <p className="text-sm text-green-800 mb-4">
              Use your real Instagram long-lived token for actual Reel posting.
            </p>
            <Button 
              onClick={setupRealToken}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={tokenStatus === 'real'}
            >
              {tokenStatus === 'real' ? '✅ Active' : '🎬 Setup Real Token'}
            </Button>
          </Card>

          {/* Demo Setup */}
          <Card className="p-4 border-2 border-blue-200 bg-blue-50">
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Demo Mode</h3>
            </div>
            <p className="text-sm text-blue-800 mb-4">
              Test Reel posting interface without real Instagram API calls.
            </p>
            <Button 
              onClick={setupDemoToken}
              variant="outline" 
              className="w-full border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
              disabled={tokenStatus === 'demo'}
            >
              {tokenStatus === 'demo' ? '✅ Active' : '🧪 Setup Demo Mode'}
            </Button>
          </Card>
        </div>

        {/* Token Management */}
        {isSetupComplete && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Token Management</h4>
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={copyTokenToClipboard}
                variant="outline" 
                size="sm"
                className="flex items-center gap-1"
              >
                <Copy className="h-4 w-4" />
                Copy Token
              </Button>
              <Button 
                onClick={clearToken}
                variant="outline" 
                size="sm"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Clear Token
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                variant="outline" 
                size="sm"
              >
                Refresh Page
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-muted/30 rounded-lg">
        <h4 className="font-medium mb-2">📋 Next Steps:</h4>
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Choose setup option above</li>
          <li>Go to Dashboard → Create Post</li>
          <li>Select "Video" → Check "Post as Instagram Reel"</li>
          <li>Upload vertical video (9:16, 15-90 seconds)</li>
          <li>Click "Create Reel Post" - Ready! 🎬</li>
        </ol>
      </div>
    </Card>
  );
}