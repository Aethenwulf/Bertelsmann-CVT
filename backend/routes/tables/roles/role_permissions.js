const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authenticateToken = require("../../../middleware/auth-Token");

const {
  validateRolePermissionParams,
  validateCreateRolePermission,
  validateUpdateRolePermission,
} = require("../../validator/roles/rolePermissionsValidator");

// Apply middleware to all routes in this router
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Role Permissions
 *   description: Manage the relationship between roles and permissions
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     role_permissions:
 *       type: object
 *       properties:
 *         role_id:
 *           type: integer
 *         permission_id:
 *           type: integer
 *         created_at:
 *           type: string
 *           format: date-time
 *         is_deleted:
 *           type: boolean
 */

// GET all role permissions
/**
 * @swagger
 * /role-permissions:
 *   get:
 *     summary: Get all role permissions
 *     tags: [Role Permissions]
 *     responses:
 *       200:
 *         description: List of role permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/role_permissions'
 */
router.get("/", async (req, res) => {
  try {
    const data = await prisma.role_permissions.findMany({
      where: { is_deleted: false },
      include: { roles: true, permissions: true },
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET specific role permission
/**
 * @swagger
 * /role-permissions/{role_id}/{permission_id}:
 *   get:
 *     summary: Get a specific role-permission relation
 *     tags: [Role Permissions]
 *     parameters:
 *       - in: path
 *         name: role_id
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
 *         description: Role-permission data
 *       404:
 *         description: Not found
 */
router.get("/:role_id/:permission_id", async (req, res) => {
  try {
    const { role_id, permission_id } = req.params;
    const data = await prisma.role_permissions.findUnique({
      where: {
        role_id_permission_id: {
          role_id: parseInt(role_id),
          permission_id: parseInt(permission_id),
        },
      },
      include: { roles: true, permissions: true },
    });
    if (!data) return res.status(404).json({ error: "Not found" });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE role permission
/**
 * @swagger
 * /role-permissions:
 *   post:
 *     summary: Create a new role-permission relation
 *     tags: [Role Permissions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               role_id:
 *                 type: integer
 *               permission_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Created
 */
router.post("/", async (req, res) => {
  const { role_id, permission_id } = req.body;
  try {
    const newItem = await prisma.role_permissions.create({
      data: { role_id, permission_id },
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
 *         required: true
 *         schema:
 *           type: integer
 *         description: Current user ID
 *       - in: path
 *         name: permission_id
 *         required: true
 *         schema:
 *           type: integer
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
 *               $ref: '#/components/schemas/user_permissions'
 *       400:
 *         description: Invalid input (validation errors)
 *       404:
 *         description: Relation not found
 */

// UPDATE role-permission relation (change role_id or permission_id)
router.put(
  "/:role_id/:permission_id",
  validateUpdateRolePermission,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role_id, permission_id } = req.params;
    const { role_id: newRoleId, permission_id: newPermissionId } = req.body;

    try {
      const relation = await prisma.role_permissions.findUnique({
        where: {
          role_id_permission_id: {
            role_id: parseInt(role_id),
            permission_id: parseInt(permission_id),
          },
        },
      });
      if (!relation) {
        return res.status(404).json({ error: "Relation not found" });
      }

      const updated = await prisma.role_permissions.update({
        where: {
          role_id_permission_id: {
            role_id: parseInt(role_id),
            permission_id: parseInt(permission_id),
          },
        },
        data: {
          role_id: newRoleId,
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
 * /role-permissions/{role_id}/{permission_id}:
 *   delete:
 *     summary: Toggle delete status of a role-permission relation
 *     tags: [Role Permissions]
 *     parameters:
 *       - in: path
 *         name: role_id
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
router.delete("/:role_id/:permission_id", async (req, res) => {
  try {
    const { role_id, permission_id } = req.params;
    const relation = await prisma.role_permissions.findUnique({
      where: {
        role_id_permission_id: {
          role_id: parseInt(role_id),
          permission_id: parseInt(permission_id),
        },
      },
    });
    if (!relation) return res.status(404).json({ error: "Relation not found" });

    const updated = await prisma.role_permissions.update({
      where: {
        role_id_permission_id: {
          role_id: parseInt(role_id),
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
