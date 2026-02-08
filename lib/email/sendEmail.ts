import { transporter } from "./transporter";

type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;

  // ✅ NEW
  from?: "partners" | "support" | "info";
};

const FROM_ADDRESSES = {
  partners: `"Doorplace USA Partners" <partners@doorplaceusa.com>`,
  support: `"Doorplace USA Support" <support@doorplaceusa.com>`,
  info: `"Doorplace USA" <info@doorplaceusa.com>`,
};

export async function sendEmail({
  to,
  subject,
  html,
  from = "support", // ✅ default sender
}: SendEmailArgs) {
  return transporter.sendMail({
    from: FROM_ADDRESSES[from],
    to,
    subject,
    html,
  });
}
