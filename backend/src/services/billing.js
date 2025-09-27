import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

// Initialize Stripe only if API key is provided
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  });
  console.log('[Billing] Stripe initialized successfully');
} else {
  console.warn('[Billing] STRIPE_SECRET_KEY not found - Stripe features disabled');
}

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    limits: {
      imagesPerMonth: 10,
      postsPerMonth: 5,
      chatMessagesPerMonth: 100,
      socialAccounts: 1
    },
    features: ['Basic AI image generation', 'Limited posts', 'Single social account']
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 9.99,
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID,
    limits: {
      imagesPerMonth: 100,
      postsPerMonth: 50,
      chatMessagesPerMonth: 1000,
      socialAccounts: 3
    },
    features: ['Advanced AI generation', 'Scheduled posting', 'Multiple accounts', 'AI captions']
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 29.99,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
    limits: {
      imagesPerMonth: 500,
      postsPerMonth: 200,
      chatMessagesPerMonth: 5000,
      socialAccounts: 10
    },
    features: ['Unlimited AI generation', 'Advanced scheduling', 'Analytics', 'Priority support']
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99.99,
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    limits: {
      imagesPerMonth: -1, // unlimited
      postsPerMonth: -1,
      chatMessagesPerMonth: -1,
      socialAccounts: -1
    },
    features: ['Unlimited everything', 'Custom integrations', 'Dedicated support', 'White-label']
  }
};

/**
 * Get user's current subscription
 */
export async function getUserSubscription(userId) {
  try {
    // Handle demo user
    if (userId === 'demo_user') {
      return {
        id: 'demo_subscription',
        userId: 'demo_user',
        plan: 'free',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
        planDetails: SUBSCRIPTION_PLANS['free']
      };
    }

    let subscription = await prisma.subscription.findUnique({
      where: { userId }
    });

    // Create free subscription if none exists
    if (!subscription) {
      subscription = await prisma.subscription.create({
        data: {
          userId,
          plan: 'free',
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      });
    }

    return {
      ...subscription,
      planDetails: SUBSCRIPTION_PLANS[subscription.plan]
    };
  } catch (error) {
    console.error('[Billing] Get subscription error:', error);
    throw error;
  }
}

/**
 * Check if user can perform action based on usage limits
 */
export async function checkUsageLimit(userId, action) {
  try {
    // Handle demo user - always allow with generous limits
    if (userId === 'demo_user') {
      return {
        allowed: true,
        used: 0,
        limit: 100,
        remaining: 100
      };
    }

    const subscription = await getUserSubscription(userId);
    const limits = subscription.planDetails.limits;

    // Unlimited plan
    if (limits[`${action}PerMonth`] === -1) {
      return { allowed: true, remaining: -1 };
    }

    // Get current month usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const usage = await prisma.usageStats.aggregate({
      where: {
        userId,
        date: {
          gte: startOfMonth,
          lt: endOfMonth
        }
      },
      _sum: {
        imagesGenerated: action === 'images',
        postsPublished: action === 'posts',
        chatMessages: action === 'chatMessages'
      }
    });

    const used = usage._sum[`${action}Generated`] || usage._sum[`${action}Published`] || usage._sum[action] || 0;
    const limit = limits[`${action}PerMonth`];
    const remaining = Math.max(0, limit - used);

    return {
      allowed: used < limit,
      used,
      limit,
      remaining
    };
  } catch (error) {
    console.error('[Billing] Check usage error:', error);
    return { allowed: false, error: error.message };
  }
}

/**
 * Track usage for billing
 */
export async function trackUsage(userId, action, count = 1) {
  try {
    // Handle demo user - just log, don't store in DB
    if (userId === 'demo_user') {
      console.log(`[Usage] Demo user tracked ${action}: +${count}`);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const updateData = {};
    updateData[action] = { increment: count };

    await prisma.usageStats.upsert({
      where: {
        userId_date: {
          userId,
          date: today
        }
      },
      update: updateData,
      create: {
        userId,
        date: today,
        ...{ [action]: count }
      }
    });

    console.log(`[Usage] Tracked ${action}: +${count} for user ${userId}`);
  } catch (error) {
    console.error('[Billing] Track usage error:', error);
  }
}

/**
 * Create Stripe checkout session
 */
export async function createCheckoutSession(userId, priceId, successUrl, cancelUrl) {
  try {
    if (!stripe) {
      throw new Error('Stripe not configured - please set STRIPE_SECRET_KEY environment variable');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    let customerId = user.subscription?.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId }
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId }
    });

    return { sessionId: session.id, url: session.url };
  } catch (error) {
    console.error('[Billing] Create checkout error:', error);
    throw error;
  }
}

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(event) {
  try {
    const eventType = event.type;
    const data = event.data.object;

    // Log the event
    console.log(`[Stripe] Received ${eventType} event`);

    switch (eventType) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(data);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(data);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSuccess(data);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailure(data);
        break;

      default:
        console.log(`[Stripe] Unhandled event type: ${eventType}`);
    }

    // Record billing event
    await prisma.billingEvent.create({
      data: {
        userId: data.metadata?.userId || 'unknown',
        type: eventType,
        stripeEventId: event.id,
        data: data,
        processed: true
      }
    });

  } catch (error) {
    console.error('[Billing] Webhook error:', error);
    throw error;
  }
}

async function handleSubscriptionUpdate(subscription) {
  if (!stripe) {
    console.error('[Billing] Stripe not configured - cannot process subscription update');
    return;
  }
  
  const customerId = subscription.customer;
  const customer = await stripe.customers.retrieve(customerId);
  const userId = customer.metadata.userId;

  if (!userId) {
    console.error('[Billing] No userId in customer metadata');
    return;
  }

  // Determine plan from price ID
  let plan = 'free';
  for (const [planId, planData] of Object.entries(SUBSCRIPTION_PLANS)) {
    if (planData.stripePriceId === subscription.items.data[0]?.price.id) {
      plan = planId;
      break;
    }
  }

  await prisma.subscription.upsert({
    where: { userId },
    update: {
      plan,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      priceId: subscription.items.data[0]?.price.id
    },
    create: {
      userId,
      plan,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      priceId: subscription.items.data[0]?.price.id
    }
  });

  console.log(`[Billing] Updated subscription for user ${userId} to ${plan}`);
}

async function handleSubscriptionCancellation(subscription) {
  if (!stripe) {
    console.error('[Billing] Stripe not configured - cannot process subscription cancellation');
    return;
  }
  
  const customerId = subscription.customer;
  const customer = await stripe.customers.retrieve(customerId);
  const userId = customer.metadata.userId;

  if (userId) {
    await prisma.subscription.update({
      where: { userId },
      data: {
        status: 'canceled',
        cancelAtPeriodEnd: true
      }
    });

    console.log(`[Billing] Canceled subscription for user ${userId}`);
  }
}

async function handlePaymentSuccess(invoice) {
  console.log(`[Billing] Payment succeeded for invoice ${invoice.id}`);
}

async function handlePaymentFailure(invoice) {
  console.log(`[Billing] Payment failed for invoice ${invoice.id}`);
}

/**
 * Get usage statistics for user
 */
export async function getUserUsageStats(userId, days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await prisma.usageStats.findMany({
      where: {
        userId,
        date: { gte: startDate }
      },
      orderBy: { date: 'desc' }
    });

    const totals = await prisma.usageStats.aggregate({
      where: {
        userId,
        date: { gte: startDate }
      },
      _sum: {
        imagesGenerated: true,
        postsPublished: true,
        chatMessages: true,
        apiCalls: true
      }
    });

    return {
      daily: stats,
      totals: totals._sum
    };
  } catch (error) {
    console.error('[Billing] Get usage stats error:', error);
    throw error;
  }
}