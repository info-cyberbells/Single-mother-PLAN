import { Request, Response, NextFunction } from 'express';
import { zipValidationService } from '../../services/zipValidation.service';

export class LocationController {
  async validateZip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { zip, state, city } = req.body as { zip: string; state: string; city?: string };
      const result = await zipValidationService.validateZip(zip, state, city);

      res.status(200).json({
        success: true,
        data: {
          valid: result.valid,
          city: result.city ?? null,
          state: result.state ?? null,
          zip: result.zip ?? null,
          cities: result.cities ?? [],
          error: result.error ?? null,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async lookupZip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { zip } = req.body as { zip: string };
      const result = await zipValidationService.lookupZip(zip);

      res.status(200).json({
        success: true,
        data: {
          zip: result.zip,
          state: result.state,
          cities: result.cities,
          error: result.error ?? null,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async lookupCity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { state, city } = req.query as { state: string; city: string };
      const result = await zipValidationService.lookupCityInState(state, city);

      res.status(200).json({
        success: true,
        data: {
          valid: result.valid,
          city: result.city,
          state: result.state,
          zips: result.zips,
          error: result.error ?? null,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
