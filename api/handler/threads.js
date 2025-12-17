// api/threads.js

const { createThread, listThreads, postMessage, listMessages } = require('../service/threadsService');
const { ok, fail, corsHeaders } = require('../http');
const { buildAuthContext } = require('../auth');

exports.handler = async (event) => {
  const {
    httpMethod,
    resource,
    pathParameters = {},
    body,
    requestContext,
  } = event;

  const auth = await buildAuthContext(requestContext);

  try {
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 204, headers: corsHeaders, body: "" };
    }

    const parsedBody = body ? JSON.parse(body) : null;

    // --- Threads ---
    if (
      resource === "/courses/{courseId}/threads" &&
      httpMethod === "POST"
    ) {
      const { courseId } = pathParameters;
      const item = await createThread(auth, courseId, parsedBody || {});
      return ok(item);
    }

    if (resource === "/courses/{courseId}/threads" && httpMethod === "GET") {
      const { courseId } = pathParameters;
      const items = await listThreads(auth, courseId);
      return ok(items);
    }

    if (
      resource === "/threads/{threadId}/messages" &&
      httpMethod === "POST"
    ) {
      const { threadId } = pathParameters;
      const item = await postMessage(auth, threadId, parsedBody || {});
      return ok(item);
    }

    if (
      resource === "/threads/{threadId}/messages" &&
      httpMethod === "GET"
    ) {
      const { threadId } = pathParameters;
      const items = await listMessages(auth, threadId);
      return ok(items);
    }

    // threads Lambda で扱わないパス → 404
    return fail("Not Found", 404);
  } catch (e) {
    console.error(e);
    const status = e.statusCode || 500;
    return fail(e.message, status);
  }
};
