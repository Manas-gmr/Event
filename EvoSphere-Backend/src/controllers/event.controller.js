const prisma = require('../lib/prisma');

// ─── Create event ──────────────────────────────────────────────────────────────
// POST /api/events   [HOST only]
const createEvent = async (req, res) => {
  const { name, description, venue, eventDate, capacity, bannerUrl } = req.body;

  const event = await prisma.event.create({
    data: {
      hostId: req.user.id,
      name,
      description,
      venue,
      eventDate: new Date(eventDate),
      capacity: parseInt(capacity),
      bannerUrl,
    },
  });

  return res.status(201).json({ message: 'Event created', event });
};

// ─── List all PUBLISHED events (public) ────────────────────────────────────────
// GET /api/events
const listPublicEvents = async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    status: 'PUBLISHED',
    ...(search && { name: { contains: search } }),
  };

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { eventDate: 'asc' },
      include: {
        host: { select: { id: true, name: true } },
        ticketTypes: true,
      },
    }),
    prisma.event.count({ where }),
  ]);

  return res.json({ total, page: parseInt(page), events });
};

// ─── Get single event (public) ─────────────────────────────────────────────────
// GET /api/events/:id
const getEvent = async (req, res) => {
  const event = await prisma.event.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      host: { select: { id: true, name: true } },
      ticketTypes: true,
      vendorApplications: {
        where: { status: 'APPROVED' },
        include: {
          vendor: {
            include: { products: { where: { available: true } } },
          },
        },
      },
    },
  });

  if (!event) return res.status(404).json({ message: 'Event not found' });
  return res.json(event);
};

// ─── HOST: get my events ───────────────────────────────────────────────────────
// GET /api/events/my   [HOST only]
const myEvents = async (req, res) => {
  const events = await prisma.event.findMany({
    where: { hostId: req.user.id },
    orderBy: { createdAt: 'desc' },
    include: { ticketTypes: true },
  });
  return res.json(events);
};

// ─── HOST: update event ────────────────────────────────────────────────────────
// PATCH /api/events/:id   [HOST only]
const updateEvent = async (req, res) => {
  const eventId = parseInt(req.params.id);
  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event) return res.status(404).json({ message: 'Event not found' });
  if (event.hostId !== req.user.id) return res.status(403).json({ message: 'Not your event' });

  const { name, description, venue, eventDate, capacity, bannerUrl, status } = req.body;

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: {
      ...(name        && { name }),
      ...(description && { description }),
      ...(venue       && { venue }),
      ...(eventDate   && { eventDate: new Date(eventDate) }),
      ...(capacity    && { capacity: parseInt(capacity) }),
      ...(bannerUrl   && { bannerUrl }),
      ...(status      && { status }),
    },
  });

  return res.json({ message: 'Event updated', event: updated });
};

// ─── HOST: delete event ────────────────────────────────────────────────────────
// DELETE /api/events/:id   [HOST only]
const deleteEvent = async (req, res) => {
  const eventId = parseInt(req.params.id);
  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event) return res.status(404).json({ message: 'Event not found' });
  if (event.hostId !== req.user.id) return res.status(403).json({ message: 'Not your event' });

  await prisma.event.delete({ where: { id: eventId } });
  return res.json({ message: 'Event deleted' });
};

// ─── HOST: add ticket type to event ───────────────────────────────────────────
// POST /api/events/:id/ticket-types   [HOST only]
const addTicketType = async (req, res) => {
  const eventId = parseInt(req.params.id);
  const event   = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event) return res.status(404).json({ message: 'Event not found' });
  if (event.hostId !== req.user.id) return res.status(403).json({ message: 'Not your event' });

  const { label, price, totalQuantity, saleEndsAt } = req.body;

  const ticketType = await prisma.ticketType.create({
    data: {
      eventId,
      label,
      price: parseFloat(price),
      totalQuantity: parseInt(totalQuantity),
      ...(saleEndsAt && { saleEndsAt: new Date(saleEndsAt) }),
    },
  });

  return res.status(201).json({ message: 'Ticket type created', ticketType });
};

// ─── HOST: event analytics ────────────────────────────────────────────────────
// GET /api/events/:id/analytics   [HOST only]
const eventAnalytics = async (req, res) => {
  const eventId = parseInt(req.params.id);
  const event   = await prisma.event.findUnique({
    where: { id: eventId },
    include: { ticketTypes: true },
  });

  if (!event) return res.status(404).json({ message: 'Event not found' });
  if (event.hostId !== req.user.id) return res.status(403).json({ message: 'Not your event' });

  const totalRevenue = await prisma.order.aggregate({
    where: {
      ticketType: { eventId },
      paymentStatus: 'PAID',
    },
    _sum: { totalAmount: true },
  });

  const vendorCount = await prisma.vendorApplication.count({
    where: { eventId, status: 'APPROVED' },
  });

  const ticketsSold = event.ticketTypes.reduce((acc, tt) => acc + tt.soldCount, 0);
  const totalCapacity = event.ticketTypes.reduce((acc, tt) => acc + tt.totalQuantity, 0);

  return res.json({
    eventId,
    eventName: event.name,
    ticketsSold,
    totalCapacity,
    revenue: totalRevenue._sum.totalAmount || 0,
    approvedVendors: vendorCount,
  });
};

module.exports = {
  createEvent, listPublicEvents, getEvent,
  myEvents, updateEvent, deleteEvent,
  addTicketType, eventAnalytics,
};
