import { sendEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  const body = await req.json();

  await sendEmail({
    to: "admin@doorplaceusa.com",
    subject: "New Partner Live Chat Message",
    html: `
      <p><strong>Partner ID:</strong> ${body.partner_id}</p>
      <p><strong>Type:</strong> ${body.message_type}</p>
      <p>${body.message}</p>
    `,
  });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
