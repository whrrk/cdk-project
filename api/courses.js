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
      FilterExpression: "begins_with(pk, :pk)",
      ExpressionAttributeValues: {
        ":pk": "COURSE#",
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

  return item;
}

// POST /courses/{courseId}/enroll
// input: { userId, role: "TEACHER" | "STUDENT" }
async function enrollCourse(authUserId, courseId, input) {
  const { userId, role } = input;

  if (!userId || !role) {
    throw new Error("userId と role は必須です");
  }

  const item = {
    pk: `USER#${userId}`,
    sk: `ENROLL#COURSE#${courseId}`,
    type: "ENROLLMENT",
    userId,
    courseId,
    role, // "TEACHER" | "STUDENT"
    createdAt: new Date().toISOString(),

    // GSI1: COURSE -> USERS
    gsi1pk: `COURSE#${courseId}`,
    gsi1sk: `ENROLL#USER#${userId}`,
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
      IndexName: "GSI1",
      KeyConditionExpression: "gsi1pk = :pk",
      ExpressionAttributeValues: {
        ":pk": `COURSE#${courseId}`,
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
