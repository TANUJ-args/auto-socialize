import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MessageSquare, FileText, Link2, BarChart3, TrendingUp, CreditCard } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import CalendarView from "@/components/dashboard/CalendarView";
import AIAssistant from "@/components/dashboard/AIAssistant";
import PostsList from "@/components/dashboard/PostsList";
import AccountsManager from "@/components/dashboard/AccountsManager";
import Analytics from "@/components/dashboard/Analytics";
import SubscriptionManager from "@/components/dashboard/SubscriptionManager";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPosts: 0,
    scheduledPosts: 0,
    publishedPosts: 0,
    connectedAccounts: 0
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadStats();
  }, [user, navigate]);

  const loadStats = async () => {
    try {
      const [postsRes, accountsRes] = await Promise.all([
        api.posts.list(),
        api.socialAccounts.list()
      ]);

      const posts = postsRes.posts;
      setStats({
        totalPosts: posts.length,
        scheduledPosts: posts.filter(p => p.status === 'scheduled').length,
        publishedPosts: posts.filter(p => p.status === 'published').length,
        connectedAccounts: accountsRes.accounts.length
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  return (
    <ScrollArea className="h-screen">
      <div className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage your social media presence
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="glass p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Posts</p>
                <p className="text-2xl font-bold">{stats.totalPosts}</p>
              </div>
              <FileText className="h-8 w-8 text-primary opacity-50" />
            </div>
          </Card>
          
          <Card className="glass p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold">{stats.scheduledPosts}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary opacity-50" />
            </div>
          </Card>
          
          <Card className="glass p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-2xl font-bold">{stats.publishedPosts}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary opacity-50" />
            </div>
          </Card>
          
          <Card className="glass p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Accounts</p>
                <p className="text-2xl font-bold">{stats.connectedAccounts}</p>
              </div>
              <Link2 className="h-8 w-8 text-primary opacity-50" />
            </div>
          </Card>
        </div>

        {/* Profile Card */}
        <Card className="glass p-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary-foreground flex items-center justify-center">
              <span className="text-2xl font-bold">
                {user?.email ? user.email[0].toUpperCase() : 'G'}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">
                {user?.email || 'Guest User'}
              </h2>
              <p className="text-muted-foreground">
                {user?.isGuest ? 'Guest Mode' : 'Pro User'}
              </p>
            </div>
            <Badge variant={user?.isGuest ? "secondary" : "default"}>
              {user?.isGuest ? 'Guest' : 'Active'}
            </Badge>
          </div>
        </Card>

        {/* Instagram Setup Prompt */}
        {stats.connectedAccounts === 0 && (
          <Card className="glass p-6 border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">🚀 Get Started with Instagram</h3>
                <p className="text-muted-foreground mt-1">
                  Connect your Instagram Business account with an access token
                </p>
              </div>
              <Button onClick={() => navigate('/instagram/token')} variant="gradient">
                Add Access Token
              </Button>
            </div>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="glass">
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="posts" className="gap-2">
              <FileText className="h-4 w-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="accounts" className="gap-2">
              <Link2 className="h-4 w-4" />
              Accounts
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Subscription
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            <CalendarView onUpdate={loadStats} />
          </TabsContent>

          <TabsContent value="ai">
            <AIAssistant onUpdate={loadStats} />
          </TabsContent>

          <TabsContent value="posts">
            <PostsList onUpdate={loadStats} />
          </TabsContent>

          <TabsContent value="accounts">
            <AccountsManager onUpdate={loadStats} />
          </TabsContent>

          <TabsContent value="analytics">
            <Analytics />
          </TabsContent>

          <TabsContent value="subscription">
            <SubscriptionManager />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
    </ScrollArea>
  );
}