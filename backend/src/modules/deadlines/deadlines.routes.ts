import { Router } from 'express';
import { DeadlinesController } from './deadlines.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { deadlineIdParamSchema, createDeadlineSchema } from './deadlines.schema';

const router = Router();
const deadlinesController = new DeadlinesController();

router.use(authenticate);

router.get('/', deadlinesController.listDeadlines);
router.post('/', validate(createDeadlineSchema), deadlinesController.createDeadline);
router.put('/:id/complete', validate(deadlineIdParamSchema), deadlinesController.completeDeadline);

export default router;
