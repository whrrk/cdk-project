// This Lambda function serves as a health check endpoint for the API.
// It returns a simple JSON response with a status message and the current time.
// This is useful for monitoring the health of the API and ensuring it is operational.;
/**
 *
 * @param {*} event 
 * @returns 
 */
exports.handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "OK", time: new Date().toISOString() }),
  };
};