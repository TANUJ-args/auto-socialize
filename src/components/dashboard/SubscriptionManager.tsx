import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Check, 
  X, 
  Crown, 
  Zap, 
  Star, 
  Rocket,
  CreditCard,
  Calendar,
  TrendingUp
} from 'lucide-react';

const SubscriptionManager = () => {
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
    fetchPlans();
    fetchUsage();
  }, []);

  const fetchSubscription = async () => {
    try {
      const token = localStorage.getItem('token') || 'demo-token';
      const response = await fetch('/api/billing/subscription', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      } else {
        console.warn('Subscription not available:', response.status);
        // Set demo subscription
        setSubscription({
          plan: 'free',
          status: 'active',
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          planDetails: {
            name: 'Free',
            price: 0,
            limits: {
              imagesPerMonth: 10,
              postsPerMonth: 5,
              chatMessagesPerMonth: 100,
              socialAccounts: 1
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      setSubscription({
        plan: 'free',
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        planDetails: {
          name: 'Free',
          price: 0,
          limits: {
            imagesPerMonth: 10,
            postsPerMonth: 5,
            chatMessagesPerMonth: 100,
            socialAccounts: 1
          }
        }
      });
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/billing/plans');
      
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans);
      } else {
        console.warn('Plans not available:', response.status);
        // Set demo plans
        setPlans([
          {
            id: 'free',
            name: 'Free',
            price: 0,
            limits: { imagesPerMonth: 10, postsPerMonth: 5, chatMessagesPerMonth: 100, socialAccounts: 1 },
            features: ['Basic AI image generation', 'Limited posts', 'Single social account']
          },
          {
            id: 'starter',
            name: 'Starter',
            price: 9.99,
            limits: { imagesPerMonth: 100, postsPerMonth: 50, chatMessagesPerMonth: 1000, socialAccounts: 3 },
            features: ['Advanced AI generation', 'Scheduled posting', 'Multiple accounts', 'AI captions']
          },
          {
            id: 'pro',
            name: 'Pro',
            price: 29.99,
            limits: { imagesPerMonth: 500, postsPerMonth: 200, chatMessagesPerMonth: 5000, socialAccounts: 10 },
            features: ['Unlimited AI generation', 'Advanced scheduling', 'Analytics', 'Priority support']
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      // Fallback to demo plans
      setPlans([
        {
          id: 'free',
          name: 'Free',
          price: 0,
          limits: { imagesPerMonth: 10, postsPerMonth: 5, chatMessagesPerMonth: 100, socialAccounts: 1 },
          features: ['Basic AI image generation', 'Limited posts', 'Single social account']
        }
      ]);
    }
  };

  const fetchUsage = async () => {
    try {
      const token = localStorage.getItem('token') || 'demo-token';
      const response = await fetch('/api/billing/usage', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsage(data.usage);
      } else {
        console.warn('Usage not available:', response.status);
        // Set demo usage data
        setUsage({
          totals: {
            imagesGenerated: 3,
            postsPublished: 1,
            chatMessages: 8
          }
        });
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
      setUsage({
        totals: {
          imagesGenerated: 3,
          postsPublished: 1,
          chatMessages: 8
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId) => {
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
        },
        body: JSON.stringify({ planId })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Redirect to Stripe Checkout
        window.location.href = data.checkout.url;
      } else {
        alert('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Failed to upgrade:', error);
      alert('Failed to upgrade subscription');
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? It will remain active until the end of your billing period.')) {
      return;
    }

    try {
      const response = await fetch('/api/billing/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
        }
      });
      
      if (response.ok) {
        alert('Subscription canceled successfully');
        fetchSubscription();
      } else {
        alert('Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Failed to cancel:', error);
      alert('Failed to cancel subscription');
    }
  };

  const getPlanIcon = (planId) => {
    switch (planId) {
      case 'free': return <Star className="w-5 h-5 text-gray-500" />;
      case 'starter': return <Zap className="w-5 h-5 text-blue-500" />;
      case 'pro': return <Crown className="w-5 h-5 text-purple-500" />;
      case 'enterprise': return <Rocket className="w-5 h-5 text-orange-500" />;
      default: return <Star className="w-5 h-5 text-gray-500" />;
    }
  };

  const getUsagePercentage = (used, limit) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const formatLimit = (limit) => {
    return limit === -1 ? 'Unlimited' : limit.toLocaleString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Subscription & Billing</h2>
        <p className="text-gray-600">Manage your subscription and view usage limits</p>
      </div>

      {/* Current Subscription */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getPlanIcon(subscription.plan)}
              Current Plan: {subscription.planDetails?.name || 'Unknown'}
              <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                {subscription.status}
              </Badge>
            </CardTitle>
            <CardDescription>
              {subscription.plan === 'free' 
                ? 'You are on the free plan' 
                : `$${subscription.planDetails?.price}/month`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium">Billing Period</p>
                <p className="text-sm text-gray-600">
                  {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-sm text-gray-600 capitalize">
                  {subscription.status}
                  {subscription.cancelAtPeriodEnd && ' (Canceling)'}
                </p>
              </div>
              <div className="flex gap-2">
                {subscription.plan !== 'free' && subscription.status === 'active' && (
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    Cancel
                  </Button>
                )}
                {subscription.plan !== 'enterprise' && (
                  <Button size="sm" onClick={() => handleUpgrade('pro')}>
                    Upgrade
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Stats */}
      {usage && subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Current Usage</CardTitle>
            <CardDescription>This month's activity and limits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Images */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Images Generated</span>
                  <span className="text-sm text-gray-600">
                    {usage.totals.imagesGenerated || 0} / {formatLimit(subscription.planDetails?.limits.imagesPerMonth)}
                  </span>
                </div>
                <Progress 
                  value={getUsagePercentage(
                    usage.totals.imagesGenerated || 0, 
                    subscription.planDetails?.limits.imagesPerMonth
                  )} 
                  className="h-2"
                />
              </div>

              {/* Posts */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Posts Published</span>
                  <span className="text-sm text-gray-600">
                    {usage.totals.postsPublished || 0} / {formatLimit(subscription.planDetails?.limits.postsPerMonth)}
                  </span>
                </div>
                <Progress 
                  value={getUsagePercentage(
                    usage.totals.postsPublished || 0, 
                    subscription.planDetails?.limits.postsPerMonth
                  )} 
                  className="h-2"
                />
              </div>

              {/* Chat Messages */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Chat Messages</span>
                  <span className="text-sm text-gray-600">
                    {usage.totals.chatMessages || 0} / {formatLimit(subscription.planDetails?.limits.chatMessagesPerMonth)}
                  </span>
                </div>
                <Progress 
                  value={getUsagePercentage(
                    usage.totals.chatMessages || 0, 
                    subscription.planDetails?.limits.chatMessagesPerMonth
                  )} 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Available Plans</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <Card key={plan.id} className={`relative ${subscription?.plan === plan.id ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {getPlanIcon(plan.id)}
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-2xl font-bold">
                  {plan.price === 0 ? 'Free' : `$${plan.price}`}
                  {plan.price > 0 && <span className="text-sm font-normal">/month</span>}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <div className="space-y-2 mb-4 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Images:</span>
                    <span>{formatLimit(plan.limits.imagesPerMonth)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Posts:</span>
                    <span>{formatLimit(plan.limits.postsPerMonth)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Accounts:</span>
                    <span>{formatLimit(plan.limits.socialAccounts)}</span>
                  </div>
                </div>

                {subscription?.plan === plan.id ? (
                  <Badge variant="default" className="w-full justify-center">
                    Current Plan
                  </Badge>
                ) : (
                  <Button 
                    className="w-full" 
                    variant={plan.id === 'pro' ? 'default' : 'outline'}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={plan.price === 0}
                  >
                    {plan.price === 0 ? 'Free Plan' : 'Upgrade'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManager;