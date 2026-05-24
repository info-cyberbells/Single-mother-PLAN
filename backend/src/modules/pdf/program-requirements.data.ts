export interface ProgramRequirements {
  program_key: string;          // matches BenefitProgram.name keywords for fuzzy matching
  agency: string;
  required_fields: string[];    // keys from FamilyProfile / User / EligibilityResult
  optional_fields: string[];
  required_documents: string[]; // values from Document.document_type
  optional_documents: string[];
}

export const PROGRAM_REQUIREMENTS: Record<string, ProgramRequirements> = {
  SNAP: {
    program_key: 'snap',
    agency: 'USDA Food and Nutrition Service',
    required_fields: ['full_name', 'date_of_birth', 'address', 'household_size', 'monthly_income', 'immigration_status'],
    optional_fields: ['employer_name', 'has_disability', 'income_sources'],
    required_documents: ['government_id', 'proof_of_income'],
    optional_documents: ['utility_bill', 'bank_statement'],
  },
  TANF: {
    program_key: 'tanf',
    agency: 'HHS Administration for Children and Families',
    required_fields: ['full_name', 'date_of_birth', 'address', 'household_size', 'num_children', 'children_ages', 'monthly_income', 'employment_status'],
    optional_fields: ['marital_status', 'domestic_violence', 'employer_name'],
    required_documents: ['government_id', 'proof_of_income', 'birth_certificate'],
    optional_documents: ['bank_statement', 'lease_agreement'],
  },
  SECTION_8: {
    program_key: 'section 8',
    agency: 'HUD / Local Housing Authority',
    required_fields: ['full_name', 'date_of_birth', 'address', 'household_size', 'monthly_income', 'monthly_rent', 'immigration_status'],
    optional_fields: ['eviction_risk', 'has_disability'],
    required_documents: ['government_id', 'proof_of_income', 'lease_agreement'],
    optional_documents: ['utility_bill', 'bank_statement'],
  },
  MEDICAID: {
    program_key: 'medicaid',
    agency: 'CMS / State Medicaid Office',
    required_fields: ['full_name', 'date_of_birth', 'address', 'household_size', 'monthly_income', 'immigration_status'],
    optional_fields: ['has_disability', 'is_pregnant', 'health_insurance'],
    required_documents: ['government_id'],
    optional_documents: ['proof_of_income', 'medical_record'],
  },
  WIC: {
    program_key: 'wic',
    agency: 'USDA Food and Nutrition Service',
    required_fields: ['full_name', 'date_of_birth', 'address', 'monthly_income', 'is_pregnant', 'num_children', 'children_ages'],
    optional_fields: ['has_disability'],
    required_documents: ['government_id', 'proof_of_income'],
    optional_documents: ['birth_certificate'],
  },
  LIHEAP: {
    program_key: 'liheap',
    agency: 'HHS Office of Community Services',
    required_fields: ['full_name', 'address', 'household_size', 'monthly_income'],
    optional_fields: ['has_disability', 'monthly_utilities'],
    required_documents: ['government_id', 'proof_of_income', 'utility_bill'],
    optional_documents: [],
  },
  HEAD_START: {
    program_key: 'head start',
    agency: 'HHS Administration for Children and Families',
    required_fields: ['full_name', 'address', 'household_size', 'monthly_income', 'num_children', 'children_ages'],
    optional_fields: ['employment_status', 'has_disability'],
    required_documents: ['government_id', 'proof_of_income', 'birth_certificate'],
    optional_documents: ['childcare_record'],
  },
  CHIP: {
    program_key: 'chip',
    agency: 'CMS / State CHIP Office',
    required_fields: ['full_name', 'date_of_birth', 'address', 'household_size', 'num_children', 'children_ages'],
    optional_fields: ['health_insurance'],
    required_documents: ['government_id', 'proof_of_income'],
    optional_documents: ['birth_certificate'],
  },
};

// Fuzzy match program name → schema
export function getProgramRequirements(programName: string): ProgramRequirements | null {
  const lower = programName.toLowerCase();
  for (const [, req] of Object.entries(PROGRAM_REQUIREMENTS)) {
    if (lower.includes(req.program_key)) return req;
  }
  return null;
}
