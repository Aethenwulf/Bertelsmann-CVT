const { body } = require("express-validator");

// Validate login request
exports.validateLogin = [
  body("emailOrUsername")
    .isString()
    .notEmpty()
    .withMessage("Email or username is required"),
  body("password")
    .isString()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];
