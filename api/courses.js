// api/courses.js
const { docClient, PutCommand, QueryCommand, ScanCommand } = require("./db");

const TABLE_NAME = process.env.TABLE_NAME;

// 簡単なID生成（本番なら uuid 等を使う）
function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

// GET /courses
async function listCourses(authUserId) {
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
async function createCourse(authUserId, input) {
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
// input: { userId, role: "TEACHER" | "STUDENT" }
async function enrollCourse(authUserId, courseId, input) {
  const { userId, role } = input;

  if (!userId || !role) {
    throw new Error("userId と role は必須です");
  }

  const item = {
    pk: `ENROLL#COURSE#${courseId}`,
    sk: `USER#${userId}`,
    type: "ENROLLMENT",
    userId,
    courseId,
    role: data.role || "student", // "TEACHER" | "STUDENT"
    createdAt: new Date().toISOString(),

    // GSI1: COURSE -> USERS
    gsi1pk: `USER#${userId}`, // USER→COURSE 一覧用
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
async function listCourseMembers(authUserId, courseId) {
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
