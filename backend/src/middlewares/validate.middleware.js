export const validate = (schema) => (req, _res, next) => {
  req.validatedBody = schema.parse(req.body);
  next();
};
