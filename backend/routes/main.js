const express = require("express");
const router = express.Router();

const autoLogger = require("../middleware/auto-Logger");
const authenticateToken = require("../middleware/auth-Token");

// Public routes
router.use("/auth", require("./auth"));

// Protected routes: auth first, then autoLogger so req.user is set
router.use(authenticateToken);
router.use(autoLogger);

router.use(
  "/activity-logs",
  require("./tables/activity_logs/activity_logs").activityLogRouter
);

router.use("/departments", require("./tables/departments/departments"));
router.use("/permissions", require("./tables/permissions/permissions"));
router.use("/roles", require("./tables/roles/roles"));
router.use("/role-permissions", require("./tables/roles/role_permissions"));
router.use("/users", require("./tables/users/users"));
router.use("/user-permissions", require("./tables/users/user_permissions"));
router.use("/user-sessions", require("./tables/users/user_sessions"));

module.exports = router;
