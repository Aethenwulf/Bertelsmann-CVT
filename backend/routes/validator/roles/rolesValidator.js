const { body, param } = require("express-validator");

// Validate :id param (role_id)
exports.validateRoleId = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Role ID must be a positive integer"),
];

// Validate role creation
exports.validateCreateRole = [
  body("role_name")
    .isString()
    .withMessage("Role name must be a string")
    .notEmpty()
    .withMessage("Role name is required")
    .isLength({ max: 100 })
    .withMessage("Role name must not exceed 100 characters"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string")
    .isLength({ max: 255 })
    .withMessage("Description must not exceed 255 characters"),
];

// Validate role update
exports.validateUpdateRole = [
  ...exports.validateRoleId,
  body("role_name")
    .optional()
    .isString()
    .withMessage("Role name must be a string")
    .isLength({ max: 100 })
    .withMessage("Role name must not exceed 100 characters"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string")
    .isLength({ max: 255 })
    .withMessage("Description must not exceed 255 characters"),
];
