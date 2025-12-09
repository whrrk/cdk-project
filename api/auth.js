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

function buildAuthContext(requestContext) {
  const authorizer = requestContext && requestContext.authorizer;
  const claims = authorizer && authorizer.claims;
  const userId =
    (claims && (claims["cognito:username"] || claims.sub)) || "anonymous";

  // ここで role を決める
  const groupsRaw = claims && claims["cognito:groups"];
  let groups = [];

  if (Array.isArray(groupsRaw)) {
    groups = groupsRaw;
  } else if (typeof groupsRaw === "string") {
    // Cognito が "TEACHER,STUDENT" みたいな文字列でくる場合もあるので一応ケア
    groups = groupsRaw.split(",").map((g) => g.trim());
  }

  let role = "UNKNOWN";
  if (groups.includes("TEACHER")) role = "TEACHER";
  else if (groups.includes("STUDENT")) role = "STUDENT";

  return {
    userId,
    role,
    groups,
    claims,
  };
}

module.exports =  { getAuthContext, requireRole, buildAuthContext };