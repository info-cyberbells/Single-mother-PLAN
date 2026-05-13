import { env } from '../../config/env';
import { prisma } from '../../config/prisma';
import { stripe } from '../../config/stripe';
import { sendEmail } from '../../config/email';

export const runSubscriptionSyncTask = async () => {
  try {
    console.log('💳 Running daily subscription-sync background job...');

    const isPlaceholder = env.STRIPE_SECRET_KEY.includes('placeholder');
    if (isPlaceholder) {
      console.log('⚠️ Skipping active Stripe remote API polling due to placeholder keys.');
      return;
    }

    // Find users with premium subscription records
    const users = await prisma.user.findMany({
      where: {
        plan: { in: ['family', 'navigator'] },
        stripe_subscription_id: { not: null },
      },
    });

    for (const user of users) {
      if (!user.stripe_subscription_id) continue;

      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);

        if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
          // Downgrade user plan to free
          await prisma.user.update({
            where: { id: user.id },
            data: {
              plan: 'free',
              stripe_subscription_id: null,
            },
          });

          // Create notification
          await prisma.notification.create({
            data: {
              user_id: user.id,
              type: 'system',
              title: 'Subscription Cancelled or Past Due',
              message: 'Your MomPlan premium membership has been deactivated. Your account is now on the Free tier.',
            },
          });

          // Send Email
          await sendEmail({
            to: user.email,
            subject: 'MomPlan Subscription Update',
            html: `<h1>Subscription Deactivated</h1>
            <p>Hello ${user.full_name},</p>
            <p>We were unable to verify an active status for your premium plan subscription. Your account tier has been downgraded to Free.</p>
            <p>You can review or update your payment credentials via your user dashboard portal anytime to resume priority features.</p>`,
          });
        }
      } catch (err: any) {
        console.error(`Failed to sync subscription for user ${user.id}:`, err.message);
      }
    }

    console.log('✅ Daily subscription-sync job finished successfully.');
  } catch (err: any) {
    console.error('❌ Subscription sync job failed with error:', err.message);
  }
};
