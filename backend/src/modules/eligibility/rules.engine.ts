
export interface RuleContext {
  household_size: number;
  number_of_children: number;
  children_ages: number[];
  monthly_income: number;
  employment_status: string;
  state: string;
  pregnancy_status: boolean;
  disability_status: boolean;
  housing_status: string;
  student_status: boolean;
  citizenship_status: string;
  
  // New from Wiser Moms
  needs_childcare?: boolean;
  monthly_rent?: number;
  eviction_risk?: boolean;
  domestic_violence?: boolean;
  chronic_illness?: boolean;
}

export interface ProgramMetadata {
  income_threshold_type?: 'very_low' | 'low' | 'moderate' | 'high';
  requires_children?: boolean;
  max_child_age?: number;
  requires_pregnancy_or_child_under_5?: boolean;
  requires_employment?: boolean;
  requires_employment_or_student?: boolean;
  requires_student_status?: boolean;
  supports_disability?: boolean;
  supports_seniors_and_disability?: boolean;
  priority_score?: number;
  requires_citizenship?: boolean;
  specific_states?: string[];
  requires_housing_instability?: boolean;
  
  // New from Wiser Moms
  requires_childcare_need?: boolean;
  supports_domestic_violence?: boolean;
  supports_eviction_risk?: boolean;
}

export class RulesEngine {
  // Simple income threshold logic (can be expanded with state-specific data later)
  private getIncomeLimit(type: string, householdSize: number): number {
    const base = 1500; // Base monthly for 1 person
    const increment = 500; // Increment per extra person
    const baseLimit = base + (householdSize - 1) * increment;

    switch (type) {
      case 'very_low': return baseLimit * 0.8;
      case 'low': return baseLimit * 1.2;
      case 'moderate': return baseLimit * 2.0;
      case 'high': return baseLimit * 4.0;
      default: return baseLimit;
    }
  }

  evaluate(program: any, context: RuleContext) {
    const meta = (program.metadata || {}) as ProgramMetadata;
    let score = 50; // Starting score
    const reasons: string[] = [];

    // 1. Income Check
    if (meta.income_threshold_type) {
      const limit = this.getIncomeLimit(meta.income_threshold_type, context.household_size);
      if (context.monthly_income <= limit) {
        score += 20;
        reasons.push(`Income is within limits for ${meta.income_threshold_type} threshold.`);
      } else if (context.monthly_income <= limit * 1.2) {
        score += 5;
        reasons.push('Income is slightly above limit, but may qualify with deductions.');
      } else {
        score -= 40;
        reasons.push('Income exceeds the typical threshold for this program.');
      }
    }

    // 2. Children Check
    if (meta.requires_children) {
      if (context.number_of_children > 0) {
        score += 15;
        if (meta.max_child_age) {
          const validChildren = context.children_ages.filter(age => age <= meta.max_child_age!);
          if (validChildren.length > 0) {
            score += 10;
            reasons.push(`Has ${validChildren.length} children within age limits.`);
          } else {
            score -= 30;
            reasons.push(`Children exceed the age limit of ${meta.max_child_age}.`);
          }
        } else {
          reasons.push('Household includes children.');
        }
      } else {
        score -= 50;
        reasons.push('This program requires children in the household.');
      }
    }

    // 3. Pregnancy/WIC specific
    if (meta.requires_pregnancy_or_child_under_5) {
      const hasYoungChild = context.children_ages.some(age => age < 5);
      if (context.pregnancy_status || hasYoungChild) {
        score += 30;
        reasons.push(context.pregnancy_status ? 'Verified pregnancy status qualifies.' : 'Has children under age 5.');
      } else {
        score -= 60;
        reasons.push('Requires pregnancy or children under 5.');
      }
    }

    // 4. Employment/Student
    if (meta.requires_employment && context.employment_status === 'unemployed') {
      score -= 20;
      reasons.push('Program typically requires active employment.');
    }

    if (meta.requires_employment_or_student) {
      if (context.employment_status !== 'unemployed' || context.student_status) {
        score += 15;
        reasons.push('Meets work or education requirements.');
      } else {
        score -= 30;
        reasons.push('Requires employment or active student status.');
      }
    }

    // 5. Disability
    if (meta.supports_disability && context.disability_status) {
      score += 20;
      reasons.push('Priority given for disability status.');
    }

    // 6. Citizenship
    if (meta.requires_citizenship) {
      if (context.citizenship_status === 'citizen' || context.citizenship_status === 'eligible_non_citizen') {
        score += 10;
        reasons.push('Meets citizenship requirements.');
      } else {
        score -= 50;
        reasons.push('Program requires verified citizenship or eligible non-citizen status.');
      }
    }

    // 7. State
    if (meta.specific_states && meta.specific_states.length > 0) {
      if (meta.specific_states.includes(context.state)) {
        score += 20;
        reasons.push(`Resident of eligible state (${context.state}).`);
      } else {
        score -= 80;
        reasons.push(`Program is only available in specific states, excluding ${context.state}.`);
      }
    }

    // 8. Housing Status
    if (meta.requires_housing_instability) {
      if (context.housing_status === 'homeless' || context.housing_status === 'at_risk') {
        score += 25;
        reasons.push('Priority given due to housing instability.');
      } else {
        score -= 20;
        reasons.push('Program specifically targets individuals with housing instability.');
      }
    }

    // 9. Childcare Need
    if (meta.requires_childcare_need) {
      if (context.needs_childcare) {
        score += 20;
        reasons.push('Program supports families needing childcare.');
      } else {
        score -= 20;
        reasons.push('Program is specifically for families needing childcare assistance.');
      }
    }

    // 10. Domestic Violence
    if (meta.supports_domestic_violence && context.domestic_violence) {
      score += 25;
      reasons.push('Priority support given for domestic violence survivors.');
    }

    // 11. Eviction Risk
    if (meta.supports_eviction_risk && context.eviction_risk) {
      score += 25;
      reasons.push('Priority given due to immediate eviction risk.');
    }

    // Normalize score
    const finalScore = Math.max(0, Math.min(100, score));
    let status: 'qualified' | 'likely_qualified' | 'check_required' | 'not_qualified' = 'check_required';

    if (finalScore >= 85) status = 'qualified';
    else if (finalScore >= 65) status = 'likely_qualified';
    else if (finalScore < 40) status = 'not_qualified';

    return {
      score: finalScore,
      status,
      reasoning: reasons.join(' '),
    };
  }
}
