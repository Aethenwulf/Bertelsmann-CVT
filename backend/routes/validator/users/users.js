const { body, param } = require("express-validator");

// For creating a new user
exports.validateCreateUser = [
  body("username")
    .isString()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be 3–30 characters"),
  body("email").isEmail().withMessage("Invalid email address"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("first_name")
    .optional()
    .isString()
    .isLength({ max: 50 })
    .withMessage("First name must be less than 50 characters"),
  body("last_name")
    .optional()
    .isString()
    .isLength({ max: 50 })
    .withMessage("Last name must be less than 50 characters"),
  body("phone_number")
    .optional()
    .customSanitizer((value) => value.replace(/\s+/g, ""))
    .isMobilePhone("any")
    .withMessage("Phone number must be a valid mobile number"),
  body("role_id").isInt().withMessage("Role ID must be an integer"),
  body("department_id").isInt().withMessage("Department ID must be an integer"),
  body("status")
    .isIn(["ONLINE", "OFFLINE"])
    .withMessage("Status must be one of ONLINE, OFFLINE"),
];

// For updating an existing user
exports.validateUpdateUser = [
  param("id").isInt().withMessage("User ID must be an integer"),
  body("username").optional().isString(),
  body("email").optional().isEmail(),
  body("password").optional().isLength({ min: 8 }),
  body("first_name").optional().isString(),
  body("last_name").optional().isString(),
  body("phone_number")
    .optional()
    .customSanitizer((value) => value.replace(/\s+/g, ""))
    .isMobilePhone(),
  body("role_id").optional().isInt(),
  body("department_id").optional().isInt(),
  body("status").optional().isIn(["ONLINE", "OFFLINE"]),
];
