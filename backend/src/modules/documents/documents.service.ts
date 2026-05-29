import { prisma } from '../../config/prisma';
import { s3Client } from '../../config/s3';
import { env } from '../../config/env';
import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { sendEmail } from '../../config/email';
import { UserRole } from '@prisma/client';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

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

    let file_url = '';

    if (isPlaceholder) {
      console.log('⚠️ [MOCK S3 UPLOAD] Saving file locally due to placeholder credentials.');
      const uploadDir = path.join(process.cwd(), 'uploads', 'documents', userId);
      fs.mkdirSync(uploadDir, { recursive: true });
      const localPath = path.join(uploadDir, `${crypto.randomUUID()}.${fileExtension}`);
      fs.writeFileSync(localPath, file.buffer);
      file_url = localPath;
    } else {
      file_url = `https://${env.S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${uniqueKey}`;
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
        original_file_name: file.originalname,
        display_name: file.originalname,
        file_url,
        file_size: file.size,
        mime_type: file.mimetype,
      },
    });

    return document;
  }

  async downloadDocument(id: string, userId: string, role: UserRole) {
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundError('Document not found');
    if (role === 'user' && doc.user_id !== userId) throw new ForbiddenError('Access denied to view this document');

    const isPlaceholder = env.AWS_ACCESS_KEY_ID.includes('placeholder');

    if (isPlaceholder) {
      let filePath = doc.file_url;
      if (!fs.existsSync(filePath)) {
        // Fallback: try to resolve relative to process.cwd()
        const docsIndex = doc.file_url.indexOf('uploads');
        if (docsIndex !== -1) {
          const relativePath = doc.file_url.substring(docsIndex);
          const resolvedPath = path.join(process.cwd(), relativePath);
          if (fs.existsSync(resolvedPath)) {
            filePath = resolvedPath;
          } else {
            const resolvedPathSub = path.join(process.cwd(), 'backend', relativePath);
            if (fs.existsSync(resolvedPathSub)) {
              filePath = resolvedPathSub;
            } else {
              throw new NotFoundError(`Local file not found at ${filePath} or ${resolvedPath}`);
            }
          }
        } else {
          throw new NotFoundError('Local file not found');
        }
      }

      return {
        stream: fs.createReadStream(filePath),
        mimeType: doc.mime_type,
        fileName: doc.display_name,
        size: doc.file_size,
      };
    } else {
      try {
        const urlObj = new URL(doc.file_url);
        const key = urlObj.pathname.substring(1);
        const s3Obj = await s3Client.send(
          new GetObjectCommand({
            Bucket: env.S3_BUCKET_NAME,
            Key: key,
          })
        );
        return {
          stream: s3Obj.Body,
          mimeType: doc.mime_type,
          fileName: doc.display_name,
          size: doc.file_size,
        };
      } catch (err) {
        console.error('Failed to stream S3 file:', err);
        throw new NotFoundError('Document file not found in storage');
      }
    }
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

    const isPlaceholder = env.AWS_ACCESS_KEY_ID.includes('placeholder');

    if (isPlaceholder) {
      try {
        if (fs.existsSync(doc.file_url)) {
          fs.unlinkSync(doc.file_url);
        }
      } catch (err) {
        console.error('Failed to delete local file:', err);
      }
    } else {
      try {
        const urlObj = new URL(doc.file_url);
        const key = urlObj.pathname.substring(1);
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

  async renameDocument(id: string, userId: string, role: UserRole, newName: string) {
    const doc = await prisma.document.findUnique({
      where: { id },
    });

    if (!doc) {
      throw new NotFoundError('Document not found');
    }

    if (role === 'user' && doc.user_id !== userId) {
      throw new ForbiddenError('Access denied to rename this document');
    }

    // Optional: Validate extension. For simplicity, we just save the exact display_name given
    // assuming frontend handles extension logic if needed, or we just trust the string.
    
    const updated = await prisma.document.update({
      where: { id },
      data: { display_name: newName },
    });

    return updated;
  }
}
