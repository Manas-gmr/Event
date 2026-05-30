const { v4: uuidv4 } = require('uuid');
const prisma = require('../lib/prisma');

// ─── Place Order ───────────────────────────────────────────────────────────────
// POST /api/orders
// Body: { ticketTypeId, quantity }
// CLIENT only
const placeOrder = async (req, res) => {
  const { ticketTypeId, quantity = 1 } = req.body;
  const qty = parseInt(quantity);

  const ticketType = await prisma.ticketType.findUnique({
    where: { id: parseInt(ticketTypeId) },
    include: { event: true },
  });

  if (!ticketType) return res.status(404).json({ message: 'Ticket type not found' });

  // Check event is published
  if (ticketType.event.status !== 'PUBLISHED' && ticketType.event.status !== 'ONGOING') {
    return res.status(400).json({ message: 'Event is not open for ticket sales' });
  }

  // Check sale window
  if (ticketType.saleEndsAt && new Date() > ticketType.saleEndsAt) {
    return res.status(400).json({ message: 'Ticket sale has ended' });
  }

  // Check availability
  const available = ticketType.totalQuantity - ticketType.soldCount;
  if (qty > available) {
    return res.status(400).json({ message: `Only ${available} ticket(s) available` });
  }

  const totalAmount = parseFloat(ticketType.price) * qty;

  // Transaction: create order + individual tickets + increment soldCount
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        clientId:     req.user.id,
        ticketTypeId: ticketType.id,
        quantity:     qty,
        totalAmount,
        paymentStatus: 'PENDING', // In production: set PENDING, update to PAID after payment gateway webhook
      },
    });

    // Create one Ticket row per seat
    const ticketData = Array.from({ length: qty }, () => ({
      orderId:    newOrder.id,
      qrCodeData: uuidv4(),           // unique token — send to Java ZXing to generate QR image
      expiresAt:  ticketType.event.eventDate, // ticket expires after event date
    }));

    await tx.ticket.createMany({ data: ticketData });

    // Increment sold count
    await tx.ticketType.update({
      where: { id: ticketType.id },
      data:  { soldCount: { increment: qty } },
    });

    return newOrder;
  });

  // Fetch the full order with tickets to return
  const fullOrder = await prisma.order.findUnique({
    where: { id: order.id },
    include: {
      ticketType: { include: { event: { select: { id: true, name: true, venue: true, eventDate: true } } } },
      tickets: true,
    },
  });

  return res.status(201).json({ message: 'Order placed successfully', order: fullOrder });
};

// ─── My Orders ─────────────────────────────────────────────────────────────────
// GET /api/orders/my   [CLIENT]
const myOrders = async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { clientId: req.user.id },
    orderBy: { orderedAt: 'desc' },
    include: {
      ticketType: {
        include: { event: { select: { id: true, name: true, venue: true, eventDate: true } } },
      },
      tickets: true,
    },
  });
  return res.json(orders);
};

// ─── Get single order ──────────────────────────────────────────────────────────
// GET /api/orders/:id   [CLIENT — own order only]
const getOrder = async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      ticketType: {
        include: { event: { select: { id: true, name: true, venue: true, eventDate: true } } },
      },
      tickets: true,
    },
  });

  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.clientId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

  return res.json(order);
};

module.exports = { placeOrder, myOrders, getOrder };
