import { env } from "./env";

// Transactional email.
//
// Resend is used through its REST API rather than its SDK — one fetch call,
// one less dependency in the serverless bundle. Swapping provider means
// changing `deliver` only.
//
// When email is not configured the app still works: the link is written to the
// server log so local development and a misconfigured deployment both remain
// usable, and the caller is told delivery did not happen so it can say so
// honestly rather than claiming an email is on its way.

export const mailConfigured = Boolean(env.resendApiKey && env.mailFrom);

export type MailResult = { delivered: boolean; reason?: string };

type Message = { to: string; subject: string; html: string; text: string };

async function deliver(message: Message): Promise<MailResult> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.mailFrom,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return { delivered: false, reason: `provider responded ${res.status}: ${detail.slice(0, 200)}` };
  }
  return { delivered: true };
}

export async function sendMail(message: Message): Promise<MailResult> {
  if (!mailConfigured) {
    console.error(
      `[budgetlock] email is not configured (RESEND_API_KEY / MAIL_FROM) — ` +
        `"${message.subject}" for ${message.to} was not sent.\n${message.text}`
    );
    return { delivered: false, reason: "not_configured" };
  }

  try {
    return await deliver(message);
  } catch (e) {
    console.error("[budgetlock] email delivery failed", e);
    return { delivered: false, reason: (e as Error)?.message ?? "unknown error" };
  }
}

// ── Templates ────────────────────────────────────────────────────────────────
// Deliberately plain: a table-free, single-column layout with inline styles and
// a visible fallback URL, which is what survives the widest range of mail
// clients. The button is a padded anchor because many clients drop background
// images and CSS classes.

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function shell(heading: string, body: string, cta: { label: string; url: string }, footer: string) {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f4f6;">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1a1f;">
    <div style="font-size:19px;font-weight:700;letter-spacing:-0.3px;color:#0f7a52;">BudgetLock</div>
    <h1 style="font-size:22px;font-weight:700;margin:26px 0 12px;letter-spacing:-0.4px;">${escapeHtml(heading)}</h1>
    <p style="font-size:15px;line-height:1.6;color:#44444d;margin:0 0 24px;">${body}</p>
    <a href="${escapeHtml(cta.url)}" style="display:inline-block;background:#0f7a52;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 26px;border-radius:10px;">${escapeHtml(cta.label)}</a>
    <p style="font-size:13px;line-height:1.6;color:#71717c;margin:26px 0 0;">
      If the button doesn't work, paste this into your browser:<br>
      <span style="color:#44444d;word-break:break-all;">${escapeHtml(cta.url)}</span>
    </p>
    <hr style="border:none;border-top:1px solid #e2e2e8;margin:28px 0 16px;">
    <p style="font-size:12.5px;line-height:1.6;color:#8b8b96;margin:0;">${footer}</p>
  </div>
</body></html>`;
}

export function passwordResetEmail(url: string, expiresInMinutes: number): Omit<Message, "to"> {
  const text = [
    "Reset your BudgetLock password",
    "",
    `Open this link to choose a new password. It expires in ${expiresInMinutes} minutes and can only be used once:`,
    url,
    "",
    "If you didn't ask for this, you can ignore this email — your password will not change.",
  ].join("\n");

  return {
    subject: "Reset your BudgetLock password",
    text,
    html: shell(
      "Reset your password",
      `Choose a new password for your BudgetLock account. This link expires in <strong>${expiresInMinutes} minutes</strong> and can only be used once.`,
      { label: "Choose a new password", url },
      "If you didn't ask for this, you can ignore this email — your password will not change. Signing in again everywhere will be required after a reset."
    ),
  };
}

export function verifyEmail(url: string): Omit<Message, "to"> {
  const text = [
    "Confirm your email for BudgetLock",
    "",
    "Open this link to confirm your address:",
    url,
    "",
    "Confirming means we can get you back into your account if you forget your password.",
  ].join("\n");

  return {
    subject: "Confirm your email for BudgetLock",
    text,
    html: shell(
      "Confirm your email",
      "Confirming your address is what lets us get you back into your account if you ever forget your password.",
      { label: "Confirm my email", url },
      "If you didn't create a BudgetLock account, you can ignore this email."
    ),
  };
}
