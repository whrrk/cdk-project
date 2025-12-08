// api/courses.js
const { getAuthContext, requireRole } = require("./auth");
const { docClient, PutCommand, QueryCommand, ScanCommand } = require("./db");

const TABLE_NAME = process.env.TABLE_NAME;

// 簡単なID生成（本番なら uuid 等を使う）
function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

// GET /courses
async function listCourses(auth) {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "begins_with(#pk, :coursePrefix) AND #sk = :meta",
      ExpressionAttributeNames: {
        "#pk": "pk",
        "#sk": "sk",
      },
      ExpressionAttributeValues: {
        ":coursePrefix": "COURSE#",
        ":meta": "META",
      },
    })
  );

  return result.Items ?? [];
}

// POST /courses
// input: { title, description?, teacherId? }
async function createCourse(auth, input) {
  const ctx = await getAuthContext(auth);
  console.log("Creating course with auth context:", ctx);
  requireRole(ctx, ["TEACHER"]);

  const courseId = input.courseId || generateId("course");

  const item = {
    pk: `COURSE#${courseId}`,
    sk: "META",
    type: "COURSE",
    courseId,
    title: input.title,
    description: input.description ?? "",
    teacherId: input.teacherId ?? null,
    createdAt: new Date().toISOString(),
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );

  return { courseId, ...item };
}

// POST /courses/{courseId}/enroll
// input: { userId, role: "STUDENT" }
async function enrollCourse(auth, courseId, input) {
  authUserId = auth.userId
  if (!authUserId || !input.role) {
    throw new Error("userId と role は必須です");
  }

  if(auth.role !== "STUDENT") {
    throw new Error("enroll は STUDENT のみサポートされています");
  }

  console.log("Enrolling user", authUserId, "to course", courseId, "as", auth.role);
  const item = {
    pk: `ENROLL#COURSE#${courseId}`,
    sk: `USER#${authUserId}`,
    type: "ENROLLMENT",
    authUserId,
    courseId,
    role: "student",
    createdAt: new Date().toISOString(),

    // GSI1: COURSE -> USERS
    gsi1pk: `USER#${authUserId}`, // USER→COURSE 一覧用
    gsi1sk: `COURSE#${courseId}`,
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );

  return item;
}

// GET /courses/{courseId}/members
async function listCourseMembers(auth, courseId) {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :userPrefix)",
      ExpressionAttributeNames: {
        "#pk": "pk",
        "#sk": "sk",
      },
      ExpressionAttributeValues: {
        ":pk": `COURSE#${courseId}`,
        ":userPrefix": "USER#",
      },
    })
  );

  return result.Items ?? [];
}

module.exports = {
  listCourses,
  createCourse,
  enrollCourse,
  listCourseMembers,
};
