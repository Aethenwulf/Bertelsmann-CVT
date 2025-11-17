const { API_BASE } = require("./config-global");
const fs = require("fs");
const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Auto-generate tags based on route folders
function generateTagsFromRoutes(routesDir) {
  const tags = [];
  if (!fs.existsSync(routesDir)) return tags;

  function scanDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const fullPath = path.join(dir, file);
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        const hasRouteFiles = fs
          .readdirSync(fullPath)
          .some((f) => f.endsWith(".js"));
        if (hasRouteFiles) {
          tags.push({
            name: file
              .replace(/[_-]/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase()),
            description: `Operations related to ${file.replace(/[_-]/g, " ")}`,
          });
        }
        scanDir(fullPath);
      }
    });
  }

  scanDir(routesDir);
  return tags;
}

const routesTablesDir = path.join(__dirname, "routes", "tables");
const tags = generateTagsFromRoutes(routesTablesDir);

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "TBS Global | CIA",
      version: "1.0.0",
      description: "API documentation for the CIA project",
    },
    servers: [{ url: API_BASE }],
    tags,
    paths: {}, // ensures it’s never empty

    // Add JWT security scheme
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },

    // Apply it globally (all endpoints require JWT unless overridden)
    security: [{ bearerAuth: [] }],
  },
  apis: [
    path.resolve(__dirname, "./routes/**/*.js"),
    path.resolve(__dirname, "./index.js"),
  ],
};

// Build the spec
let specs = swaggerJsdoc(options);

// If no paths found, inject a dummy endpoint so UI isn’t blank
if (!specs.paths || Object.keys(specs.paths).length === 0) {
  specs.paths = {
    "/ping": {
      get: {
        tags: ["Utility"],
        summary: "Health check",
        responses: {
          200: {
            description: "Pong",
          },
        },
      },
    },
  };
}

module.exports = {
  swaggerUi,
  specs,
};
