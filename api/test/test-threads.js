// api/test/test-threads.js
const { handler } = require('../handler/threads');
const createEvent = require('./createEvent');

async function testListThreads() {
    const event = createEvent({
        method: "GET",
        resource: "/courses/{courseId}/threads",
        pathParameters: { courseId: "course_1765289285408_64538" },
    });
    const res = await handler(event);
    console.log("=== [GET] /courses/{courseId}/threads ===");
    console.log(JSON.stringify(res, null, 2));
}

async function testCreateThread() {
    const event = createEvent({
        method: "POST",
        resource: "/courses/{courseId}/threads",
        pathParameters: { courseId: "course_1765289285408_64538" },
        body: {
            title: "질문 있습니다",
            body: "이 강의에서 ~ 부분이 이해가 안 됩니다.",
        },
    });
    const res = await handler(event);
    console.log("=== [POST] /courses/{courseId}/threads ===");
    console.log(JSON.stringify(res, null, 2));
}

async function main() {
    const mode = process.argv[2] || "list";

    if (mode === "list") {
        await testListThreads();
    } else if (mode === "create") {
        await testCreateThread();
    } else {
        console.error("사용 예: node test/test-threads.js [list|create]");
    }
}

main().catch(console.error);