const prisma = require('../lib/prisma');

// ─── Get vendor's own profile ──────────────────────────────────────────────────
// GET /api/vendors/profile   [VENDOR]
const getMyProfile = async (req, res) => {
  const profile = await prisma.vendorProfile.findUnique({
    where: { userId: req.user.id },
    include: { applications: true, products: true },
  });
  if (!profile) return res.status(404).json({ message: 'Vendor profile not found' });
  return res.json(profile);
};

// ─── Update vendor profile ────────────────────────────────────────────────────
// PATCH /api/vendors/profile   [VENDOR]
const updateProfile = async (req, res) => {
  const { businessName, category, bio, logoUrl } = req.body;

  const profile = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } });
  if (!profile) return res.status(404).json({ message: 'Vendor profile not found' });

  const updated = await prisma.vendorProfile.update({
    where: { userId: req.user.id },
    data: {
      ...(businessName && { businessName }),
      ...(category     && { category }),
      ...(bio          !== undefined && { bio }),
      ...(logoUrl      && { logoUrl }),
    },
  });

  return res.json({ message: 'Profile updated', profile: updated });
};

// ─── Apply to an event ────────────────────────────────────────────────────────
// POST /api/vendors/apply/:eventId   [VENDOR]
const applyToEvent = async (req, res) => {
  const eventId = parseInt(req.params.eventId);
  const { message } = req.body;

  const profile = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } });
  if (!profile) return res.status(404).json({ message: 'Complete your vendor profile first' });

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return res.status(404).json({ message: 'Event not found' });

  // Check event accepts vendors (must be DRAFT or PUBLISHED)
  if (['COMPLETED', 'CANCELLED'].includes(event.status)) {
    return res.status(400).json({ message: 'Event is no longer accepting vendor applications' });
  }

  // Check duplicate application
  const existing = await prisma.vendorApplication.findUnique({
    where: { vendorId_eventId: { vendorId: profile.id, eventId } },
  });
  if (existing) return res.status(409).json({ message: 'You already applied to this event' });

  const application = await prisma.vendorApplication.create({
    data: { vendorId: profile.id, eventId, message },
  });

  return res.status(201).json({ message: 'Application submitted', application });
};

// ─── HOST: view pending vendor applications ────────────────────────────────────
// GET /api/vendors/applications/event/:eventId   [HOST]
const getApplications = async (req, res) => {
  const eventId = parseInt(req.params.eventId);

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return res.status(404).json({ message: 'Event not found' });
  if (event.hostId !== req.user.id) return res.status(403).json({ message: 'Not your event' });

  const applications = await prisma.vendorApplication.findMany({
    where: { eventId },
    include: {
      vendor: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
    orderBy: { appliedAt: 'desc' },
  });

  return res.json(applications);
};

// ─── HOST: approve or reject a vendor application ─────────────────────────────
// PATCH /api/vendors/applications/:applicationId   [HOST]
// Body: { status: 'APPROVED' | 'REJECTED' }
const reviewApplication = async (req, res) => {
  const appId = parseInt(req.params.applicationId);
  const { status } = req.body;

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(422).json({ message: 'status must be APPROVED or REJECTED' });
  }

  const application = await prisma.vendorApplication.findUnique({
    where: { id: appId },
    include: { event: true },
  });

  if (!application) return res.status(404).json({ message: 'Application not found' });
  if (application.event.hostId !== req.user.id) return res.status(403).json({ message: 'Not your event' });

  const updated = await prisma.vendorApplication.update({
    where: { id: appId },
    data: { status, reviewedAt: new Date() },
  });

  return res.json({ message: `Application ${status.toLowerCase()}`, application: updated });
};

// ─── VENDOR: my applications ──────────────────────────────────────────────────
// GET /api/vendors/applications/my   [VENDOR]
const myApplications = async (req, res) => {
  const profile = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } });
  if (!profile) return res.status(404).json({ message: 'Vendor profile not found' });

  const applications = await prisma.vendorApplication.findMany({
    where: { vendorId: profile.id },
    include: { event: { select: { id: true, name: true, venue: true, eventDate: true, status: true } } },
    orderBy: { appliedAt: 'desc' },
  });

  return res.json(applications);
};

// ─── VENDOR: add product to event ─────────────────────────────────────────────
// POST /api/vendors/products   [VENDOR]
// Body: { eventId, name, description, price, imageUrl }
const addProduct = async (req, res) => {
  const { eventId, name, description, price, imageUrl } = req.body;

  const profile = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } });
  if (!profile) return res.status(404).json({ message: 'Vendor profile not found' });

  // Must be APPROVED for this event
  const application = await prisma.vendorApplication.findUnique({
    where: { vendorId_eventId: { vendorId: profile.id, eventId: parseInt(eventId) } },
  });

  if (!application || application.status !== 'APPROVED') {
    return res.status(403).json({ message: 'You must be approved by the host to list products for this event' });
  }

  const product = await prisma.vendorProduct.create({
    data: {
      vendorId: profile.id,
      eventId:  parseInt(eventId),
      name,
      description,
      price:    parseFloat(price),
      imageUrl,
    },
  });

  return res.status(201).json({ message: 'Product added', product });
};

// ─── VENDOR: update product ───────────────────────────────────────────────────
// PATCH /api/vendors/products/:productId   [VENDOR]
const updateProduct = async (req, res) => {
  const productId = parseInt(req.params.productId);
  const profile   = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } });

  const product = await prisma.vendorProduct.findUnique({ where: { id: productId } });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  if (product.vendorId !== profile.id) return res.status(403).json({ message: 'Not your product' });

  const { name, description, price, imageUrl, available } = req.body;

  const updated = await prisma.vendorProduct.update({
    where: { id: productId },
    data: {
      ...(name        && { name }),
      ...(description !== undefined && { description }),
      ...(price       !== undefined && { price: parseFloat(price) }),
      ...(imageUrl    && { imageUrl }),
      ...(available   !== undefined && { available }),
    },
  });

  return res.json({ message: 'Product updated', product: updated });
};

// ─── VENDOR: delete product ───────────────────────────────────────────────────
// DELETE /api/vendors/products/:productId   [VENDOR]
const deleteProduct = async (req, res) => {
  const productId = parseInt(req.params.productId);
  const profile   = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } });

  const product = await prisma.vendorProduct.findUnique({ where: { id: productId } });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  if (product.vendorId !== profile.id) return res.status(403).json({ message: 'Not your product' });

  await prisma.vendorProduct.delete({ where: { id: productId } });
  return res.json({ message: 'Product deleted' });
};

// ─── Public: get all products for an event (approved vendors only) ─────────────
// GET /api/vendors/products/event/:eventId
const eventProducts = async (req, res) => {
  const eventId = parseInt(req.params.eventId);

  // Only products from APPROVED vendors
  const approvedVendorIds = await prisma.vendorApplication.findMany({
    where: { eventId, status: 'APPROVED' },
    select: { vendorId: true },
  });

  const vendorIds = approvedVendorIds.map((a) => a.vendorId);

  const products = await prisma.vendorProduct.findMany({
    where: { eventId, vendorId: { in: vendorIds }, available: true },
    include: {
      vendor: { select: { businessName: true, category: true, logoUrl: true } },
    },
  });

  return res.json(products);
};

module.exports = {
  getMyProfile, updateProfile,
  applyToEvent, myApplications,
  getApplications, reviewApplication,
  addProduct, updateProduct, deleteProduct, eventProducts,
};
