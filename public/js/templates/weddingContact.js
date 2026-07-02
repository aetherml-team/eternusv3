export const weddingContact = (details) => {
    const { bride_name, groom_name, budget, email, additional_info, wedding_type, meeting_date, meeting_time } = details
    const meetingDisplay = meeting_date && meeting_time ? `${meeting_date} ${meeting_time}` : 'N/A'
    return `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>New Wedding Planner Form Submission</title>
  <style type="text/css">
    /* General Styles */
    body {
      font-family: 'Arial', sans-serif;
      background-color: #f2f2f2;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    .email-container {
      max-width: 650px;
      margin: 0 auto;
      background-color: #ffffff;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }
    /* Header */
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 28px;
      color: #6d4c41;
    }
    .header p {
      font-size: 16px;
      color: #8d6e63;
    }
    /* Content */
    .content {
      margin-bottom: 30px;
    }
    .content p {
      font-size: 16px;
      line-height: 1.6;
      margin: 10px 0;
    }
    .content strong {
      color: #6d4c41;
    }
    /* Details Table */
    .details-table {
      width: 100%;
      border-collapse: collapse;
    }
    .details-table th, .details-table td {
      text-align: left;
      padding: 12px;
      border-bottom: 1px solid #ddd;
    }
    .details-table th {
      background-color: #f9f9f9;
      color: #6d4c41;
      font-weight: normal;
    }
    /* Footer */
    .footer {
      text-align: center;
      font-size: 12px;
      color: #999;
      margin-top: 20px;
    }
    .footer p {
      margin: 5px 0;
    }
    /* Media Queries */
    @media screen and (max-width: 650px) {
      .email-container {
        padding: 20px;
      }
      .header h1 {
        font-size: 24px;
      }
      .content p {
        font-size: 14px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <h1>New Wedding Planner Form Submission</h1>
      <p>A new client has submitted their wedding details.</p>
    </div>
    <!-- Content -->
    <div class="content">
      <p><strong>Submitted by:</strong> ${bride_name} & ${groom_name}</p>
      <table class="details-table">
        <tr>
          <th>Bride Name</th>
          <td>${bride_name}</td>
        </tr>
        <tr>
          <th>Groom Name</th>
          <td>${groom_name}</td>
        </tr>
        <tr>
          <th>Email</th>
          <td>${email}</td>
        </tr>
        <tr>
          <th>Budget</th>
          <td>${budget}</td>
        </tr>
        <tr>
          <th>Wedding Type</th>
          <td>${wedding_type}</td>
        </tr>
        <tr>
          <th>Meeting</th>
          <td>${meetingDisplay}</td>
        </tr>
        <tr>
          <th>Additional Info</th>
          <td>${additional_info}</td>
        </tr>
      </table>
    </div>
    <!-- Footer -->
    <div class="footer">
      <p>This is an automated notification from your website's contact form.</p>
      <p>Please reach out to the client promptly.</p>
    </div>
  </div>
</body>
</html>

    `
}