export const weddingCustomer = (details, copy) => {
  const SITE_URL = (copy.siteUrl || 'https://eternus-landing.vercel.app').replace(/\/$/, '');
  const LOGO_URL = `${SITE_URL}/img/logo/logo-eternus-light.png`;

  const {
    bride_name,
    groom_name,
    budget,
    additional_info,
    wedding_type,
    meeting_display,
  } = details;

  const additionalText = additional_info?.trim() ? additional_info : copy.noneProvided;
  const showAdditional = Boolean(additional_info?.trim());

  const greeting = copy.greeting
    .replace('{bride_name}', bride_name)
    .replace('{groom_name}', groom_name);

  const year = new Date().getFullYear();
  const siteHost = SITE_URL.replace(/^https?:\/\//, '');

  const detailCell = (label, value) => `
    <td width="50%" valign="top" style="padding:0 8px 12px 0;font-family:Georgia,'Times New Roman',serif;">
      <p style="margin:0 0 4px;font-size:10px;line-height:1.4;letter-spacing:0.12em;text-transform:uppercase;color:#fdf9cf;font-family:Arial,Helvetica,sans-serif;">
        ${label}
      </p>
      <p style="margin:0;font-size:14px;line-height:1.45;color:#f5f2ea;font-family:Georgia,'Times New Roman',serif;">
        ${value}
      </p>
    </td>`;

  const additionalRow = showAdditional
    ? `<tr>
        <td colspan="2" style="padding:0 0 12px;font-family:Georgia,'Times New Roman',serif;">
          <p style="margin:0 0 4px;font-size:10px;line-height:1.4;letter-spacing:0.12em;text-transform:uppercase;color:#fdf9cf;font-family:Arial,Helvetica,sans-serif;">
            ${copy.labelAdditionalInfo}
          </p>
          <p style="margin:0;font-size:14px;line-height:1.45;color:#f5f2ea;font-family:Georgia,'Times New Roman',serif;">
            ${additionalText}
          </p>
        </td>
      </tr>`
    : '';

  const meetingBlock = meeting_display
    ? `<tr>
        <td colspan="2" style="padding:0 0 14px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding:12px 14px;background:rgba(253,249,207,0.06);border:1px solid rgba(253,249,207,0.16);border-left:3px solid #fdf9cf;border-radius:10px;">
                <p style="margin:0 0 4px;font-size:10px;line-height:1.4;letter-spacing:0.12em;text-transform:uppercase;color:#fdf9cf;font-family:Arial,Helvetica,sans-serif;">
                  ${copy.labelMeeting}
                </p>
                <p style="margin:0;font-size:14px;line-height:1.45;color:#ffffff;font-family:Georgia,'Times New Roman',serif;">
                  ${meeting_display}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="${copy.lang}" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${copy.title}</title>
</head>
<body style="margin:0;padding:0;background-color:#07090f;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${copy.headerTagline}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#07090f;">
    <tr>
      <td align="center" style="padding:20px 12px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
          <tr>
            <td style="background:linear-gradient(180deg,#121820 0%,#0d1118 100%);border:1px solid rgba(253,249,207,0.14);border-radius:16px;overflow:hidden;box-shadow:0 18px 48px rgba(0,0,0,0.42);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:24px 28px 16px;text-align:center;border-bottom:1px solid rgba(253,249,207,0.08);">
                    <a href="${SITE_URL}/" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
                      <img src="${LOGO_URL}" alt="Eternus" width="132" height="135" style="display:block;margin:0 auto 14px;border:0;outline:none;text-decoration:none;">
                    </a>
                    <p style="margin:0 0 10px;font-size:11px;line-height:1.3;letter-spacing:0.2em;text-transform:uppercase;color:#bdb8ae;font-family:Arial,Helvetica,sans-serif;">
                      (&emsp;${copy.eyebrow}&emsp;)
                    </p>
                    <h1 style="margin:0;font-size:22px;line-height:1.3;font-weight:400;color:#ffffff;font-family:Georgia,'Times New Roman',serif;">
                      ${greeting}
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 28px 0;">
                    <p style="margin:0 0 14px;font-size:14px;line-height:1.65;color:#dbd7d7;font-family:Georgia,'Times New Roman',serif;">
                      ${copy.intro}
                    </p>
                    <p style="margin:0 0 10px;font-size:10px;line-height:1.4;letter-spacing:0.12em;text-transform:uppercase;color:#fdf9cf;font-family:Arial,Helvetica,sans-serif;">
                      ${copy.receivedDetails}
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        ${detailCell(copy.labelBride, bride_name)}
                        ${detailCell(copy.labelGroom, groom_name)}
                      </tr>
                      <tr>
                        ${detailCell(copy.labelBudget, budget)}
                        ${detailCell(copy.labelWeddingType, wedding_type)}
                      </tr>
                      ${meetingBlock}
                      ${additionalRow}
                    </table>
                    <p style="margin:12px 0 0;font-size:13px;line-height:1.6;color:#9a958c;font-family:Georgia,'Times New Roman',serif;">
                      ${copy.closing}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:18px 28px 20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="border:1px solid rgba(253,249,207,0.45);border-radius:999px;">
                          <a href="${SITE_URL}/" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:11px 24px;font-size:11px;line-height:1;letter-spacing:0.16em;text-transform:uppercase;text-decoration:none;color:#fdf9cf;font-family:Arial,Helvetica,sans-serif;">
                            ${copy.cta}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 28px 18px;text-align:center;border-top:1px solid rgba(253,249,207,0.06);">
                    <p style="margin:14px 0 0;font-size:11px;line-height:1.5;color:#7a756c;font-family:Arial,Helvetica,sans-serif;">
                      &copy; ${year} Eternus &middot; ${copy.footerRights}
                      &nbsp;&middot;&nbsp;
                      <a href="${SITE_URL}/" target="_blank" rel="noopener noreferrer" style="color:#fdf9cf;text-decoration:none;">${siteHost}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
