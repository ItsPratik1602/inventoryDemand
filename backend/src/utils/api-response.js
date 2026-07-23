export const sendResponse = (res, statusCode, message, data) => {
  const payload = {
    success: statusCode < 400,
    message
  };

  if (data !== undefined) {
    payload.data = data;
  }

  return res.status(statusCode).json(payload);
};
