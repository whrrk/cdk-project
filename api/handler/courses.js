// api/courses.js
const { listCourses, createCourse, enrollCourse, listCourseMembers } = require('../service/coursesService');
const { buildAuthContext } = require('../auth');
const { ok, fail, corsHeaders } = require('../http');

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

    // --- Courses ---
    if (resource === "/courses" && httpMethod === "GET") {
      const items = await listCourses();
      return ok(items);
    }

    if (resource === "/courses" && httpMethod === "POST") {
      const item = await createCourse(auth, parsedBody || {});
      return ok(item);
    }

    if (resource === "/courses/{courseId}/enroll" && httpMethod === "POST") {
      const { courseId } = pathParameters;
      const item = await enrollCourse(auth, courseId, parsedBody || {});
      return ok(item);
    }

    if (resource === "/courses/{courseId}/members" && httpMethod === "GET") {
      const { courseId } = pathParameters;
      const items = await listCourseMembers(auth, courseId);
      return ok(items);
    }

    // courses Lambda で扱わないパス → 404
    return fail("Not Found", 404);
  } catch (e) {
    console.error(e);
    const status = e.statusCode || 500;
    return fail(e.message, status);
  }
};



