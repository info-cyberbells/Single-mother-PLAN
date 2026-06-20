import { Request, Response, NextFunction } from 'express';
import { PartnerDashboardService } from './partner-dashboard.service';
import { toAccessContext } from './partner-access';
import { UnauthorizedError } from '../../utils/errors';

const svc = new PartnerDashboardService();

export class PartnerDashboardController {
  async getProgramPerformance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.orgUser) throw new UnauthorizedError('Not authenticated');
      const ctx = toAccessContext(req.orgUser);
      const data = await svc.getProgramPerformance(
        ctx,
        req.query.quarter as string | undefined,
        req.query.year ? Number(req.query.year) : undefined
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getTeamOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.orgUser) throw new UnauthorizedError('Not authenticated');
      const ctx = toAccessContext(req.orgUser);
      const data = await svc.getTeamOverview(
        ctx,
        req.query.quarter as string | undefined,
        req.query.year ? Number(req.query.year) : undefined
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
