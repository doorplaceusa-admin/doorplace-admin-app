import { sendEmail } from "./sendEmail";

type BulkEmailArgs = {
  recipients: string[];
  subject: string;
  html: string;
  delayMs?: number;
};

export async function sendBulkEmail({
  recipients,
  subject,
  html,
  delayMs = 2000,
}: BulkEmailArgs) {
  const results = [];

  for (const email of recipients) {
    try {
      await sendEmail({ to: email, subject, html });
      results.push({ email, status: "sent" });
    } catch (err) {
      results.push({ email, status: "failed" });
    }

    await new Promise((r) => setTimeout(r, delayMs));
  }

  return results;
}
