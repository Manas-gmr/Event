/**
 * Restricts a route to one or more roles.
 * Must be used AFTER authenticate middleware.
 * Usage: authorize('HOST')  or  authorize('HOST', 'VENDOR')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Access denied. Required role(s): ${roles.join(', ')}`,
    });
  }
  next();
};

module.exports = authorize;
