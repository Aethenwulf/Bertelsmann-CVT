const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const authenticateToken = require("../../../middleware/auth-Token");

const {
  validateCreateUser,
  validateUpdateUser,
} = require("../../validator/users/users");
const validate = require("../../../middleware/validate");

// Apply middleware to all routes in this router
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Endpoints for managing users and their accounts
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     users:
 *       type: object
 *       properties:
 *         user_id:
 *           type: integer
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *         phone_number:
 *           type: string
 *         role_id:
 *           type: integer
 *         department_id:
 *           type: integer
 *         status:
 *           type: string
 *         last_login:
 *           type: string
 *           format: date-time
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         is_deleted:
 *           type: boolean
 *     usersCreate:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           example: johndoe
 *         email:
 *           type: string
 *           example: johndoe@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: MySecureP@ss123
 *         first_name:
 *           type: string
 *           example: John
 *         last_name:
 *           type: string
 *           example: Doe
 *         phone_number:
 *           type: string
 *           example: "+1 555 123 4567"
 *         role_id:
 *           type: integer
 *           example: 2
 *         department_id:
 *           type: integer
 *           example: 1
 *         status:
 *           type: string
 *           example: OFFLINE
 *     usersUpdate:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         password:
 *           type: string
 *           format: password
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *         phone_number:
 *           type: string
 *         role_id:
 *           type: integer
 *         department_id:
 *           type: integer
 *         status:
 *           type: string
 */

function removePassword(item) {
  if (!item) return item;
  if (Array.isArray(item))
    return item.map(({ password_hash, ...rest }) => rest);
  const { password_hash, ...rest } = item;
  return rest;
}

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users depending on role
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/users'
 */

// List all users (with role-based filter)
router.get("/", async (req, res) => {
  try {
    let data;
    if (req.user?.role === 1) {
      // Admin → get all users
      data = await prisma.users.findMany();
    } else {
      // Non-admin → only return users marked deleted
      data = await prisma.users.findMany({
        where: {
          is_deleted: false,
          department_id: req.user?.department,
        },
      });
    }
    res.json(removePassword(data));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a specific user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/users'
 *       404:
 *         description: User not found
 */

// Get single user (log READ)
router.get("/:id", async (req, res) => {
  try {
    const data = await prisma.users.findUnique({
      where: { user_id: parseInt(req.params.id) },
    });
    if (!data) return res.status(404).json({ error: "Not found" });

    await req.logActivity?.({
      action_type: "READ",
      table_name: "users",
      record_id: data.user_id,
    });

    res.json(removePassword(data));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/usersCreate'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/users'
 */

// Create new user (log CREATE)
router.post("/", validateCreateUser, validate, async (req, res) => {
  const {
    username,
    email,
    password,
    first_name,
    last_name,
    phone_number,
    role_id,
    department_id,
    status,
  } = req.body;

  try {
    const password_hash = await bcrypt.hash(password, 10);

    const newItem = await prisma.users.create({
      data: {
        username,
        email,
        password_hash,
        first_name,
        last_name,
        phone_number,
        role_id,
        department_id,
        status,
      },
    });

    await req.logActivity?.({
      action_type: "CREATE",
      table_name: "users",
      record_id: newItem.user_id,
      changed_fields: Object.keys(req.body),
    });

    res.status(201).json(removePassword(newItem));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user details (optional password change)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/usersUpdate'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/users'
 *       404:
 *         description: User not found
 */

// Update user (log UPDATE with changed_fields detection)
router.put("/:id", validateUpdateUser, validate, async (req, res) => {
  const {
    username,
    email,
    password,
    first_name,
    last_name,
    phone_number,
    role_id,
    department_id,
    status,
  } = req.body;

  try {
    const userId = parseInt(req.params.id);

    const oldUser = await prisma.users.findUnique({
      where: { user_id: userId },
    });
    if (!oldUser) return res.status(404).json({ error: "User not found" });

    const updateData = {
      username,
      email,
      first_name,
      last_name,
      phone_number,
      role_id,
      department_id,
      status,
      updated_at: new Date(),
    };

    if (
      password &&
      typeof password === "string" &&
      password.trim().length > 0
    ) {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    const updatedItem = await prisma.users.update({
      where: { user_id: userId },
      data: updateData,
    });

    const changedFields = Object.keys(updateData).filter(
      (key) => updateData[key] !== oldUser[key]
    );

    await req.logActivity?.({
      action_type: "UPDATE",
      table_name: "users",
      record_id: updatedItem.user_id,
      changed_fields: changedFields,
    });

    res.json(removePassword(updatedItem));
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Toggle user deletion state
 *     description: Soft-delete or restore a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deletion state toggled
 *       403:
 *         description: Users cannot delete themselves
 *       404:
 *         description: User not found
 */

// Delete/restore user (log DELETE/RESTORE)
router.delete("/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    // Assuming `req.user` holds the authenticated user (e.g. via JWT middleware)
    if (req.user?.user_id === userId) {
      return res
        .status(403)
        .json({ error: "You cannot delete your own account" });
    }

    const user = await prisma.users.findUnique({ where: { user_id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const updatedUser = await prisma.users.update({
      where: { user_id: userId },
      data: { is_deleted: !user.is_deleted, updated_at: new Date() },
    });

    await req.logActivity?.({
      action_type: updatedUser.is_deleted ? "DELETE" : "RESTORE",
      table_name: "users",
      record_id: updatedUser.user_id,
      changed_fields: ["is_deleted"],
    });

    res.status(200).json({
      message: updatedUser.is_deleted
        ? "User marked as deleted"
        : "User restored",
      user: removePassword(updatedUser),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
