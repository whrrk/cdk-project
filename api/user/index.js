/**
 * 
 * @returns 
 */
exports.handler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "User endpoint OK",time: new Date().toISOString() }),
  };
};
