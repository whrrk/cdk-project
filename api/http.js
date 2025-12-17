const corsHeaders = {
  "Access-Control-Allow-Origin": "https://dix3mtf4a9qw2.cloudfront.net",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};

function ok(body, statusCode = 200) {
  return {
    statusCode,
    headers: corsHeaders,
    body: body === "" ? "" : JSON.stringify(body ?? {}),
  };
}

function fail(message, statusCode = 500) {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify({ message: message ?? "Internal error" }),
  };
}

module.exports = { corsHeaders, ok, fail };
