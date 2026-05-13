import { prisma } from '../../config/prisma';
import { s3Client } from '../../config/s3';
import { env } from '../../config/env';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { sendEmail } from '../../config/email';
import { UserRole } from '@prisma/client';
import crypto from 'crypto';

export class DocumentsService {
  async listDocuments(userId: string, role: UserRole) {
    if (role === 'admin' || role === 'counselor') {
      return prisma.document.findMany({
        include: {
          user: { select: { full_name: true, email: true } },
          application: { include: { program: { select: { name: true } } } },
        },
        orderBy: { uploaded_at: 'desc' },
      });
    }

    return prisma.document.findMany({
      where: { user_id: userId },
      include: {
        application: { include: { program: { select: { name: true } } } },
      },
      orderBy: { uploaded_at: 'desc' },
    });
  }

  async getDocumentById(id: string, userId: string, role: UserRole) {
    const doc = await prisma.document.findUnique({
      where: { id },
      include: {
        application: true,
      },
    });

    if (!doc) {
      throw new NotFoundError('Document not found');
    }

    if (role === 'user' && doc.user_id !== userId) {
      throw new ForbiddenError('Access denied to view this document');
    }

    return doc;
  }

  async uploadDocument(
    userId: string,
    file: Express.Multer.File,
    data: { document_type: string; application_id?: string }
  ) {
    const fileExtension = file.originalname.split('.').pop() || '';
    const uniqueKey = `documents/${userId}/${crypto.randomUUID()}.${fileExtension}`;
    const isPlaceholder = env.AWS_ACCESS_KEY_ID.includes('placeholder');

    let file_url = `https://${env.S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${uniqueKey}`;

    if (isPlaceholder) {
      console.log('⚠️ [MOCK S3 UPLOAD] Using dummy storage URL due to placeholder credentials.');
      file_url = `https://mock-s3-storage.local/${uniqueKey}`;
    } else {
      // Execute actual upload to S3 bucket
      await s3Client.send(
        new PutObjectCommand({
          Bucket: env.S3_BUCKET_NAME,
          Key: uniqueKey,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );
    }

    const document = await prisma.document.create({
      data: {
        user_id: userId,
        application_id: data.application_id || null,
        document_type: data.document_type,
        file_name: file.originalname,
        file_url,
        file_size: file.size,
        mime_type: file.mimetype,
        verified: false,
      },
    });

    return document;
  }

  async deleteDocument(id: string, userId: string, role: UserRole) {
    const doc = await prisma.document.findUnique({
      where: { id },
    });

    if (!doc) {
      throw new NotFoundError('Document not found');
    }

    if (role === 'user' && doc.user_id !== userId) {
      throw new ForbiddenError('Access denied to delete this document');
    }

    // Try removing from S3 if real credentials are used
    if (!env.AWS_ACCESS_KEY_ID.includes('placeholder')) {
      try {
        // Extract S3 key from URL
        const urlObj = new URL(doc.file_url);
        const key = urlObj.pathname.substring(1); // remove leading slash
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: env.S3_BUCKET_NAME,
            Key: key,
          })
        );
      } catch (err) {
        console.error('Failed to delete S3 file:', err);
      }
    }

    await prisma.document.delete({
      where: { id },
    });
  }

  async verifyDocument(id: string, verifierId: string) {
    const doc = await prisma.document.findUnique({
      where: { id },
      include: {
        user: true,
        application: { include: { program: true } },
      },
    });

    if (!doc) {
      throw new NotFoundError('Document not found');
    }

    const updated = await prisma.document.update({
      where: { id },
      data: {
        verified: true,
        verified_by: verifierId,
      },
      include: {
        application: { include: { program: true } },
      },
    });

    // Create DB notification
    await prisma.notification.create({
      data: {
        user_id: doc.user_id,
        type: 'status_update',
        title: 'Document Verified',
        message: `Your uploaded document "${doc.file_name}" (${doc.document_type.replace('_', ' ')}) has been officially verified.`,
        related_application_id: doc.application_id,
      },
    });

    // Trigger email: Document verification complete
    await sendEmail({
      to: doc.user.email,
      subject: 'MomPlan: Document Verification Complete',
      html: `<h1>Document Successfully Verified</h1>
      <p>Hello ${doc.user.full_name},</p>
      <p>Good news! Your uploaded file <strong>${doc.file_name}</strong> has been verified by our administration team.</p>
      ${doc.application ? `<p>This contributes to your application for <strong>${doc.application.program.name}</strong>.</p>` : ''}
      <p>Log back into your dashboard to monitor complete application milestones.</p>`,
    });

    return updated;
  }
}
