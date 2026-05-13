import { env } from '../../config/env';
import { prisma } from '../../config/prisma';
import { sendEmail } from '../../config/email';

export const runRenewalCheckTask = async () => {
  try {
    console.log('🔄 Running monthly renewal-check background job...');

    // Find applications approved more than 11 months ago
    const elevenMonthsAgo = new Date();
    elevenMonthsAgo.setMonth(elevenMonthsAgo.getMonth() - 11);

    const applications = await prisma.application.findMany({
      where: {
        status: 'approved',
        last_updated_at: {
          lte: elevenMonthsAgo,
        },
      },
      include: {
        user: true,
        program: true,
      },
    });

    for (const app of applications) {
      // Flag application as needing action / renewal recertification
      await prisma.application.update({
        where: { id: app.id },
        data: {
          status: 'action_required',
          notes: 'Automated renewal recertification check required. Please upload fresh proof documents.',
        },
      });

      // Create internal notification
      const msg = `Your approved application for ${app.program.name} is approaching its annual renewal recertification deadline.`;
      await prisma.notification.create({
        data: {
          user_id: app.user_id,
          type: 'document_required',
          title: 'Annual Renewal Recertification Required',
          message: msg,
          related_application_id: app.id,
        },
      });

      // Trigger Email
      await sendEmail({
        to: app.user.email,
        subject: `MomPlan Recertification Notice: ${app.program.name}`,
        html: `<h1>Annual Benefit Renewal Required</h1>
        <p>Hello ${app.user.full_name},</p>
        <p>${msg}</p>
        <p>Government benefit agencies typically require updated income verification every 12 months to maintain active benefits.</p>
        <p>Please log into your dashboard to start the recertification flow and prevent potential coverage lapses.</p>`,
      });
    }

    console.log('✅ Monthly renewal-check job finished successfully.');
  } catch (err: any) {
    console.error('❌ Renewal check job failed with error:', err.message);
  }
};
