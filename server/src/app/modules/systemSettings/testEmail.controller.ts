import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../global/response";
import { buildTransporter } from "../../utils/emailService";
import { sendErrorResponse } from "../../utils/errorResponse";

const testEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      smtpSecure,
      smtpFromName,
      smtpFromEmail,
    } = req.body;

    if (!smtpUser || !smtpPass) {
      return sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "SMTP username and password are required to send a test email."
      );
    }

    const creds = {
      host: smtpHost || "smtp.gmail.com",
      port: Number(smtpPort) || 587,
      user: smtpUser,
      pass: smtpPass,
      secure: Boolean(smtpSecure),
      fromName: smtpFromName || "PUPQuestC Support",
      fromEmail: smtpFromEmail || smtpUser,
    };

    const transporter = buildTransporter(creds);

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>PUPQuestC SMTP Test</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0f0f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f0f;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background-color:#1a1a1a;border-radius:16px;border:1px solid #2d1a0e;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#7f0000 0%,#9a0000 50%,#5c0000 100%);padding:32px 40px;text-align:center;">
              <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#d4a017;">
                Polytechnic University of the Philippines — QC
              </p>
              <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">PUPQuestC</h1>
              <p style="margin:6px 0 0 0;font-size:13px;color:rgba(255,255,255,0.75);">Lost &amp; Found Management System</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <h2 style="margin:0 0 8px 0;font-size:18px;font-weight:700;color:#e5c87a;">✅ SMTP Connection Successful</h2>
              <p style="margin:0 0 16px 0;font-size:14px;color:#9ca3af;line-height:1.6;">
                Your email configuration is working correctly. This test was sent from the PUPQuestC admin dashboard.
              </p>
              <div style="background:#0f1a0f;border:1px solid #22543d;border-radius:8px;padding:16px;margin-bottom:16px;">
                <p style="margin:0;font-size:13px;color:#68d391;line-height:1.7;">
                  <strong>Host:</strong> ${creds.host}<br/>
                  <strong>Port:</strong> ${creds.port}<br/>
                  <strong>Secure (SSL):</strong> ${creds.secure ? "Yes" : "No"}<br/>
                  <strong>From:</strong> "${creds.fromName}" &lt;${creds.fromEmail}&gt;
                </p>
              </div>
              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
                You can now save these settings and they will be used for all system emails.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#111111;border-top:1px solid #2d1a0e;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#4b5563;">
                © ${new Date().getFullYear()} PUPQuestC · Polytechnic University of the Philippines — Quezon City
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    await transporter.sendMail({
      from: `"${creds.fromName}" <${creds.fromEmail}>`,
      to: creds.user,
      subject: "PUPQuestC: SMTP Connection Test — Success",
      html,
    });

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: `Test email sent successfully to ${creds.user}.`,
      data: null,
    });
  } catch (error: any) {
    const message =
      error?.code === "EAUTH" ? "Authentication failed. Check your username and password (use an App Password for Gmail)." :
        error?.code === "ECONNREFUSED" ? `Connection refused. Check that ${req.body.smtpHost}:${req.body.smtpPort} is correct and reachable.` :
          error?.code === "ETIMEDOUT" ? "Connection timed out. The SMTP host may be unreachable or blocked by a firewall." :
            error?.responseCode === 535 ? "Invalid credentials (535). For Gmail, generate an App Password at myaccount.google.com/security." :
              error?.message || "Unknown SMTP error.";

    return sendErrorResponse(res, StatusCodes.BAD_GATEWAY, message);
  }
};

export const testEmailController = { testEmail };
