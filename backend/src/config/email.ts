import { Resend } from 'resend';
import { env } from './env';

const resend = new Resend(env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: SendEmailOptions): Promise<void> => {
  const isPlaceholder = env.RESEND_API_KEY.includes('placeholder');

  if (isPlaceholder) {
    console.log(`✉️ [MOCK EMAIL] To: ${to} | Subject: ${subject}`);
    console.log(`Content: ${html}`);
    return;
  }

  try {
    const data = await resend.emails.send({
      from: 'MomPlan Notifications <notifications@momplan.gov-assist.com>',
      to,
      subject,
      html,
    });
    console.log('✅ Email sent successfully:', data);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
  }
};
