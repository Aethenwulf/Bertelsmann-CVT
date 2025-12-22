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
 *     description: Authentication endpoints (login / logout / me)
 */

function getBearerToken(req) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.split(" ")[1];
}

function safeUserIdFromPayload(payload) {
  return payload?.id ?? payload?.user_id ?? null;
}

function avatarUrlFromUser(req, user) {
  if (!user?.avatar_size_bytes) return null;

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const v = user.updated_at ? new Date(user.updated_at).getTime() : Date.now();

  return `${baseUrl}/users/${user.id}/avatar?v=${v}`;
}

function buildUserResponse(req, user, userAuth) {
  const profileCompleted = Boolean(user.profile_completed);

  return {
    user_id: user.id,
    fullname: `${user.first_name} ${user.last_name}`,
    username: userAuth?.username ?? null,
    email: user.email,
    role: user.role_id,
    department: user.department_id,

    // keep both keys so frontend variants won't break
    profileCompleted,
    profile_completed: profileCompleted,

    firstName: user.first_name,
    lastName: user.last_name,
    phoneNumber: user.phone_number,
    country: user.country,
    state: user.state,
    city: user.city,
    address: user.address_line,
    zipCode: user.zip_code,
    about: user.about,
    isPublic: user.is_public,

    // ✅ this becomes: http://localhost:3000/users/2/avatar
    avatarUrl: avatarUrlFromUser(req, user),

    status: user.status,
    lastSeen: user.last_seen,
    lastLogin: user.last_login,
    birthday: user.birthday || null,
  };
}

// ------------------- Employee ---------------------

/**
 * @swagger
 * /auth/sign-in:
 *   post:
 *     summary: Sign in with username or email + password (returns JWT for local storage)
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
 *         description: Sign-in successful (returns JWT token + public user info)
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
 *                 user:
 *                   type: object
 *       400:
 *         description: Missing credentials
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */

router.post("/sign-in", validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { emailOrUsername, password } = req.body;

    const userAuth = await prisma.user_auth.findFirst({
      where: {
        is_deleted: false,
        users: { is_deleted: false },
        OR: [
          { username: emailOrUsername },
          { users: { email: emailOrUsername } },
        ],
      },
      include: { users: true },
    });

    // Disabled / not found
    if (
      !userAuth ||
      !userAuth.users ||
      userAuth.users.is_deleted ||
      userAuth.is_deleted
    ) {
      return res.status(403).json({ message: "Account disabled" });
    }

    const validPassword = await bcrypt.compare(
      password,
      userAuth.password_hash
    );
    if (!validPassword)
      return res.status(401).json({ message: "Invalid credentials" });

    const user = userAuth.users;

    const tokenPayload = {
      user_id: user.id,
      fullname: `${user.first_name} ${user.last_name}`,
      username: userAuth.username,
      email: user.email,
      role: user.role_id,
      department: user.department_id,
      profile_completed: user.profile_completed,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "1d" });

    await logUserActivity(req, {
      user_id: user.id,
      action_type: "SIGN_IN",
      table_name: "users",
      record_id: user.id,
    });

    return res.json({
      success: true,
      token,
      user: buildUserResponse(req, user, userAuth),
    });
  } catch (err) {
    console.error("Sign-in error:", err);
    return res.status(500).json({ message: "Server error" });
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
 *         description: Returns current user profile
 *       401:
 *         description: Unauthorized (no or invalid token)
 */
router.get("/me", async (req, res) => {
  try {
    const token = getBearerToken(req);
    if (!token)
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired token" });
    }

    const userId = safeUserIdFromPayload(payload);
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Invalid token payload" });

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role_id: true,
        department_id: true,
        profile_completed: true,

        phone_number: true,
        country: true,
        state: true,
        city: true,
        address_line: true,
        zip_code: true,
        about: true,
        is_public: true,

        status: true,
        last_seen: true,
        last_login: true,
        birthday: true,

        avatar_size_bytes: true,
        updated_at: true,

        // IMPORTANT: used below
        is_deleted: true,
      },
    });

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    if (user.is_deleted)
      return res
        .status(403)
        .json({ success: false, message: "Account disabled" });

    const userAuth = await prisma.user_auth.findFirst({
      where: { user_id: userId, is_deleted: false },
      select: { username: true },
    });

    if (!userAuth)
      return res
        .status(403)
        .json({ success: false, message: "Account disabled" });

    return res.json({
      success: true,
      user: buildUserResponse(req, user, userAuth),
    });
  } catch (err) {
    console.error("Me endpoint error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * @swagger
 * /auth/me:
 *   put:
 *     summary: Update current authenticated user's profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               photoURL:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               country:
 *                 type: integer
 *               address:
 *                 type: string
 *               state:
 *                 type: integer
 *               city:
 *                 type: integer
 *               zipCode:
 *                 type: string
 *               about:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */

router.put("/me", async (req, res) => {
  try {
    const token = getBearerToken(req);
    if (!token)
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired token" });
    }

    const userId = safeUserIdFromPayload(payload);
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Invalid token payload" });

    const existing = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, is_deleted: true },
    });

    if (!existing || existing.is_deleted) {
      return res
        .status(403)
        .json({ success: false, message: "Account disabled" });
    }

    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      country,
      address,
      state,
      city,
      zipCode,
      about,
      isPublic,
      birthday,
    } = req.body;

    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        first_name: firstName,
        last_name: lastName,
        email,

        phone_number: phoneNumber ?? null,
        country: country ?? null,
        state: state ?? null,
        city: city ?? null,
        address_line: address ?? null,
        zip_code: zipCode ?? null,
        about: about ?? null,

        birthday: birthday ? new Date(birthday) : null,
        is_public: isPublic ?? false,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role_id: true,
        department_id: true,
        profile_completed: true,

        phone_number: true,
        country: true,
        state: true,
        city: true,
        address_line: true,
        zip_code: true,
        about: true,
        is_public: true,

        status: true,
        last_seen: true,
        last_login: true,
        birthday: true,

        avatar_size_bytes: true,
        updated_at: true,
      },
    });

    await logUserActivity(req, {
      user_id: userId,
      action_type: "UPDATE_PROFILE",
      table_name: "users",
      record_id: userId,
    });

    const userAuth = await prisma.user_auth.findFirst({
      where: { user_id: userId, is_deleted: false },
      select: { username: true },
    });

    return res.json({
      success: true,
      user: buildUserResponse(req, updatedUser, userAuth),
    });
  } catch (err) {
    console.error("Update profile error (/auth/me PUT):", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * @swagger
 * /auth/sign-out:
 *   post:
 *     summary: Sign out (invalidate session on frontend)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Signed out successfully
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

router.post("/sign-out", async (req, res) => {
  try {
    let userId = null;

    const token = getBearerToken(req);
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = safeUserIdFromPayload(decoded);
      } catch (verifyErr) {
        console.warn(
          "Invalid or expired token on sign-out:",
          verifyErr.message
        );
      }
    }

    if (userId) {
      await logUserActivity(req, {
        user_id: userId,
        action_type: "SIGN_OUT",
        table_name: "users",
        record_id: userId,
      });
    }

    return res.json({ success: true, message: "Signed out" });
  } catch (err) {
    console.error("Sign-out error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ------------------- Customer ---------------------
/**
 * @swagger
 * /auth/customer/login/init:
 *   post:
 *     summary: Validate customer credentials (Payor Account Number + Access Code) and start OTP flow
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [payorAccountNumber, accessCode]
 *             properties:
 *               payorAccountNumber:
 *                 type: string
 *                 example: "19245687"
 *               accessCode:
 *                 type: string
 *                 example: "06273d15-6032"
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 transactionId: { type: string }
 *       401:
 *         description: Invalid credentials
 */
router.post("/customer/login/init", async (req, res) => {
  try {
    const { payorAccountNumber, accessCode } = req.body;

    if (!payorAccountNumber || !accessCode) {
      return res
        .status(400)
        .json({ success: false, message: "Missing credentials" });
    }

    const userAuth = await prisma.user_auth.findFirst({
      where: {
        username: String(payorAccountNumber),
        is_deleted: false,
        users: { is_deleted: false },
      },
      include: { users: true },
    });

    if (!userAuth || !userAuth.users) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(String(accessCode), userAuth.password_hash);
    if (!ok)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    return res.json({ success: true, transactionId: String(userAuth.user_id) });
  } catch (err) {
    console.error("customer/login/init error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * @swagger
 * /auth/customer/otp/send:
 *   post:
 *     summary: Generate and store OTP for the customer (demo send)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [transactionId, method]
 *             properties:
 *               transactionId:
 *                 type: string
 *                 example: "2"
 *               method:
 *                 type: string
 *                 enum: [email, sms]
 *                 example: "email"
 *     responses:
 *       200:
 *         description: OTP created (in demo mode may return otp)
 */
router.post("/customer/otp/send", async (req, res) => {
  try {
    const { transactionId, method } = req.body;

    if (!transactionId || !method) {
      return res
        .status(400)
        .json({ success: false, message: "Missing transactionId or method" });
    }
    if (!["email", "sms"].includes(method)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid method" });
    }

    const userId = Number(transactionId);
    if (!Number.isFinite(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid transactionId" });
    }

    const user = await prisma.users.findFirst({
      where: { id: userId, is_deleted: false },
    });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // consume previous OTPs
    await prisma.user_otp.updateMany({
      where: {
        user_id: userId,
        consumed_at: null,
        expires_at: { gt: new Date() },
      },
      data: { consumed_at: new Date() },
    });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user_otp.create({
      data: { user_id: userId, otp_code: otp, expires_at: expiresAt },
    });

    console.log(`[DEMO OTP] user_id=${userId} method=${method} otp=${otp}`);

    const demoMode = (process.env.DEMO_MODE || "").toLowerCase() === "true";
    return res.json(
      demoMode ? { success: true, ok: true, otp } : { success: true, ok: true }
    );
  } catch (err) {
    console.error("customer/otp/send error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * @swagger
 * /auth/customer/otp/verify:
 *   post:
 *     summary: Verify OTP and return JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [transactionId, otp]
 *             properties:
 *               transactionId:
 *                 type: string
 *                 example: "2"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified, returns JWT token
 *       401:
 *         description: Invalid or expired OTP
 */
router.post("/customer/otp/verify", async (req, res) => {
  try {
    const { transactionId, otp } = req.body;

    if (!transactionId || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Missing transactionId or otp" });
    }

    const userId = Number(transactionId);
    if (!Number.isFinite(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid transactionId" });
    }

    const latest = await prisma.user_otp.findFirst({
      where: {
        user_id: userId,
        consumed_at: null,
        expires_at: { gt: new Date() },
      },
      orderBy: { created_at: "desc" },
    });

    if (!latest || String(latest.otp_code) !== String(otp)) {
      return res
        .status(401)
        .json({ success: false, message: "OTP invalid or expired" });
    }

    await prisma.user_otp.update({
      where: { id: latest.id },
      data: { consumed_at: new Date() },
    });

    const user = await prisma.users.findFirst({
      where: { id: userId, is_deleted: false },
    });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const userAuth = await prisma.user_auth.findFirst({
      where: { user_id: userId, is_deleted: false },
      select: { username: true },
    });

    const tokenPayload = {
      user_id: user.id,
      fullname: `${user.first_name} ${user.last_name}`,
      username: userAuth?.username || null,
      email: user.email,
      role: user.role_id,
      department: user.department_id,
      profile_completed: user.profile_completed,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "1d" });

    return res.json({ success: true, token });
  } catch (err) {
    console.error("customer/otp/verify error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
