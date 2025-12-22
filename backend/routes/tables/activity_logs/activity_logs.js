const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const UAParser = require("ua-parser-js");
const authenticateToken = require("../../../middleware/auth-Token");

// Middleware: All routes protected
router.use(authenticateToken);

// Helper function for internal logging (no Swagger POST)
async function logActivity(
  req,
  {
    user_id,
    action_type,
    table_name = null,
    record_id = null,
    changed_fields = null,
  }
) {
  try {
    // Parse UA info
    const parser = new UAParser(req.headers["user-agent"]);
    const uaResult = parser.getResult();

    const deviceType = uaResult.device.type || "desktop"; // mobile, tablet, desktop, etc.
    const machineId = `${uaResult.os.name || "Unknown OS"} ${
      uaResult.os.version || ""
    }`.trim();
    const browserName = uaResult.browser.name || "Unknown Browser";
    const browserVersion = uaResult.browser.version || "";

    // Get IP (Express behind proxy needs trust proxy enabled)
    const ipAddress =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    await prisma.activity_logs.create({
      data: {
        user_id,
        action_type,
        table_name,
        record_id,
        changed_fields,
        machine_id: `${machineId} · ${browserName} ${browserVersion}`,
        device_type: deviceType,
        ip_address: ipAddress,
      },
    });
  } catch (err) {
    console.error("❌ Failed to log activity:", err);
  }
}

/**
 * @swagger
 * tags:
 *   name: Activity Logs
 *   description: Tracks all create, update, delete, login, and logout operations for auditing purposes
 *
 * components:
 *   schemas:
 *     activity_logs:
 *       type: object
 *       properties:
 *         log_id:
 *           type: integer
 *           example: 1
 *         user_id:
 *           type: integer
 *           example: 42
 *         action_type:
 *           type: string
 *           enum: [CREATE, UPDATE, DELETE, LOGIN, LOGOUT]
 *           example: LOGIN
 *         table_name:
 *           type: string
 *           example: users
 *         record_id:
 *           type: integer
 *           example: 101
 *         changed_fields:
 *           type: array
 *           items:
 *             type: string
 *           nullable: true
 *           example: ["name", "email"]
 *         machine_id:
 *           type: string
 *           nullable: true
 *           example: "MACHINE-123"
 *         device_type:
 *           type: string
 *           nullable: true
 *           example: "Chrome on Windows"
 *         ip_address:
 *           type: string
 *           nullable: true
 *           example: "192.168.0.1"
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: "2025-08-14T12:34:56Z"
 */

/**
 * @swagger
 * /activity-logs:
 *   get:
 *     summary: Get all activity logs with optional filters
 *     tags: [Activity Logs]
 *     responses:
 *       200:
 *         description: List of activity logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/activity_logs'
 */
router.get("/", async (req, res) => {
  try {
    const { table_name, user_id, action_type, start_date, end_date } =
      req.query;

    const where = {};
    if (table_name) where.table_name = table_name;
    if (user_id) where.user_id = parseInt(user_id);
    if (action_type) where.action_type = action_type;
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at.gte = new Date(start_date);
      if (end_date) where.created_at.lte = new Date(end_date);
    }

    const logs = await prisma.activity_logs.findMany({
      where,
      orderBy: { created_at: "desc" },
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /activity-logs/{id}:
 *   get:
 *     summary: Get a specific log entry
 *     tags: [Activity Logs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Log entry
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/activity_logs'
 *       404:
 *         description: Not found
 */
router.get("/:id", async (req, res) => {
  try {
    const log = await prisma.activity_logs.findUnique({
      where: { log_id: parseInt(req.params.id) },
    });

    if (!log) return res.status(404).json({ error: "Not found" });

    res.json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = {
  activityLogRouter: router,
  logActivity,
};
