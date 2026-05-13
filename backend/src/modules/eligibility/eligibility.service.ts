import { prisma } from '../../config/prisma';
import { callClaudeApi } from '../../config/anthropic';
import { sendEmail } from '../../config/email';
import { NotFoundError, InternalServerError } from '../../utils/errors';
import { EligibilityStatus } from '@prisma/client';

interface ClaudeEligibilityItem {
  programId: string;
  status: EligibilityStatus;
  confidence_score: number;
  reasoning: string;
}

export class EligibilityService {
  async runScan(userId: string) {
    // 1. Load user's family_profile from DB
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { family_profile: true },
    });

    if (!user || !user.family_profile) {
      throw new NotFoundError('Family profile is required to run eligibility scan. Please configure your profile first.');
    }

    // 2. Load all active benefit_programs from DB
    const programs = await prisma.benefitProgram.findMany({
      where: { is_active: true },
    });

    if (programs.length === 0) {
      return [];
    }

    // Prepare inputs for Claude AI matching logic
    const userProfileSummary = {
      state: user.state,
      household_size: user.family_profile.household_size,
      num_children: user.family_profile.num_children,
      children_ages: user.family_profile.children_ages,
      monthly_income: user.family_profile.monthly_income,
      employment_status: user.family_profile.employment_status,
      housing_status: user.family_profile.housing_status,
      has_disability: user.family_profile.has_disability,
      is_pregnant: user.family_profile.is_pregnant,
    };

    const programsCriteria = programs.map((p) => ({
      programId: p.id,
      name: p.name,
      agency: p.agency,
      program_type: p.program_type,
      federal_or_state: p.federal_or_state,
      state_code: p.state_code,
      eligibility_criteria: p.eligibility_criteria,
    }));

    const systemPrompt = `You are an expert government benefits eligibility analyst AI engine for MomPlan.
Your task is to analyze the User Profile data against the criteria of all available active Benefit Programs.
Evaluate each program carefully and classify the eligibility.

CRITICAL REQUIREMENT:
You MUST output ONLY a pure JSON array containing an evaluation object for EACH program provided. Do not use markdown backticks, no explanations outside the JSON array.
Valid status strings: "qualified", "likely_qualified", "check_required", "not_qualified".

JSON format structure:
[
  {
    "programId": "string",
    "status": "qualified" | "likely_qualified" | "check_required" | "not_qualified",
    "confidence_score": number (0 to 100),
    "reasoning": "detailed explanation of why this evaluation was given based on income thresholds, state, or children criteria"
  }
]`;

    const userPrompt = `USER PROFILE:
${JSON.stringify(userProfileSummary, null, 2)}

ACTIVE BENEFIT PROGRAMS CRITERIA:
${JSON.stringify(programsCriteria, null, 2)}

Return the pure JSON array now.`;

    // 3. Send to Claude API
    let rawResponse = '';
    try {
      rawResponse = await callClaudeApi(systemPrompt, userPrompt);
    } catch (err) {
      console.error('Claude API execution error:', err);
      throw new InternalServerError('AI eligibility scanning engine temporarily unavailable.');
    }

    // 4. Parse Claude's response
    let parsedResults: ClaudeEligibilityItem[] = [];
    try {
      // Strip any accidental markdown formatting if present
      const cleaned = rawResponse.replace(/```json/gi, '').replace(/```/gi, '').trim();
      parsedResults = JSON.parse(cleaned) as ClaudeEligibilityItem[];
    } catch (err) {
      console.error('Failed to parse Claude AI output as JSON:', rawResponse, err);
      // Fallback/Mock logic if model response is malformed to ensure robustness
      parsedResults = programs.map((p) => ({
        programId: p.id,
        status: 'check_required',
        confidence_score: 50,
        reasoning: 'Automated fallback check required due to parsing ambiguity.',
      }));
    }

    // Filter out results for unknown programIds
    const validProgramIds = new Set(programs.map((p) => p.id));
    const sanitizedResults = parsedResults.filter((r) => validProgramIds.has(r.programId));

    // Store results in eligibility_results table inside transaction to update gracefully
    await prisma.$transaction(
      sanitizedResults.map((item) =>
        prisma.eligibilityResult.upsert({
          where: {
            user_id_program_id: {
              user_id: userId,
              program_id: item.programId,
            },
          },
          create: {
            user_id: userId,
            program_id: item.programId,
            status: item.status,
            confidence_score: item.confidence_score,
            reasoning: item.reasoning,
            checked_at: new Date(),
          },
          update: {
            status: item.status,
            confidence_score: item.confidence_score,
            reasoning: item.reasoning,
            checked_at: new Date(),
          },
        })
      )
    );

    // 5. Return ranked list sorted by confidence_score DESC
    const rankedList = await prisma.eligibilityResult.findMany({
      where: { user_id: userId },
      include: {
        program: {
          select: {
            name: true,
            agency: true,
            program_type: true,
            estimated_monthly_value_min: true,
            estimated_monthly_value_max: true,
            application_url: true,
          },
        },
      },
      orderBy: { confidence_score: 'desc' },
    });

    // Trigger email: Eligibility scan complete (list of matched programs)
    const matchedProgramsHtml = rankedList
      .filter((r) => r.status === 'qualified' || r.status === 'likely_qualified')
      .map((r) => `<li><strong>${r.program.name}</strong> (${r.status}): ${r.reasoning}</li>`)
      .join('');

    await sendEmail({
      to: user.email,
      subject: 'Your AI Benefits Eligibility Scan is Complete!',
      html: `<h1>Eligibility Scan Results</h1>
      <p>Hello ${user.full_name}, your personalized MomPlan benefits eligibility evaluation is complete.</p>
      ${
        matchedProgramsHtml
          ? `<h2>Top Recommended Programs:</h2><ul>${matchedProgramsHtml}</ul>`
          : '<p>Review your dashboard to see full details and next steps for your application.</p>'
      }
      <p>Log back into your dashboard to start applying!</p>`,
    });

    return rankedList;
  }

  async getResults(userId: string) {
    return prisma.eligibilityResult.findMany({
      where: { user_id: userId },
      include: {
        program: true,
      },
      orderBy: { confidence_score: 'desc' },
    });
  }

  async getResultByProgramId(userId: string, programId: string) {
    const result = await prisma.eligibilityResult.findUnique({
      where: {
        user_id_program_id: {
          user_id: userId,
          program_id: programId,
        },
      },
      include: {
        program: true,
      },
    });

    if (!result) {
      throw new NotFoundError('Eligibility result not found for this program');
    }

    return result;
  }
}
