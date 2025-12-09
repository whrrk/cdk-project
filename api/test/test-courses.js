// api/test/test-courses.js
const { handler } = require('../handler/courses');
const createEvent = require('./createEvent');

// GET /courses
async function testListCourses() {
    const event = createEvent({
        method: "GET",
        resource: "/courses",
    });

    const res = await handler(event);
    console.log("=== [GET] /courses ===");
    console.log(JSON.stringify(res, null, 2));
}

// POST /courses
async function testCreateCourse() {
    const event = createEvent({
        method: "POST",
        resource: "/courses",
        body: {
            title: "CDK 完全破壊",
            description: "Udemy スタイル",
        },
    });

    const res = await handler(event);
    console.log("=== [POST] /courses ===");
    console.log(JSON.stringify(res, null, 2));
}

// POST /courses/{courseId}/enroll
async function testEnrollCourse() {
    const event = createEvent({
        method: "POST",
        resource: "/courses/{courseId}/enroll",
        pathParameters: {
            courseId: "course_1765287386502_28104",
        },
        body: {
            // 필요하면 enrollment payload
        },
    });

    const res = await handler(event);
    console.log("=== [POST] /courses/{courseId}/enroll ===");
    console.log(JSON.stringify(res, null, 2));
}

// ---- Entry point ----
// node test/test-courses.js list
// node test/test-courses.js create
// node test/test-courses.js enroll
async function main() {
    const mode = process.argv[2] || "list";

    if (mode === "list") {
        await testListCourses();
    } else if (mode === "create") {
        await testCreateCourse();
    } else if (mode === "enroll") {
        await testEnrollCourse();
    } else {
        console.error("Unknown mode:", mode);
        console.error("例: node test/test-courses.js [list|create|enroll]");
        process.exit(1);
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
