import {
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPassword
} from "../services/auth.service.js";
import { updateProfile } from "../services/user.service.js";
import { sendResponse } from "../utils/api-response.js";
import { catchAsync } from "../utils/catch-async.js";
import { logAuditAction } from "../middlewares/audit.middleware.js";

export const register = catchAsync(async (req, res) => {
  console.info(`[auth] register requested for ${req.validatedBody.email}`);
  const result = await registerUser(req.validatedBody);
  
  // Log registration
  await logAuditAction(result.user.id, "CREATE", "USER", result.user.id, {
    email: result.user.email,
    role: result.user.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  return sendResponse(res, 201, "User registered successfully", result);
});

export const login = catchAsync(async (req, res) => {
  console.info(`[auth] login requested for ${req.validatedBody.email}`);
  const result = await loginUser(req.validatedBody);
  
  // Log login
  await logAuditAction(result.user.id, "LOGIN", "USER", result.user.id, {
    email: result.user.email,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  return sendResponse(res, 200, "Login successful", result);
});

export const forgotPassword = catchAsync(async (req, res) => {
  console.info(`[auth] forgot password requested for ${req.validatedBody.email}`);
  await requestPasswordReset(req.validatedBody);
  console.info("[auth] forgot password response sent");
  return sendResponse(
    res,
    200,
    "If the email exists, a password reset link has been sent"
  );
});

export const resetPasswordController = catchAsync(async (req, res) => {
  console.info("[auth] reset password requested");
  await resetPassword(req.validatedBody);
  return sendResponse(res, 200, "Password reset successful");
});

export const changePasswordController = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return sendResponse(res, 400, "Current password and new password are required");
  }
  
  if (newPassword.length < 6) {
    return sendResponse(res, 400, "New password must be at least 6 characters long");
  }
  
  try {
    await updateProfile(req.user.id, { password: newPassword }, currentPassword);
    
    // Log password change
    await logAuditAction(req.user.id, "UPDATE", "USER", req.user.id, {
      action: "PASSWORD_CHANGE",
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    return sendResponse(res, 200, "Password changed successfully");
  } catch (error) {
    return sendResponse(res, 400, error.message || "Failed to change password");
  }
});

export const me = catchAsync(async (req, res) => {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    "Surrogate-Control": "no-store"
  });

  return sendResponse(res, 200, "Current user fetched", req.user);
});

export const updateProfileController = catchAsync(async (req, res) => {
  console.log("Profile update request:", {
    userId: req.user?.id,
    validatedBody: req.validatedBody
  });
  
  const data = await updateProfile(req.user.id, req.validatedBody);
  console.log("Profile update success:", data);
  
  return sendResponse(res, 200, "Profile updated successfully", data);
});
