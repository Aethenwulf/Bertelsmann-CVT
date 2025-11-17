// ----------------------------------------------------------------------

const API_BASE =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://tbs-global-cia-backend.onrender.com";

// ----------------------------------------------------------------------

const ORIGIN = "http://localhost:5173";
const PORT_NUMBER = 3000;

module.exports = {
  API_BASE,
  ORIGIN,
  PORT_NUMBER,
};

// ----------------------------------------------------------------------
