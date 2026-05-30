const router       = require('express').Router();
const { body }     = require('express-validator');
const ctrl         = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');
const validate     = require('../middleware/validate');

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['HOST', 'CLIENT', 'VENDOR']).withMessage('Role must be HOST, CLIENT, or VENDOR'),
  ],
  validate,
  ctrl.register
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  ctrl.login
);

// GET /api/auth/me
router.get('/me', authenticate, ctrl.me);

module.exports = router;
