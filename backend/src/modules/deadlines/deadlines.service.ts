import { prisma } from '../../config/prisma';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { UserRole } from '@prisma/client';

export class DeadlinesService {
  async listDeadlines(userId: string, role: UserRole) {
    if (role === 'admin' || role === 'counselor') {
      return prisma.deadline.findMany({
        include: {
          application: { include: { program: { select: { name: true } } } },
          user: { select: { full_name: true, email: true } },
        },
        orderBy: { due_date: 'asc' },
      });
    }

    return prisma.deadline.findMany({
      where: { user_id: userId },
      include: {
        application: { include: { program: { select: { name: true } } } },
      },
      orderBy: { due_date: 'asc' },
    });
  }

  async createDeadline(
    creatorId: string,
    role: UserRole,
    data: { application_id: string; deadline_type: string; due_date: string }
  ) {
    const application = await prisma.application.findUnique({
      where: { id: data.application_id },
    });

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    // Normal users can only create deadlines for their own application
    if (role === 'user' && application.user_id !== creatorId) {
      throw new ForbiddenError('Access denied');
    }

    return prisma.deadline.create({
      data: {
        user_id: application.user_id,
        application_id: data.application_id,
        deadline_type: data.deadline_type,
        due_date: new Date(data.due_date),
        is_completed: false,
      },
      include: {
        application: { include: { program: { select: { name: true } } } },
      },
    });
  }

  async completeDeadline(id: string, userId: string, role: UserRole) {
    const deadline = await prisma.deadline.findUnique({
      where: { id },
    });

    if (!deadline) {
      throw new NotFoundError('Deadline not found');
    }

    if (role === 'user' && deadline.user_id !== userId) {
      throw new ForbiddenError('Access denied');
    }

    return prisma.deadline.update({
      where: { id },
      data: { is_completed: true },
      include: {
        application: { include: { program: { select: { name: true } } } },
      },
    });
  }

  async deleteDeadline(id: string, userId: string, role: UserRole) {
    const deadline = await prisma.deadline.findUnique({ where: { id } });
    if (!deadline) throw new NotFoundError('Deadline not found');
    if (role === 'user' && deadline.user_id !== userId) throw new ForbiddenError('Access denied');
    await prisma.deadline.delete({ where: { id } });
  }
}
