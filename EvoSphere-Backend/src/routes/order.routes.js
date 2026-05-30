const router       = require('express').Router();
const { body }     = require('express-validator');
const ctrl         = require('../controllers/order.controller');
const authenticate = require('../middleware/authenticate');
const authorize    = require('../middleware/authorize');
const validate     = require('../middleware/validate');

// POST /api/orders  — place order (CLIENT only)
router.post(
  '/',
  authenticate,
  authorize('CLIENT'),
  [
    body('ticketTypeId').isInt({ min: 1 }).withMessage('ticketTypeId must be a positive integer'),
    body('quantity').optional().isInt({ min: 1, max: 10 }).withMessage('quantity must be 1–10'),
  ],
  validate,
  ctrl.placeOrder
);

// GET /api/orders/my  — view own orders (CLIENT)
router.get('/my', authenticate, authorize('CLIENT'), ctrl.myOrders);

// GET /api/orders/:id
router.get('/:id', authenticate, ctrl.getOrder);

module.exports = router;
