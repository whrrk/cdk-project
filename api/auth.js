async function getAuthContext(auth) {
  const userId = auth.userId;
  const email = auth.email;
  const groups = auth.groups || [];

  let role = "UNKNOWN";
  if (groups.includes("TEACHER")) role = "TEACHER";
  if (groups.includes("STUDENT")) role = "STUDENT";
  if (groups.includes("ADMIN")) role = "ADMIN";

  console.log("Auth context:", { userId, email, role, groups });
  return { userId, email, role, groups };
}

function requireRole(ctx, allowedRoles) {
  console.log("Checking roles:", ctx.role, allowedRoles);
  if (!allowedRoles.includes(ctx.role)) {
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
  }
}

module.exports =  { getAuthContext, requireRole };