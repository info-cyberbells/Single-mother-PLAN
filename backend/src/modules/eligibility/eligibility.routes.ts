import { Router } from 'express';
import { EligibilityController } from './eligibility.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { getResultParamSchema } from './eligibility.schema';

const router = Router();
const eligibilityController = new EligibilityController();

router.use(authenticate);

router.post('/scan', eligibilityController.runScan);
router.get('/results', eligibilityController.getResults);
router.get('/results/:programId', validate(getResultParamSchema), eligibilityController.getResultByProgramId);

export default router;
