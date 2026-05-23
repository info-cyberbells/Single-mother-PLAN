import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const programs = [
  {
    id: 'tanf',
    name: 'TANF — Temporary Assistance for Needy Families',
    agency: 'U.S. Dept. of Health & Human Services',
    program_type: 'Cash Assistance',
    federal_or_state: 'Federal And State Program',
    description: 'Monthly cash assistance for low-income families with children, plus job training and childcare support.',
    benefit: 'Up to $400–$900/mo',
    estimated_monthly_value_min: 400,
    estimated_monthly_value_max: 900,
    website: 'https://www.acf.hhs.gov/ofa/programs/tanf',
    application_url: 'https://www.acf.hhs.gov/ofa/map/about/help-families',
    contact_email: 'infocollection@acf.hhs.gov',
    tags: ['cash', 'children', 'emergency'],
    eligibility_criteria: {
      income_threshold_type: 'low',
      requires_children: true,
      requires_unemployment: false,
      priority_score: 95,
      category: 'Cash'
    },
    metadata: {
      income_threshold_type: 'low',
      requires_children: true,
      requires_unemployment: false,
      priority_score: 95,
      category: 'Cash'
    }
  },
  {
    id: 'snap',
    name: 'SNAP — Food Stamps',
    agency: 'USDA',
    program_type: 'Federal Program',
    federal_or_state: 'Federal Program',
    description: 'Monthly EBT benefits to buy groceries for you and your family.',
    benefit: 'Avg $180 per person/mo',
    estimated_monthly_value_min: 180,
    estimated_monthly_value_max: 1200,
    website: 'https://www.fns.usda.gov/snap/supplemental-nutrition-assistance-program',
    application_url: 'https://www.fns.usda.gov/snap/state-directory',
    contact_email: 'AskUSDA@usda.gov',
    tags: ['food', 'essential', 'ebt'],
    eligibility_criteria: {
      income_threshold_type: 'low',
      requires_children: false,
      priority_score: 90,
      category: 'Food'
    },
    metadata: {
      income_threshold_type: 'low',
      requires_children: false,
      priority_score: 90,
      category: 'Food'
    }
  },
  {
    id: 'wic',
    name: 'WIC — Women, Infants & Children',
    agency: 'USDA',
    program_type: 'Federal Program',
    federal_or_state: 'Federal Program',
    description: 'Nutritious food, formula, breastfeeding support, and health referrals for pregnant women and kids under 5.',
    benefit: 'Food package + formula',
    estimated_monthly_value_min: 50,
    estimated_monthly_value_max: 300,
    website: 'https://www.fns.usda.gov/wic',
    application_url: 'https://www.fns.usda.gov/wic/wic-state-agencies',
    contact_email: 'AskUSDA@usda.gov',
    tags: ['food', 'nutrition', 'pregnancy', 'children'],
    eligibility_criteria: {
      income_threshold_type: 'moderate',
      requires_pregnancy_or_child_under_5: true,
      priority_score: 98,
      category: 'Nutrition'
    },
    metadata: {
      income_threshold_type: 'moderate',
      requires_pregnancy_or_child_under_5: true,
      priority_score: 98,
      category: 'Nutrition'
    }
  },
  {
    id: 'medicaid',
    name: 'Medicaid & CHIP',
    agency: 'CMS',
    program_type: 'Federal Program',
    federal_or_state: 'Federal Program',
    description: 'Free or low-cost health coverage for you and your kids.',
    benefit: 'Comprehensive medical coverage',
    estimated_monthly_value_min: 300,
    estimated_monthly_value_max: 2000,
    website: 'https://www.medicaid.gov/',
    application_url: 'https://www.healthcare.gov/medicaid-chip/',
    contact_email: 'Medicaid.gov@cms.hhs.gov',
    tags: ['healthcare', 'health', 'children', 'pregnancy'],
    eligibility_criteria: {
      income_threshold_type: 'low',
      requires_children: false,
      supports_disability: true,
      priority_score: 92,
      category: 'Health'
    },
    metadata: {
      income_threshold_type: 'low',
      requires_children: false,
      supports_disability: true,
      priority_score: 92,
      category: 'Health'
    }
  },
  {
    id: 'ccdf',
    name: 'Child Care Subsidy (CCDF)',
    agency: 'Office of Child Care',
    program_type: 'Federal Program',
    federal_or_state: 'Federal Program',
    description: 'Help paying for daycare or after-school care so you can work or attend school.',
    benefit: 'Subsidized childcare costs',
    estimated_monthly_value_min: 200,
    estimated_monthly_value_max: 1500,
    website: 'https://www.acf.hhs.gov/occ',
    application_url: 'https://www.childcare.gov/state-resources',
    contact_email: 'OCCPolicyInfo@acf.hhs.gov',
    tags: ['childcare', 'employment', 'education'],
    eligibility_criteria: {
      income_threshold_type: 'moderate',
      requires_children: true,
      requires_employment_or_student: true,
      priority_score: 88,
      category: 'Childcare'
    },
    metadata: {
      income_threshold_type: 'moderate',
      requires_children: true,
      requires_employment_or_student: true,
      priority_score: 88,
      category: 'Childcare'
    }
  },
  {
    id: 'section8',
    name: 'Section 8 Housing Choice Voucher',
    agency: 'HUD',
    program_type: 'Federal Program',
    federal_or_state: 'Federal Program',
    description: 'Rental assistance — pay ~30% of your income, voucher covers the rest.',
    benefit: 'Rental voucher',
    estimated_monthly_value_min: 500,
    estimated_monthly_value_max: 2500,
    website: 'https://www.hud.gov/topics/housing_choice_voucher_program_section_8',
    application_url: 'https://www.hud.gov/program_offices/public_indian_housing/pha/contacts',
    contact_email: 'answers@hud.gov',
    tags: ['housing', 'rent', 'low-income'],
    eligibility_criteria: {
      income_threshold_type: 'very_low',
      requires_children: false,
      supports_disability: true,
      priority_score: 85,
      category: 'Housing'
    },
    metadata: {
      income_threshold_type: 'very_low',
      requires_children: false,
      supports_disability: true,
      priority_score: 85,
      category: 'Housing'
    }
  },
  {
    id: 'liheap',
    name: 'LIHEAP — Energy Assistance',
    agency: 'HHS',
    program_type: 'Federal Program',
    federal_or_state: 'Federal Program',
    description: 'Help paying heating, cooling, and energy bills.',
    benefit: 'Up to $1,000/yr toward bills',
    estimated_monthly_value_min: 20,
    estimated_monthly_value_max: 100,
    website: 'https://www.acf.hhs.gov/ocs/programs/liheap',
    application_url: 'https://www.acf.hhs.gov/ocs/low-income-home-energy-assistance-program-liheap',
    contact_email: 'LIHEAP@acf.hhs.gov',
    tags: ['utilities', 'energy', 'heating', 'cooling'],
    eligibility_criteria: {
      income_threshold_type: 'low',
      supports_seniors_and_disability: true,
      priority_score: 80,
      category: 'Utilities'
    },
    metadata: {
      income_threshold_type: 'low',
      supports_seniors_and_disability: true,
      priority_score: 80,
      category: 'Utilities'
    }
  },
  {
    id: 'eitc',
    name: 'Earned Income Tax Credit (EITC)',
    agency: 'IRS',
    program_type: 'Federal Program',
    federal_or_state: 'Federal Program',
    description: 'Refundable tax credit for working parents — money back even if you owe nothing.',
    benefit: 'Up to $7,830/yr',
    estimated_monthly_value_min: 50,
    estimated_monthly_value_max: 650,
    website: 'https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit-eitc',
    application_url: 'https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit-eitc',
    contact_email: 'TAS.Form.911.Request.for.Assistance@irs.gov',
    tags: ['tax', 'cash', 'employment'],
    eligibility_criteria: {
      income_threshold_type: 'moderate',
      requires_employment: true,
      priority_score: 82,
      category: 'Tax'
    },
    metadata: {
      income_threshold_type: 'moderate',
      requires_employment: true,
      priority_score: 82,
      category: 'Tax'
    }
  },
  {
    id: 'child_tax_credit',
    name: 'Child Tax Credit',
    agency: 'IRS',
    program_type: 'Federal Program',
    federal_or_state: 'Federal Program',
    description: 'Up to $2,000 per qualifying child under 17 on your federal return.',
    benefit: '$2,000 per child',
    estimated_monthly_value_min: 160,
    estimated_monthly_value_max: 160,
    website: 'https://www.irs.gov/credits-deductions/child-tax-credit',
    application_url: 'https://www.irs.gov/credits-deductions/child-tax-credit',
    contact_email: 'TAS.Form.911.Request.for.Assistance@irs.gov',
    tags: ['tax', 'children', 'cash'],
    eligibility_criteria: {
      income_threshold_type: 'high',
      requires_children: true,
      max_child_age: 17,
      priority_score: 90,
      category: 'Tax'
    },
    metadata: {
      income_threshold_type: 'high',
      requires_children: true,
      max_child_age: 17,
      priority_score: 90,
      category: 'Tax'
    }
  },
  {
    id: 'pell_grant',
    name: 'Federal Pell Grant',
    agency: 'Dept. of Education',
    program_type: 'Federal Program',
    federal_or_state: 'Federal Program',
    description: "Free college money for low-income students — doesn't need to be repaid.",
    benefit: 'Up to $7,395/yr',
    estimated_monthly_value_min: 100,
    estimated_monthly_value_max: 615,
    website: 'https://studentaid.gov/understand-aid/types/grants/pell',
    application_url: 'https://studentaid.gov/h/apply-for-aid/fafsa',
    contact_email: 'customerservice@studentaid.gov',
    tags: ['education', 'college', 'students'],
    eligibility_criteria: {
      income_threshold_type: 'moderate',
      requires_student_status: true,
      priority_score: 75,
      category: 'Education'
    },
    metadata: {
      income_threshold_type: 'moderate',
      requires_student_status: true,
      priority_score: 75,
      category: 'Education'
    }
  },
  {
    id: 'head_start',
    name: 'Head Start & Early Head Start',
    agency: 'HHS',
    program_type: 'Federal Program',
    federal_or_state: 'Federal Program',
    description: 'Free early learning, health, and family services for kids 0–5.',
    benefit: 'Free preschool program',
    estimated_monthly_value_min: 500,
    estimated_monthly_value_max: 1200,
    website: 'https://www.acf.hhs.gov/ohs',
    application_url: 'https://eclkc.ohs.acf.hhs.gov/center-locator',
    contact_email: 'HeadStart@eclkc.info',
    tags: ['education', 'children', 'preschool'],
    eligibility_criteria: {
      income_threshold_type: 'low',
      requires_children: true,
      max_child_age: 5,
      priority_score: 91,
      category: 'Education'
    },
    metadata: {
      income_threshold_type: 'low',
      requires_children: true,
      max_child_age: 5,
      priority_score: 91,
      category: 'Education'
    }
  },
  {
    id: 'lifeline',
    name: 'Lifeline Phone & Internet',
    agency: 'FCC',
    program_type: 'Federal Program',
    federal_or_state: 'Federal Program',
    description: 'Discount on monthly phone or internet for qualifying households.',
    benefit: '$9.25/mo discount',
    estimated_monthly_value_min: 9,
    estimated_monthly_value_max: 9,
    website: 'https://www.lifelinesupport.org/',
    application_url: 'https://www.lifelinesupport.org/get-started/',
    contact_email: 'LifelineSupport@usac.org',
    tags: ['utilities', 'phone', 'internet'],
    eligibility_criteria: {
      income_threshold_type: 'low',
      priority_score: 72,
      category: 'Utilities'
    },
    metadata: {
      income_threshold_type: 'low',
      priority_score: 72,
      category: 'Utilities'
    }
  }
];

async function main() {
  console.log('Seeding benefit programs with structured metadata...');

  for (const program of programs) {
    await prisma.benefitProgram.upsert({
      where: { id: program.id },
      update: {
        name: program.name,
        agency: program.agency,
        program_type: program.program_type,
        federal_or_state: program.federal_or_state,
        description: program.description,
        eligibility_criteria: program.eligibility_criteria as any,
        estimated_monthly_value_min: program.estimated_monthly_value_min,
        estimated_monthly_value_max: program.estimated_monthly_value_max,
        application_url: program.application_url,
        contact_email: (program as any).contact_email,
        tags: program.tags,
        metadata: program.metadata as any,
      },
      create: {
        id: program.id,
        name: program.name,
        agency: program.agency,
        program_type: program.program_type,
        federal_or_state: program.federal_or_state,
        description: program.description,
        eligibility_criteria: program.eligibility_criteria as any,
        estimated_monthly_value_min: program.estimated_monthly_value_min,
        estimated_monthly_value_max: program.estimated_monthly_value_max,
        application_url: program.application_url,
        contact_email: (program as any).contact_email,
        tags: program.tags,
        metadata: program.metadata as any,
      },
    });
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
