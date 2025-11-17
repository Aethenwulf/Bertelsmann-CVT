const { body, param } = require("express-validator");

// For creating a new user-permission
exports.validateCreatePermission = [
  body("user_id")
    .isInt({ gt: 0 })
    .withMessage("user_id must be a positive integer"),
  body("permission_id")
    .isInt({ gt: 0 })
    .withMessage("permission_id must be a positive integer"),
];

// For updating an existing relation (needs both path params + new body)
exports.validateUpdatePermission = [
  param("user_id")
    .isInt({ gt: 0 })
    .withMessage("Path user_id must be a positive integer"),
  body("user_id").optional().isInt({ gt: 0 }),
  body("permission_id").optional().isInt({ gt: 0 }),
];
