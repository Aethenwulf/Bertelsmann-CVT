const { body, param } = require("express-validator");

const sanitizePhone = (v) =>
  typeof v === "string" ? v.replace(/\s+/g, "") : v;

const isIso2 = (v) => typeof v === "string" && /^[A-Z]{2}$/.test(v);

const sanitizeUsername = (v) => {
  if (typeof v !== "string") return v;
  return v
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9._-]/g, ""); // conservative
};

const STATUS_ALLOWED = ["ACTIVE", "REMOVE"];

exports.validateCreateUser = [
  // auth row
  body("username")
    .exists({ checkFalsy: true })
    .withMessage("Username is required")
    .bail()
    .customSanitizer(sanitizeUsername)
    .isString()
    .isLength({ min: 3, max: 100 }) // ✅ match Prisma VarChar(100)
    .withMessage("Username must be 3–100 characters"),

  body("email")
    .exists({ checkFalsy: true })
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Invalid email address"),

  body("password")
    .exists({ checkFalsy: true })
    .withMessage("Password is required")
    .bail()
    .isString()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),

  // users table (snake_case as per your POST route)
  body("first_name")
    .exists({ checkFalsy: true })
    .withMessage("first_name is required")
    .bail()
    .isString()
    .isLength({ max: 100 }),

  body("last_name")
    .exists({ checkFalsy: true })
    .withMessage("last_name is required")
    .bail()
    .isString()
    .isLength({ max: 100 }),

  body("phone_number")
    .optional({ nullable: true })
    .customSanitizer(sanitizePhone)
    .isString()
    .isLength({ max: 20 })
    .withMessage("phone_number must be <= 20 chars"),

  body("phone_country")
    .optional({ nullable: true })
    .customSanitizer((v) => (typeof v === "string" ? v.toUpperCase() : v))
    .custom(isIso2)
    .withMessage("phone_country must be a 2-letter ISO code (e.g. PH)"),

  body("country")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 150 }),

  body("state").optional({ nullable: true }).isString().isLength({ max: 150 }),

  body("city").optional({ nullable: true }).isString().isLength({ max: 150 }),

  body("address_line")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 255 }),

  body("zip_code")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 20 }),

  body("role_id")
    .optional({ nullable: true })
    .isInt()
    .withMessage("role_id must be an integer"),

  body("department_id")
    .optional({ nullable: true })
    .isInt()
    .withMessage("department_id must be an integer"),

  body("status")
    .optional({ nullable: true })
    .isIn(STATUS_ALLOWED)
    .withMessage(`status must be one of ${STATUS_ALLOWED.join(", ")}`),
];

// For updating an existing user (camelCase as per your PUT route)
exports.validateUpdateUser = [
  param("id").isInt().withMessage("User ID must be an integer"),

  body("firstName")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 100 }),
  body("lastName")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 100 }),
  body("email").optional({ nullable: true }).isEmail(),

  body("phoneNumber")
    .optional({ nullable: true })
    .customSanitizer(sanitizePhone)
    .isString()
    .isLength({ max: 20 }),

  body("phoneCountry")
    .optional({ nullable: true })
    .customSanitizer((v) => (typeof v === "string" ? v.toUpperCase() : v))
    .custom(isIso2)
    .withMessage("phoneCountry must be a 2-letter ISO code (e.g. PH)"),

  body("country")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 150 }),
  body("state").optional({ nullable: true }).isString().isLength({ max: 150 }),
  body("city").optional({ nullable: true }).isString().isLength({ max: 150 }),
  body("address")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 255 }),
  body("zipCode").optional({ nullable: true }).isString().isLength({ max: 20 }),
  body("about").optional({ nullable: true }).isString(),

  body("birthday")
    .optional({ nullable: true })
    .custom((v) => !v || !Number.isNaN(Date.parse(v)))
    .withMessage("birthday must be a valid date string"),

  body("departmentId").optional({ nullable: true }).isInt(),
  body("roleId").optional({ nullable: true }).isInt(),
  body("isPublic").optional({ nullable: true }).isBoolean(),

  body("status")
    .optional({ nullable: true })
    .isIn(STATUS_ALLOWED)
    .withMessage(`status must be one of ${STATUS_ALLOWED.join(", ")}`),

  body("password")
    .optional({ nullable: true })
    .isString()
    .isLength({ min: 6 })
    .withMessage("password must be at least 6 characters"),

  body("currentPassword")
    .optional({ nullable: true })
    .isString()
    .isLength({ min: 6 })
    .withMessage("currentPassword must be at least 6 characters"),

  body("username")
    .optional({ nullable: true })
    .customSanitizer(sanitizeUsername)
    .isString()
    .isLength({ min: 3, max: 100 })
    .withMessage("Username must be 3–100 characters"),

  body("photoURL")
    .optional({ nullable: true })
    .custom(() => {
      throw new Error(
        "photoURL is not supported. Upload avatar via /users/:id/avatar"
      );
    }),

  body("profile_completed")
    .optional({ nullable: true })
    .isBoolean()
    .withMessage("profile_completed must be boolean"),
];
