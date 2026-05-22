import { Queue, Worker, Job } from 'bullmq';
import { redis } from '../../config/redis';
import { prisma } from '../../config/prisma';
import { sendEmail } from '../../config/email';
import { automationService } from './automation.service';

export const applyNowQueue = new Queue('apply-now-queue', { connection: redis });

export const applyNowWorker = new Worker('apply-now-queue', async (job: Job) => {
  const { applicationId, userId } = job.data;
  console.log(`[Worker] Processing Apply Now for application: ${applicationId}`);

  try {
    // 1. Compose email (this will fetch contact, prepare payload, and use AI to generate email)
    const emailData = await automationService.composeApplicationEmail(applicationId, userId);

    // 2. Attach documents and send email
    await sendEmail({
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.body,
      attachments: emailData.attachments.map(att => ({
        filename: att.filename,
        path: att.url, // Resend accepts remote URLs using 'path'
      }))
    });

    // 3. Update application tracking status
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: 'submitted', submitted_at: new Date() },
    });

    // 4. Notify user
    await prisma.notification.create({
      data: {
        user_id: userId,
        type: 'status_update',
        title: 'Application Submitted',
        message: `Your application has been successfully submitted to the agency.`,
        related_application_id: applicationId,
      },
    });

    console.log(`[Worker] Successfully processed Apply Now for application: ${applicationId}`);
  } catch (error: any) {
    console.error(`[Worker] Failed to process application ${applicationId}:`, error);
    
    // Create an error notification
    await prisma.notification.create({
      data: {
        user_id: userId,
        type: 'system',
        title: 'Application Submission Failed',
        message: `We encountered an error submitting your application. Our team has been notified. Error: ${error.message}`,
        related_application_id: applicationId,
      },
    });
    
    throw error;
  }
}, { connection: redis });

applyNowWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed with error ${err.message}`);
});
