import { transporter } from "./transporter";

type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailArgs) {
  return transporter.sendMail({
    from: `"Doorplace USA" <partners@doorplaceusa.com>`,
    to,
    subject,
    html,
  });
}
