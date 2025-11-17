const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authenticateToken = require("../../../middleware/auth-Token");

// Simple inline validation — replace with your own validator if available
function validateLookup(req, res, next) {
  const { group_name, name, parent_id, sort_order, is_active, description } =
    req.body;

  if (!group_name || typeof group_name !== "string") {
    return res
      .status(400)
      .json({ error: "group_name is required and must be a string" });
  }
  if (!name || typeof name !== "string") {
    return res
      .status(400)
      .json({ error: "name is required and must be a string" });
  }
  if (parent_id !== undefined && !Number.isInteger(parent_id)) {
    return res
      .status(400)
      .json({ error: "parent_id must be an integer if provided" });
  }
  if (sort_order !== undefined && !Number.isInteger(sort_order)) {
    return res
      .status(400)
      .json({ error: "sort_order must be an integer if provided" });
  }
  if (is_active !== undefined && typeof is_active !== "boolean") {
    return res
      .status(400)
      .json({ error: "is_active must be a boolean if provided" });
  }
  if (description !== undefined && typeof description !== "string") {
    return res
      .status(400)
      .json({ error: "description must be a string if provided" });
  }
  next();
}

// Apply middleware to all routes
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Lookups
 *   description: Lookup management operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     lookups:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         group_name:
 *           type: string
 *           example: INCIDENT_CATEGORY
 *         parent_id:
 *           type: integer
 *           nullable: true
 *           example: 2
 *         name:
 *           type: string
 *           example: Equipment Failure
 *         description:
 *           type: string
 *           nullable: true
 *           example: Failure caused by malfunction
 *         sort_order:
 *           type: integer
 *           nullable: true
 *           example: 10
 *         is_active:
 *           type: boolean
 *           example: true
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: 2025-08-11T10:00:00Z
 *         updated_at:
 *           type: string
 *           format: date-time
 *           example: 2025-08-11T12:00:00Z
 *     lookupInput:
 *       type: object
 *       required:
 *         - group_name
 *         - name
 *       properties:
 *         group_name:
 *           type: string
 *           example: INCIDENT_CATEGORY
 *         parent_id:
 *           type: integer
 *           nullable: true
 *         name:
 *           type: string
 *           example: Equipment Failure
 *         description:
 *           type: string
 *           nullable: true
 *         sort_order:
 *           type: integer
 *           nullable: true
 *         is_active:
 *           type: boolean
 *           example: true
 */

/**
 * @swagger
 * /lookups:
 *   get:
 *     summary: Get all active lookups
 *     description: Retrieves all lookups where `is_active` is true.
 *     tags: [Lookups]
 *     parameters:
 *       - in: query
 *         name: group_name
 *         schema:
 *           type: string
 *         description: Filter by group name
 *       - in: query
 *         name: parent_id
 *         schema:
 *           type: integer
 *         description: Filter by parent ID
 *     responses:
 *       200:
 *         description: A list of lookups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/lookups'
 *       500:
 *         description: Server error
 */
router.get("/", async (req, res) => {
  try {
    const { group_name, parent_id } = req.query;
    const data = await prisma.lookups.findMany({
      where: {
        is_active: true,
        ...(group_name ? { group_name } : {}),
        ...(parent_id ? { parent_id: parseInt(parent_id) } : {}),
      },
      orderBy: [{ sort_order: "asc" }, { id: "asc" }],
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /lookups/{id}:
 *   get:
 *     summary: Get lookup by ID
 *     tags: [Lookups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lookup found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/lookups'
 *       404:
 *         description: Lookup not found
 *       500:
 *         description: Server error
 */
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = await prisma.lookups.findUnique({ where: { id } });
    if (!data) return res.status(404).json({ error: "Lookup not found" });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /lookups:
 *   post:
 *     summary: Create a new lookup
 *     tags: [Lookups]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/lookupInput'
 *     responses:
 *       201:
 *         description: Lookup created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/lookups'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post("/", validateLookup, async (req, res) => {
  const { group_name, parent_id, name, description, sort_order, is_active } =
    req.body;
  try {
    const newItem = await prisma.lookups.create({
      data: {
        group_name,
        parent_id: parent_id ?? null,
        name,
        description: description ?? null,
        sort_order: sort_order ?? null,
        is_active: is_active ?? true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /lookups/{id}:
 *   put:
 *     summary: Update a lookup
 *     tags: [Lookups]
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
 *             $ref: '#/components/schemas/lookupInput'
 *     responses:
 *       200:
 *         description: Lookup updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/lookups'
 *       404:
 *         description: Lookup not found
 *       500:
 *         description: Server error
 */
router.put("/:id", validateLookup, async (req, res) => {
  const { group_name, parent_id, name, description, sort_order, is_active } =
    req.body;
  try {
    const updatedItem = await prisma.lookups.update({
      where: { id: parseInt(req.params.id) },
      data: {
        group_name,
        parent_id: parent_id ?? null,
        name,
        description: description ?? null,
        sort_order: sort_order ?? null,
        is_active: is_active ?? true,
        updated_at: new Date(),
      },
    });
    res.json(updatedItem);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Lookup not found" });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /lookups/{id}:
 *   delete:
 *     summary: Toggle lookup active state
 *     description: Soft delete or restore a lookup by toggling `is_active`.
 *     tags: [Lookups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lookup active state toggled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 lookup:
 *                   $ref: '#/components/schemas/lookups'
 *       404:
 *         description: Lookup not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.lookups.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: "Lookup not found" });
    }

    const updated = await prisma.lookups.update({
      where: { id },
      data: {
        is_active: !existing.is_active,
        updated_at: new Date(),
      },
    });

    res.status(200).json({
      message: updated.is_active
        ? "Lookup restored"
        : "Lookup marked as inactive",
      lookup: updated,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
