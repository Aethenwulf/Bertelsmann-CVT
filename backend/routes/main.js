require("dotenv").config();

const express = require("express");
const router = express.Router();

const autoLogger = require("../middleware/auto-Logger");
const authenticateToken = require("../middleware/auth-Token");

const customerSignUp = require("./request/index");

// -------------------- PUBLIC ROUTES --------------------
router.use("/auth", require("./auth"));
router.use("/auth", customerSignUp);

// -------------------- USERS MODULE --------------------
const {
  router: usersRouter,
  publicGetAvatar,
} = require("./tables/users/users");

// PUBLIC avatar image (NO TOKEN) — must be before authenticateToken
router.get("/users/:id/avatar", publicGetAvatar);

// -------------------- PROTECTED ROUTES --------------------
router.use(authenticateToken);
router.use(autoLogger);

// Protected /users routes (POST avatar, PUT user, etc.)
router.use("/users", usersRouter);

router.use(
  "/activity-logs",
  require("./tables/activity_logs/activity_logs").activityLogRouter
);

router.use("/departments", require("./tables/departments/departments"));
router.use("/permissions", require("./tables/permissions/permissions"));
router.use("/roles", require("./tables/roles/roles"));
router.use("/role-permissions", require("./tables/roles/role_permissions"));
router.use("/user-permissions", require("./tables/users/user_permissions"));
router.use("/user-sessions", require("./tables/users/user_sessions"));

module.exports = router;
