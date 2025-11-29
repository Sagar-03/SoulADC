const nodemailer = require("nodemailer");

/**
 * Send email using nodemailer
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML content
 */
const sendEmail = async (to, subject, html) => {
  try {
    // Create transporter based on environment variables
    let transporter;

    // Check if using Gmail
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD, // Use App Password for Gmail
        },
      });
    } 
    // Check if using custom SMTP
    else if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    }
    // Fallback to Ethereal (development only)
    else {
      console.warn("⚠️ No email configuration found. Using Ethereal test account.");
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    // Email options
    const mailOptions = {
      from: process.env.SES_FROM_EMAIL || process.env.EMAIL_USER || '"SoulADC" <noreply@souladc.com>',
      to,
      subject,
      html,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent successfully:", info.messageId);

    // If using Ethereal, log preview URL
    if (transporter.options.host === "smtp.ethereal.email") {
      console.log("📧 Preview URL:", nodemailer.getTestMessageUrl(info));
    }

    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
};

module.exports = sendEmail;
