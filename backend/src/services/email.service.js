import { env } from "../config/env.js";
import { sendMail } from "../utils/mailer.js";

const buildResetPasswordTemplate = ({ name, resetUrl }) => ({
  subject: "Password Reset Request",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
      <h2 style="margin-bottom: 12px;">Password Reset Request</h2>
      <p>Hello ${name},</p>
      <p>We received a request to reset your Inventory Demand System password.</p>
      <p style="margin: 28px 0;">
        <a href="${resetUrl}" style="background: #0f766e; color: #ffffff; text-decoration: none; padding: 12px 22px; border-radius: 8px; display: inline-block;">
          Reset Password
        </a>
      </p>
      <p>This link expires in 15 minutes.</p>
      <p>If you did not request a password reset, you can safely ignore this email.</p>
    </div>
  `
});

export const sendResetPasswordEmail = async ({ to, name, token }) => {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
  const template = buildResetPasswordTemplate({ name, resetUrl });

  return sendMail({
    to,
    subject: template.subject,
    html: template.html
  });
};
