const router       = require('express').Router();
const { body }     = require('express-validator');
const ctrl         = require('../controllers/ticket.controller');
const authenticate = require('../middleware/authenticate');
const authorize    = require('../middleware/authorize');
const validate     = require('../middleware/validate');

// POST /api/tickets/validate  — HOST scans QR at entry
router.post(
  '/validate',
  authenticate,
  authorize('HOST'),
  [body('qrCodeData').notEmpty().withMessage('qrCodeData is required')],
  validate,
  ctrl.validateTicket
);

// GET /api/tickets/event/:eventId  — HOST sees all tickets for their event
router.get('/event/:eventId', authenticate, authorize('HOST'), ctrl.eventTickets);

// GET /api/tickets/:id  — CLIENT sees own ticket
router.get('/:id', authenticate, ctrl.getTicket);

// GET /api/tickets/public/:id  — Public access for QR validation
router.get('/public/:id', ctrl.publicGetTicket);

// PATCH /api/tickets/:id/status  — Update ticket status
router.patch('/:id/status', ctrl.updateTicketStatus);

module.exports = router;
