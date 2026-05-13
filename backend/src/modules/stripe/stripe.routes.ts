import express, { Router } from 'express';
import { StripeController } from './stripe.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createCheckoutSessionSchema } from './stripe.schema';

const router = Router();
const stripeController = new StripeController();

// Create Checkout Session for subscribing to a plan
router.post(
  '/create-checkout-session',
  authenticate,
  validate(createCheckoutSessionSchema),
  stripeController.createCheckoutSession
);

// Create Customer Portal Session for managing subscription
router.post(
  '/create-portal-session',
  authenticate,
  stripeController.createPortalSession
);

// Stripe Webhook Endpoint - requires raw body buffer for signature verification
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  stripeController.webhook
);

export default router;
