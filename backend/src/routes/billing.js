import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getUserSubscription,
  checkUsageLimit,
  createCheckoutSession,
  handleStripeWebhook,
  getUserUsageStats,
  SUBSCRIPTION_PLANS
} from '../services/billing.js';

const router = express.Router();

/**
 * Get subscription plans (public endpoint)
 */
router.get('/plans', (req, res) => {
  res.json({
    success: true,
    plans: Object.values(SUBSCRIPTION_PLANS)
  });
});

/**
 * Get user's current subscription
 */
router.get('/subscription', authenticate, async (req, res) => {
  try {
    const { userId } = req;
    const subscription = await getUserSubscription(userId);
    
    res.json({
      success: true,
      subscription
    });
  } catch (error) {
    console.error('[Billing API] Get subscription error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

/**
 * Get user's usage statistics
 */
router.get('/usage', authenticate, async (req, res) => {
  try {
    const { userId } = req;
    const { days = 30 } = req.query;
    
    const usage = await getUserUsageStats(userId, parseInt(days));
    
    res.json({
      success: true,
      usage
    });
  } catch (error) {
    console.error('[Billing API] Get usage error:', error);
    res.status(500).json({ error: 'Failed to fetch usage statistics' });
  }
});

/**
 * Check usage limits for specific action
 */
router.get('/limits/:action', authenticate, async (req, res) => {
  try {
    const { userId } = req;
    const { action } = req.params;
    
    const limit = await checkUsageLimit(userId, action);
    
    res.json({
      success: true,
      limit
    });
  } catch (error) {
    console.error('[Billing API] Check limits error:', error);
    res.status(500).json({ error: 'Failed to check usage limits' });
  }
});

/**
 * Create Stripe checkout session for subscription
 */
router.post('/checkout', authenticate, async (req, res) => {
  try {
    const { userId } = req;
    const { planId } = req.body;
    
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan || !plan.stripePriceId) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }
    
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:8080';
    const successUrl = `${baseUrl}/dashboard?subscription_success=true`;
    const cancelUrl = `${baseUrl}/settings?subscription_canceled=true`;
    
    const checkout = await createCheckoutSession(
      userId,
      plan.stripePriceId,
      successUrl,
      cancelUrl
    );
    
    res.json({
      success: true,
      checkout
    });
  } catch (error) {
    console.error('[Billing API] Create checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

/**
 * Handle Stripe webhooks
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('[Billing API] No webhook secret configured');
      return res.status(400).json({ error: 'Webhook secret not configured' });
    }
    
    // Verify webhook signature
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    
    await handleStripeWebhook(event);
    
    res.json({ received: true });
  } catch (error) {
    console.error('[Billing API] Webhook error:', error);
    res.status(400).json({ error: 'Webhook error: ' + error.message });
  }
});

/**
 * Cancel subscription
 */
router.post('/cancel', authenticate, async (req, res) => {
  try {
    const { userId } = req;
    
    const subscription = await getUserSubscription(userId);
    
    if (!subscription.stripeSubscriptionId) {
      return res.status(400).json({ error: 'No active subscription found' });
    }
    
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    // Cancel at period end
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    });
    
    res.json({
      success: true,
      message: 'Subscription will be canceled at the end of the current period'
    });
  } catch (error) {
    console.error('[Billing API] Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

/**
 * Reactivate subscription
 */
router.post('/reactivate', authenticate, async (req, res) => {
  try {
    const { userId } = req;
    
    const subscription = await getUserSubscription(userId);
    
    if (!subscription.stripeSubscriptionId) {
      return res.status(400).json({ error: 'No subscription found' });
    }
    
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    // Remove cancel_at_period_end
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false
    });
    
    res.json({
      success: true,
      message: 'Subscription reactivated successfully'
    });
  } catch (error) {
    console.error('[Billing API] Reactivate subscription error:', error);
    res.status(500).json({ error: 'Failed to reactivate subscription' });
  }
});

export default router;