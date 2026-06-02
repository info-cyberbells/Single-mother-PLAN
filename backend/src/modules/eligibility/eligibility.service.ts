import { prisma } from '../../config/prisma';
import { RulesEngine } from './rules.engine';
import Anthropic from '@anthropic-ai/sdk';
import { PdfService } from '../pdf/pdf.service';

export class EligibilityService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || 'placeholder',
    });
  }

  async runScan(userId: string) {
    // 1. Get user profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { family_profile: true },
    });

    if (!user || !user.family_profile) {
      throw new Error('User profile not found. Please complete your profile first.');
    }

    const profile = user.family_profile;

    // 2. Get all benefit programs
    const programs = await prisma.benefitProgram.findMany();

    // 3. Run Deterministic Rules Engine
    const rulesEngine = new RulesEngine();
    const ruleResults = programs.map((p) => {
      const evaluation = rulesEngine.evaluate(p, {
        household_size: profile.household_size ?? 1,
        number_of_children: profile.num_children ?? 0,
        children_ages: Array.isArray(profile.children_ages) ? (profile.children_ages as number[]) : [],
        monthly_income: profile.monthly_income ?? 0,
        employment_status: profile.employment_status ?? 'unemployed',
        state: user.state || profile.state || 'GA',
        pregnancy_status: profile.is_pregnant ?? false,
        disability_status: profile.has_disability ?? false,
        housing_status: profile.housing_status ?? 'stable',
        student_status: profile.employment_status === 'student',
        
        // Map citizenship_status correctly (citizen or eligible_non_citizen)
        citizenship_status: profile.immigration_status === 'citizen' || profile.immigration_status === 'eligible_non_citizen'
          ? profile.immigration_status
          : 'citizen',
        
        // Apply Wiser Moms eligibility fields
        needs_childcare: profile.needs_childcare ?? undefined,
        monthly_rent: profile.monthly_rent ? Number(profile.monthly_rent) : undefined,
        eviction_risk: profile.eviction_risk ?? undefined,
        domestic_violence: profile.domestic_violence ?? undefined,
        chronic_illness: profile.chronic_illness ?? undefined,
        preferred_language: profile.preferred_language || undefined,
        marital_status: profile.marital_status || undefined,
        income_sources: (profile.income_sources as string[]) || undefined,
        health_insurance: profile.health_insurance || undefined,
        savings_assets: profile.savings_assets || undefined,
        monthly_childcare_cost: profile.monthly_childcare_cost ? Number(profile.monthly_childcare_cost) : undefined,
        legal_issues: profile.legal_issues && Array.isArray(profile.legal_issues) ? (profile.legal_issues as string[]) : [],
        urgency: profile.urgency || undefined,
      });
      return { programId: p.id, ...evaluation };
    });

    // 4. Refine with AI (Claude) if API key is present
    const isPlaceholder = process.env.ANTHROPIC_API_KEY?.includes('placeholder') || !process.env.ANTHROPIC_API_KEY;
    let parsedResults: any[] = [];

    if (isPlaceholder) {
      // Fallback to rules only
      parsedResults = ruleResults.map((r) => ({
        programId: r.programId,
        status: r.status,
        confidence_score: r.score,
        reasoning: r.reasoning,
      }));
    } else {
      const aiPrompt = `User Profile: ${JSON.stringify(profile)}\nRule Engine Results: ${JSON.stringify(ruleResults)}\nPrograms: ${JSON.stringify(programs.map(p => ({ id: p.id, name: p.name, description: p.description })))}`;
      
      try {
        const aiResponse = await Promise.race([
          this.callClaudeApi(aiPrompt),
          new Promise<string>((_, reject) =>
            setTimeout(() => reject(new Error('AI Refinement Timeout')), 25000)
          ),
        ]);
        const cleaned = aiResponse.replace(/```json|```/g, '').trim();
        parsedResults = JSON.parse(cleaned);
      } catch (err) {
        console.error('AI Refinement Error:', err);
        // Fallback to rules on error
        parsedResults = ruleResults.map((r) => ({
          programId: r.programId,
          status: r.status,
          confidence_score: r.score,
          reasoning: r.reasoning,
        }));
      }
    }

    // 5. Save results to database (parallel upserts for speed)
    await Promise.all(
      parsedResults.map((res) => {
        const program = programs.find((p) => p.id === res.programId);
        if (!program) return Promise.resolve();
        return prisma.eligibilityResult.upsert({
          where: {
            user_id_program_id: {
              user_id: userId,
              program_id: program.id,
            },
          },
          update: {
            status: res.status,
            confidence_score: res.confidence_score || 0,
            reasoning: res.reasoning,
          },
          create: {
            user_id: userId,
            program_id: program.id,
            status: res.status,
            confidence_score: res.confidence_score || 0,
            reasoning: res.reasoning,
          },
        });
      })
    );

    // 6. Save a scan-complete notification
    const qualified = parsedResults.filter(
      (r) => r.status === 'qualified' || r.status === 'likely_qualified'
    );

    await prisma.notification.create({
      data: {
        user_id: userId,
        type: 'status_update',
        title: '🎯 Eligibility Scan Complete',
        message: `Scan complete: ${qualified.length} program${qualified.length !== 1 ? 's' : ''} matched out of ${parsedResults.length} checked. View your Benefits page for details.`,
      },
    }).catch(() => {
      // Non-critical — swallow if notification creation fails
    });

    // Start background PDF generation for eligible programs
    const pdfService = new PdfService();
    (async () => {
      for (const res of qualified) {
        try {
          console.log(`[Background PDF Generation] Checking/creating application for user ${userId}, program ${res.programId}`);
          
          let app = await prisma.application.findFirst({
            where: { user_id: userId, program_id: res.programId },
          });

          if (!app) {
            app = await prisma.application.create({
              data: {
                user_id: userId,
                program_id: res.programId,
                status: 'draft',
                priority: 'normal',
              },
            });
            console.log(`[Background PDF Generation] Created draft application ${app.id} for user ${userId}, program ${res.programId}`);
          }

          console.log(`[Background PDF Generation] Starting PDF generation for user ${userId}, program ${res.programId}, application ${app.id}`);
          await pdfService.generateApplicationPdf(userId, res.programId, app.id);
          console.log(`[Background PDF Generation] Completed PDF generation for user ${userId}, program ${res.programId}`);
        } catch (pdfErr) {
          console.error(`[Background PDF Generation] Failed for user ${userId}, program ${res.programId}:`, pdfErr);
        }
      }
    })().catch((err) => {
      console.error('[Background PDF Generation] Uncaught error in background worker:', err);
    });

    return this.getResults(userId);
  }

  private async callClaudeApi(prompt: string): Promise<string> {
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      system: 'You are an AI eligibility matching assistant for MomPlan. Return ONLY a JSON array of objects with keys: programId, status, confidence_score, reasoning, estimated_benefit.',
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text;
    }
    return '';
  }

  async getResults(userId: string) {
    return prisma.eligibilityResult.findMany({
      where: { user_id: userId },
      include: { program: true },
      orderBy: { confidence_score: 'desc' },
    });
  }

  async getResultByProgramId(userId: string, programId: string) {
    return prisma.eligibilityResult.findUnique({
      where: {
        user_id_program_id: {
          user_id: userId,
          program_id: programId,
        },
      },
      include: { program: true },
    });
  }
}
