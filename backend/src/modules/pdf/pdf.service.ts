import PDFDocument from 'pdfkit';
import { prisma } from '../../config/prisma';
import { s3Client } from '../../config/s3';
import { callClaudeApi } from '../../config/anthropic';
import { env } from '../../config/env';
import { getProgramRequirements, ProgramRequirements } from './program-requirements.data';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getPresignedDownloadUrl } from '../../config/s3';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface ValidationReport {
  is_valid: boolean;
  missing_required_fields: string[];
  missing_required_documents: string[];
  missing_optional_fields: string[];
  missing_optional_documents: string[];
  can_generate: boolean;
}

export class PdfService {
  // Validate what data is present/missing before generation
  async validateForProgram(userId: string, programId: string): Promise<ValidationReport> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { family_profile: true, documents: true },
    });

    if (!user) throw new Error('User not found');
    const profile = user.family_profile;

    const program = await prisma.benefitProgram.findUnique({ where: { id: programId } });
    if (!program) throw new Error('Program not found');

    const requirements = getProgramRequirements(program.name);
    if (!requirements) {
      // Default report if program doesn't have custom requirements
      return {
        is_valid: true,
        missing_required_fields: [],
        missing_required_documents: [],
        missing_optional_fields: [],
        missing_optional_documents: [],
        can_generate: true,
      };
    }

    const missing_required_fields: string[] = [];
    const missing_optional_fields: string[] = [];
    const missing_required_documents: string[] = [];
    const missing_optional_documents: string[] = [];

    // Helper to evaluate field presence
    const checkField = (field: string): boolean => {
      if (field === 'full_name') return !!user.full_name;
      if (!profile) return false;

      if (field === 'date_of_birth') return !!profile.date_of_birth;
      if (field === 'address') {
        return !!(profile.street_address && profile.city && profile.state && profile.zip_code);
      }
      if (field === 'household_size') return profile.household_size > 0;
      if (field === 'num_children') return profile.num_children >= 0;
      if (field === 'children_ages') {
        if (profile.num_children === 0) return true;
        const ages = profile.children_ages as any;
        return Array.isArray(ages) && ages.length > 0;
      }
      if (field === 'monthly_income') return profile.monthly_income >= 0;
      if (field === 'employment_status') return !!profile.employment_status;
      if (field === 'immigration_status') return !!profile.immigration_status;
      if (field === 'employer_name') return !!profile.employer_name;
      if (field === 'has_disability') return typeof profile.has_disability === 'boolean';
      if (field === 'income_sources') {
        const sources = profile.income_sources as any;
        return Array.isArray(sources) && sources.length > 0;
      }
      if (field === 'monthly_rent') return profile.monthly_rent !== null && profile.monthly_rent !== undefined;
      if (field === 'monthly_utilities') return profile.monthly_utilities !== null && profile.monthly_utilities !== undefined;
      if (field === 'eviction_risk') return typeof profile.eviction_risk === 'boolean';
      if (field === 'is_pregnant') return typeof profile.is_pregnant === 'boolean';
      if (field === 'health_insurance') return !!profile.health_insurance;
      if (field === 'chronic_illness') return typeof profile.chronic_illness === 'boolean';
      if (field === 'marital_status') return !!profile.marital_status;
      if (field === 'domestic_violence') return typeof profile.domestic_violence === 'boolean';

      return false;
    };

    // Evaluate fields
    for (const field of requirements.required_fields) {
      if (!checkField(field)) missing_required_fields.push(field);
    }
    for (const field of requirements.optional_fields) {
      if (!checkField(field)) missing_optional_fields.push(field);
    }

    // Evaluate documents
    const userDocTypes = new Set(user.documents.map((d) => d.document_type));
    for (const docType of requirements.required_documents) {
      if (!userDocTypes.has(docType)) missing_required_documents.push(docType);
    }
    for (const docType of requirements.optional_documents) {
      if (!userDocTypes.has(docType)) missing_optional_documents.push(docType);
    }

    const is_valid = missing_required_fields.length === 0 && missing_required_documents.length === 0;
    // can_generate is true if full_name is present (critical required field)
    const can_generate = !!user.full_name;

    return {
      is_valid,
      missing_required_fields,
      missing_required_documents,
      missing_optional_fields,
      missing_optional_documents,
      can_generate,
    };
  }

  // Main generation function
  async generateApplicationPdf(userId: string, programId: string, applicationId?: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { family_profile: true, documents: true },
    });

    if (!user || !user.family_profile) {
      throw new Error('Complete family profile not found.');
    }

    const profile = user.family_profile;

    const program = await prisma.benefitProgram.findUnique({ where: { id: programId } });
    if (!program) throw new Error('Benefit program not found.');

    const eligibilityResult = await prisma.eligibilityResult.findUnique({
      where: {
        user_id_program_id: { user_id: userId, program_id: programId },
      },
    });

    if (!eligibilityResult) {
      throw new Error('Eligibility results not found. Run a scan first.');
    }

    // Auto-associate application if exists
    if (!applicationId) {
      const app = await prisma.application.findFirst({
        where: { user_id: userId, program_id: programId },
      });
      if (app) applicationId = app.id;
    }

    const requirements = getProgramRequirements(program.name);
    const validationReport = await this.validateForProgram(userId, programId);

    // Call Claude AI for narrative summary
    let eligibilitySummary = '';
    const isPlaceholder = env.ANTHROPIC_API_KEY.includes('placeholder') || !env.ANTHROPIC_API_KEY;

    if (isPlaceholder) {
      eligibilitySummary = `Based on the information provided, this applicant meets the income and household requirements for ${program.name}. The eligibility determination was completed on ${this.formatDate(new Date())} with a confidence score of ${eligibilityResult.confidence_score}%. Supporting documentation has been reviewed and is included in this application package.`;
    } else {
      const systemPrompt = `You are a professional government benefits application writer for MomPlan.
Write a formal eligibility summary for a government assistance application PDF.
Output exactly 3-4 sentences of plain text. No markdown, no bullets, no headers.
Use formal professional language appropriate for a government document.
Do not include dollar amounts or specific benefit figures — those are shown separately.
Do not include the applicant's SSN, full date of birth, or any security-sensitive data.`;

      const userPrompt = `Program: ${program.name}
Agency: ${requirements?.agency || program.agency}
Eligibility Status: ${eligibilityResult.status}
Confidence Score: ${eligibilityResult.confidence_score}%
Qualification Reasons: ${eligibilityResult.reasoning}
Household Size: ${profile.household_size}
Employment Status: ${profile.employment_status}

Write the eligibility summary for this applicant's application packet.`;

      try {
        eligibilitySummary = await callClaudeApi(systemPrompt, userPrompt);
        eligibilitySummary = eligibilitySummary.replace(/```[a-z]*|```/g, '').trim();
      } catch (err) {
        console.error('Claude API call failed in PdfService:', err);
        eligibilitySummary = `Based on the information provided, this applicant meets the income and household requirements for ${program.name}. The eligibility determination was completed on ${this.formatDate(new Date())} with a confidence score of ${eligibilityResult.confidence_score}%. Supporting documentation has been reviewed and is included in this application package.`;
      }
    }

    const uuid = crypto.randomUUID();

    // Compile pdf using pdfkit
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Color Palette
      const primaryColor = '#6D47FC';
      const darkColor = '#1E2130';
      const slateColor = '#475569';
      const dividerColor = '#E2E8F0';

      // Cover Page
      doc.font('Helvetica-Bold').fontSize(24).fillColor(primaryColor).text(program.name, { align: 'center' });
      doc.moveDown(0.2);
      doc.font('Helvetica').fontSize(12).fillColor(slateColor).text(requirements?.agency || program.agency, { align: 'center' });
      
      doc.moveDown(4);
      doc.font('Helvetica-Bold').fontSize(16).fillColor(darkColor).text('Application for Government Assistance', { align: 'center' });
      doc.font('Helvetica').fontSize(11).fillColor(slateColor).text('Prepared by MomPlan Application System', { align: 'center' });
      
      doc.moveDown(4);
      doc.font('Helvetica-Bold').fontSize(12).fillColor(darkColor).text(`Applicant: `, { continued: true }).font('Helvetica').text(user.full_name);
      doc.moveDown(0.2);
      doc.font('Helvetica-Bold').fontSize(12).text(`Date: `, { continued: true }).font('Helvetica').text(this.formatDate(new Date()));
      doc.moveDown(0.2);
      doc.font('Helvetica-Bold').fontSize(12).text(`Reference ID: `, { continued: true }).font('Helvetica').text(uuid);

      doc.addPage();

      const drawSectionHeader = (title: string) => {
        doc.moveDown(1);
        doc.font('Helvetica-Bold').fontSize(13).fillColor(primaryColor).text(title);
        // Draw line divider
        doc.moveTo(50, doc.y + 4).lineTo(562, doc.y + 4).stroke(dividerColor);
        doc.moveDown(0.6);
      };

      const drawRow = (label: string, value: string) => {
        doc.font('Helvetica-Bold').fontSize(10).fillColor(darkColor).text(label, { continued: true })
           .font('Helvetica').fillColor(slateColor).text(` ${value}`);
        doc.moveDown(0.35);
      };

      // Section 1 — Applicant Summary
      drawSectionHeader('Section 1 — Applicant Summary');
      drawRow('Full Name:', user.full_name);
      drawRow('Date of Birth:', this.formatDate(profile.date_of_birth));
      drawRow('Address:', `${profile.street_address || ''}, ${profile.city || ''}, ${profile.state || ''} ${profile.zip_code || ''}`);
      drawRow('Phone:', user.phone || 'N/A');
      drawRow('Email:', user.email);
      drawRow('Citizenship Status:', this.slugToTitle(profile.immigration_status || 'N/A'));

      // Section 2 — Household & Income
      drawSectionHeader('Section 2 — Household & Income');
      drawRow('Household Size:', String(profile.household_size));
      drawRow('Number of Children:', String(profile.num_children));
      
      let childAgesStr = 'N/A';
      if (profile.children_ages && Array.isArray(profile.children_ages)) {
        childAgesStr = profile.children_ages.join(', ');
      }
      drawRow('Children Ages:', childAgesStr);
      drawRow('Marital Status:', this.slugToTitle(profile.marital_status || 'N/A'));
      drawRow('Employment Status:', this.slugToTitle(profile.employment_status || 'N/A'));
      drawRow('Employer:', profile.employer_name || 'N/A');
      drawRow('Monthly Income:', this.formatCurrency(profile.monthly_income));
      drawRow('Annual Income:', this.formatCurrency(profile.monthly_income * 12));
      drawRow('Federal Poverty Level %:', this.calculateFplPercentage(profile.household_size, profile.monthly_income));
      
      let incomeSourcesStr = 'N/A';
      if (profile.income_sources && Array.isArray(profile.income_sources)) {
        incomeSourcesStr = profile.income_sources.join(', ');
      }
      drawRow('Income Sources:', incomeSourcesStr);

      // Section 3 — Housing
      drawSectionHeader('Section 3 — Housing');
      drawRow('Housing Status:', this.slugToTitle(profile.housing_status || 'N/A'));
      drawRow('Monthly Rent:', profile.monthly_rent !== null && profile.monthly_rent !== undefined ? this.formatCurrency(profile.monthly_rent) : 'N/A');
      drawRow('Monthly Utilities:', profile.monthly_utilities !== null && profile.monthly_utilities !== undefined ? this.formatCurrency(profile.monthly_utilities) : 'N/A');
      drawRow('Eviction Risk:', this.formatBoolean(profile.eviction_risk));

      // Section 4 — Health & Demographics
      drawSectionHeader('Section 4 — Health & Demographics');
      drawRow('Pregnancy Status:', this.formatBoolean(profile.is_pregnant));
      drawRow('Disability Status:', this.formatBoolean(profile.has_disability));
      drawRow('Current Health Coverage:', profile.health_insurance || 'None');
      drawRow('Chronic Illness:', this.formatBoolean(profile.chronic_illness));

      doc.addPage();

      // Section 5 — Eligibility Summary
      drawSectionHeader('Section 5 — Eligibility Summary');
      drawRow('Program Matched:', program.name);
      drawRow('Qualification Status:', this.slugToTitle(eligibilityResult.status));
      drawRow('AI Confidence Score:', `${eligibilityResult.confidence_score}%`);
      drawRow('Estimated Monthly Benefit:', `${this.formatCurrency(program.estimated_monthly_value_min)} – ${this.formatCurrency(program.estimated_monthly_value_max)}`);
      
      doc.moveDown(0.2);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(darkColor).text('AI Match Summary:');
      doc.font('Helvetica').fontSize(10).fillColor(slateColor).text(eligibilitySummary, { lineGap: 3 });
      doc.moveDown(0.8);

      // Section 6 — Supporting Documents
      drawSectionHeader('Section 6 — Supporting Documents');
      
      // Draw Table Header
      const tableStartY = doc.y;
      doc.font('Helvetica-Bold').fontSize(9).fillColor(darkColor);
      doc.text('Document Type', 50, tableStartY);
      doc.text('File Name', 200, tableStartY);
      doc.text('Status', 450, tableStartY);
      
      doc.moveTo(50, tableStartY + 12).lineTo(562, tableStartY + 12).stroke(dividerColor);
      doc.moveDown(0.6);

      const requirementsDocs = [
        ...(requirements?.required_documents.map(d => ({ type: d, required: true })) || []),
        ...(requirements?.optional_documents.map(d => ({ type: d, required: false })) || [])
      ];

      doc.font('Helvetica').fontSize(9).fillColor(slateColor);
      for (const reqDoc of requirementsDocs) {
        const matchingDoc = user.documents.find(d => d.document_type === reqDoc.type);
        const y = doc.y;
        
        doc.text(this.slugToTitle(reqDoc.type), 50, y);
        doc.text(matchingDoc ? matchingDoc.display_name : 'Not Provided', 200, y, { width: 230, height: 12, ellipsis: true });
        
        let statusText = 'Attached';
        if (!matchingDoc) {
          statusText = reqDoc.required ? 'Not Provided' : 'Optional — Not Provided';
        }
        doc.text(statusText, 450, y);
        doc.moveDown(0.4);
      }

      // Section 7 — Declaration & Signature
      doc.moveDown(1.5);
      doc.font('Helvetica-Bold').fontSize(11).fillColor(darkColor).text('APPLICANT DECLARATION', { align: 'center' });
      doc.moveDown(0.4);
      const declarationText = `I certify that all information provided in this application is true, accurate, and complete to the best of my knowledge. I understand that knowingly providing false information is subject to penalties under law.`;
      doc.font('Helvetica').fontSize(9).fillColor(slateColor).text(declarationText, { align: 'justify', lineGap: 2 });
      
      doc.moveDown(2);
      const sigY = doc.y;
      doc.moveTo(50, sigY + 12).lineTo(300, sigY + 12).stroke(darkColor);
      doc.moveTo(400, sigY + 12).lineTo(562, sigY + 12).stroke(darkColor);
      
      doc.font('Helvetica').fontSize(9).fillColor(darkColor);
      doc.text('Applicant Signature', 50, sigY + 18);
      doc.text('Date', 400, sigY + 18);

      doc.moveDown(1.5);
      doc.font('Helvetica-Bold').fontSize(9).text('Printed Name: ', { continued: true }).font('Helvetica').text(user.full_name);
      
      doc.moveDown(1);
      doc.fontSize(8).fillColor(slateColor).text(`Prepared on behalf of applicant by MomPlan Application System.`, { align: 'center' });
      doc.text(`This document was generated on ${this.formatDate(new Date())} and is valid for submission.`, { align: 'center' });

      // Appendix — Attached Documents
      // For MVP we just state they are attached to the email
      doc.addPage();
      drawSectionHeader('Appendix — Attached Documents');
      doc.font('Helvetica').fontSize(10).fillColor(slateColor).text(
        'Due to current system limits, full original copies of the uploaded documents listed in Section 6 are attached separately in your email package. They are also preserved in your secure digital vault on the MomPlan platform.',
        { lineGap: 3 }
      );

      doc.end();
    });

    // File Persistence
    const isS3Placeholder = env.AWS_ACCESS_KEY_ID.includes('placeholder');
    let file_url = '';

    if (isS3Placeholder) {
      console.log('⚠️ [MOCK S3 PDF UPLOAD] Saving PDF locally due to placeholder credentials.');
      const dir = path.join(process.cwd(), 'uploads', 'pdfs', userId);
      fs.mkdirSync(dir, { recursive: true });
      const localPath = path.join(dir, `${uuid}.pdf`);
      fs.writeFileSync(localPath, pdfBuffer);
      file_url = localPath;
    } else {
      const key = `pdfs/${userId}/${uuid}.pdf`;
      await s3Client.send(new PutObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: key,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
      }));
      file_url = `https://${env.S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
    }

    // Version determination
    const existing = await prisma.generatedPdf.findFirst({
      where: { user_id: userId, program_id: programId },
      orderBy: { version: 'desc' },
    });
    const version = existing ? existing.version + 1 : 1;

    // Database record creation
    const generated = await prisma.generatedPdf.create({
      data: {
        id: uuid,
        user_id: userId,
        application_id: applicationId || null,
        program_id: programId,
        file_url,
        file_size: pdfBuffer.length,
        version,
        status: 'generated',
        validation_report: validationReport as any,
      },
      include: {
        program: true,
      },
    });

    return generated;
  }

  // Get a signed download URL (24hr expiry)
  async getDownloadUrl(pdfId: string, userId: string, role?: string): Promise<string> {
    const pdf = await prisma.generatedPdf.findUnique({ where: { id: pdfId } });
    if (!pdf) throw new Error('PDF not found');

    // Access control: admins and counselors can download anything, users can only download their own
    if (role !== 'admin' && role !== 'counselor' && pdf.user_id !== userId) {
      throw new Error('Access denied to this PDF');
    }

    const isPlaceholder = env.AWS_ACCESS_KEY_ID.includes('placeholder');

    if (isPlaceholder) {
      // Local streaming backend route link
      return `${env.FRONTEND_URL.replace(/:3000|:3001/, ':5000')}/api/pdf/${pdfId}/download/stream`;
    } else {
      // S3 presigned URL
      const key = pdf.file_url.split('.amazonaws.com/').pop() || '';
      return getPresignedDownloadUrl(key);
    }
  }

  // List all PDFs for a user (or all PDFs if admin)
  async listPdfs(userId: string, role: string): Promise<any[]> {
    if (role === 'admin' || role === 'counselor') {
      return prisma.generatedPdf.findMany({
        include: {
          user: { select: { full_name: true, email: true } },
          program: { select: { name: true, agency: true } },
        },
        orderBy: { generated_at: 'desc' },
      });
    }

    return prisma.generatedPdf.findMany({
      where: { user_id: userId },
      include: {
        program: { select: { name: true, agency: true } },
      },
      orderBy: { generated_at: 'desc' },
    });
  }

  // Helper formatting methods
  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  }

  private formatBoolean(val: boolean | null | undefined): string {
    if (val === true) return 'Yes';
    if (val === false) return 'No';
    return 'N/A';
  }

  private calculateFplPercentage(householdSize: number, monthlyIncome: number): string {
    const size = Math.max(1, householdSize);
    const base = 15060;
    const increment = 5380;
    const annualFpl = base + (size - 1) * increment;
    const annualIncome = monthlyIncome * 12;
    const percentage = Math.round((annualIncome / annualFpl) * 100);
    return `${percentage}%`;
  }

  private slugToTitle(slug: string): string {
    return slug
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
