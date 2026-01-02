const nodemailer = require("nodemailer");

/**
 * Send email using nodemailer
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML content
 */
const sendEmail = async (to, subject, html) => {
  try {
    // Amazon SES SMTP Configuration
    const transporter = nodemailer.createTransport({
      host: process.env.SES_SMTP_HOST,
      port: parseInt(process.env.SES_SMTP_PORT || "587"),
      secure: false, // Use TLS
      auth: {
        user: process.env.SES_SMTP_USERNAME,
        pass: process.env.SES_SMTP_PASSWORD,
      },
    });

    // Email options
    const mailOptions = {
      from: process.env.SES_FROM_EMAIL,
      to,
      subject,
      html,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent successfully:", info.messageId);

    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
};

module.exports = sendEmail;
