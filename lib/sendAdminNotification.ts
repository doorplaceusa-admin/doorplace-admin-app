import nodemailer from "nodemailer";

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

const transporter = nodemailer.createTransport({
  host: requireEnv("SMTP_HOST"),
  port: Number(requireEnv("SMTP_PORT")),
  secure: false,
  auth: {
    user: requireEnv("SMTP_USER"),
    pass: requireEnv("SMTP_PASS"),
  },
});

export async function sendAdminNotification(payload: {
  type: "lead" | "partner" | "order" | "system";
  title: string;
  details?: Record<string, any>;
}) {
  await transporter.sendMail({
    from: requireEnv("SMTP_FROM"),

    // ✅ SEND TO EMAIL + YOUR PHONE (TEXT)
    to: [
      requireEnv("ADMIN_ALERT_EMAIL"),
      "7134162714@sms.myboostmobile.com"
    ],

    subject: `🚨 TradePilot — ${payload.title}`,

    // ✅ THIS IS WHAT YOUR PHONE WILL READ
    text: `🚨 ${payload.title}

${payload.details?.name ?? ""}
${payload.details?.phone ?? ""}
${payload.details?.city ?? ""}, ${payload.details?.state ?? ""}`,

    // ✅ EMAIL VERSION (for inbox)
    html: `
      <h2>${payload.title}</h2>
      <pre>${JSON.stringify(payload.details, null, 2)}</pre>
    `,
  });
}