const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const prisma = require('../lib/prisma');

// ─── Register ──────────────────────────────────────────────────────────────────
// POST /api/auth/register
// Body: { name, email, password, role, phone? }
// role must be HOST | CLIENT | VENDOR
// If role is VENDOR, also creates a VendorProfile (requires businessName, category)
const register = async (req, res) => {
  const { name, email, password, role, phone, businessName, category, bio, logoUrl } = req.body;

  try {
    // Check duplicate email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);

    // Use a transaction so that user + vendorProfile are created atomically
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { name, email, passwordHash, role, phone },
      });

      if (role === 'VENDOR') {
        if (!businessName || !category) {
          throw new Error('VENDOR registration requires businessName and category');
        }
        await tx.vendorProfile.create({
          data: {
            userId: newUser.id,
            businessName,
            category,
            bio: bio || null,
            logoUrl: logoUrl || null,
          },
        });
      }

      return newUser;
    });

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { vendorProfile: true },
    });

    const token = jwt.sign(
      { id: fullUser.id, role: fullUser.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(201).json({
      message: 'Registered successfully',
      token,
      user: {
        id: fullUser.id,
        name: fullUser.name,
        email: fullUser.email,
        role: fullUser.role,
        phone: fullUser.phone,
        profilePicUrl: fullUser.profilePicUrl,
        vendorProfile: fullUser.vendorProfile,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
};

// ─── Login ─────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Body: { email, password }
const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { vendorProfile: true },
  });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  return res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      profilePicUrl: user.profilePicUrl,
      vendorProfile: user.vendorProfile,
    },
  });
};

// ─── Get current user ──────────────────────────────────────────────────────────
// GET /api/auth/me  (requires auth)
const me = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true, name: true, email: true, role: true,
      phone: true, profilePicUrl: true, createdAt: true,
      vendorProfile: true,
    },
  });
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json(user);
};

module.exports = { register, login, me };
