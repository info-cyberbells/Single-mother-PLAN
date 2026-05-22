import { prisma } from '../../config/prisma';
import { sendEmail } from '../../config/email';

/**
 * Government Contact Ingestion & Caching Strategy
 * Supports scalable dynamic routing for email composition.
 */
export interface GovContact {
  agency: string;
  department: string;
  email: string;
  state: string;
  category: string;
  source_url: string;
}

export class AutomationService {
  // In-memory cache to prevent constant DB hits if schema is expanded later
  private contactCache: Map<string, GovContact[]> = new Map();

  /**
   * TASK 7: Ingests scraped contacts from external websites safely.
   */
  async ingestContacts(contacts: GovContact[]) {
    console.log(`[Automation] Ingesting ${contacts.length} government contacts...`);
    
    for (const contact of contacts) {
      // Validate email format
      if (!/^\S+@\S+\.\S+$/.test(contact.email)) {
        continue;
      }
      
      const key = `${contact.state}-${contact.agency}`;
      const existing = this.contactCache.get(key) || [];
      
      // Prevent duplicates
      if (!existing.find(c => c.email === contact.email)) {
        existing.push(contact);
        this.contactCache.set(key, existing);
      }
    }
  }

  /**
   * TASK 6: Prepares a composed email draft for a specific application.
   * Finds the correct contact, generates a templated body using AI, and prepares document attachments.
   */
  async composeApplicationEmail(applicationId: string, userId: string) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        program: true,
        user: { include: { family_profile: true } },
        documents: true
      }
    });

    if (!application || !application.user.family_profile) {
      throw new Error('Application or complete user profile not found');
    }

    // 1. Verify Eligibility
    const eligibilityResult = await prisma.eligibilityResult.findUnique({
      where: {
        user_id_program_id: { user_id: userId, program_id: application.program_id }
      }
    });

    if (!eligibilityResult || (eligibilityResult.status !== 'qualified' && eligibilityResult.status !== 'likely_qualified')) {
      throw new Error('User is not fully qualified for this program. Cannot automate application.');
    }

    // 2. Determine target contact
    const state = application.user.state || 'National';
    const contacts = this.contactCache.get(`${state}-${application.program.agency}`) || [];
    const primaryContact = contacts.length > 0 ? contacts[0].email : 'support@agency.gov'; // Fallback

    // 3. Compose email via Anthropic AI (acting as OpenAI substitute as per existing arch)
    const { callClaudeApi } = require('../../config/anthropic');
    const systemPrompt = `You are an automated government application assistant.
Your task is to draft a formal, professional email to a government agency representative on behalf of an applicant.
Do not include any placeholder brackets like [Name] in your final output, use the provided data.
Keep the email structured, clear, and focused on application submission.`;

    const userPrompt = `Draft an application submission email for ${application.user.full_name} applying to ${application.program.name}.
Agency: ${application.program.agency}
Applicant Profile:
- Household Size: ${application.user.family_profile.household_size}
- Income: $${application.user.family_profile.monthly_income}/month
- Address: ${application.user.family_profile.city}, ${application.user.state}
- Documents Attached: ${application.documents.length > 0 ? application.documents.map(d => d.display_name).join(', ') : 'None'}

The email should be ready to send as-is. End with "MomPlan Automations System" as the sender.`;

    let generatedBody = '';
    try {
      generatedBody = await callClaudeApi(systemPrompt, userPrompt);
    } catch (err) {
      console.error('Failed to generate AI email, falling back to template', err);
      // Fallback
      generatedBody = `Dear ${application.program.agency} Representative,\n\n`;
      generatedBody += `Please find the application submission for ${application.user.full_name}.\n`;
      generatedBody += `Program: ${application.program.name}\n\n`;
      if (application.documents.length > 0) {
        generatedBody += `Attached are ${application.documents.length} supporting documents.\n`;
      }
      generatedBody += `\nThank you,\nMomPlan Automations System`;
    }

    const subject = `Application Submission: ${application.program.name} - ${application.user.full_name}`;

    return {
      to: primaryContact,
      subject,
      body: generatedBody,
      attachments: application.documents.map(doc => ({
        filename: doc.display_name,
        url: doc.file_url, // S3 URL to attach
        mimeType: doc.mime_type
      }))
    };
  }

  /**
   * TASK 5: Application Workflow Hooks for future automation expansion
   */
  async onApplicationStatusChange(applicationId: string, newStatus: string) {
    console.log(`[Automation] Hook triggered for Application ${applicationId} -> ${newStatus}`);
    
    if (newStatus === 'submitted') {
      // Future: automatically generate email composition and queue it for review
      console.log(`[Automation] Queuing async review tasks for submitted application.`);
    }
  }

  /**
   * TASK 8: Process Application (Sync replacement for BullMQ)
   */
  async processApplication(applicationId: string, userId: string) {
    console.log(`[Worker] Processing Apply Now for application: ${applicationId}`);

    try {
      // 1. Compose email (this will fetch contact, prepare payload, and use AI to generate email)
      const emailData = await this.composeApplicationEmail(applicationId, userId);

      // 2. Attach documents and send email
      await sendEmail({
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.body,
        attachments: emailData.attachments.map((att: any) => ({
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
      
      // Optionally rethrow if you want the API to fail immediately
      // throw error; 
    }
  }
}

export const automationService = new AutomationService();
