const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
const logUserActivity = require("../../utils/logUserActivity");
const { validateLogin } = require("../validator/auth/authValidator");
const { validationResult } = require("express-validator");

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication endpoints (login / logout)
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with username or email + password (returns JWT for local storage)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailOrUsername
 *               - password
 *             properties:
 *               emailOrUsername:
 *                 type: string
 *                 example: johndoe@example.com
 *               password:
 *                 type: string
 *                 example: MySecureP@ss123
 *     responses:
 *       200:
 *         description: Login successful (returns JWT token + public user info)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                   description: JWT token to store locally
 *                 user:
 *                   type: object
 *                   description: public user info (no password)
 *       400:
 *         description: Missing credentials
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post("/login", validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { emailOrUsername, password } = req.body;

    // ✅ Search in user_auth, not users
    const userAuth = await prisma.user_auth.findFirst({
      where: {
        OR: [
          { username: emailOrUsername },
          { users: { email: emailOrUsername } },
        ],
      },
      include: {
        users: true, // get user details for JWT payload
      },
    });

    if (!userAuth) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ Compare hashed password
    const validPassword = await bcrypt.compare(
      password,
      userAuth.password_hash
    );
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = userAuth.users;

    // ✅ Build JWT payload
    const payload = {
      user_id: user.id,
      fullname: `${user.first_name} ${user.last_name}`,
      username: userAuth.username,
      email: user.email,
      role: user.role_id,
      department: user.department_id,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });

    // ✅ Update status in users
    await prisma.users.update({
      where: { id: user.id },
      data: { status: "ONLINE", last_login: new Date() },
    });

    await logUserActivity(req, {
      user_id: user.id,
      action_type: "LOGIN",
      table_name: "users",
      record_id: user.id,
    });

    res.json({ success: true, token, user: payload });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user (requires Bearer token)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns current user info from JWT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   type: object
 *       401:
 *         description: Unauthorized (no or invalid token)
 */
router.get("/me", (req, res) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      console.error("JWT verify error in /auth/me:", err.message);
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired token" });
    }

    const user = {
      id: payload.id ?? payload.user_id ?? null,
      fullname: payload.fullname,
      username: payload.username,
      email: payload.email,
      role: payload.role,
      department: payload.department,
    };

    return res.json({
      success: true,
      user,
    });
  } catch (err) {
    console.error("Me endpoint error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout (delete token on frontend or revoke if blacklisting enabled)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */

router.post("/logout", async (req, res) => {
  try {
    let userId = null;

    const authHeader = req.headers["authorization"];
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id ?? decoded.user_id ?? null;
      } catch (verifyErr) {
        console.warn("Invalid or expired token on logout:", verifyErr.message);
      }
    }

    if (userId) {
      await prisma.users.update({
        where: { id: userId },
        data: { status: "OFFLINE" },
      });

      await logUserActivity(req, {
        user_id: userId,
        action_type: "LOGOUT",
        table_name: "users",
        record_id: userId,
      });
    }

    res.json({ success: true, message: "Logged out" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
