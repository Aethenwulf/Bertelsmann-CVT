const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authenticateToken = require("../../../middleware/auth-Token");

// Apply middleware to all routes in this router
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Permissions
 *   description: Permission management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     permissions:
 *       type: object
 *       properties:
 *         permission_id:
 *           type: integer
 *         permission_name:
 *           type: string
 *         description:
 *           type: string
 *         created_at:
 *           type: string
 *           example: Handles all technology operations
 *         updated_at:
 *           type: string
 *           example: Handles all technology operations
 *         is_deleted:
 *           type: string
 *           example: Handles all technology operations
 */

/**
 * @swagger
 * /permissions:
 *   get:
 *     summary: Get all permissions
 *     tags: [Permissions]
 *     responses:
 *       200:
 *         description: List of permissions
 *       500:
 *         description: Server error
 */
router.get("/", async (req, res) => {
  try {
    const data = await prisma.permissions.findMany({
      where: { is_deleted: false },
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
