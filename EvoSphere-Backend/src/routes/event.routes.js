const router       = require('express').Router();
const { body }     = require('express-validator');
const ctrl         = require('../controllers/event.controller');
const authenticate = require('../middleware/authenticate');
const authorize    = require('../middleware/authorize');
const validate     = require('../middleware/validate');

router.get('/',          ctrl.listPublicEvents);
router.get('/my/events', authenticate, authorize('HOST'), ctrl.myEvents);
router.get('/:id',       ctrl.getEvent);

router.post(
  '/',
  authenticate,
  authorize('HOST'),
  [
    body('name').trim().notEmpty(),
    body('venue').trim().notEmpty(),
    body('eventDate').isISO8601().withMessage('eventDate must be a valid date'),
    body('capacity').isInt({ min: 1 }),
  ],
  validate,
  ctrl.createEvent
);

router.patch('/:id', authenticate, authorize('HOST'), ctrl.updateEvent);
router.delete('/:id', authenticate, authorize('HOST'), ctrl.deleteEvent);

// Ticket types scoped to an event
router.post(
  '/:id/ticket-types',
  authenticate,
  authorize('HOST'),
  [
    body('label').trim().notEmpty(),
    body('price').isFloat({ min: 0 }),
    body('totalQuantity').isInt({ min: 1 }),
  ],
  validate,
  ctrl.addTicketType
);

// Analytics
router.get('/:id/analytics', authenticate, authorize('HOST'), ctrl.eventAnalytics);

module.exports = router;
