import { ZodError } from "zod";
import pkg from "@prisma/client";
const { Prisma } = pkg;

export const globalErrorHandler = (err, _req, res, _next) => {
  console.error(err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: err.errors[0]?.message || "Validation failed",
      errors: err.errors.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }))
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return sendResponse(res, 409, "A record with this value already exists");
    }
  }

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : "Something went wrong";

  return res.status(statusCode).json({
    success: false,
    message,
    errors: []
  });
};
