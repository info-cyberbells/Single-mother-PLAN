import { Request, Response, NextFunction } from 'express';
import { PdfService } from './pdf.service';
import { UnauthorizedError, NotFoundError, ForbiddenError } from '../../utils/errors';
import { env } from '../../config/env';
import fs from 'fs';

const pdfService = new PdfService();

export class PdfController {
  async validateForProgram(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const report = await pdfService.validateForProgram(req.user.id, req.body.program_id);
      res.status(200).json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  async generatePdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const pdf = await pdfService.generateApplicationPdf(
        req.user.id,
        req.body.program_id,
        req.body.application_id
      );
      res.status(201).json({ success: true, data: pdf });
    } catch (error) {
      next(error);
    }
  }

  async listPdfs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const pdfs = await pdfService.listPdfs(req.user.id, req.user.role);
      res.status(200).json({ success: true, data: pdfs });
    } catch (error) {
      next(error);
    }
  }

  async downloadPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const url = await pdfService.getDownloadUrl(req.params.id, req.user.id, req.user.role);
      res.status(200).json({ success: true, data: { url } });
    } catch (error) {
      next(error);
    }
  }

  async streamLocalPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const pdfs = await pdfService.listPdfs(req.user.id, req.user.role);
      const pdf = pdfs.find(p => p.id === req.params.id);
      
      if (!pdf) {
        throw new NotFoundError('PDF not found');
      }

      // Check access control
      if (req.user.role !== 'admin' && req.user.role !== 'counselor' && pdf.user_id !== req.user.id) {
        throw new ForbiddenError('Access denied');
      }

      const filePath = pdf.file_url;
      if (!fs.existsSync(filePath)) {
        throw new NotFoundError('Local PDF file not found on disk');
      }

      const fileName = `${pdf.program?.name || 'Application'}_Package.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      res.setHeader('Content-Length', pdf.file_size.toString());

      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    } catch (error) {
      next(error);
    }
  }

  async deletePdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      // Admin/counselors can delete any PDF, users can only delete their own
      const pdfs = await pdfService.listPdfs(req.user.id, req.user.role);
      const pdf = pdfs.find(p => p.id === req.params.id);

      if (!pdf) {
        throw new NotFoundError('PDF not found');
      }

      if (req.user.role !== 'admin' && req.user.role !== 'counselor' && pdf.user_id !== req.user.id) {
        throw new ForbiddenError('Access denied to delete this PDF');
      }

      // Delete file from disk if placeholder mode
      const isPlaceholder = env.AWS_ACCESS_KEY_ID.includes('placeholder');
      if (isPlaceholder) {
        try {
          if (fs.existsSync(pdf.file_url)) {
            fs.unlinkSync(pdf.file_url);
          }
        } catch (err) {
          console.error('Failed to delete local PDF file:', err);
        }
      } else {
        // AWS S3 DeleteObjectCommand
        const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
        const { s3Client } = require('../../config/s3');
        try {
          const urlObj = new URL(pdf.file_url);
          const key = urlObj.pathname.substring(1);
          await s3Client.send(new DeleteObjectCommand({
            Bucket: env.S3_BUCKET_NAME,
            Key: key,
          }));
        } catch (err) {
          console.error('Failed to delete S3 PDF file:', err);
        }
      }

      // Delete from Prisma
      const { prisma } = require('../../config/prisma');
      await prisma.generatedPdf.delete({ where: { id: req.params.id } });

      res.status(200).json({ success: true, message: 'PDF deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
