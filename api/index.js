// api/index.js
const {
  listCourses,
  createCourse,
  enrollCourse,
  listCourseMembers,
} = require("./courses");

const {
  createThread,
  listThreads,
  postMessage,
  listMessages,
} = require("./threads");

exports.handler = async (event) => {
  const {
    httpMethod,
    resource,
    pathParameters = {},
    body,
    requestContext,
  } = event;

  const authorizer = requestContext && requestContext.authorizer;
  const claims = authorizer && authorizer.claims;

  const authUserId =
    (claims && (claims["cognito:username"] || claims.sub)) || "anonymous";

  console.log("authUserId:", authUserId);
  console.log("resource:", resource, "method:", httpMethod);

  try {
    // body がある場合は一度だけ parse
    const parsedBody = body ? JSON.parse(body) : null;

    // --- Courses ---
    if (resource === "/courses" && httpMethod === "GET") {
      const items = await listCourses(authUserId);
      return response(200, items);
    }

    if (resource === "/courses" && httpMethod === "POST") {
      const item = await createCourse(authUserId, parsedBody || {});
      return response(201, item);
    }

    if (resource === "/courses/{courseId}/enroll" && httpMethod === "POST") {
      const { courseId } = pathParameters;
      const item = await enrollCourse(authUserId, courseId, parsedBody || {});
      return response(201, item);
    }

    if (resource === "/courses/{courseId}/members" && httpMethod === "GET") {
      const { courseId } = pathParameters;
      const items = await listCourseMembers(authUserId, courseId);
      return response(200, items);
    }

    // --- Threads ---
    if (
      resource === "/courses/{courseId}/threads" &&
      httpMethod === "POST"
    ) {
      const { courseId } = pathParameters;
      const item = await createThread(authUserId, courseId, parsedBody || {});
      return response(201, item);
    }

    if (resource === "/courses/{courseId}/threads" && httpMethod === "GET") {
      const { courseId } = pathParameters;
      const items = await listThreads(authUserId, courseId);
      return response(200, items);
    }

    if (
      resource === "/threads/{threadId}/messages" &&
      httpMethod === "POST"
    ) {
      const { threadId } = pathParameters;
      const item = await postMessage(authUserId, threadId, parsedBody || {});
      return response(201, item);
    }

    if (
      resource === "/threads/{threadId}/messages" &&
      httpMethod === "GET"
    ) {
      const { threadId } = pathParameters;
      const items = await listMessages(authUserId, threadId);
      return response(200, items);
    }

    return response(404, { message: "Not Found" });
  } catch (e) {
    console.error(e);
    return response(500, { message: e.message ?? "Internal Server Error" });
  }
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
    },
    body: JSON.stringify(body),
  };
}
