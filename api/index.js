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

function buildAuthContext(requestContext) {
  const authorizer = requestContext && requestContext.authorizer;
  const claims = authorizer && authorizer.claims;

  console.log("Auth claims:", claims);
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
    // body がある場合は一度だけ parse
    const parsedBody = body ? JSON.parse(body) : null;

    // --- Courses ---
    if (resource === "/courses" && httpMethod === "GET") {
      const items = await listCourses(auth);
      return response(200, items);
    }

    if (resource === "/courses" && httpMethod === "POST") {
      const item = await createCourse(auth, parsedBody || {});
      return response(201, item);
    }

    if (resource === "/courses/{courseId}/enroll" && httpMethod === "POST") {
      const { courseId } = pathParameters;
      const item = await enrollCourse(auth, courseId, parsedBody || {});
      return response(201, item);
    }

    if (resource === "/courses/{courseId}/members" && httpMethod === "GET") {
      const { courseId } = pathParameters;
      const items = await listCourseMembers(auth, courseId);
      return response(200, items);
    }

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

    return response(404, { message: "Not Found" });
  } catch (e) {
      console.error(e);
      const status = e.statusCode || 500;
      return response(status, { message: e.message ?? "Internal Server Error" });
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
