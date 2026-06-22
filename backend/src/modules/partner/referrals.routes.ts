import { Router } from 'express';
import { ReferralsController } from './referrals.controller';
import { authenticateOrgUser } from './partner-auth.middleware';
import { withControllerLog } from '../../utils/controllerLog';

const router = Router();
const ctrl = withControllerLog(new ReferralsController(), 'partner.referrals');

router.get('/summary', authenticateOrgUser, ctrl.getSummary);
router.get('/target-orgs', authenticateOrgUser, ctrl.targetOrgs);
router.get('/cases', authenticateOrgUser, ctrl.referableCases);
router.get('/', authenticateOrgUser, ctrl.list);
router.post('/', authenticateOrgUser, ctrl.create);
router.patch('/:id', authenticateOrgUser, ctrl.updateStatus);

export default router;
