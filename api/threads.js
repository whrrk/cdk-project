// api/threads.js
const { docClient, PutCommand, QueryCommand } = require("./db");

const TABLE_NAME = process.env.TABLE_NAME;

function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

// POST /courses/{courseId}/threads
// input: { title, createdBy }
async function createThread(courseId, input) {
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
async function listThreads(courseId) {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI2",
      KeyConditionExpression: "gsi2pk = :pk",
      ExpressionAttributeValues: {
        ":pk": `COURSE#${courseId}`,
      },
    })
  );

  return result.Items ?? [];
}

// POST /threads/{threadId}/messages
// input: { senderId, body }
async function postMessage(threadId, input) {
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
async function listMessages(threadId) {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
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
