import { Router } from 'express';
import { ApplicationsController } from './applications.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  applicationIdParamSchema,
  createApplicationSchema,
  updateApplicationSchema,
} from './applications.schema';

const router = Router();
const applicationsController = new ApplicationsController();

router.use(authenticate);

router.get('/', applicationsController.listApplications);
router.post('/', validate(createApplicationSchema), applicationsController.createApplication);
router.get('/:id', validate(applicationIdParamSchema), applicationsController.getApplicationById);
router.put('/:id', validate(updateApplicationSchema), applicationsController.updateApplication);
router.delete('/:id', validate(applicationIdParamSchema), applicationsController.deleteApplication);

export default router;
