import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../utils/errors';

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
      },
    });

    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    return user;
  }

  async updateProfile(
    userId: string,
    data: { full_name?: string; phone?: string; state?: string; zip_code?: string }
  ) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        role: true,
        plan: true,
        state: true,
        zip_code: true,
        updated_at: true,
      },
    });
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
}
