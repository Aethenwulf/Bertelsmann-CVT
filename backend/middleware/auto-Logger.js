const logUserActivity = require("../utils/logUserActivity");

module.exports = function autoLogger(req, res, next) {
  // unify all logging through the util
  req.logActivity = (payload) => logUserActivity(req, payload);
  next();
};
