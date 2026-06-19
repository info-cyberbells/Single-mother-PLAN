import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const CSV_DIR = 'D:/mom\'s-DB';

function parseCSV(content: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentVal = '';
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(currentVal.trim());
      lines.push(row);
      row = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  if (currentVal || row.length > 0) {
    row.push(currentVal.trim());
    lines.push(row);
  }
  return lines;
}

function parseBool(val: string): boolean {
  return val.toLowerCase() === 'true';
}

function parseNum(val: string): number | null {
  if (!val || val === '') return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
}

function parseIntNum(val: string): number | null {
  if (!val || val === '') return null;
  const num = parseInt(val, 10);
  return isNaN(num) ? null : num;
}

function parseDate(val: string): Date | null {
  if (!val || val === '') return null;
  const date = new Date(val);
  return isNaN(date.getTime()) ? null : date;
}

function parseJson(val: string): any {
  if (!val || val === '') return null;
  try {
    return JSON.parse(val);
  } catch (err) {
    if (val.startsWith('[') && val.endsWith(']')) {
      try {
        const cleaned = val.replace(/'/g, '"');
        return JSON.parse(cleaned);
      } catch (_) {}
    }
    return val;
  }
}

function parseStringArray(val: string): string[] {
  if (!val || val === '' || val === '[]') return [];
  const parsed = parseJson(val);
  if (Array.isArray(parsed)) return parsed.map(String);
  return [val];
}

function mapPlan(val: string): 'free' | 'family' | 'navigator' {
  const v = val.toLowerCase();
  if (v === 'family') return 'family';
  if (v === 'navigator' || v === 'partner' || v === 'network' || v === 'community') return 'navigator';
  return 'free';
}

async function main() {
  console.log('--- STARTING BULK CSV DATA IMPORT ---');
  
  // 1. Read all files into memory first to filter and clean them
  
  // Users
  const usersFile = path.join(CSV_DIR, 'users_rows.csv');
  const userRows = parseCSV(fs.readFileSync(usersFile, 'utf-8'));
  const userHeaders = userRows[0];
  const usersData: any[] = [];
  const userIdsSet = new Set<string>();
  
  for (let i = 1; i < userRows.length; i++) {
    const row = userRows[i];
    if (row.length < userHeaders.length) continue;
    const data: any = {};
    userHeaders.forEach((header, idx) => {
      const val = row[idx];
      if (header === 'id') data.id = val;
      else if (header === 'email') data.email = val;
      else if (header === 'password_hash') data.password_hash = val || '';
      else if (header === 'phone') data.phone = val || null;
      else if (header === 'role') data.role = val === 'counselor' || val === 'admin' ? val : 'user';
      else if (header === 'plan') data.plan = mapPlan(val);
      else if (header === 'stripe_customer_id') data.stripe_customer_id = val || null;
      else if (header === 'stripe_subscription_id') data.stripe_subscription_id = val || null;
      else if (header === 'state') data.state = val || null;
      else if (header === 'zip_code') data.zip_code = val || null;
      else if (header === 'created_at') data.created_at = parseDate(val) || new Date();
      else if (header === 'updated_at') data.updated_at = parseDate(val) || new Date();
      else if (header === 'last_active_at') data.last_active_at = parseDate(val) || new Date();
      else if (header === 'status') data.status = val === 'inactive' || val === 'flagged' ? val : 'active';
      else if (header === 'profile_picture') data.profile_picture = val || null;
      else if (header === 'full_name') data.full_name = val || '';
    });
    
    if (!data.full_name) {
      const firstIdx = userHeaders.indexOf('first_name');
      const lastIdx = userHeaders.indexOf('last_name');
      const first = firstIdx !== -1 ? row[firstIdx] : '';
      const last = lastIdx !== -1 ? row[lastIdx] : '';
      data.full_name = `${first} ${last}`.trim() || 'User';
    }
    
    if (userIdsSet.has(data.id)) continue;
    userIdsSet.add(data.id);
    usersData.push(data);
  }
  
  // Programs
  const programsFile = path.join(CSV_DIR, 'programs_rows.csv');
  const programRows = parseCSV(fs.readFileSync(programsFile, 'utf-8'));
  const programHeaders = programRows[0];
  const programsData: any[] = [];
  const programIdsSet = new Set<string>();
  
  for (let i = 1; i < programRows.length; i++) {
    const row = programRows[i];
    if (row.length < programHeaders.length) continue;
    const data: any = {};
    programHeaders.forEach((header, idx) => {
      const val = row[idx];
      if (header === 'id') data.id = val;
      else if (header === 'program_name') data.name = val;
      else if (header === 'administering_agency') data.agency = val || '';
      else if (header === 'program_type') data.program_type = val;
      else if (header === 'federal_or_state') data.federal_or_state = val || null;
      else if (header === 'state') data.state_code = val || null;
      else if (header === 'description') data.description = val || null;
      else if (header === 'eligibility_criteria') data.eligibility_criteria = parseJson(val) || null;
      else if (header === 'estimated_monthly_value_min') data.estimated_monthly_value_min = parseNum(val);
      else if (header === 'estimated_monthly_value_max') data.estimated_monthly_value_max = parseNum(val);
      else if (header === 'apply_url') data.application_url = val || null;
      else if (header === 'contact_email') data.contact_email = val || null;
      else if (header === 'is_active') data.is_active = parseBool(val);
      else if (header === 'tags') data.tags = parseStringArray(val);
      else if (header === 'metadata') data.metadata = parseJson(val) || null;
      else if (header === 'also_known_as') data.also_known_as = val || null;
      else if (header === 'agency_phone') data.agency_phone = val || null;
      else if (header === 'agency_website') data.agency_website = val || null;
      else if (header === 'eligibility_summary') data.eligibility_summary = val || null;
      else if (header === 'income_limit_pct_fpl') data.income_limit_pct_fpl = parseNum(val);
      else if (header === 'income_limit_pct_smi') data.income_limit_pct_smi = parseNum(val);
      else if (header === 'asset_limit') data.asset_limit = parseNum(val);
      else if (header === 'lifetime_limit_months') data.lifetime_limit_months = parseIntNum(val);
      else if (header === 'work_requirement_hrs') data.work_requirement_hrs = parseIntNum(val);
      else if (header === 'renewal_period') data.renewal_period = val || null;
      else if (header === 'counties_served') data.counties_served = parseStringArray(val);
      else if (header === 'languages_available') data.languages_available = parseStringArray(val);
      else if (header === 'waitlist_status') data.waitlist_status = val || 'open';
      else if (header === 'waitlist_notes') data.waitlist_notes = val || null;
      else if (header === 'last_verified_date') data.last_verified_date = parseDate(val);
      else if (header === 'source_url') data.source_url = val || null;
      else if (header === 'guide_url') data.guide_url = val || null;
      else if (header === 'renewal_period_months') data.renewal_period_months = parseIntNum(val);
      else if (header === 'program_code') data.program_code = val || null;
      else if (header === 'notes') data.notes = val || null;
      else if (header === 'program_due_date') data.program_due_date = parseDate(val);
      else if (header === 'created_at') data.created_at = parseDate(val) || new Date();
      else if (header === 'updated_at') data.updated_at = parseDate(val) || new Date();
    });
    
    if (programIdsSet.has(data.id)) continue;
    programIdsSet.add(data.id);
    programsData.push(data);
  }
  
  // Organizations
  const orgsFile = path.join(CSV_DIR, 'organizations_rows.csv');
  const orgRows = parseCSV(fs.readFileSync(orgsFile, 'utf-8'));
  const orgHeaders = orgRows[0];
  const orgsData: any[] = [];
  const orgIdsSet = new Set<string>();
  
  for (let i = 1; i < orgRows.length; i++) {
    const row = orgRows[i];
    if (row.length < orgHeaders.length) continue;
    const data: any = {};
    orgHeaders.forEach((header, idx) => {
      const val = row[idx];
      if (header === 'id') data.id = val;
      else if (header === 'org_name') data.org_name = val;
      else if (header === 'category') data.category = val;
      else if (header === 'purpose') data.purpose = val || null;
      else if (header === 'phone') data.phone = val || null;
      else if (header === 'crisis_line') data.crisis_line = val || null;
      else if (header === 'email') data.email = val || null;
      else if (header === 'website') data.website = val || null;
      else if (header === 'address') data.address = val || null;
      else if (header === 'city') data.city = val || 'Atlanta';
      else if (header === 'state') data.state = val || 'GA';
      else if (header === 'zip_code') data.zip_code = val || null;
      else if (header === 'counties_served') data.counties_served = parseStringArray(val);
      else if (header === 'populations_served') data.populations_served = parseStringArray(val);
      else if (header === 'languages_served') data.languages_served = parseStringArray(val);
      else if (header === 'intake_process') data.intake_process = val || null;
      else if (header === 'hours_of_operation') data.hours_of_operation = val || null;
      else if (header === 'flag_dv') data.flag_dv = parseBool(val);
      else if (header === 'flag_eviction') data.flag_eviction = parseBool(val);
      else if (header === 'flag_children_u5') data.flag_children_u5 = parseBool(val);
      else if (header === 'flag_pregnant') data.flag_pregnant = parseBool(val);
      else if (header === 'flag_student') data.flag_student = parseBool(val);
      else if (header === 'flag_immigrant') data.flag_immigrant = parseBool(val);
      else if (header === 'flag_no_childcare') data.flag_no_childcare = parseBool(val);
      else if (header === 'dv_safety_mode') data.dv_safety_mode = parseBool(val);
      else if (header === 'partner_tier') data.partner_tier = val || null;
      else if (header === 'last_verified_date') data.last_verified_date = parseDate(val);
      else if (header === 'source_url') data.source_url = val || null;
      else if (header === 'active') data.active = parseBool(val);
      else if (header === 'service_tags') data.service_tags = parseStringArray(val);
      else if (header === 'referral_notes') data.referral_notes = val || null;
      else if (header === 'created_at') data.created_at = parseDate(val) || new Date();
      else if (header === 'updated_at') data.updated_at = parseDate(val) || new Date();
    });
    
    if (orgIdsSet.has(data.id)) continue;
    orgIdsSet.add(data.id);
    orgsData.push(data);
  }
  
  // Family Profiles (depends on User)
  const profilesFile = path.join(CSV_DIR, 'profiles_rows.csv');
  const profileRows = parseCSV(fs.readFileSync(profilesFile, 'utf-8'));
  const profileHeaders = profileRows[0];
  const profilesData: any[] = [];
  const profileIdsSet = new Set<string>();
  
  for (let i = 1; i < profileRows.length; i++) {
    const row = profileRows[i];
    if (row.length < profileHeaders.length) continue;
    const userId = row[profileHeaders.indexOf('user_id')];
    if (!userIdsSet.has(userId)) continue; // skip orphans
    
    const data: any = {};
    profileHeaders.forEach((header, idx) => {
      const val = row[idx];
      if (header === 'id') data.id = val;
      else if (header === 'user_id') data.user_id = val;
      else if (header === 'household_size') data.household_size = parseIntNum(val);
      else if (header === 'num_children_under18') data.num_children = parseIntNum(val);
      else if (header === 'children_ages') data.children_ages = parseJson(val) || null;
      else if (header === 'gross_monthly_income') data.monthly_income = parseNum(val);
      else if (header === 'employment_status') data.employment_status = val || null;
      else if (header === 'housing_situation') data.housing_status = val || null;
      else if (header === 'has_disability') data.has_disability = parseBool(val);
      else if (header === 'pregnant') data.is_pregnant = parseBool(val);
      else if (header === 'first_name') data.first_name = val || null;
      else if (header === 'last_name') data.last_name = val || null;
      else if (header === 'date_of_birth') data.date_of_birth = parseDate(val);
      else if (header === 'phone') data.phone = val || null;
      else if (header === 'email') data.email = val || null;
      else if (header === 'language_preference') data.preferred_language = val || 'en';
      else if (header === 'street_address') data.street_address = val || null;
      else if (header === 'apartment_suite') data.apartment_suite = val || null;
      else if (header === 'city') data.city = val || null;
      else if (header === 'state') data.state = val || 'GA';
      else if (header === 'zip_code') data.zip_code = val || null;
      else if (header === 'monthly_rent') data.monthly_rent = parseNum(val);
      else if (header === 'monthly_utilities') data.monthly_utilities = parseNum(val);
      else if (header === 'landlord_name') data.landlord_name = val || null;
      else if (header === 'eviction_notice') data.eviction_risk = parseBool(val);
      else if (header === 'income_sources') data.income_sources = parseStringArray(val);
      else if (header === 'other_household_income') data.other_household_income = parseBool(val);
      else if (header === 'children_dobs') data.children_dobs = parseStringArray(val);
      else if (header === 'child_disability') data.child_disability = parseBool(val);
      else if (header === 'marital_status') data.marital_status = val || null;
      else if (header === 'other_adults') data.other_adults = parseBool(val);
      else if (header === 'needs_childcare') data.needs_childcare = parseBool(val);
      else if (header === 'has_health_insurance') data.has_health_insurance = parseBool(val);
      else if (header === 'immigration_status') data.immigration_status = val || null;
      else if (header === 'legal_issues') data.legal_issues = parseStringArray(val);
      else if (header === 'urgency_level') data.urgency = val || null;
      else if (header === 'has_savings') data.has_savings = parseBool(val);
      else if (header === 'domestic_violence') data.domestic_violence = parseBool(val);
      else if (header === 'county') data.county = val || null;
      else if (header === 'postpartum_months_since_birth') data.postpartum_months_since_birth = parseIntNum(val);
      else if (header === 'breastfeeding') data.breastfeeding = parseBool(val);
      else if (header === 'children_under_5_count') data.children_under_5_count = parseIntNum(val) || 0;
      else if (header === 'has_medicaid') data.has_medicaid = parseBool(val);
      else if (header === 'has_snap') data.has_snap = parseBool(val);
      else if (header === 'has_tanf_work_first') data.has_tanf_work_first = parseBool(val);
      else if (header === 'has_ssi') data.has_ssi = parseBool(val);
      else if (header === 'has_non_custodial_parent') data.has_non_custodial_parent = parseBool(val);
      else if (header === 'us_citizen') data.us_citizen = parseBool(val);
      else if (header === 'qualified_immigrant') data.qualified_immigrant = parseBool(val);
      else if (header === 'work_activity_hrs_per_month') data.work_activity_hrs_per_month = parseIntNum(val) || 0;
      else if (header === 'in_qualifying_activity') data.in_qualifying_activity = parseBool(val);
      else if (header === 'previously_denied_medicaid') data.previously_denied_medicaid = parseBool(val);
      else if (header === 'intake_snapshot') data.intake_snapshot = parseJson(val) || null;
      else if (header === 'preferred_contact') data.preferred_contact = val || 'email';
      else if (header === 'consent_data_use') data.consent_data_use = parseBool(val);
      else if (header === 'intake_completed_at') data.intake_completed_at = parseDate(val);
      else if (header === 'created_at') data.created_at = parseDate(val) || new Date();
      else if (header === 'updated_at') data.updated_at = parseDate(val) || new Date();
      else if (header === 'child_support_status') data.child_support_status = val || null;
      else if (header === 'childcare_preference') data.childcare_preference = val || null;
      else if (header === 'childcare_provider') data.childcare_provider = val || null;
      else if (header === 'chronic_illness') data.chronic_illness = parseBool(val);
      else if (header === 'employer_name') data.employer_name = val || null;
      else if (header === 'health_insurance') data.health_insurance = val || null;
      else if (header === 'monthly_childcare_cost') data.monthly_childcare_cost = parseNum(val);
      else if (header === 'savings_assets') data.savings_assets = val || null;
      else if (header === 'ssn_last_four') data.ssn_last_four = val || null;
      else if (header === 'work_situation') data.work_situation = val || null;
    });
    
    if (profileIdsSet.has(data.id)) continue;
    profileIdsSet.add(data.id);
    profilesData.push(data);
  }
  
  // Applications (depends on User, Program)
  const appsFile = path.join(CSV_DIR, 'applications_rows.csv');
  const appRows = parseCSV(fs.readFileSync(appsFile, 'utf-8'));
  const appHeaders = appRows[0];
  const appsData: any[] = [];
  const appIdsSet = new Set<string>();
  
  for (let i = 1; i < appRows.length; i++) {
    const row = appRows[i];
    if (row.length < appHeaders.length) continue;
    const userId = row[appHeaders.indexOf('user_id')];
    let programId = row[appHeaders.indexOf('program_id')];
    let adminId = row[appHeaders.indexOf('assigned_admin_id')];
    
    if (!userIdsSet.has(userId)) continue;
    if (programId && !programIdsSet.has(programId)) programId = '';
    if (adminId && !userIdsSet.has(adminId)) adminId = '';
    
    const data: any = {};
    appHeaders.forEach((header, idx) => {
      const val = row[idx];
      if (header === 'id') data.id = val;
      else if (header === 'user_id') data.user_id = val;
      else if (header === 'program_id') data.program_id = programId || null;
      else if (header === 'status') data.status = val || 'draft';
      else if (header === 'submitted_at') data.submitted_at = parseDate(val);
      else if (header === 'last_updated_at') data.last_updated_at = parseDate(val) || new Date();
      else if (header === 'notes') data.notes = val || null;
      else if (header === 'assigned_admin_id') data.assigned_admin_id = adminId || null;
      else if (header === 'priority') data.priority = val || 'normal';
      else if (header === 'pdf_generated') data.pdf_generated = parseBool(val);
      else if (header === 'created_at') data.created_at = parseDate(val) || new Date();
      else if (header === 'updated_at') data.updated_at = parseDate(val) || new Date();
    });
    
    if (appIdsSet.has(data.id)) continue;
    appIdsSet.add(data.id);
    appsData.push(data);
  }
  
  // Documents (depends on User, Application)
  const docsFile = path.join(CSV_DIR, 'documents_rows.csv');
  const docRows = parseCSV(fs.readFileSync(docsFile, 'utf-8'));
  const docHeaders = docRows[0];
  const docsData: any[] = [];
  const docIdsSet = new Set<string>();
  
  for (let i = 1; i < docRows.length; i++) {
    const row = docRows[i];
    if (row.length < docHeaders.length) continue;
    const userId = row[docHeaders.indexOf('user_id')];
    let appId = row[docHeaders.indexOf('application_id')];
    
    if (!userIdsSet.has(userId)) continue;
    if (appId && !appIdsSet.has(appId)) appId = '';
    
    const data: any = {};
    docHeaders.forEach((header, idx) => {
      const val = row[idx];
      if (header === 'id') data.id = val;
      else if (header === 'user_id') data.user_id = val;
      else if (header === 'application_id') data.application_id = appId || null;
      else if (header === 'document_type') data.document_type = val;
      else if (header === 'file_name') data.original_file_name = val || 'unnamed_file';
      else if (header === 'display_name') data.display_name = val || 'Unnamed Document';
      else if (header === 'storage_path') data.file_url = val;
      else if (header === 'file_size') data.file_size = parseIntNum(val);
      else if (header === 'mime_type') data.mime_type = val || null;
      else if (header === 'uploaded_at') data.uploaded_at = parseDate(val) || new Date();
    });
    
    if (docIdsSet.has(data.id)) continue;
    docIdsSet.add(data.id);
    docsData.push(data);
  }
  
  // Eligibility Results (depends on User, Program, Org)
  const resultsFile = path.join(CSV_DIR, 'results_rows.csv');
  const resultRows = parseCSV(fs.readFileSync(resultsFile, 'utf-8'));
  const resultHeaders = resultRows[0];
  const resultsData: any[] = [];
  const resultUniqueKeysSet = new Set<string>();
  
  for (let i = 1; i < resultRows.length; i++) {
    const row = resultRows[i];
    if (row.length < resultHeaders.length) continue;
    const userId = row[resultHeaders.indexOf('user_id')];
    const programId = row[resultHeaders.indexOf('program_id')];
    let orgId = row[resultHeaders.indexOf('org_id')];
    
    if (!userIdsSet.has(userId) || !programIdsSet.has(programId)) continue;
    if (orgId && !orgIdsSet.has(orgId)) orgId = '';
    
    const data: any = {};
    resultHeaders.forEach((header, idx) => {
      const val = row[idx];
      if (header === 'id') data.id = val;
      else if (header === 'user_id') data.user_id = val;
      else if (header === 'program_id') data.program_id = val;
      else if (header === 'status') data.status = val === 'qualified' || val === 'likely_qualified' || val === 'check_required' || val === 'not_qualified' ? val : 'check_required';
      else if (header === 'confidence_score') data.confidence_score = parseNum(val) || 0;
      else if (header === 'reasoning') data.reasoning = val || '';
      else if (header === 'checked_at') data.checked_at = parseDate(val) || new Date();
      else if (header === 'org_id') data.org_id = orgId || null;
      else if (header === 'match_type') data.match_type = val || null;
      else if (header === 'eligibility') data.eligibility = val || null;
      else if (header === 'estimated_benefit') data.estimated_benefit = parseNum(val);
      else if (header === 'match_reason') data.match_reason = val || null;
      else if (header === 'ai_rank') data.ai_rank = parseIntNum(val);
      else if (header === 'reasons') data.reasons = parseStringArray(val);
      else if (header === 'program_code') data.program_code = val || null;
      else if (header === 'created_at') data.created_at = parseDate(val) || new Date();
    });
    
    const uniqueKey = `${data.user_id}_${data.program_id}`;
    if (resultUniqueKeysSet.has(uniqueKey)) continue;
    resultUniqueKeysSet.add(uniqueKey);
    resultsData.push(data);
  }
  
  // Generated PDFs (depends on User, Application, Program)
  const pdfsFile = path.join(CSV_DIR, 'generated_pdfs_rows.csv');
  const pdfRows = parseCSV(fs.readFileSync(pdfsFile, 'utf-8'));
  const pdfHeaders = pdfRows[0];
  const pdfsData: any[] = [];
  const pdfIdsSet = new Set<string>();
  
  for (let i = 1; i < pdfRows.length; i++) {
    const row = pdfRows[i];
    if (row.length < pdfHeaders.length) continue;
    const userId = row[pdfHeaders.indexOf('user_id')];
    const programId = row[pdfHeaders.indexOf('program_id')];
    let appId = row[pdfHeaders.indexOf('application_id')];
    
    if (!userIdsSet.has(userId) || !programIdsSet.has(programId)) continue;
    if (appId && !appIdsSet.has(appId)) appId = '';
    
    const data: any = {};
    pdfHeaders.forEach((header, idx) => {
      const val = row[idx];
      if (header === 'id') data.id = val;
      else if (header === 'user_id') data.user_id = val;
      else if (header === 'application_id') data.application_id = appId || null;
      else if (header === 'program_id') data.program_id = val;
      else if (header === 'file_url') data.file_url = val;
      else if (header === 'file_size') data.file_size = parseIntNum(val) || 0;
      else if (header === 'version') data.version = parseIntNum(val) || 1;
      else if (header === 'status') data.status = val || 'generated';
      else if (header === 'validation_report') data.validation_report = parseJson(val) || null;
      else if (header === 'generated_at') data.generated_at = parseDate(val) || new Date();
    });
    
    if (pdfIdsSet.has(data.id)) continue;
    pdfIdsSet.add(data.id);
    pdfsData.push(data);
  }
  
  // Application Guides (depends on Program)
  const guidesFile = path.join(CSV_DIR, 'application_guides_rows.csv');
  const guideRows = parseCSV(fs.readFileSync(guidesFile, 'utf-8'));
  const guideHeaders = guideRows[0];
  const guidesData: any[] = [];
  const guideIdsSet = new Set<string>();
  
  for (let i = 1; i < guideRows.length; i++) {
    const row = guideRows[i];
    if (row.length < guideHeaders.length) continue;
    let programId = row[guideHeaders.indexOf('program_id')];
    if (programId && !programIdsSet.has(programId)) programId = '';
    
    const data: any = {};
    guideHeaders.forEach((header, idx) => {
      const val = row[idx];
      if (header === 'id') data.id = val;
      else if (header === 'program_id') data.program_id = programId || null;
      else if (header === 'guide_name') data.guide_name = val;
      else if (header === 'overview') data.overview = val || null;
      else if (header === 'apply_url') data.apply_url = val || null;
      else if (header === 'phone') data.phone = val || null;
      else if (header === 'last_verified') data.last_verified = parseDate(val);
      else if (header === 'source_url') data.source_url = val || null;
      else if (header === 'created_at') data.created_at = parseDate(val) || new Date();
      else if (header === 'state') data.state = val || 'GA';
    });
    
    if (guideIdsSet.has(data.id)) continue;
    guideIdsSet.add(data.id);
    guidesData.push(data);
  }
  
  // Guide Steps (depends on Guide)
  const stepsFile = path.join(CSV_DIR, 'guide_steps_rows.csv');
  const stepRows = parseCSV(fs.readFileSync(stepsFile, 'utf-8'));
  const stepHeaders = stepRows[0];
  const stepsData: any[] = [];
  const stepIdsSet = new Set<string>();
  
  for (let i = 1; i < stepRows.length; i++) {
    const row = stepRows[i];
    if (row.length < stepHeaders.length) continue;
    const guideId = row[stepHeaders.indexOf('guide_id')];
    if (!guideIdsSet.has(guideId)) continue;
    
    const data: any = {};
    stepHeaders.forEach((header, idx) => {
      const val = row[idx];
      if (header === 'id') data.id = val;
      else if (header === 'guide_id') data.guide_id = val;
      else if (header === 'step_number') data.step_number = parseIntNum(val) || 1;
      else if (header === 'title') data.title = val;
      else if (header === 'description') data.description = val || '';
      else if (header === 'plain_english') data.plain_english = val || null;
      else if (header === 'tip') data.tip = val || null;
      else if (header === 'url') data.url = val || null;
      else if (header === 'created_at') data.created_at = parseDate(val) || new Date();
    });
    
    if (stepIdsSet.has(data.id)) continue;
    stepIdsSet.add(data.id);
    stepsData.push(data);
  }
  
  // Income Thresholds (depends on Program)
  const thresholdsFile = path.join(CSV_DIR, 'income_thresholds_rows.csv');
  const thresholdRows = parseCSV(fs.readFileSync(thresholdsFile, 'utf-8'));
  const thresholdHeaders = thresholdRows[0];
  const thresholdsData: any[] = [];
  const thresholdIdsSet = new Set<string>();
  
  for (let i = 1; i < thresholdRows.length; i++) {
    const row = thresholdRows[i];
    if (row.length < thresholdHeaders.length) continue;
    const programId = row[thresholdHeaders.indexOf('program_id')];
    if (!programIdsSet.has(programId)) continue;
    
    const data: any = {};
    thresholdHeaders.forEach((header, idx) => {
      const val = row[idx];
      if (header === 'id') data.id = val;
      else if (header === 'program_id') data.program_id = val;
      else if (header === 'household_size') data.household_size = parseIntNum(val) || 1;
      else if (header === 'income_limit') data.income_limit = parseNum(val);
      else if (header === 'income_limit_yr') data.income_limit_yr = parseNum(val);
      else if (header === 'benefit_amount') data.benefit_amount = parseNum(val);
      else if (header === 'co_pay') data.co_pay = parseNum(val);
      else if (header === 'notes') data.notes = val || null;
      else if (header === 'created_at') data.created_at = parseDate(val) || new Date();
    });
    
    if (thresholdIdsSet.has(data.id)) continue;
    thresholdIdsSet.add(data.id);
    thresholdsData.push(data);
  }
  
  // Notifications (depends on User, Application)
  const notificationsFile = path.join(CSV_DIR, 'notifications_rows.csv');
  const notifRows = parseCSV(fs.readFileSync(notificationsFile, 'utf-8'));
  const notifHeaders = notifRows[0];
  const notificationsData: any[] = [];
  const notificationIdsSet = new Set<string>();
  
  for (let i = 1; i < notifRows.length; i++) {
    const row = notifRows[i];
    if (row.length < notifHeaders.length) continue;
    const userId = row[notifHeaders.indexOf('user_id')];
    let appId = row[notifHeaders.indexOf('related_application_id')];
    
    if (!userIdsSet.has(userId)) continue;
    if (appId && !appIdsSet.has(appId)) appId = '';
    
    const data: any = {};
    notifHeaders.forEach((header, idx) => {
      const val = row[idx];
      if (header === 'id') data.id = val;
      else if (header === 'user_id') data.user_id = val;
      else if (header === 'type') data.type = val;
      else if (header === 'title') data.title = val;
      else if (header === 'message') data.message = val || '';
      else if (header === 'is_read') data.is_read = parseBool(val);
      else if (header === 'created_at') data.created_at = parseDate(val) || new Date();
      else if (header === 'related_application_id') data.related_application_id = appId || null;
      else if (header === 'action_url') data.action_url = val || null;
    });
    
    if (notificationIdsSet.has(data.id)) continue;
    notificationIdsSet.add(data.id);
    notificationsData.push(data);
  }
  
  // 2. Clean existing database records in reverse dependency order
  console.log('🧹 Cleaning existing records from database...');
  await prisma.notification.deleteMany();
  await prisma.incomeThreshold.deleteMany();
  await prisma.guideStep.deleteMany();
  await prisma.applicationGuide.deleteMany();
  await prisma.generatedPdf.deleteMany();
  await prisma.eligibilityResult.deleteMany();
  await prisma.document.deleteMany();
  await prisma.application.deleteMany();
  await prisma.familyProfile.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.benefitProgram.deleteMany();
  await prisma.user.deleteMany();
  console.log('🧹 Database clean.');

  // 3. Bulk Insert in correct dependency order
  console.log('🚀 Bulk inserting clean records into database...');
  
  await prisma.user.createMany({ data: usersData });
  console.log(`✅ Users inserted: ${usersData.length}`);
  
  await prisma.benefitProgram.createMany({ data: programsData });
  console.log(`✅ Benefit Programs inserted: ${programsData.length}`);
  
  await prisma.organization.createMany({ data: orgsData });
  console.log(`✅ Organizations inserted: ${orgsData.length}`);
  
  await prisma.familyProfile.createMany({ data: profilesData });
  console.log(`✅ Family Profiles inserted: ${profilesData.length}`);
  
  await prisma.application.createMany({ data: appsData });
  console.log(`✅ Applications inserted: ${appsData.length}`);
  
  await prisma.document.createMany({ data: docsData });
  console.log(`✅ Documents inserted: ${docsData.length}`);
  
  await prisma.eligibilityResult.createMany({ data: resultsData });
  console.log(`✅ Eligibility Results inserted: ${resultsData.length}`);
  
  await prisma.generatedPdf.createMany({ data: pdfsData });
  console.log(`✅ Generated PDFs inserted: ${pdfsData.length}`);
  
  await prisma.applicationGuide.createMany({ data: guidesData });
  console.log(`✅ Application Guides inserted: ${guidesData.length}`);
  
  await prisma.guideStep.createMany({ data: stepsData });
  console.log(`✅ Guide Steps inserted: ${stepsData.length}`);
  
  await prisma.incomeThreshold.createMany({ data: thresholdsData });
  console.log(`✅ Income Thresholds inserted: ${thresholdsData.length}`);
  
  await prisma.notification.createMany({ data: notificationsData });
  console.log(`✅ Notifications inserted: ${notificationsData.length}`);
  
  console.log('🎉 --- BULK CSV DATA IMPORT COMPLETED SUCCESSFULLY ---');
}

main()
  .catch(e => {
    console.error('💥 Bulk Import failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
