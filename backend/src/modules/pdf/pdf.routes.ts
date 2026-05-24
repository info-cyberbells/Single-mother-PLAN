import { Router } from 'express';
import { PdfController } from './pdf.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { generatePdfSchema, validatePdfSchema, pdfIdParamSchema } from './pdf.schema';

const router = Router();
const pdfController = new PdfController();

router.use(authenticate);

router.post('/validate', validate(validatePdfSchema), pdfController.validateForProgram);
router.post('/generate', validate(generatePdfSchema), pdfController.generatePdf);
router.get('/', pdfController.listPdfs);
router.get('/:id/download', validate(pdfIdParamSchema), pdfController.downloadPdf);
router.get('/:id/download/stream', validate(pdfIdParamSchema), pdfController.streamLocalPdf);
router.delete('/:id', validate(pdfIdParamSchema), pdfController.deletePdf);

export default router;
