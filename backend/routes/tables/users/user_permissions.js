const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authenticateToken = require("../../../middleware/auth-Token");

const {
  validateCreatePermission,
  validateUpdatePermission,
} = require("../../validator/users/userPermissionsValidator");
const { validationResult } = require("express-validator");

// Apply middleware to all routes in this router
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: User Permissions
 *   description: Manage the relationship between users and permissions
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     user_permissions:
 *       type: object
 *       properties:
 *         user_id:
 *           type: integer
 *         permission_id:
 *           type: integer
 *         created_at:
 *           type: string
 *           format: date-time
 *         is_deleted:
 *           type: boolean
 */

// GET all user permissions
/**
 * @swagger
 * /user-permissions:
 *   get:
 *     summary: Get all user permissions
 *     tags: [User Permissions]
 *     responses:
 *       200:
 *         description: List of user permissions
 */
router.get("/", async (req, res) => {
  try {
    const data = await prisma.user_permissions.findMany({
      where: { is_deleted: false },
      include: { users: true, permissions: true },
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET specific user permission
/**
 * @swagger
 * /user-permissions/{user_id}/{permission_id}:
 *   get:
 *     summary: Get a specific user-permission relation
 *     tags: [User Permissions]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         schema:
 *           type: integer
 *         required: true
 *       - in: path
 *         name: permission_id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: User-permission data
 *       404:
 *         description: Not found
 */
router.get("/:user_id/:permission_id", async (req, res) => {
  try {
    const { user_id, permission_id } = req.params;
    const data = await prisma.user_permissions.findUnique({
      where: {
        user_id_permission_id: {
          user_id: parseInt(user_id),
          permission_id: parseInt(permission_id),
        },
      },
      include: { users: true, permissions: true },
    });
    if (!data) return res.status(404).json({ error: "Not found" });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE user permission
/**
 * @swagger
 * /user-permissions:
 *   post:
 *     summary: Create a new user-permission relation
 *     tags: [User Permissions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               user_id:
 *                 type: integer
 *               permission_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Created
 */
router.post("/", validateCreatePermission, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { user_id, permission_id } = req.body;
  try {
    const newItem = await prisma.user_permissions.create({
      data: { user_id, permission_id },
    });
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /user-permissions/{user_id}/{permission_id}:
 *   put:
 *     summary: Update a user-permission relation (change user_id or permission_id)
 *     tags: [User Permissions]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Current user ID
 *       - in: path
 *         name: permission_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Current permission ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - permission_id
 *             properties:
 *               user_id:
 *                 type: integer
 *                 example: 2
 *               permission_id:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       200:
 *         description: User-permission relation updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 relation:
 *                   $ref: '#/components/schemas/user_permissions'
 *       400:
 *         description: Invalid input (validation errors)
 *       404:
 *         description: Relation not found
 */

router.put(
  "/:user_id/:permission_id",
  validateUpdatePermission,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { user_id, permission_id } = req.params;
    const { user_id: newUserId, permission_id: newPermissionId } = req.body;

    try {
      const relation = await prisma.user_permissions.findUnique({
        where: {
          user_id_permission_id: {
            user_id: parseInt(user_id),
            permission_id: parseInt(permission_id),
          },
        },
      });
      if (!relation)
        return res.status(404).json({ error: "Relation not found" });

      const updated = await prisma.user_permissions.update({
        where: {
          user_id_permission_id: {
            user_id: parseInt(user_id),
            permission_id: parseInt(permission_id),
          },
        },
        data: {
          user_id: newUserId,
          permission_id: newPermissionId,
        },
      });

      res.json({
        message: "Relation updated successfully",
        relation: updated,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// DELETE / toggle is_deleted
/**
 * @swagger
 * /user-permissions/{user_id}/{permission_id}:
 *   delete:
 *     summary: Toggle delete status of a user-permission relation
 *     tags: [User Permissions]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         schema:
 *           type: integer
 *         required: true
 *       - in: path
 *         name: permission_id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Deleted/restored successfully
 */
router.delete("/:user_id/:permission_id", async (req, res) => {
  try {
    const { user_id, permission_id } = req.params;
    const relation = await prisma.user_permissions.findUnique({
      where: {
        user_id_permission_id: {
          user_id: parseInt(user_id),
          permission_id: parseInt(permission_id),
        },
      },
    });
    if (!relation) return res.status(404).json({ error: "Relation not found" });

    const updated = await prisma.user_permissions.update({
      where: {
        user_id_permission_id: {
          user_id: parseInt(user_id),
          permission_id: parseInt(permission_id),
        },
      },
      data: { is_deleted: !relation.is_deleted },
    });

    res.json({
      message: updated.is_deleted
        ? "Relation marked deleted"
        : "Relation restored",
      relation: updated,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
