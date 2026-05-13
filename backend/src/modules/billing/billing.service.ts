import { prisma } from '../../config/prisma';
import { stripe } from '../../config/stripe';
import { env } from '../../config/env';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { sendEmail } from '../../config/email';
import { UserPlan } from '@prisma/client';
import Stripe from 'stripe';

// Map plan enum to demo Stripe Price IDs
const PLAN_PRICES: Record<string, string> = {
  family: 'price_momplan_family_monthly',
  navigator: 'price_momplan_navigator_monthly',
};

export class BillingService {
  async createCheckoutSession(userId: string, plan: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (plan === 'free') {
      throw new BadRequestError('Free plan does not require checkout');
    }

    const priceId = PLAN_PRICES[plan];
    if (!priceId) {
      throw new BadRequestError('Invalid plan selected for checkout');
    }

    const isPlaceholder = env.STRIPE_SECRET_KEY.includes('placeholder');

    if (isPlaceholder) {
      console.log(`⚠️ [MOCK STRIPE CHECKOUT] Plan: ${plan} for User: ${user.email}`);
      // Directly update the DB for local simulated demonstration workflow
      await prisma.user.update({
        where: { id: userId },
        data: {
          plan: plan as UserPlan,
          stripe_customer_id: `cus_mock_${userId}`,
          stripe_subscription_id: `sub_mock_${Date.now()}`,
        },
      });

      // Send confirmation email
      await sendEmail({
        to: user.email,
        subject: `MomPlan Subscription Confirmed: ${plan.toUpperCase()}`,
        html: `<h1>Thank you for subscribing to the ${plan.toUpperCase()} plan!</h1>
        <p>Your premium features including automated smart recertification alerts and enhanced counselor booking priority are now fully active.</p>`,
      });

      return { url: `${env.FRONTEND_URL}/dashboard?checkout=success` };
    }

    // Execute real Stripe Checkout session
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripe_customer_id: customerId },
      });
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
      success_url: `${env.FRONTEND_URL}/dashboard?checkout=success`,
      cancel_url: `${env.FRONTEND_URL}/pricing?checkout=cancelled`,
      metadata: {
        userId: user.id,
        plan,
      },
    });

    return { url: session.url };
  }

  async createPortalSession(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.stripe_customer_id) {
      throw new BadRequestError('No active billing customer record found');
    }

    const isPlaceholder = env.STRIPE_SECRET_KEY.includes('placeholder');
    if (isPlaceholder) {
      return { url: `${env.FRONTEND_URL}/pricing?simulated_portal=true` };
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${env.FRONTEND_URL}/dashboard`,
    });

    return { url: portalSession.url };
  }

  async getSubscriptionStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        stripe_customer_id: true,
        stripe_subscription_id: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    let status = 'active';
    let current_period_end = null;

    if (user.stripe_subscription_id && !env.STRIPE_SECRET_KEY.includes('placeholder')) {
      try {
        const sub = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
        status = sub.status;
        current_period_end = new Date(sub.current_period_end * 1000);
      } catch (err) {
        console.error('Failed to retrieve subscription from Stripe:', err);
      }
    }

    return {
      plan: user.plan,
      status,
      current_period_end,
      stripe_subscription_id: user.stripe_subscription_id,
    };
  }

  async handleWebhook(signature: string, rawBody: Buffer) {
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error('⚠️ Stripe webhook signature verification failed:', err.message);
      throw new BadRequestError(`Webhook Error: ${err.message}`);
    }

    // Process event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan as UserPlan;

        if (userId && plan) {
          const user = await prisma.user.update({
            where: { id: userId },
            data: {
              plan,
              stripe_subscription_id: session.subscription as string,
            },
          });

          await sendEmail({
            to: user.email,
            subject: `MomPlan Subscription Confirmed: ${plan.toUpperCase()}`,
            html: `<h1>Thank you for subscribing to the ${plan.toUpperCase()} plan!</h1>
            <p>Your premium features are now fully enabled.</p>`,
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const user = await prisma.user.findFirst({
          where: { stripe_customer_id: customerId },
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              plan: 'free',
              stripe_subscription_id: null,
            },
          });

          await sendEmail({
            to: user.email,
            subject: 'MomPlan Subscription Cancelled',
            html: `<h1>Subscription Cancelled</h1>
            <p>Hello ${user.full_name}, your premium MomPlan tier has been downgraded to Free.</p>
            <p>You can upgrade anytime via your dashboard.</p>`,
          });
        }
        break;
      }
    }
  }
}
