// api/threads.js
const { docClient, PutCommand, QueryCommand } = require("./db");

const TABLE_NAME = process.env.TABLE_NAME;

function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

// POST /courses/{courseId}/threads
// input: { title, createdBy }
async function createThread(authUserId, courseId, input) {
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
async function listThreads(authUserId, courseId) {
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
async function postMessage(authUserId, threadId, input) {
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
async function listMessages(authUserId, threadId) {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
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
  createThread,
  listThreads,
  postMessage,
  listMessages,
};
