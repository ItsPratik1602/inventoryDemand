import { Router } from "express";
import {
  changePasswordController,
  forgotPassword,
  login,
  me,
  register,
  resetPasswordController,
  updateProfileController
} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema
} from "../utils/validators.js";

const authRequestLogger = (req, _res, next) => {
  console.info(`[auth] ${req.method} ${req.originalUrl} from ${req.ip}`);
  next();
};

export default function authRoutes({
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter
}) {
  const router = Router();

  router.use(authRequestLogger);

  router.post("/register", registerLimiter, validate(registerSchema), register);
  router.post("/login", loginLimiter, validate(loginSchema), login);
  router.post(
    "/forgot-password",
    forgotPasswordLimiter,
    validate(forgotPasswordSchema),
    forgotPassword
  );
  router.post(
    "/reset-password",
    resetPasswordLimiter,
    validate(resetPasswordSchema),
    resetPasswordController
  );
  router.get("/me", protect, me);
  router.patch("/profile", protect, validate(updateProfileSchema), updateProfileController);
  router.patch("/change-password", protect, changePasswordController);

  return router;
}
