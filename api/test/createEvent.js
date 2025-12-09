// api/test/createEvent.js
module.exports = function createEvent({
    method = "GET",
    resource = "/",
    pathParameters = {},
    body = null,
    claims = {},
} = {}) {
    return {
        httpMethod: method,
        resource,
        pathParameters,
        body: body ? JSON.stringify(body) : null,
        requestContext: {
            authorizer: {
                claims: {
                    sub: "local-user",
                    email: "local@example.com",
                    "cognito:groups": ["TEACHER"],
                    ...claims,
                },
            },
        },
    };
};
