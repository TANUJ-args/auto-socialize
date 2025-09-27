import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Instagram, Twitter, Linkedin, Link2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";

interface AccountsManagerProps {
  onUpdate?: () => void;
}

export default function AccountsManager({ onUpdate }: AccountsManagerProps) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    loadAccounts();
    // Listen for OAuth popup message
    const handler = async (event: MessageEvent) => {
      if (typeof event.data !== 'object' || !event.data) return;
      if (event.data.type === 'instagram-oauth') {
        const payload = JSON.parse(event.data.payload || '{}');
        if (payload.success) {
          toast.success('Instagram connected successfully');
          // Auto-verify the newly connected account
          setTimeout(async () => {
            await loadAccounts();
            await autoVerifyInstagram();
            onUpdate?.();
          }, 600);
        } else {
          toast.error(payload.error || 'Instagram connection failed');
        }
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const checkInstagramConnection = () => {
    const token = localStorage.getItem('ig_access_token');
    return {
      connected: !!token,
      tokenType: token === 'DEMO_TOKEN_FOR_TESTING' ? 'demo' : token ? 'real' : null,
      tokenPreview: token ? token.substring(0, 20) + '...' : null
    };
  };

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const { accounts } = await api.socialAccounts.list();
      setAccounts(accounts);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectInstagram = () => {
    if (!API_URL) {
      toast.error("Please set VITE_API_URL in your environment variables");
      return;
    }
    
    if (!user?.id) {
      toast.error("Please login to connect Instagram");
      return;
    }
    
    toast.info("Opening Instagram authorization window...");
    const authUrl = `${API_URL}/api/instagram/oauth/start?userId=${user?.id}`;
    const popup = window.open(authUrl, 'instagram-auth', 'width=600,height=700,scrollbars=yes,resizable=yes');
    
    if (!popup) {
      toast.error("Popup blocked. Please allow popups for this site.");
      return;
    }
    
    // Listen for popup close
    const checkPopup = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkPopup);
        setTimeout(() => {
          loadAccounts();
          onUpdate?.();
        }, 1000);
      }
    }, 1000);
    
    // Auto-close popup after 5 minutes to prevent hanging
    setTimeout(() => {
      if (!popup?.closed) {
        popup?.close();
        clearInterval(checkPopup);
        toast.error("Instagram connection timed out");
      }
    }, 5 * 60 * 1000);
  };

  const verifyInstagram = async () => {
    setVerifying(true);
    try {
      const response = await api.socialAccounts.verifyInstagram();
      toast.success(`Instagram account @${response.account.username} verified!`);
      loadAccounts();
    } catch (error: any) {
      toast.error(error.message || "Failed to verify Instagram account");
    } finally {
      setVerifying(false);
    }
  };

  const autoVerifyInstagram = async () => {
    try {
      const response = await api.socialAccounts.verifyInstagram();
      toast.success(`Instagram API verified for @${response.account.username}!`);
      loadAccounts();
    } catch (error: any) {
      console.warn('Auto-verification failed:', error.message);
      // Don't show error toast for auto-verification failures
    }
  };

  const disconnectAccount = async (platform: string) => {
    if (!confirm(`Disconnect ${platform} account?`)) return;
    
    try {
      await api.socialAccounts.disconnect(platform);
      toast.success(`${platform} account disconnected`);
      loadAccounts();
      onUpdate?.();
    } catch (error) {
      toast.error(`Failed to disconnect ${platform}`);
    }
  };

  const addAccessToken = () => {
    window.location.href = '/instagram/token';
  };

  const platforms = [
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color: 'from-purple-500 to-pink-500',
      available: true
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: Twitter,
      color: 'from-blue-400 to-blue-600',
      available: false
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'from-blue-600 to-blue-800',
      available: false
    }
  ];

  return (
    <Card className="glass p-6">
      <div className="flex items-center gap-2 mb-6">
        <Link2 className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Connected Accounts</h2>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {platforms.map((platform, index) => {
            const account = accounts.find(a => a.platform === platform.id);
            const Icon = platform.icon;
            
            return (
              <motion.div
                key={platform.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 border rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{platform.name}</h3>
                        {!platform.available && (
                          <Badge variant="secondary">Coming Soon</Badge>
                        )}
                        {account && (
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        )}
                      </div>
                      
                      {account && (
                        <p className="text-sm text-muted-foreground">
                          @{account.username}
                        </p>
                      )}
                      
                      {!platform.available && (
                        <p className="text-sm text-muted-foreground">
                          Integration coming in the next update
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {platform.available && !account && platform.id === 'instagram' && (
                      <>
                        <motion.div whileTap={{ scale: 0.98 }} whileHover={{ scale: 1.02 }}>
                          <Button
                            variant="gradient"
                            onClick={connectInstagram}
                            className="mr-2"
                          >
                            Connect via OAuth
                          </Button>
                        </motion.div>
                        <motion.div whileTap={{ scale: 0.98 }} whileHover={{ scale: 1.02 }}>
                          <Button
                            variant="outline"
                            onClick={addAccessToken}
                          >
                            Add Access Token
                          </Button>
                        </motion.div>
                      </>
                    )}
                    
                    {platform.available && !account && platform.id !== 'instagram' && (
                      <motion.div whileTap={{ scale: 0.98 }} whileHover={{ scale: 1.02 }}>
                        <Button
                          variant="gradient"
                          onClick={() => platform.id === 'instagram' && connectInstagram()}
                        >
                          Connect {platform.name}
                        </Button>
                      </motion.div>
                    )}
                    
                    {platform.id === 'instagram' && account && (
                      <>
                        <motion.div whileTap={{ scale: 0.98 }} whileHover={{ scale: 1.02 }}>
                          <Button
                            variant="outline"
                            onClick={verifyInstagram}
                            disabled={verifying}
                          >
                            {verifying ? 'Verifying...' : 'Test API'}
                          </Button>
                        </motion.div>
                        <Button
                          variant="destructive"
                          onClick={() => disconnectAccount(platform.id)}
                        >
                          Disconnect
                        </Button>
                      </>
                    )}
                    
                    {!platform.available && (
                      <Button variant="outline" disabled>
                        Coming Soon
                      </Button>
                    )}
                  </div>
                </div>
                
                {platform.id === 'instagram' && account && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Make sure your Instagram account is a Business account for full API access
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <h3 className="font-medium mb-2">OAuth Setup Tips</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Ensure VITE_API_URL is set to your backend URL</li>
          <li>• Instagram requires a Facebook App with Instagram Basic Display API</li>
          <li>• Add your redirect URI to the Facebook App settings</li>
        </ul>
      </div>
    </Card>
  );
}