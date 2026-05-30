const prisma = require('../lib/prisma');

// ─── Validate QR (scan at entry gate) ─────────────────────────────────────────
// POST /api/tickets/validate
// Body: { qrCodeData }
// HOST only — scans tickets for their own events
const validateTicket = async (req, res) => {
  const { qrCodeData } = req.body;

  if (!qrCodeData) return res.status(400).json({ message: 'qrCodeData is required' });

  const ticket = await prisma.ticket.findUnique({
    where: { qrCodeData },
    include: {
      order: {
        include: {
          ticketType: {
            include: {
              event: { select: { id: true, name: true, hostId: true, eventDate: true } },
            },
          },
        },
      },
    },
  });

  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

  // Ensure the host scanning this ticket owns the event
  if (ticket.order.ticketType.event.hostId !== req.user.id) {
    return res.status(403).json({ message: 'This ticket does not belong to your event' });
  }

  // Already used
  if (ticket.status === 'USED') {
    return res.status(400).json({
      message: 'Ticket already used',
      usedAt: ticket.usedAt,
    });
  }

  // Expired
  if (ticket.status === 'EXPIRED' || (ticket.expiresAt && new Date() > ticket.expiresAt)) {
    await prisma.ticket.update({ where: { id: ticket.id }, data: { status: 'EXPIRED' } });
    return res.status(400).json({ message: 'Ticket has expired' });
  }

  // Mark as USED (soft-delete style)
  const updated = await prisma.ticket.update({
    where: { id: ticket.id },
    data: { status: 'USED', usedAt: new Date() },
  });

  return res.json({
    message: '✅ Ticket valid — entry granted',
    ticket: {
      id:        updated.id,
      usedAt:    updated.usedAt,
      eventName: ticket.order.ticketType.event.name,
    },
  });
};

// ─── List tickets for an event (HOST view) ─────────────────────────────────────
// GET /api/tickets/event/:eventId   [HOST only]
const eventTickets = async (req, res) => {
  const eventId = parseInt(req.params.eventId);

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return res.status(404).json({ message: 'Event not found' });
  if (event.hostId !== req.user.id) return res.status(403).json({ message: 'Not your event' });

  const tickets = await prisma.ticket.findMany({
    where: { order: { ticketType: { eventId } } },
    include: {
      order: {
        select: {
          id: true, quantity: true, totalAmount: true,
          client: { select: { id: true, name: true, email: true } },
          ticketType: { select: { label: true, price: true } },
        },
      },
    },
    orderBy: { id: 'asc' },
  });

  return res.json(tickets);
};

// ─── Get single ticket (CLIENT — own ticket) ───────────────────────────────────
// GET /api/tickets/:id
const getTicket = async (req, res) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      order: {
        include: {
          client: { select: { id: true } },
          ticketType: {
            include: { event: { select: { id: true, name: true, venue: true, eventDate: true } } },
          },
        },
      },
    },
  });

  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  if (ticket.order.client.id !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

  return res.json(ticket);
};

// ─── Public get ticket (for QR validation page) ─────────────────────────────────
// GET /api/tickets/public/:id
const publicGetTicket = async (req, res) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      order: {
        include: {
          ticketType: {
            include: { event: { select: { id: true, name: true, venue: true, eventDate: true } } },
          },
        },
      },
    },
  });

  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

  return res.json(ticket);
};

// ─── Update ticket status (for QR validation) ──────────────────────────────────
// PATCH /api/tickets/:id/status
const updateTicketStatus = async (req, res) => {
  const { status } = req.body;
  const ticketId = parseInt(req.params.id);

  if (!status || !['USED', 'UNUSED'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

  if (ticket.status === 'USED' && status === 'USED') {
    return res.status(400).json({ message: 'Ticket already used' });
  }

  const updated = await prisma.ticket.update({
    where: { id: ticketId },
    data: { status, usedAt: status === 'USED' ? new Date() : null },
  });

  return res.json({ message: 'Status updated', ticket: updated });
};

module.exports = { validateTicket, eventTickets, getTicket, publicGetTicket, updateTicketStatus };
