import { Router } from 'express';
import { PartnerCasesController } from './partner-cases.controller';
import { PartnerDashboardController } from './partner-dashboard.controller';
import { authenticateOrgUser, requireOrgRole } from './partner-auth.middleware';
import { withControllerLog } from '../../utils/controllerLog';

const router = Router();
const ctrl = withControllerLog(new PartnerCasesController(), 'partner.dashboard');
const dash = withControllerLog(new PartnerDashboardController(), 'partner.dashboard');

router.get('/summary', authenticateOrgUser, ctrl.getSummary);

// Program Performance Breakdown — available to admins (org-wide) and caseworkers (own caseload)
router.get('/program-performance', authenticateOrgUser, dash.getProgramPerformance);

// Team Overview Panel — organization admins only
router.get('/team-overview', authenticateOrgUser, requireOrgRole('admin'), dash.getTeamOverview);

export default router;
