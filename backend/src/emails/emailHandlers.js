import { transporter, sender } from "../lib/nodemailer.js";
import { createWelcomeEmailTemplate } from "../emails/emailTemplates.js";

export const sendWelcomeEmail = async (email, name, clientURL) => {
  const info = await transporter.sendMail({
    from: `"${sender.name}" <${sender.email}>`,
    to: email,
    subject: "Welcome to Buddy Chat!",
    html: createWelcomeEmailTemplate(name, clientURL),
  });

  console.log("Welcome email sent successfully. Message ID:", info.messageId);
};
