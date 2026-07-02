export const weddingCustomer = (details) => {
  const { bride_name, groom_name, budget, additional_info, wedding_type, meeting_date, meeting_time } =
    details;
  const meetingLine =
    meeting_date && meeting_time
      ? `<li><strong>Meeting:</strong> ${meeting_date} ${meeting_time}</li>`
      : '';
  return `
    <!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <title>Your Journey with Eternus Begins</title>
  <style type="text/css">
    /* General Styles */
    body {
      margin: 0;
      padding: 0;
      background-color: #f2efe9;
      font-family: 'Times New Roman', serif;
      color: #3c3c3c;
    }
    table {
      border-spacing: 0;
    }
    td {
      padding: 0;
    }
    img {
      border: 0;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f2efe9;
      padding-bottom: 40px;
    }
    .main {
      background-color: #ffffff;
      margin: 0 auto;
      width: 100%;
      max-width: 700px;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }
    /* Header */
    .header {
      background-image: url('https://yourdomain.com/images/header-background.jpg');
      background-size: cover;
      background-position: center;
      text-align: center;
      padding: 60px 30px;
      color: #ffffff;
    }
    .header h1 {
      font-size: 42px;
      margin-bottom: 10px;
    }
    .header p {
      font-size: 20px;
      margin: 0;
    }
    /* Content */
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      font-size: 28px;
      color: #6d4c41;
      margin-bottom: 20px;
    }
    .content p {
      font-size: 16px;
      line-height: 1.8;
      margin-bottom: 20px;
    }
    .content ul {
      list-style-type: none;
      padding: 0;
    }
    .content ul li {
      font-size: 16px;
      margin-bottom: 10px;
    }
    .content ul li strong {
      color: #6d4c41;
    }
    /* CTA Button */
    .cta {
      text-align: center;
      margin: 40px 0;
    }
    .cta a {
      background-color: #6d4c41;
      color: #ffffff;
      padding: 15px 30px;
      text-decoration: none;
      font-size: 18px;
      border-radius: 5px;
      display: inline-block;
    }
    .cta a:hover {
      background-color: #5a392c;
    }
    /* Footer */
    .footer {
      background-color: #f2efe9;
      text-align: center;
      padding: 30px;
      font-size: 14px;
      color: #8d6e63;
    }
    .footer p {
      margin: 5px 0;
    }
    /* Media Queries */
    @media screen and (max-width: 700px) {
      .header h1 {
        font-size: 32px;
      }
      .content h2 {
        font-size: 24px;
      }
      .cta a {
        font-size: 16px;
        padding: 12px 25px;
      }
    }
  </style>
</head>
<body>
  <center class="wrapper">
    <table class="main" width="100%">
      <!-- Header -->
      <tr>
        <td class="header">
          <img src="https://yourdomain.com/images/eternus-logo.png" alt="Eternus Logo" width="150" style="margin-bottom: 20px;">
          <h1>Welcome to Eternus</h1>
          <p>Your Timeless Journey Awaits</p>
        </td>
      </tr>
      <!-- Content -->
      <tr>
        <td class="content">
          <h2>Dear ${bride_name} & ${groom_name},</h2>
          <p>
            Thank you for entrusting <strong>Eternus</strong> with the planning of your special day. We are delighted to accompany you on this remarkable journey towards a celebration that echoes the timelessness of your love.
          </p>
          <p>We have received the following details:</p>
          <ul>
            <li><strong>Bride:</strong> ${bride_name}</li>
            <li><strong>Groom:</strong> ${groom_name}</li>
            <li><strong>Budget:</strong> ${budget}</li>
            <li><strong>Wedding Type:</strong> ${wedding_type}</li>
            ${meetingLine}
            <li><strong>Additional Information:</strong> ${additional_info}</li>
          </ul>
          <p>
            Our team of seasoned professionals is dedicated to transforming your vision into an exquisite reality. We will be in touch shortly to discuss the next steps. In the meantime, feel free to explore our portfolio and discover how we weave magic into every moment.
          </p>
          <div class="cta">
            <a href="https://eternus.com/portfolio" target="_blank">Discover Our Creations</a>
          </div>
        </td>
      </tr>
      <!-- Footer -->
      <tr>
        <td class="footer">
          <p>&copy; ${new Date().getFullYear()} Eternus | All Rights Reserved</p>
          <p>1234 Wedding Lane, Suite 100, Your City, Country</p>
          <p>
            <a href="tel:+1234567890" style="color: #6d4c41; text-decoration: none;">+1 (234) 567-890</a> |
            <a href="mailto:contact@eternus.com" style="color: #6d4c41; text-decoration: none;">contact@eternus.com</a>
          </p>
          <p>
            <a href="https://facebook.com/eternus" target="_blank" style="margin: 0 5px;">
              <img src="https://yourdomain.com/images/facebook-icon.png" alt="Facebook" width="24">
            </a>
            <a href="https://instagram.com/eternus" target="_blank" style="margin: 0 5px;">
              <img src="https://yourdomain.com/images/instagram-icon.png" alt="Instagram" width="24">
            </a>
            <a href="https://pinterest.com/eternus" target="_blank" style="margin: 0 5px;">
              <img src="https://yourdomain.com/images/pinterest-icon.png" alt="Pinterest" width="24">
            </a>
          </p>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>

  `;
};
