const express = require("express");
const nodemailer = require("nodemailer");

const router = express.Router();

// POST /auth/customer-sign-up
/**
 * @swagger
 * /auth/customer-sign-up:
 *   post:
 *     summary: Demo sign-up request (sends email to admin)
 *     tags: [Request]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerName
 *               - email
 *               - phoneNumber
 *               - address
 *               - state
 *               - city
 *               - postalCode
 *             properties:
 *               customerName:
 *                 type: string
 *                 example: Pearls Inc
 *               email:
 *                 type: string
 *                 example: salestax@bertelsmann.com
 *               phoneNumber:
 *                 type: string
 *                 example: "2128851135"
 *               phoneCountry:
 *                 type: string
 *                 example: US
 *               dba:
 *                 type: string
 *                 example: Pearls DBA
 *               address:
 *                 type: string
 *                 example: 1745 Broadway
 *               state:
 *                 type: string
 *                 example: New York
 *               city:
 *                 type: string
 *                 example: New York
 *               postalCode:
 *                 type: string
 *                 example: "10019"
 *     responses:
 *       200:
 *         description: Email sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *       500:
 *         description: Failed to send email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to send email
 */

router.post("/customer-sign-up", async (req, res) => {
  try {
    const {
      customerName,
      email,
      phoneNumber,
      phoneCountry,
      dba,
      address,
      state,
      city,
      postalCode,
    } = req.body || {};

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true", // true for 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    await transporter.verify();

    const receiver = "francis.juat.tbs@gmail.com";

    const text = `
        New Demo Sign-up Request

        Customer Name: ${customerName || ""}
        Email: ${email || ""}
        Phone: ${phoneNumber || ""} (${phoneCountry || ""})
        DBA: ${dba || ""}

        Address: ${address || ""}
        State: ${state || ""}
        City: ${city || ""}
        Postal Code: ${postalCode || ""}
        `.trim();

    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: receiver,
      subject: `Sign-up Request: ${customerName || "Unknown"}`,
      text,
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("customer-sign-up email error:", err); // ✅ show real cause
    return res
      .status(500)
      .json({ message: err?.message || "Failed to send email" });
  }
});

module.exports = router;
