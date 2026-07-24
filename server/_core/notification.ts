import { TRPCError } from "@trpc/server";
import nodemailer from "nodemailer";
import { ENV } from "./env";

export type NotificationPayload = {
  title: string;
  content: string;
};

const TITLE_MAX_LENGTH = 1200;
const CONTENT_MAX_LENGTH = 20000;

const trimValue = (value: string): string => value.trim();
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const validatePayload = (input: NotificationPayload): NotificationPayload => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Notification title is required." });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Notification content is required." });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.` });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.` });
  }
  return { title, content };
};

/**
 * Dispatches an operational alert to the app owner via SMTP (was the Manus
 * Notification Service). Best-effort: returns `true` on send, `false` if SMTP
 * isn't configured or the send fails, so callers can continue. Validation
 * errors still bubble up as TRPC errors.
 *
 * Recipient is OWNER_EMAIL if set, otherwise the SMTP account (SMTP_USER).
 */
export async function notifyOwner(payload: NotificationPayload): Promise<boolean> {
  const { title, content } = validatePayload(payload);

  const to = ENV.ownerEmail || ENV.smtpUser;
  if (!ENV.smtpUser || !ENV.smtpPass || !to) {
    console.warn("[Notification] SMTP not configured — owner alert skipped:", title);
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: ENV.smtpHost,
      port: ENV.smtpPort,
      secure: ENV.smtpPort === 465,
      auth: { user: ENV.smtpUser, pass: ENV.smtpPass },
    });
    await transporter.sendMail({
      from: ENV.smtpFrom,
      to,
      subject: `[Prime Fit] ${title}`,
      text: content,
    });
    return true;
  } catch (error) {
    console.warn("[Notification] Failed to email owner alert:", error);
    return false;
  }
}
