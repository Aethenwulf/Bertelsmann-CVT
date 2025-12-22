const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const multer = require("multer");
const authenticateToken = require("../../../middleware/auth-Token");

function makeBaseUrl(req) {
  return `${req.protocol}://${req.get("host")}`; // http://localhost:3000
}

function withAbsoluteAvatarUrl(req, userRow) {
  if (!userRow) return userRow;

  const avatarUrl = userRow.avatar_size_bytes
    ? `${makeBaseUrl(req)}/users/${userRow.id}/avatar`
    : null;

  return { ...userRow, avatarUrl };
}

function toIntOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number.parseInt(String(value), 10);
  return Number.isNaN(n) ? null : n;
}

// store in memory so we can write buffer to DB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
  fileFilter: (req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/gif"].includes(file.mimetype);

    // ✅ Multer v1 style (cb exists)
    if (typeof cb === "function") {
      if (!ok) return cb(new Error("Only JPG/PNG/GIF allowed"));
      return cb(null, true);
    }

    // ✅ Multer v2 style (no cb): return boolean, or throw
    if (!ok) throw new Error("Only JPG/PNG/GIF allowed");
    return true;
  },
});

async function publicGetAvatar(req, res) {
  try {
    const userId = Number(req.params.id);
    if (!Number.isFinite(userId))
      return res.status(400).send("Invalid user ID");

    const user = await prisma.users.findFirst({
      where: { id: userId, is_deleted: false },
      select: {
        avatar_bytes: true,
        avatar_mime: true,
        avatar_size_bytes: true,
      },
    });

    if (!user || !user.avatar_bytes) return res.status(404).end();

    res.setHeader(
      "Content-Type",
      user.avatar_mime || "application/octet-stream"
    );
    res.setHeader(
      "Content-Length",
      user.avatar_size_bytes?.toString() || String(user.avatar_bytes.length)
    );
    res.setHeader("Cache-Control", "public, max-age=300");
    return res.send(Buffer.from(user.avatar_bytes));
  } catch (err) {
    console.error("Get avatar error:", err);
    return res.status(500).end();
  }
}

function normalizeBigInt(value) {
  if (typeof value === "bigint") return value.toString();
  return value;
}

function normalizeUserBigInts(user) {
  if (!user) return user;

  return {
    ...user,
    avatar_size_bytes: normalizeBigInt(user.avatar_size_bytes),
  };
}

// -------------------- Reusable Prisma Select (safe user fields) --------------------

const USER_SAFE_SELECT = {
  id: true,
  first_name: true,
  last_name: true,
  email: true,
  phone_country: true,
  phone_number: true,
  birthday: true,
  department_id: true,
  role_id: true,
  country: true,
  state: true,
  city: true,
  address_line: true,
  zip_code: true,
  about: true,

  // Option B avatar meta only (NO BYTES)
  avatar_mime: true,
  avatar_size_bytes: true,

  is_public: true,
  status: true,
  last_seen: true,
  last_login: true,
  created_at: true,
  updated_at: true,
  profile_completed: true,
  is_deleted: true,
};

// -------------------- AVATAR (DB bytes) --------------------

// Apply middleware to all routes in this router
router.use(authenticateToken);

// POST /users/:id/avatar  (multipart/form-data, field name: avatar)
router.post(
  "/:id/avatar",
  (req, res, next) => {
    upload.single("avatar")(req, res, (err) => {
      if (err)
        return res.status(400).json({ error: err.message || "Upload failed" });
      next();
    });
  },
  async (req, res) => {
    try {
      const userId = Number.parseInt(req.params.id, 10);
      if (Number.isNaN(userId))
        return res.status(400).json({ error: "Invalid user ID" });

      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const isAdmin = Number(req.user?.role) === 1;
      const selfId = req.user?.id ?? req.user?.user_id;
      if (!isAdmin && Number(selfId) !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      await prisma.users.update({
        where: { id: userId },
        data: {
          avatar_bytes: req.file.buffer,
          avatar_mime: req.file.mimetype,
          avatar_size_bytes: BigInt(req.file.size),
        },
      });

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const v = Date.now();

      return res.json({
        success: true,
        avatarUrl: `${baseUrl}/users/${userId}/avatar?v=${v}`,
      });
    } catch (err) {
      console.error("Upload avatar error:", err);
      return res.status(400).json({ error: err.message || "Upload failed" });
    }
  }
);

// DELETE /users/:id/avatar  (clears avatar)
router.delete("/:id/avatar", async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isFinite(userId))
      return res.status(400).json({ error: "Invalid user ID" });

    const isAdmin = Number(req.user?.role) === 1;
    const selfId = req.user?.id ?? req.user?.user_id;
    if (!isAdmin && Number(selfId) !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await prisma.users.update({
      where: { id: userId },
      data: {
        avatar_bytes: null,
        avatar_mime: null,
        avatar_size_bytes: null,
      },
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("Delete avatar error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * only overwrite when field is present
 * - undefined => keep existing
 * - null      => write null (explicit clear)
 */

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: User management endpoints
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
 *           example: 1
 *         username:
 *           type: string
 *           example: johndoe
 *         email:
 *           type: string
 *           example: johndoe@example.com
 *         role_id:
 *           type: integer
 *           example: 1
 *         password:
 *           type: string
 *           example: "$2b$10$TgOjpqFbm2EXl6QK7U0iR9gEpZfzL3wPfTfOnPOEqglmtDd9B"
 *         created_at:
 *           type: string
 *           example: "2025-08-11T10:00:00Z"
 *         updated_at:
 *           type: string
 *           example: "2025-08-11T12:00:00Z"
 *         profile_completed:
 *           type: boolean
 *           example: false
 *         is_deleted:
 *           type: boolean
 *           example: false
 */

function coalesceUndefined(next, prev) {
  return next === undefined ? prev : next;
}

const {
  validateCreateUser,
  validateUpdateUser,
} = require("../../validator/users/users");
const validate = require("../../../middleware/validate");

function removePassword(item) {
  // users table doesn't contain password_hash, but keep this helper safe
  if (!item) return item;
  if (Array.isArray(item))
    return item.map(({ password_hash, ...rest }) => rest);
  const { password_hash, ...rest } = item;
  return rest;
}

function toIntOrNull(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// Simple username normalizer (optional but recommended)
function normalizeUsername(v) {
  const s = String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9._-]/g, ""); // keep it safe-ish for logins
  return s;
}

async function generateUniqueUsername(tx, baseUsername) {
  const base = normalizeUsername(baseUsername) || "user";
  let candidate = base;

  // If base exists, append incremental suffix: base1, base2, ...
  for (let i = 0; i < 10000; i++) {
    const exists = await tx.user_auth.findUnique({
      where: { username: candidate },
      select: { id: true },
    });

    if (!exists) return candidate;

    candidate = `${base}${i + 1}`;
  }

  // Extremely unlikely fallback
  return `${base}${Date.now()}`;
}

// List all users (role-based filter)
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/users'
 *       500:
 *         description: Server error
 */

router.get("/", async (req, res) => {
  try {
    const isAdmin = req.user?.role === 1;

    const data = await prisma.users.findMany({
      where: isAdmin
        ? undefined
        : {
            is_deleted: false,
            department_id: toIntOrNull(req.user?.department),
          },
      select: {
        ...USER_SAFE_SELECT,
        user_auth: {
          where: { is_deleted: false },
          select: { username: true },
          take: 1,
        },
      },
      orderBy: { id: "asc" },
    });

    const normalized = data.map((u) => {
      const username = u.user_auth?.[0]?.username ?? null;
      const { user_auth, ...rest } = u;
      return { ...rest, username };
    });
    const safe = normalized.map(normalizeUserBigInts);
    const withAvatar = safe.map((u) => withAbsoluteAvatarUrl(req, u));
    return res.json(removePassword(withAvatar));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get single user (log READ)
/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/users'
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

router.get("/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (Number.isNaN(userId))
      return res.status(400).json({ error: "Invalid user ID" });

    const data = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        ...USER_SAFE_SELECT,
        user_auth: {
          where: { is_deleted: false },
          select: { username: true },
          take: 1,
        },
      },
    });

    if (!data || data.is_deleted)
      return res.status(404).json({ error: "Not found" });

    const username = data.user_auth?.[0]?.username ?? null;
    const { user_auth, ...rest } = data;

    await req.logActivity?.({
      action_type: "READ",
      table_name: "users",
      record_id: data.id,
    });

    const row = normalizeUserBigInts({ ...rest, username });
    return res.json(removePassword(withAbsoluteAvatarUrl(req, row)));
  } catch (error) {
    return res.status(500).json({ error: error.message });
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
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/users'
 *       400:
 *         description: Invalid payload
 *       409:
 *         description: Duplicate email or username
 *       500:
 *         description: Server error
 */

router.post("/", validateCreateUser, validate, async (req, res) => {
  const {
    username,
    email,
    password,
    first_name,
    last_name,
    phone_number,
    phone_country,

    country,
    state,
    city,
    address_line,
    zip_code,

    role_id,
    department_id,
    status,
  } = req.body;

  try {
    const password_hash = await bcrypt.hash(password, 10);

    const created = await prisma.$transaction(async (tx) => {
      // ✅ generate unique username inside the same transaction
      const baseUsername = username || String(email).split("@")[0];
      const uniqueUsername = await generateUniqueUsername(tx, baseUsername);

      const newUser = await tx.users.create({
        data: {
          first_name,
          last_name,
          email,
          phone_number: phone_number ?? null,
          phone_country: phone_country ?? null,

          country: country ?? null,
          state: state ?? null,
          city: city ?? null,
          address_line: address_line ?? null,
          zip_code: zip_code ?? null,

          role_id: toIntOrNull(role_id),
          department_id: toIntOrNull(department_id),
          status: status ?? "ACTIVE",
        },
        select: USER_SAFE_SELECT,
      });

      await tx.user_auth.create({
        data: {
          user_id: newUser.id,
          username: uniqueUsername, // ✅ never collides now
          password_hash,
        },
      });

      return newUser;
    });

    await req.logActivity?.({
      action_type: "CREATE",
      table_name: "users",
      record_id: created.id,
      changed_fields: Object.keys(req.body),
    });

    res.status(201).json(removePassword(created));
  } catch (error) {
    // Prisma unique errors
    if (error?.code === "P2002") {
      return res.status(409).json({
        error: "Duplicate value for a unique field",
        target: error?.meta?.target, // ✅ helpful for debugging
      });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update user profile; optionally update password in user_auth
/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user by ID
 *     tags: [Users]
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
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/users'
 *       400:
 *         description: Invalid payload
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

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
    if (error?.code === "P2002") {
      return res.status(409).json({
        error: "Duplicate value for a unique field",
        target: error?.meta?.target,
      });
    }
    if (error?.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

// Delete/restore user (soft toggle)
router.delete("/:id", async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Prevent self-delete
    if (req.user?.user_id === userId) {
      return res.status(403).json({
        error: "You cannot delete your own account",
      });
    }

    const existing = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!existing) {
      return res.status(404).json({ error: "User not found" });
    }

    const updated = await prisma.users.update({
      where: { id: userId },
      data: { is_deleted: !existing.is_deleted },
      select: USER_SAFE_SELECT,
    });

    await req.logActivity?.({
      action_type: updated.is_deleted ? "DELETE" : "RESTORE",
      table_name: "users",
      record_id: updated.id,
      changed_fields: ["is_deleted"],
    });

    return res.json({
      success: true,
      message: updated.is_deleted ? "User deactivated" : "User restored",
      user: updated,
    });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = { router, publicGetAvatar };
