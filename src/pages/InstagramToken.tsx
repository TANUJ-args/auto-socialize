import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function InstagramTokenPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const validate = async () => {
    if (!token) return toast.error('Enter a token');
    if (token.length < 50) return toast.error('Token seems too short - please check it');
    
    setLoading(true);
    try {
      const res = await api.request<{ valid: boolean; account?: any; error?: any }>(`/api/instagram/validate-token`, {
        method: 'POST',
        body: JSON.stringify({ accessToken: token })
      });
      if (res.valid) {
        // Save token for the user in the backend
        await api.request('/api/instagram/save-token', {
          method: 'POST',
          body: JSON.stringify({ accessToken: token })
        });
        
        localStorage.setItem('ig_access_token', token);
        toast.success('Instagram connected successfully!' + (res.account?.username ? ` @${res.account.username}` : ''));
        
        // Redirect back to dashboard
        setTimeout(() => navigate('/dashboard'), 800);
      } else {
        toast.error('Token validation failed');
      }
    } catch (e: any) {
      console.error('Token validation error:', e);
      let errorMsg = 'Validation failed';
      
      if (e.message?.includes('fetch')) {
        errorMsg = 'Cannot connect to server. Please check if backend is running.';
      } else if (e.message?.includes('OAuth')) {
        errorMsg = 'Invalid token format or expired token.';
      } else if (e.message?.includes('400')) {
        errorMsg = 'Bad request - check token format.';
      } else if (e.message?.includes('401')) {
        errorMsg = 'Unauthorized - token may be expired or invalid.';
      }
      
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="p-6">Login required</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Connect Instagram with Access Token</h1>
        <p className="text-sm text-muted-foreground">
          Enter a long-lived page access token from Facebook Developer Console. Once validated, 
          you'll return to the dashboard where you can manage posts and verify your connection.
        </p>
        <p className="text-xs text-muted-foreground">
          Token must have <code className="mx-1 px-1 bg-muted rounded">instagram_basic</code> and 
          <code className="mx-1 px-1 bg-muted rounded">instagram_content_publish</code> scopes.
        </p>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Access Token</label>
          <Input
            placeholder="EAABwzLixnjYBO..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="font-mono text-sm"
          />
        </div>
        
        <Button disabled={loading || !token} onClick={validate} className="w-full">
          {loading ? 'Validating...' : 'Validate Token'}
        </Button>
      </Card>
      
      <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">How to get an Instagram Access Token:</h3>
        <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
          <li>Go to <a href="https://developers.facebook.com" target="_blank" rel="noopener" className="underline">Facebook Developer Console</a></li>
          <li>Create or select your app with Instagram Basic Display API</li>
          <li>Generate a User Access Token with required scopes</li>
          <li>Exchange it for a Long-Lived Token (60 days validity)</li>
          <li>Ensure your Instagram account is a Business account</li>
        </ol>
      </Card>
      
      <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <h3 className="font-medium text-amber-900 dark:text-amber-100 mb-2">⚠️ Token Requirements:</h3>
        <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1 list-disc list-inside">
          <li>Must be a <strong>Page Access Token</strong> (not User Token)</li>
          <li>Page must be connected to Instagram Business Account</li>
          <li>Required scopes: <code>instagram_basic</code>, <code>instagram_content_publish</code></li>
          <li>Token should be long-lived (60 days expiry)</li>
        </ul>
      </Card>
    </div>
  );
}
