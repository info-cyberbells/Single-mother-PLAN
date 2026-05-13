import { Request, Response, NextFunction } from 'express';
import { DeadlinesService } from './deadlines.service';
import { UnauthorizedError } from '../../utils/errors';

const deadlinesService = new DeadlinesService();

export class DeadlinesController {
  async listDeadlines(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const deadlines = await deadlinesService.listDeadlines(req.user.id, req.user.role);
      res.status(200).json({ success: true, data: deadlines });
    } catch (error) {
      next(error);
    }
  }

  async createDeadline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const deadline = await deadlinesService.createDeadline(req.user.id, req.user.role, req.body);
      res.status(201).json({ success: true, data: deadline });
    } catch (error) {
      next(error);
    }
  }

  async completeDeadline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const deadline = await deadlinesService.completeDeadline(req.params.id, req.user.id, req.user.role);
      res.status(200).json({ success: true, data: deadline });
    } catch (error) {
      next(error);
    }
  }
}
