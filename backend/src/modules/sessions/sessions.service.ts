import { prisma } from '../../config/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../utils/errors';
import { sendEmail } from '../../config/email';
import { UserRole } from '@prisma/client';

export class SessionsService {
  async listSessions(userId: string, role: UserRole) {
    if (role === 'admin') {
      return prisma.counselorSession.findMany({
        include: {
          user: { select: { full_name: true, email: true } },
          counselor: { select: { full_name: true, email: true } },
        },
        orderBy: { scheduled_at: 'asc' },
      });
    }

    if (role === 'counselor') {
      return prisma.counselorSession.findMany({
        where: { counselor_id: userId },
        include: {
          user: { select: { full_name: true, email: true } },
        },
        orderBy: { scheduled_at: 'asc' },
      });
    }

    // Normal users view sessions where they are the user
    return prisma.counselorSession.findMany({
      where: { user_id: userId },
      include: {
        counselor: { select: { full_name: true, email: true } },
      },
      orderBy: { scheduled_at: 'asc' },
    });
  }

  async bookSession(
    userId: string,
    data: { counselor_id: string; scheduled_at: string; duration_minutes: number; notes?: string }
  ) {
    // Ensure target counselor exists and has role 'counselor' or 'admin'
    const counselor = await prisma.user.findUnique({
      where: { id: data.counselor_id },
    });

    if (!counselor || (counselor.role !== 'counselor' && counselor.role !== 'admin')) {
      throw new BadRequestError('Selected user is not an available counselor');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    // Default mock meeting URL
    const meeting_url = `https://meet.momplan.gov-assist.com/${counselor.id}/${Date.now()}`;

    const session = await prisma.counselorSession.create({
      data: {
        user_id: userId,
        counselor_id: data.counselor_id,
        scheduled_at: new Date(data.scheduled_at),
        duration_minutes: data.duration_minutes,
        status: 'scheduled',
        notes: data.notes,
        meeting_url,
      },
      include: {
        counselor: { select: { full_name: true, email: true } },
      },
    });

    // Create DB notification
    await prisma.notification.create({
      data: {
        user_id: userId,
        type: 'system',
        title: 'Counselor Session Confirmed',
        message: `Your benefits counseling session with ${session.counselor.full_name} is successfully scheduled for ${session.scheduled_at.toLocaleString()}.`,
        action_url: meeting_url,
      },
    });

    // Trigger email: Counselor session confirmation
    await sendEmail({
      to: user.email,
      subject: 'MomPlan: Counselor Session Confirmed',
      html: `<h1>Counseling Session Scheduled</h1>
      <p>Hello ${user.full_name},</p>
      <p>Your one-on-one consultation with certified benefits advisor <strong>${session.counselor.full_name}</strong> is confirmed.</p>
      <p><strong>Date & Time:</strong> ${session.scheduled_at.toLocaleString()}</p>
      <p><strong>Duration:</strong> ${session.duration_minutes} minutes</p>
      <p><strong>Meeting Link:</strong> <a href="${meeting_url}">${meeting_url}</a></p>
      ${session.notes ? `<p><strong>Notes provided:</strong> ${session.notes}</p>` : ''}
      <p>We recommend joining the meeting 5 minutes early.</p>`,
    });

    return session;
  }

  async updateSession(
    id: string,
    userId: string,
    role: UserRole,
    data: { status?: string; notes?: string | null; meeting_url?: string | null; scheduled_at?: string }
  ) {
    const existing = await prisma.counselorSession.findUnique({
      where: { id },
      include: { user: true, counselor: true },
    });

    if (!existing) {
      throw new NotFoundError('Session not found');
    }

    if (role === 'user' && existing.user_id !== userId) {
      throw new ForbiddenError('Access denied');
    }

    if (role === 'counselor' && existing.counselor_id !== userId) {
      throw new ForbiddenError('Access denied');
    }

    const updatePayload: any = { ...data };
    if (data.scheduled_at) {
      updatePayload.scheduled_at = new Date(data.scheduled_at);
    }

    const updated = await prisma.counselorSession.update({
      where: { id },
      data: updatePayload,
      include: { user: true, counselor: true },
    });

    return updated;
  }

  async deleteSession(id: string, userId: string, role: UserRole) {
    const existing = await prisma.counselorSession.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Session not found');
    }

    if (role === 'user' && existing.user_id !== userId) {
      throw new ForbiddenError('Access denied');
    }

    if (role === 'counselor' && existing.counselor_id !== userId) {
      throw new ForbiddenError('Access denied');
    }

    await prisma.counselorSession.delete({
      where: { id },
    });
  }
}
