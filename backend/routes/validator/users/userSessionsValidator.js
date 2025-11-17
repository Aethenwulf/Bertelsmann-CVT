const { body, param } = require("express-validator");

// For creating a new session
exports.validateCreateSession = [
  body("user_id").isInt().withMessage("User ID must be an integer"),
  body("token_hash")
    .isString()
    .notEmpty()
    .withMessage("Token hash is required"),
  body("device_type")
    .optional()
    .isIn(["mobile", "desktop"])
    .withMessage("Device type must be 'mobile' or 'desktop'"),
  body("device_fp").optional().isString(),
  body("machine_id").optional().isString(),
  body("ip_address").optional().isIP().withMessage("Invalid IP address"),
  body("geo").optional().isString(),
  body("client_info").optional().isObject(),
  body("expires_at")
    .isISO8601()
    .toDate()
    .withMessage("expires_at must be a valid date"),
  body("is_revoked").optional().isBoolean(),
];

// For updating an existing session
exports.validateUpdateSession = [
  param("id").isUUID().withMessage("Session ID must be a valid UUID"),
  body("device_type")
    .optional()
    .isIn(["mobile", "desktop"])
    .withMessage("Device type must be 'mobile' or 'desktop'"),
  body("device_fp").optional().isString(),
  body("machine_id").optional().isString(),
  body("ip_address").optional().isIP().withMessage("Invalid IP address"),
  body("geo").optional().isString(),
  body("client_info").optional().isObject(),
  body("last_activity")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("last_activity must be a valid date"),
  body("expires_at")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("expires_at must be a valid date"),
  body("is_revoked").optional().isBoolean(),
];
