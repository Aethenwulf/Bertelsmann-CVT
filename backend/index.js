const { ORIGIN, PORT_NUMBER } = require("./config-global.js");

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const session = require("express-session");

// const bcrypt = require("bcrypt");

// Image
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Security
const helmet = require("helmet");

// Swagger
const { swaggerUi, specs, swaggerCustomJs } = require("./swagger");

// Routes
const routes = require("./routes/main");

// Middleware
app.use(bodyParser.json());
app.use(cookieParser());

// Helmet baseline security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // allow images to be used by frontend origin
  })
);

// Helmet Content Security Policy (CSP)
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // allow Swagger UI inline scripts
      objectSrc: ["'none'"],
      imgSrc: ["'self'", "data:", "https:"],
      styleSrc: ["'self'", "'unsafe-inline'"], // allow Swagger inline styles
      // This controls where *pages served by this backend* can connect to.
      // It does NOT affect CORS directly, but we'll keep it as-is.
      connectSrc: ["'self'", process.env.FRONTEND_ORIGIN || ORIGIN],
      upgradeInsecureRequests: [],
    },
  })
);

// ----------------------------------------------------------------------
// CORS configuration
// ----------------------------------------------------------------------

// Define allowed frontend origins for CORS
const allowedOrigins = [
  "http://localhost:8084", // ✅ your current frontend
  "http://localhost:5173", // previous dev frontend
  process.env.FRONTEND_ORIGIN || ORIGIN, // whatever you've configured
].filter(Boolean);

// Allow CORS for frontend during development
app.use(
  cors({
    origin: allowedOrigins, // simple array – cors will match the request origin
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ⚠️ Removed app.options("*", cors()) – this was likely causing path-to-regexp crash

app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      sameSite: "none",
    },
  })
);

// Serve Swagger's default favicon so we don't get console 404 warnings
app.get("/favicon.ico", (req, res) => {
  res.sendFile(
    path.join(__dirname, "node_modules", "swagger-ui-dist", "favicon-32x32.png")
  );
});

// Serve OpenAPI JSON at /api-docs.json
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(specs);
});

// Serve Swagger UI at /api-docs
app.use("/api-docs", swaggerUi.serve);
app.get(
  "/api-docs",
  swaggerUi.setup(specs, {
    swaggerOptions: {
      url: "/api-docs.json", // tell Swagger where to fetch JSON
    },
    customJs: swaggerCustomJs,
    customSiteTitle: "Bertelsmann | CVT - API Docs",
  })
);

app.use(express.static(path.join(__dirname, "public")));

// API routes
app.use("/", routes);

// Default 404 for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// Start server
const PORT = process.env.PORT || PORT_NUMBER;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📄 Swagger docs: http://localhost:${PORT}/api-docs`);
  console.log("✅ CORS allowed origins:", allowedOrigins);
});

// (async () => {
//   console.log(await bcrypt.hash("aethel00", 10)); // choose your own password
// })();
