import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../utils/errors';

let cachedPrograms: any[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache TTL

export function clearProgramsCache() {
  cachedPrograms = null;
  cacheTimestamp = 0;
}

export class ProgramsService {
  async listPrograms(filters: { state?: string; type?: string }) {
    const now = Date.now();
    if (!cachedPrograms || now - cacheTimestamp > CACHE_TTL) {
      cachedPrograms = await prisma.benefitProgram.findMany({
        where: {
          is_active: true,
        },
        orderBy: { name: 'asc' },
      });
      cacheTimestamp = now;
    }

    let filtered = cachedPrograms;

    if (filters.state && filters.state !== 'All') {
      const targetState = filters.state.toLowerCase();
      filtered = filtered.filter(p => {
        const fedOrState = (p.federal_or_state || '').toLowerCase();
        const stateCode = (p.state_code || '').toLowerCase();
        return fedOrState === 'federal' || fedOrState.includes('federal') || stateCode === targetState;
      });
    }

    if (filters.type && filters.type !== 'All') {
      const targetType = filters.type.toLowerCase();
      filtered = filtered.filter(p => {
        const programType = (p.program_type || '').toLowerCase();
        return programType === targetType;
      });
    }

    return filtered;
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

    // Invalidate cache
    clearProgramsCache();

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

    // Invalidate cache
    clearProgramsCache();

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

    // Invalidate cache
    clearProgramsCache();

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
