const { body, param } = require("express-validator");

// For :role_id and :permission_id in path
exports.validateRolePermissionParams = [
  param("role_id")
    .isInt({ min: 1 })
    .withMessage("Role ID must be a positive integer"),
  param("permission_id")
    .isInt({ min: 1 })
    .withMessage("Permission ID must be a positive integer"),
];

// For creating a new role-permission
exports.validateCreateRolePermission = [
  body("role_id")
    .isInt({ min: 1 })
    .withMessage("Role ID must be a positive integer"),
  body("permission_id")
    .isInt({ min: 1 })
    .withMessage("Permission ID must be a positive integer"),
];

// For updating an existing role-permission
exports.validateUpdateRolePermission = [
  ...exports.validateRolePermissionParams, // current IDs from path
  body("role_id")
    .isInt({ min: 1 })
    .withMessage("New Role ID must be a positive integer"),
  body("permission_id")
    .isInt({ min: 1 })
    .withMessage("New Permission ID must be a positive integer"),
];
