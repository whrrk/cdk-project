// api/threads.js

const { createThread, listThreads, postMessage, listMessages } = require('../service/threadsService');
const { response } = require('../http');
const { buildAuthContext } = require('../auth');


exports.handler = async (event) => {
  const {
    httpMethod,
    resource,
    pathParameters = {},
    body,
    requestContext,
  } = event;

  const auth = buildAuthContext(requestContext);

  try {
    const parsedBody = body ? JSON.parse(body) : null;

    // --- Threads ---
    if (
      resource === "/courses/{courseId}/threads" &&
      httpMethod === "POST"
    ) {
      const { courseId } = pathParameters;
      const item = await createThread(auth, courseId, parsedBody || {});
      return response(201, item);
    }

    if (resource === "/courses/{courseId}/threads" && httpMethod === "GET") {
      const { courseId } = pathParameters;
      const items = await listThreads(auth, courseId);
      return response(200, items);
    }

    if (
      resource === "/threads/{threadId}/messages" &&
      httpMethod === "POST"
    ) {
      const { threadId } = pathParameters;
      const item = await postMessage(auth, threadId, parsedBody || {});
      return response(201, item);
    }

    if (
      resource === "/threads/{threadId}/messages" &&
      httpMethod === "GET"
    ) {
      const { threadId } = pathParameters;
      const items = await listMessages(auth, threadId);
      return response(200, items);
    }

    // threads Lambda で扱わないパス → 404
    return response(404, { message: "Not Found" });
  } catch (e) {
    console.error(e);
    const status = e.statusCode || 500;
    return response(status, { message: e.message ?? "Internal Server Error" });
  }
};
