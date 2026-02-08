/**
 * Validation Schemas & Rules
 * 
 * Centralized validation for API requests
 */

const { body, param, query, validationResult } = require('express-validator');

// Sanitization & rules
const userValidationRules = () => {
  return [
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be 3-30 characters')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username can only contain alphanumeric, dash, underscore')
      .toLowerCase(),
    body('email')
      .trim()
      .isEmail()
      .withMessage('Valid email required')
      .normalizeEmail()
      .toLowerCase(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and numbers'),
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be 2-100 characters'),
    body('phone')
      .optional()
      .trim()
      .matches(/^[\d\s\-()]+$/)
      .withMessage('Invalid phone format'),
    body('role')
      .optional()
      .isIn(['ADMIN', 'CONTRATADO', 'MOTORISTA'])
      .withMessage('Invalid role'),
    body('contractorId')
      .optional()
      .matches(/^[a-f0-9]{24}$|^[a-z0-9_]+$/)
      .withMessage('Invalid contractor ID format')
  ];
};

const deliveryValidationRules = () => {
  return [
    body('deliveryNumber')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Delivery number required (max 50 chars)'),
    body('vehiclePlate')
      .optional()
      .trim()
      .isLength({ max: 20 })
      .withMessage('Vehicle plate max 20 chars'),
    body('observations')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Observations max 1000 chars'),
    body('driverId')
      .optional()
      .matches(/^[a-f0-9]{24}$|^[a-z0-9_]+$/)
      .withMessage('Invalid driver ID'),
    body('contractorId')
      .matches(/^[a-f0-9]{24}$|^[a-z0-9_]+$/)
      .withMessage('Contractor ID required and must be valid')
  ];
};

const paginationValidationRules = () => {
  return [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be >= 1'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be 1-100'),
    query('skip')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Skip must be >= 0')
  ];
};

const idValidationRules = () => {
  return [
    param('id')
      .matches(/^[a-f0-9]{24}$|^[a-z0-9_]+$/)
      .withMessage('Invalid ID format')
  ];
};

// Middleware to handle validation errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

module.exports = {
  userValidationRules,
  deliveryValidationRules,
  paginationValidationRules,
  idValidationRules,
  validate
};
