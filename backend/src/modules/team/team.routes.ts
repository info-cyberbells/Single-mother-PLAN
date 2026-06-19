import { Router } from 'express';
import { TeamController } from './team.controller';
import { authenticateOrgUser, requireOrgRole } from '../partner/partner-auth.middleware';
import { validate } from '../../middleware/validate';
import {
  bulkCreateMembersSchema,
  memberIdParamsSchema,
  updateMemberStatusSchema,
} from './team.schema';
import { withControllerLog } from '../../utils/controllerLog';

const router = Router();
const ctrl = withControllerLog(new TeamController(), 'team');

router.use(authenticateOrgUser, requireOrgRole('admin'));

router.get('/', ctrl.listMembers);
router.post('/bulk-create', validate(bulkCreateMembersSchema), ctrl.bulkCreate);
router.delete('/:id', validate(memberIdParamsSchema), ctrl.deleteMember);
router.post('/:id/reset-password', validate(memberIdParamsSchema), ctrl.resetPassword);
router.patch('/:id/status', validate(updateMemberStatusSchema), ctrl.updateStatus);

export default router;
