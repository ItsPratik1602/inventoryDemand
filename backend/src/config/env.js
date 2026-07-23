import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: Number(process.env.PORT || 5000),
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",
  FRONTEND_URL:
    process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5173",
  SMTP_USER: process.env.SMTP_USER?.trim(),
  SMTP_PASS: process.env.SMTP_PASS?.replace(/\s+/g, ""),
  MAIL_FROM:
    process.env.MAIL_FROM ||
    `Inventory Demand System <${process.env.SMTP_USER || "no-reply@example.com"}>`
};

const requiredVars = ["DATABASE_URL", "JWT_SECRET", "SMTP_USER", "SMTP_PASS"];

for (const key of requiredVars) {
  if (!env[key]) {
    console.warn(`Missing environment variable: ${key}`);
  }
}
