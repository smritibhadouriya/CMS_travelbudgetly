export const parseBody = (req) => {
  try {
    return req.body?.data ? JSON.parse(req.body.data) : (req.body || {});
  } catch {
    return req.body || {};
  }
};
