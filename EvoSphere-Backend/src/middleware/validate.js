const { validationResult } = require('express-validator');

/**
 * Checks express-validator results.
 * Call this after your validator chain in a route.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
};

module.exports = validate;
