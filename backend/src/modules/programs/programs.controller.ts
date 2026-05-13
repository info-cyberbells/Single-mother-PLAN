import { Request, Response, NextFunction } from 'express';
import { ProgramsService } from './programs.service';
import { UnauthorizedError } from '../../utils/errors';

const programsService = new ProgramsService();

export class ProgramsController {
  async listPrograms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        state: req.query.state as string | undefined,
        type: req.query.type as string | undefined,
      };
      const programs = await programsService.listPrograms(filters);
      res.status(200).json({ success: true, data: programs });
    } catch (error) {
      next(error);
    }
  }

  async getProgramById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const program = await programsService.getProgramById(req.params.id);
      res.status(200).json({ success: true, data: program });
    } catch (error) {
      next(error);
    }
  }

  async createProgram(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const program = await programsService.createProgram(req.user.id, req.body);
      res.status(201).json({ success: true, data: program });
    } catch (error) {
      next(error);
    }
  }

  async updateProgram(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const program = await programsService.updateProgram(req.user.id, req.params.id, req.body);
      res.status(200).json({ success: true, data: program });
    } catch (error) {
      next(error);
    }
  }

  async deleteProgram(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      await programsService.deleteProgram(req.user.id, req.params.id);
      res.status(200).json({ success: true, message: 'Program deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
