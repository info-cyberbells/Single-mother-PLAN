import { Router } from 'express';
import { PartnerOrgController } from './partner-org.controller';
import { authenticateOrgUser, requireOrgRole } from './partner-auth.middleware';
import { withControllerLog } from '../../utils/controllerLog';

const router = Router();
const ctrl = withControllerLog(new PartnerOrgController(), 'partner.organization');

router.get(
  '/',
  authenticateOrgUser,
  requireOrgRole('admin'),
  ctrl.getOrganization
);
router.post(
  '/onboarding/complete',
  authenticateOrgUser,
  ctrl.completeOnboarding
);

export default router;
