import { Router } from 'express';
import { UserController } from './user.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { updateProfileSchema, updateFamilyProfileSchema } from './user.schema';

const router = Router();
const userController = new UserController();

router.use(authenticate);

router.get('/profile', userController.getProfile);
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);
router.get('/family-profile', userController.getFamilyProfile);
router.put('/family-profile', validate(updateFamilyProfileSchema), userController.updateFamilyProfile);
router.get('/counselors', userController.listCounselors);

export default router;
