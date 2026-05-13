import { Request, Response, NextFunction } from 'express';
import { BillingService } from './billing.service';
import { UnauthorizedError, BadRequestError } from '../../utils/errors';

const billingService = new BillingService();

export class BillingController {
  async checkout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const session = await billingService.createCheckoutSession(req.user.id, req.body.plan);
      res.status(200).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  }

  async portal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const session = await billingService.createPortalSession(req.user.id);
      res.status(200).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  }

  async subscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const status = await billingService.getSubscriptionStatus(req.user.id);
      res.status(200).json({ success: true, data: status });
    } catch (error) {
      next(error);
    }
  }

  async webhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    const signature = req.headers['stripe-signature'];

    if (!signature || typeof signature !== 'string') {
      next(new BadRequestError('Missing stripe-signature header'));
      return;
    }

    try {
      await billingService.handleWebhook(signature, req.body);
      res.status(200).json({ received: true });
    } catch (error) {
      next(error);
    }
  }
}
