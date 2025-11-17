// validators/departments.js
const { body, validationResult } = require("express-validator");

// Validation rules
const validateDepartment = [
  body("department_name")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Department name is required"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = { validateDepartment };
