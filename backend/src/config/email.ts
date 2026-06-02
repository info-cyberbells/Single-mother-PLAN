import { Resend } from 'resend';
import { env } from './env';
import fs from 'fs';
import path from 'path';

const resend = new Resend(env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; path?: string; content?: string | Buffer }>;
}

function resolveLocalPath(filePath: string): string | null {
  if (fs.existsSync(filePath)) {
    return filePath;
  }
  const uploadsIndex = filePath.indexOf('uploads');
  if (uploadsIndex !== -1) {
    const relativePath = filePath.substring(uploadsIndex);
    const resolvedPath = path.join(process.cwd(), relativePath);
    if (fs.existsSync(resolvedPath)) {
      return resolvedPath;
    }
    const resolvedPathSub = path.join(process.cwd(), 'backend', relativePath);
    if (fs.existsSync(resolvedPathSub)) {
      return resolvedPathSub;
    }
  }
  return null;
}

export const sendEmail = async ({ to, subject, html, attachments }: SendEmailOptions): Promise<void> => {
  const isPlaceholder = env.RESEND_API_KEY.includes('placeholder');

  let processedAttachments: any[] | undefined = undefined;
  if (attachments && attachments.length > 0) {
    processedAttachments = attachments.map(att => {
      if (att.path && !att.path.startsWith('http://') && !att.path.startsWith('https://')) {
        const resolved = resolveLocalPath(att.path);
        if (resolved) {
          try {
            const content = fs.readFileSync(resolved);
            return {
              filename: att.filename,
              content,
            };
          } catch (err) {
            console.error(`❌ Failed to read local attachment: ${resolved}`, err);
          }
        } else {
          console.warn(`⚠️ Could not resolve local attachment path: ${att.path}`);
        }
      }
      return att;
    });
  }

  if (isPlaceholder) {
    console.log(`✉️ [MOCK EMAIL] To: ${to} | Subject: ${subject}`);
    console.log(`Content: ${html}`);
    if (processedAttachments && processedAttachments.length > 0) {
      console.log(`Attachments: ${processedAttachments.length} files attached.`);
      processedAttachments.forEach(att => {
        console.log(` - ${att.filename} (${att.content ? 'Buffer' : att.path})`);
      });
    }
    return;
  }

  try {
    const data = await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to,
      subject,
      html,
      attachments: processedAttachments,
    });
    console.log('✅ Email sent successfully:', data);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
  }
};
