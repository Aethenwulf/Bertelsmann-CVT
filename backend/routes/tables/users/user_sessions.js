const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authenticateToken = require("../../../middleware/auth-Token");

const {
  validateCreateSession,
  validateUpdateSession,
} = require("../../validator/users/userSessionsValidator");

// Apply middleware to all routes in this router
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: User Sessions
 *   description: Manage user login sessions and tokens
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     user_sessions:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique session identifier (UUID)
 *         user_id:
 *           type: integer
 *           description: User ID linked to the session
 *         token_hash:
 *           type: string
 *           description: Hashed authentication token
 *         device_type:
 *           type: string
 *           nullable: true
 *           enum: ["mobile", "desktop"]
 *           example: "mobile"
 *         device_fp:
 *           type: string
 *           nullable: true
 *           description: Device fingerprint
 *         machine_id:
 *           type: string
 *           nullable: true
 *           description: Identifier for machine/device
 *         ip_address:
 *           type: string
 *           nullable: true
 *           description: IP address of the client
 *         geo:
 *           type: string
 *           nullable: true
 *           description: Geolocation info of the session
 *         client_info:
 *           type: object
 *           nullable: true
 *           description: JSON containing browser or client info
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: When the session was created
 *         last_activity:
 *           type: string
 *           format: date-time
 *           description: Last activity timestamp
 *         expires_at:
 *           type: string
 *           format: date-time
 *           description: When the session expires
 *         is_revoked:
 *           type: boolean
 *           description: Whether the session/token is revoked
 */

/**
 * @swagger
 * /user-sessions:
 *   get:
 *     summary: Get all user sessions
 *     tags: [User Sessions]
 *     responses:
 *       200:
 *         description: List of user sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/user_sessions'
 */
router.get("/", async (req, res) => {
  try {
    const sessions = await prisma.user_sessions.findMany({
      orderBy: { created_at: "desc" },
    });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /user-sessions/{id}:
 *   get:
 *     summary: Get a user session by ID
 *     tags: [User Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User session data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/user_sessions'
 *       404:
 *         description: Session not found
 */
router.get("/:id", async (req, res) => {
  try {
    const session = await prisma.user_sessions.findUnique({
      where: { id: req.params.id },
    });
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /user-sessions:
 *   post:
 *     summary: Create a new user session
 *     tags: [User Sessions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - token_hash
 *               - expires_at
 *             properties:
 *               user_id:
 *                 type: integer
 *               token_hash:
 *                 type: string
 *               device_type:
 *                 type: string
 *               device_fp:
 *                 type: string
 *               machine_id:
 *                 type: string
 *               ip_address:
 *                 type: string
 *               geo:
 *                 type: string
 *               client_info:
 *                 type: object
 *               expires_at:
 *                 type: string
 *                 format: date-time
 *               is_revoked:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: User session created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/user_sessions'
 */
router.post("/", validateCreateSession, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const {
      user_id,
      token_hash,
      device_type,
      device_fp,
      machine_id,
      ip_address,
      geo,
      client_info,
      expires_at,
      is_revoked,
    } = req.body;

    const newSession = await prisma.user_sessions.create({
      data: {
        user_id,
        token_hash,
        device_type,
        device_fp,
        machine_id,
        ip_address,
        geo,
        client_info,
        expires_at: new Date(expires_at),
        is_revoked: is_revoked || false,
      },
    });

    res.status(201).json(newSession);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /user-sessions/{id}:
 *   put:
 *     summary: Update a user session (e.g., revoke session or update last activity)
 *     tags: [User Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               device_type:
 *                 type: string
 *               device_fp:
 *                 type: string
 *               machine_id:
 *                 type: string
 *               ip_address:
 *                 type: string
 *               geo:
 *                 type: string
 *               client_info:
 *                 type: object
 *               last_activity:
 *                 type: string
 *                 format: date-time
 *               expires_at:
 *                 type: string
 *                 format: date-time
 *               is_revoked:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User session updated
 *       404:
 *         description: Session not found
 */
router.put("/:id", validateUpdateSession, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const {
      device_type,
      device_fp,
      machine_id,
      ip_address,
      geo,
      client_info,
      last_activity,
      expires_at,
      is_revoked,
    } = req.body;

    const updatedSession = await prisma.user_sessions.update({
      where: { id: req.params.id },
      data: {
        device_type,
        device_fp,
        machine_id,
        ip_address,
        geo,
        client_info,
        last_activity: last_activity ? new Date(last_activity) : undefined,
        expires_at: expires_at ? new Date(expires_at) : undefined,
        is_revoked,
      },
    });

    res.json(updatedSession);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Session not found" });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /user-sessions/{id}:
 *   delete:
 *     summary: Delete a user session by ID (logout)
 *     tags: [User Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Session deleted successfully
 *       404:
 *         description: Session not found
 */
router.delete("/:id", async (req, res) => {
  try {
    await prisma.user_sessions.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Session not found" });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
