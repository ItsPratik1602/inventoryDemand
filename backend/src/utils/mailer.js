import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { AppError } from "./app-error.js";

let transporter;

const ensureMailerConfig = () => {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    console.error("[email] SMTP credentials are missing");
    throw new AppError("SMTP is not configured for password reset emails", 500);
  }
};

export const getMailerTransport = () => {
  ensureMailerConfig();

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      }
    });
  }

  return transporter;
};

export const sendMail = async (message) => {
  const mailer = getMailerTransport();

  try {
    console.info(
      `[email] verifying Gmail transporter for ${message.to} using ${env.SMTP_USER}`
    );
    await mailer.verify();
    console.info("[email] Gmail SMTP connection verified");

    const info = await mailer.sendMail({
      from: env.MAIL_FROM,
      ...message
    });

    console.info(
      `[email] email sent to ${message.to} with message id ${info.messageId}`
    );

    return info;
  } catch (error) {
    console.error("[email] email send failed", error);
    throw new AppError("Email sending failed", 500);
  }
};
