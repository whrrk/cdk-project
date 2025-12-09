require('dotenv').config();
const { docClient, PutCommand, QueryCommand } = require("../db");
const TABLE_NAME = process.env.TABLE_NAME;

function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

async function getThreadById(threadId) {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND sk = :sk",
      ExpressionAttributeValues: {
        ":pk": `THREAD#${threadId}`,
        ":sk": "META", // スレッド情報として "META" を置いたと仮定
      },
    })
  );

  return result.Items?.[0] ?? null;
}

// ユーザーがそのコースに属しているか確認
async function ensureUserEnrolled(userId, courseId) {
  const res = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "#pk = :pk AND #sk = :sk",
      ExpressionAttributeNames: {
        "#pk": "pk",
        "#sk": "sk",
      },
      ExpressionAttributeValues: {
        ":pk": `ENROLL#COURSE#${courseId}`,
        ":sk": `USER#${userId}`,
      },
    })
  );

  if (!res.Items || res.Items.length === 0) {
    const err = new Error("Forbidden: not enrolled");
    err.statusCode = 403;
    throw err;
  }
}

// POST /courses/{courseId}/threads
// input: { title, createdBy }
async function createThread(auth, courseId, input) {
  if (auth.groups === "STUDENT") {
    console.log("Checking enrollment for user:", auth.userId, "in course:", courseId);
    await ensureUserEnrolled(auth.userId, courseId);
  }

  const threadId = input.threadId || generateId("thread");

  const item = {
    pk: `THREAD#${threadId}`,
    sk: "META",
    type: "THREAD",
    threadId,
    courseId,
    title: input.title ?? "",
    createdBy: input.createdBy ?? null,
    createdAt: new Date().toISOString(),

    // GSI2: COURSE -> THREADS
    gsi2pk: `COURSE#${courseId}`,
    gsi2sk: `THREAD#${threadId}`,
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );

  return item;
}

// GET /courses/{courseId}/threads
async function listThreads(auth, courseId) {
  if (auth.groups.includes("STUDENT")) {
    await ensureUserEnrolled(auth.userId, courseId);
  }

  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI2",
      KeyConditionExpression: "#gpk = :gpk",
      ExpressionAttributeNames: {
        "#gpk": "gsi2pk",
      },
      ExpressionAttributeValues: {
        ":gpk": `COURSE#${courseId}`,
      },
    })
  );

  return result.Items ?? [];
}

// POST /threads/{threadId}/messages
// input: { senderId, body }
async function postMessage(auth, threadId, input) {
  const thread = await getThreadById(threadId);
  if (!thread) {
    throw new Error("Thread not found");
  }

  if (auth.groups.includes("STUDENT")) {
    await ensureUserEnrolled(auth.userId, thread.courseId);
  }
  const timestamp = Date.now();
  const sk = `MSG#${timestamp}`;

  const item = {
    pk: `THREAD#${threadId}`,
    sk,
    type: "MESSAGE",
    threadId,
    senderId: input.senderId ?? null,
    body: input.body ?? "",
    createdAt: new Date(timestamp).toISOString(),
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );

  return item;
}

// GET /threads/{threadId}/messages
async function listMessages(auth, threadId) {
  const thread = await getThreadById(threadId);
  if (!thread) {
    throw new Error("Thread not found");
  }

  if (auth.groups.includes("STUDENT")) {
    await ensureUserEnrolled(auth.userId, thread.courseId);
  }

  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :sk)",
      ExpressionAttributeNames: {
        "#pk": "pk",
        "#sk": "sk",
      },
      ExpressionAttributeValues: {
        ":pk": `THREAD#${threadId}`,
        ":sk": "MSG#",
      },
    })
  );

  return result.Items ?? [];
}

module.exports = {
  ensureUserEnrolled,
  getThreadById,
  createThread,
  listThreads,
  postMessage,
  listMessages,
};