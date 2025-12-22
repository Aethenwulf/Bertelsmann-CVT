const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authenticateToken = require("../../../middleware/auth-Token");

const {
  validateRoleId,
  validateCreateRole,
  validateUpdateRole,
} = require("../../validator/roles/rolesValidator");

// Apply middleware to all routes in this router
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Role management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     roles:
 *       type: object
 *       properties:
 *         role_id:
 *           type: integer
 *           example: 1
 *         role_name:
 *           type: string
 *           example: Admin
 *         description:
 *           type: string
 *           example: Administrator role
 *         created_at:
 *           type: string
 *           example: "2025-08-11T10:00:00Z"
 *         updated_at:
 *           type: string
 *           example: "2025-08-11T12:00:00Z"
 *         is_deleted:
 *           type: boolean
 *           example: false
 */

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Get all roles
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: List of roles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/roles'
 *       500:
 *         description: Server error
 */

router.get("/", async (req, res) => {
  try {
    const data = await prisma.roles.findMany({
      where: { is_deleted: false },
      orderBy: { id: "asc" },
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /roles/{id}:
 *   get:
 *     summary: Get role by ID
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Role object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/roles'
 *       404:
 *         description: Role not found
 *       500:
 *         description: Server error
 */

router.get("/:id", async (req, res) => {
  try {
    const data = await prisma.roles.findUnique({
      where: { id: parseInt(req.params.id, 10) },
    });
    if (!data) return res.status(404).json({ error: "Not found" });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /roles:
 *   post:
 *     summary: Create a new role
 *     tags: [Roles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role_name
 *             properties:
 *               role_name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Role created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/roles'
 *       400:
 *         description: Invalid payload
 *       500:
 *         description: Server error
 */

router.post("/", validateCreateRole, async (req, res) => {
  const { role_name, description } = req.body;

  try {
    const newItem = await prisma.roles.create({
      data: {
        name: role_name,
        description: description ?? null,
      },
    });
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /roles/{id}:
 *   put:
 *     summary: Update a role
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role_name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/roles'
 *       400:
 *         description: Invalid payload
 *       404:
 *         description: Role not found
 *       500:
 *         description: Server error
 */

router.put("/:id", validateUpdateRole, async (req, res) => {
  const { role_name, description } = req.body;

  try {
    const updatedItem = await prisma.roles.update({
      where: { id: parseInt(req.params.id, 10) }, // ✅ id
      data: {
        ...(role_name !== undefined ? { name: role_name } : {}),
        ...(description !== undefined ? { description } : {}),
      },
    });
    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /roles/{id}:
 *   delete:
 *     summary: Toggle role deletion state
 *     description: If the role is active, it will be marked as deleted. If already deleted, it will be restored.
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Role deletion state toggled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 role:
 *                   $ref: '#/components/schemas/roles'
 *       404:
 *         description: Role not found
 *       500:
 *         description: Server error
 */

router.delete("/:id", validateRoleId, async (req, res) => {
  try {
    const roleId = parseInt(req.params.id, 10);

    const role = await prisma.roles.findUnique({ where: { id: roleId } }); // ✅ id
    if (!role) return res.status(404).json({ error: "Role not found" });

    const updatedRole = await prisma.roles.update({
      where: { id: roleId }, // ✅ id
      data: { is_deleted: !role.is_deleted },
    });

    res.status(200).json({
      message: updatedRole.is_deleted
        ? "Role marked as deleted"
        : "Role restored",
      role: updatedRole,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
