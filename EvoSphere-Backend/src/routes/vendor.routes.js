const router       = require('express').Router();
const { body }     = require('express-validator');
const ctrl         = require('../controllers/vendor.controller');
const authenticate = require('../middleware/authenticate');
const authorize    = require('../middleware/authorize');
const validate     = require('../middleware/validate');

// ── VENDOR: profile ───────────────────────────────────────────────────────────
router.get('/profile',   authenticate, authorize('VENDOR'), ctrl.getMyProfile);
router.patch('/profile', authenticate, authorize('VENDOR'), ctrl.updateProfile);

// ── VENDOR: applications ──────────────────────────────────────────────────────
router.get('/applications/my',
  authenticate, authorize('VENDOR'), ctrl.myApplications);

router.post('/apply/:eventId',
  authenticate, authorize('VENDOR'), ctrl.applyToEvent);

// ── HOST: manage applications ─────────────────────────────────────────────────
router.get('/applications/event/:eventId',
  authenticate, authorize('HOST'), ctrl.getApplications);

router.patch(
  '/applications/:applicationId',
  authenticate,
  authorize('HOST'),
  [body('status').isIn(['APPROVED', 'REJECTED'])],
  validate,
  ctrl.reviewApplication
);

// ── VENDOR: products ──────────────────────────────────────────────────────────
router.post(
  '/products',
  authenticate,
  authorize('VENDOR'),
  [
    body('eventId').isInt({ min: 1 }),
    body('name').trim().notEmpty(),
    body('price').isFloat({ min: 0 }),
  ],
  validate,
  ctrl.addProduct
);

router.patch('/products/:productId', authenticate, authorize('VENDOR'), ctrl.updateProduct);
router.delete('/products/:productId', authenticate, authorize('VENDOR'), ctrl.deleteProduct);

// ── Public: products for an event ─────────────────────────────────────────────
router.get('/products/event/:eventId', ctrl.eventProducts);

module.exports = router;
