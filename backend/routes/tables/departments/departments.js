const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authenticateToken = require("../../../middleware/auth-Token");
const {
  validateDepartment,
} = require("../../validator/department/departmentsValidator");

// Apply middleware to all routes in this router
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Departments
 *   description: Department management operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     departments:
 *       type: object
 *       properties:
 *         department_id:
 *           type: integer
 *           example: 1
 *         department_name:
 *           type: string
 *           example: IT Department
 *         description:
 *           type: string
 *           example: Handles all technology operations
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: 2025-08-11T10:00:00Z
 *         updated_at:
 *           type: string
 *           format: date-time
 *           example: 2025-08-11T12:00:00Z
 *         is_deleted:
 *           type: boolean
 *           example: false
 *     departmentInput:
 *       type: object
 *       required:
 *         - department_name
 *       properties:
 *         department_name:
 *           type: string
 *           example: Human Resources
 *         description:
 *           type: string
 *           example: Handles hiring and employee relations
 */

/**
 * @swagger
 * /departments:
 *   get:
 *     summary: Get all departments
 *     description: Retrieves all departments that are not marked as deleted.
 *     tags: [Departments]
 *     responses:
 *       200:
 *         description: A list of departments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/departments'
 *       500:
 *         description: Server error
 */
router.get("/", async (req, res) => {
  try {
    const data = await prisma.departments.findMany({
      where: { is_deleted: false },
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /departments/{id}:
 *   get:
 *     summary: Get department by ID
 *     tags: [Departments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Department found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/departments'
 *       404:
 *         description: Department not found
 *       500:
 *         description: Server error
 */
router.get("/:id", async (req, res) => {
  try {
    const data = await prisma.departments.findUnique({
      where: { department_id: parseInt(req.params.id) },
    });
    if (!data) return res.status(404).json({ error: "Department not found" });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /departments:
 *   post:
 *     summary: Create a new department
 *     tags: [Departments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/departmentInput'
 *     responses:
 *       201:
 *         description: Department created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/departments'
 *       500:
 *         description: Server error
 */
router.post("/", validateDepartment, async (req, res) => {
  const { department_name, description } = req.body;
  try {
    const newItem = await prisma.departments.create({
      data: {
        department_name,
        description,
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
 * /departments/{id}:
 *   put:
 *     summary: Update a department
 *     tags: [Departments]
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
 *             $ref: '#/components/schemas/departmentInput'
 *     responses:
 *       200:
 *         description: Department updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/departments'
 *       404:
 *         description: Department not found
 *       500:
 *         description: Server error
 */
router.put("/:id", validateDepartment, async (req, res) => {
  const { department_name, description } = req.body;
  try {
    const updatedItem = await prisma.departments.update({
      where: { department_id: parseInt(req.params.id) },
      data: { department_name, description, updated_at: new Date() },
    });
    res.json(updatedItem);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Department not found" });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /departments/{id}:
 *   delete:
 *     summary: Toggle department deletion state
 *     description: Marks a department as deleted or restores it if already deleted.
 *     tags: [Departments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Department deletion state toggled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 department:
 *                   $ref: '#/components/schemas/departments'
 *       404:
 *         description: Department not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", async (req, res) => {
  try {
    const departmentId = parseInt(req.params.id);

    const department = await prisma.departments.findUnique({
      where: { department_id: departmentId },
    });

    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }

    const updatedDepartment = await prisma.departments.update({
      where: { department_id: departmentId },
      data: {
        is_deleted: !department.is_deleted,
        updated_at: new Date(),
      },
    });

    res.status(200).json({
      message: updatedDepartment.is_deleted
        ? "Department marked as deleted"
        : "Department restored",
      department: updatedDepartment,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
