/**
 * Email templates for various purposes
 */

/**
 * Generate invoice/bill email template for course purchase
 * @param {Object} data - Invoice data
 * @param {string} data.userName - Name of the student
 * @param {string} data.userEmail - Email of the student
 * @param {string} data.itemTitle - Title of the course/mock
 * @param {string} data.itemType - Type: 'course' or 'mock'
 * @param {number} data.amount - Payment amount
 * @param {Date} data.purchaseDate - Date of purchase
 * @param {string} data.transactionId - Transaction/Session ID
 * @param {Date} data.expiryDate - Expiry date (for courses)
 */
const generateInvoiceEmail = (data) => {
  const {
    userName,
    userEmail,
    itemTitle,
    itemType,
    amount,
    purchaseDate,
    transactionId,
    expiryDate
  } = data;

  const formattedDate = new Date(purchaseDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedExpiryDate = expiryDate ? new Date(expiryDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : null;

  const itemTypeDisplay = itemType === 'course' ? 'Course' : 'Mock Exam';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Invoice - SoulADC LMS</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">SoulADC LMS</h1>
              <p style="color: #E0E7FF; margin: 5px 0 0 0; font-size: 14px;">Payment Invoice</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <!-- Greeting -->
              <h2 style="color: #1F2937; margin: 0 0 10px 0; font-size: 24px;">Hello ${userName}!</h2>
              <p style="color: #6B7280; margin: 0 0 30px 0; font-size: 16px; line-height: 1.5;">
                Thank you for your purchase. Your payment has been successfully processed and your ${itemTypeDisplay.toLowerCase()} access has been approved.
              </p>

              <!-- Invoice Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F9FAFB; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 25px;">
                    <h3 style="color: #4F46E5; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #E5E7EB; padding-bottom: 10px;">Invoice Details</h3>
                    
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="color: #6B7280; font-size: 14px; padding: 8px 0;">Invoice Number:</td>
                        <td style="color: #1F2937; font-size: 14px; font-weight: bold; text-align: right; padding: 8px 0;">#${transactionId.substring(0, 12).toUpperCase()}</td>
                      </tr>
                      <tr>
                        <td style="color: #6B7280; font-size: 14px; padding: 8px 0;">Date of Purchase:</td>
                        <td style="color: #1F2937; font-size: 14px; font-weight: bold; text-align: right; padding: 8px 0;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="color: #6B7280; font-size: 14px; padding: 8px 0;">Transaction ID:</td>
                        <td style="color: #1F2937; font-size: 14px; font-weight: bold; text-align: right; padding: 8px 0; word-break: break-all;">${transactionId}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Item Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F9FAFB; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 25px;">
                    <h3 style="color: #4F46E5; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #E5E7EB; padding-bottom: 10px;">${itemTypeDisplay} Information</h3>
                    
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="color: #6B7280; font-size: 14px; padding: 8px 0;">${itemTypeDisplay} Name:</td>
                        <td style="color: #1F2937; font-size: 14px; font-weight: bold; text-align: right; padding: 8px 0;">${itemTitle}</td>
                      </tr>
                      <tr>
                        <td style="color: #6B7280; font-size: 14px; padding: 8px 0;">Type:</td>
                        <td style="color: #1F2937; font-size: 14px; font-weight: bold; text-align: right; padding: 8px 0;">${itemTypeDisplay}</td>
                      </tr>
                      ${expiryDate ? `
                      <tr>
                        <td style="color: #6B7280; font-size: 14px; padding: 8px 0;">Valid Until:</td>
                        <td style="color: #1F2937; font-size: 14px; font-weight: bold; text-align: right; padding: 8px 0;">${formattedExpiryDate}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Amount Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 25px;">
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="color: #E0E7FF; font-size: 16px;">Amount Paid:</td>
                        <td style="color: #FFFFFF; font-size: 28px; font-weight: bold; text-align: right;">AUD $${amount.toFixed(2)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Customer Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F9FAFB; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 25px;">
                    <h3 style="color: #4F46E5; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #E5E7EB; padding-bottom: 10px;">Customer Information</h3>
                    
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="color: #6B7280; font-size: 14px; padding: 8px 0;">Name:</td>
                        <td style="color: #1F2937; font-size: 14px; font-weight: bold; text-align: right; padding: 8px 0;">${userName}</td>
                      </tr>
                      <tr>
                        <td style="color: #6B7280; font-size: 14px; padding: 8px 0;">Email:</td>
                        <td style="color: #1F2937; font-size: 14px; font-weight: bold; text-align: right; padding: 8px 0;">${userEmail}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Next Steps -->
              <div style="background-color: #EEF2FF; border-left: 4px solid #4F46E5; padding: 20px; border-radius: 4px; margin-bottom: 30px;">
                <h4 style="color: #4F46E5; margin: 0 0 10px 0; font-size: 16px;">What's Next?</h4>
                <p style="color: #4B5563; margin: 0; font-size: 14px; line-height: 1.6;">
                  ${itemType === 'course' 
                    ? 'You can now access all the course materials, videos, and resources. Log in to your account and start learning!'
                    : 'You can now attempt this mock exam. Log in to your account and test your knowledge!'
                  }
                </p>
              </div>

              <!-- Support -->
              <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 0;">
                If you have any questions about this invoice or need assistance, please don't hesitate to contact our support team.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="color: #6B7280; font-size: 12px; margin: 0 0 10px 0;">
                This is an automated email. Please do not reply to this message.
              </p>
              <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} SoulADC LMS. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

module.exports = {
  generateInvoiceEmail
};
