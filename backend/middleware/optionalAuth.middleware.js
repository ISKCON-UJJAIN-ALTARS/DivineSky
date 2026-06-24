const jwt = require("jsonwebtoken");

/**
 * 🔓 Optional auth middleware
 * Unlike auth.js, this NEVER blocks the request.
 * - If a valid admin Bearer token is present, req.user is set and req.isAdmin = true
 * - If no token, an invalid token, or a non-admin token is present, the request
 *   still proceeds normally with req.isAdmin = false
 *
 * Use this on PUBLIC routes that need to behave differently for admins
 * (e.g. showing hidden products in the manage panel) without requiring
 * customers to be authenticated.
 */
module.exports = function optionalAuth(req, res, next) {
  req.isAdmin = false;

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    req.isAdmin = decoded.role === "admin";
  } catch (err) {
    // Invalid/expired token on a public route shouldn't block the request,
    // it just means we treat this request as non-admin.
    req.isAdmin = false;
  }

  next();
};