import { Router, raw } from 'express';
import { BillingController } from './billing.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { checkoutBodySchema } from './billing.schema';

const router = Router();
const billingController = new BillingController();

// Webhook endpoint needs raw Buffer payload for cryptographic signature verification
router.post('/webhook', raw({ type: 'application/json' }), billingController.webhook);

// Protected authenticated routes
router.use(authenticate);

router.post('/checkout', validate(checkoutBodySchema), billingController.checkout);
router.post('/portal', billingController.portal);
router.get('/subscription', billingController.subscription);

export default router;
