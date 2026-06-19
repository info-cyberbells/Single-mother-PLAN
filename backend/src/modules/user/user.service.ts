import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../utils/errors';

/**
 * Converts a Prisma Decimal object (or string/number) to a plain JS number.
 * Returns null if the value is null/undefined or cannot be parsed.
 */
function parseDecimal(val: any): number | null {
  if (val === null || val === undefined) return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
}

/**
 * Serializes Decimal fields in a family_profile object to plain numbers
 * so they are never sent to the client as Prisma Decimal objects ([object Object]).
 */
function serializeProfile(user: any): any {
  if (!user?.family_profile) return user;
  const fp = user.family_profile;
  return {
    ...user,
    family_profile: {
      ...fp,
      monthly_rent: parseDecimal(fp.monthly_rent),
      monthly_utilities: parseDecimal(fp.monthly_utilities),
      monthly_childcare_cost: parseDecimal(fp.monthly_childcare_cost),
      monthly_income: parseDecimal(fp.monthly_income),
    },
  };
}

export class UserService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        role: true,
        plan: true,
        state: true,
        zip_code: true,
        created_at: true,
        updated_at: true,
        last_active_at: true,
        status: true,
        profile_picture: true,
        family_profile: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    return serializeProfile(user);
  }

  async updateProfile(
    userId: string,
    data: any
  ) {
    const { 
      full_name, phone, email, state, zip_code,
      household_size, num_children, children_ages, monthly_income,
      employment_status, housing_status, has_disability, is_pregnant,
      
      // New Wiser Moms fields
      needs_childcare, monthly_rent, monthly_utilities, eviction_risk, domestic_violence,
      chronic_illness, immigration_status, date_of_birth, ssn_last_four, preferred_language,
      marital_status, other_adults, income_sources, work_situation, employer_name,
      health_insurance, savings_assets, child_support_status,
      monthly_childcare_cost, childcare_preference, childcare_provider, legal_issues, urgency,
      first_name, last_name, children_dobs,
      // Address
      street_address, city,
      profile_picture,
    } = data;

    // Update User basic info
    const userUpdate: any = {};
    if (full_name !== undefined) userUpdate.full_name = full_name;
    if (phone !== undefined) userUpdate.phone = phone;
    if (state !== undefined) userUpdate.state = state;
    if (zip_code !== undefined) userUpdate.zip_code = zip_code;
    if (profile_picture !== undefined) userUpdate.profile_picture = profile_picture;
    // Only update email if provided (requires uniqueness check implicitly via Prisma)
    if (email !== undefined) userUpdate.email = email;

    const user = await prisma.user.update({
      where: { id: userId },
      data: userUpdate,
      include: { family_profile: true }
    });

    // Update Family Profile if any family fields are present
    const hasFamilyData = [
      household_size, num_children, monthly_income, 
      employment_status, housing_status, has_disability, is_pregnant,
      needs_childcare, monthly_rent, monthly_utilities, eviction_risk, domestic_violence,
      chronic_illness, immigration_status, date_of_birth, ssn_last_four, preferred_language,
      marital_status, other_adults, income_sources, work_situation, employer_name,
      health_insurance, savings_assets, child_support_status,
      monthly_childcare_cost, childcare_preference, childcare_provider, legal_issues, urgency,
      first_name, last_name, children_dobs,
      street_address, city,
    ].some(val => val !== undefined);

    if (hasFamilyData) {
      const parsedDob = date_of_birth ? new Date(date_of_birth) : undefined;

      await prisma.familyProfile.upsert({
        where: { user_id: userId },
        create: {
          user_id: userId,
          household_size: household_size || 1,
          num_children: num_children || 0,
          children_ages: children_ages || [],
          monthly_income: monthly_income || 0,
          employment_status: employment_status || 'unemployed',
          housing_status: housing_status || 'renting',
          has_disability: has_disability || false,
          is_pregnant: is_pregnant || false,
          
          needs_childcare: needs_childcare || false,
          monthly_rent: monthly_rent || 0,
          monthly_utilities: monthly_utilities || 0,
          eviction_risk: eviction_risk || false,
          domestic_violence: domestic_violence || false,
          chronic_illness: chronic_illness || false,
          immigration_status: immigration_status || 'citizen',
          date_of_birth: parsedDob,
          ssn_last_four: ssn_last_four || null,
          preferred_language: preferred_language || 'English',
          marital_status: marital_status || 'single',
          other_adults: other_adults || false,
          income_sources: income_sources || [],
          work_situation: work_situation || '',
          employer_name: employer_name || null,
          health_insurance: health_insurance || '',
          savings_assets: savings_assets || '',
          child_support_status: child_support_status || 'none',
          monthly_childcare_cost: monthly_childcare_cost || null,
          childcare_preference: childcare_preference || null,
          childcare_provider: childcare_provider || null,
          legal_issues: legal_issues || [],
          urgency: urgency || 'not_urgent',
          street_address: street_address || null,
          city: city || null,
          state: state || null,
          zip_code: zip_code || null,
          first_name: first_name || null,
          last_name: last_name || null,
          children_dobs: children_dobs || [],
        },
        update: {
          ...(household_size !== undefined && { household_size }),
          ...(num_children !== undefined && { num_children }),
          ...(children_ages !== undefined && { children_ages }),
          ...(monthly_income !== undefined && { monthly_income }),
          ...(employment_status !== undefined && { employment_status }),
          ...(housing_status !== undefined && { housing_status }),
          ...(has_disability !== undefined && { has_disability }),
          ...(is_pregnant !== undefined && { is_pregnant }),
          
          ...(needs_childcare !== undefined && { needs_childcare }),
          ...(monthly_rent !== undefined && { monthly_rent }),
          ...(monthly_utilities !== undefined && { monthly_utilities }),
          ...(eviction_risk !== undefined && { eviction_risk }),
          ...(domestic_violence !== undefined && { domestic_violence }),
          ...(chronic_illness !== undefined && { chronic_illness }),
          ...(immigration_status !== undefined && { immigration_status }),
          ...(date_of_birth !== undefined && { date_of_birth: parsedDob }),
          ...(ssn_last_four !== undefined && { ssn_last_four }),
          ...(preferred_language !== undefined && { preferred_language }),
          ...(marital_status !== undefined && { marital_status }),
          ...(other_adults !== undefined && { other_adults }),
          ...(income_sources !== undefined && { income_sources }),
          ...(work_situation !== undefined && { work_situation }),
          ...(employer_name !== undefined && { employer_name }),
          ...(health_insurance !== undefined && { health_insurance }),
          ...(savings_assets !== undefined && { savings_assets }),
          ...(child_support_status !== undefined && { child_support_status }),
          ...(monthly_childcare_cost !== undefined && { monthly_childcare_cost }),
          ...(childcare_preference !== undefined && { childcare_preference }),
          ...(childcare_provider !== undefined && { childcare_provider }),
          ...(legal_issues !== undefined && { legal_issues }),
          ...(urgency !== undefined && { urgency }),
          ...(street_address !== undefined && { street_address }),
          ...(city !== undefined && { city }),
          ...(state !== undefined && { state }),
          ...(zip_code !== undefined && { zip_code }),
          ...(first_name !== undefined && { first_name }),
          ...(last_name !== undefined && { last_name }),
          ...(children_dobs !== undefined && { children_dobs }),
        }
      });
    }

    return this.getProfile(userId);
  }

  async getFamilyProfile(userId: string) {
    const profile = await prisma.familyProfile.findUnique({
      where: { user_id: userId },
    });

    if (!profile) {
      throw new NotFoundError('Family profile not configured yet');
    }

    return profile;
  }

  async updateFamilyProfile(
    userId: string,
    data: {
      household_size: number;
      num_children: number;
      children_ages: number[];
      monthly_income: number;
      employment_status: string;
      housing_status: string;
      has_disability: boolean;
      is_pregnant: boolean;
    }
  ) {
    return prisma.familyProfile.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        ...data,
      },
      update: data,
    });
  }

  async listCounselors() {
    return prisma.user.findMany({
      where: { role: 'counselor', status: 'active' },
      select: {
        id: true,
        full_name: true,
        email: true,
        profile_picture: true,
      }
    });
  }
}
