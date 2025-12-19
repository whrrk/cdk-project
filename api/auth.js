const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, QueryCommand } = require("@aws-sdk/lib-dynamodb");

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME;

async function getAuthContext(auth) {
  const userId = auth.userId;
  const email = auth.email;
  const groups = auth.groups || [];

  let role = "UNKNOWN";
  if (groups.includes("TEACHER")) role = "TEACHER";
  if (groups.includes("STUDENT")) role = "STUDENT";
  if (groups.includes("ADMIN")) role = "ADMIN";

  return { userId, email, role, groups };
}

async function getClaims(event) {
  const claims =
    event?.requestContext?.authorizer?.jwt?.claims ||
    event?.requestContext?.authorizer?.claims;

  if (!claims) {
    const err = new Error("Unauthorized");
    err.statusCode = 401;
    throw err;
  }
  return claims;
}

async function requireRole(claims, allowedRoles = []) {
  const groups = claims?.groups;
  const userRoles = Array.isArray(groups)
    ? groups
    : typeof groups === "string"
      ? groups.split(",")
      : [];

  const ok = allowedRoles.some(r => userRoles.includes(r));
  if (!ok) {
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
  }
}

// ユーザーがそのコースに属しているか確認
async function requireEnrolled(userId, courseId) {
  const res = await db.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1", // ★ 콘솔에서 확인한 실제 GSI 이름
      KeyConditionExpression: "gsi1pk = :pk AND gsi1sk = :sk",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":sk": `COURSE#${courseId}`,
      },
      Limit: 1,
    })
  );

  if (!res.Items || res.Items.length === 0) {
    const err = new Error("Forbidden: not enrolled");
    err.statusCode = 403;
    throw err;
  }

  return res.Items[0];
}


async function buildAuthContext(requestContext) {
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

module.exports = {
  getClaims,
  getAuthContext,
  requireRole,
  requireEnrolled,
  buildAuthContext
};