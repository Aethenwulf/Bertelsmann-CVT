const { PrismaClient } = require("@prisma/client");
const UAParser = require("ua-parser-js");
const prisma = new PrismaClient();

async function logUserActivity(
  req,
  {
    user_id = null,
    action_type,
    table_name = null,
    record_id = null,
    changed_fields = null,
  }
) {
  try {
    const parser = new UAParser(req.headers["user-agent"] || "");
    const uaResult = parser.getResult();

    const deviceType = uaResult.device.type || "desktop";
    const machineId = `${uaResult.os.name || "Unknown OS"} ${
      uaResult.os.version || ""
    }`.trim();
    const browserName = uaResult.browser.name || "Unknown Browser";
    const browserVersion = uaResult.browser.version || "";

    const ipAddress =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      req.ip ||
      null;

    const uid = user_id ?? req.user?.id ?? req.user?.user_id ?? null;
    const dataBase = {
      action_type,
      table_name,
      record_id,
      machine_id: `${machineId} · ${browserName} ${browserVersion}`,
      device_type: deviceType,
      ip_address: ipAddress,
      created_at: new Date(),
    };

    if (changed_fields != null) {
      if (Array.isArray(changed_fields)) {
        dataBase.changed_fields = changed_fields;
      } else if (typeof changed_fields === "string") {
        try {
          // allow JSON string input safely
          const parsed = JSON.parse(changed_fields);
          dataBase.changed_fields = Array.isArray(parsed)
            ? parsed
            : [changed_fields];
        } catch {
          dataBase.changed_fields = [changed_fields];
        }
      }
    }

    // First try with scalar FK user_id (most common in your previous code)
    try {
      await prisma.activity_logs.create({
        data: { ...dataBase, user_id: uid },
      });
    } catch (e) {
      // If the model doesn't have scalar user_id, fall back to relation connect
      if (String(e.message || e).includes("Unknown argument `user_id`")) {
        const relData =
          uid != null
            ? { ...dataBase, users: { connect: { user_id: uid } } }
            : dataBase; // allow null user_id
        await prisma.activity_logs.create({ data: relData });
      } else {
        throw e;
      }
    }
  } catch (err) {
    console.error("❌ Failed to log user activity:", err);
  }
}

module.exports = logUserActivity;
