// api/courses.js
const { listCourses, createCourse, enrollCourse, listCourseMembers } = require('../service/coursesService');
const { buildAuthContext } = require('../auth');
const { response } = require('../http');

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

    // --- Courses ---
    if (resource === "/courses" && httpMethod === "GET") {
      const items = await listCourses();
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

    // courses Lambda で扱わないパス → 404
    return response(404, { message: "Not Found" });
  } catch (e) {
    console.error(e);
    const status = e.statusCode || 500;
    return response(status, { message: e.message ?? "Internal Server Error" });
  }
};



