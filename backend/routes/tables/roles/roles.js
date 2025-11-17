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
 */
router.get("/", async (req, res) => {
  try {
    const data = await prisma.roles.findMany({
      where: { is_deleted: false },
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
 */
router.get("/:id", async (req, res) => {
  try {
    const data = await prisma.roles.findUnique({
      where: { role_id: parseInt(req.params.id) },
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
 *         description: Role created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/roles'
 */
router.post("/", validateCreateRole, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { role_name, description } = req.body;
  try {
    const newItem = await prisma.roles.create({
      data: { role_name, description },
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
 *         description: Role updated
 */
router.put("/:id", validateUpdateRole, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { role_name, description } = req.body;
  try {
    const updatedItem = await prisma.roles.update({
      where: { role_id: parseInt(req.params.id) },
      data: { role_name, description, updated_at: new Date() },
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
 *       404:
 *         description: Role not found
 */
router.delete("/:id", validateRoleId, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const roleId = parseInt(req.params.id);

    const role = await prisma.roles.findUnique({
      where: { role_id: roleId },
    });

    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }

    const updatedRole = await prisma.roles.update({
      where: { role_id: roleId },
      data: {
        is_deleted: !role.is_deleted,
        updated_at: new Date(),
      },
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
