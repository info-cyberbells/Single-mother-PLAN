import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../utils/errors';

export class ProgramsService {
  async listPrograms(filters: { state?: string; type?: string }) {
    const whereClause: any = {
      is_active: true,
    };

    if (filters.state) {
      whereClause.OR = [
        { federal_or_state: 'federal' },
        { state_code: { equals: filters.state, mode: 'insensitive' } },
      ];
    }

    if (filters.type) {
      whereClause.program_type = { equals: filters.type, mode: 'insensitive' };
    }

    return prisma.benefitProgram.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });
  }

  async getProgramById(id: string) {
    const program = await prisma.benefitProgram.findUnique({
      where: { id },
    });

    if (!program) {
      throw new NotFoundError('Benefit program not found');
    }

    return program;
  }

  async createProgram(
    adminId: string,
    data: {
      name: string;
      agency: string;
      program_type: string;
      federal_or_state: string;
      state_code?: string | null;
      description: string;
      eligibility_criteria: any;
      estimated_monthly_value_min: number;
      estimated_monthly_value_max: number;
      application_url?: string | null;
      contact_email?: string | null;
      is_active?: boolean;
    }
  ) {
    const program = await prisma.benefitProgram.create({
      data,
    });

    // Create Audit log
    await prisma.auditLog.create({
      data: {
        admin_id: adminId,
        action: 'create_program',
        target_type: 'benefit_programs',
        target_id: program.id,
        metadata: { name: program.name },
      },
    });

    return program;
  }

  async updateProgram(adminId: string, id: string, data: any) {
    const existing = await prisma.benefitProgram.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Benefit program not found');
    }

    const updated = await prisma.benefitProgram.update({
      where: { id },
      data,
    });

    await prisma.auditLog.create({
      data: {
        admin_id: adminId,
        action: 'update_program',
        target_type: 'benefit_programs',
        target_id: updated.id,
        metadata: { updatedFields: Object.keys(data) },
      },
    });

    return updated;
  }

  async deleteProgram(adminId: string, id: string) {
    const existing = await prisma.benefitProgram.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Benefit program not found');
    }

    await prisma.benefitProgram.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        admin_id: adminId,
        action: 'delete_program',
        target_type: 'benefit_programs',
        target_id: id,
        metadata: { name: existing.name },
      },
    });
  }
}
