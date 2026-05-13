/**
 * Email service — sends transactional emails via SMTP (Gmail, Outlook, etc.)
 * Used for license key delivery after WooCommerce order is paid.
 */
import nodemailer from "nodemailer";
import { ENV } from "./env";

function getTransporter() {
  return nodemailer.createTransport({
    host: ENV.smtpHost,
    port: ENV.smtpPort,
    secure: ENV.smtpPort === 465,
    auth: {
      user: ENV.smtpUser,
      pass: ENV.smtpPass,
    },
  });
}

export async function sendLicenseEmail({
  to,
  customerName,
  licenseKey,
  orderNumber,
}: {
  to: string;
  customerName: string;
  licenseKey: string;
  orderNumber: string | number;
}): Promise<boolean> {
  if (!ENV.smtpUser || !ENV.smtpPass) {
    console.warn("[Email] SMTP not configured — skipping license email");
    return false;
  }

  const firstName = customerName.split(" ")[0] || customerName;

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>كود تفعيل Prime Fit</title>
</head>
<body style="margin:0;padding:0;background:#0D1B2A;font-family:'Cairo',Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D1B2A;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111827;border-radius:20px;overflow:hidden;border:1px solid #1F2937;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1B2E5E,#0D1B2A);padding:32px;text-align:center;">
              <h1 style="margin:0;font-size:28px;font-weight:900;color:#F9FAFB;">
                <span style="color:#00E5FF;">Prime</span> Fit
              </h1>
              <p style="margin:8px 0 0;color:#9CA3AF;font-size:14px;">طلبك رقم #${orderNumber}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="color:#F9FAFB;font-size:16px;margin:0 0 8px;">مرحباً ${firstName}! 👋</p>
              <p style="color:#9CA3AF;font-size:14px;line-height:1.7;margin:0 0 24px;">
                شكراً لاشتراكك في <strong style="color:#00E5FF;">Prime Fit</strong>. طلبك تم استلامه بنجاح وكود التفعيل الخاص بك جاهز أدناه.
              </p>

              <!-- License Key Box -->
              <div style="background:#1B2E5E;border:2px dashed #00E5FF;border-radius:16px;padding:24px;text-align:center;margin:0 0 24px;">
                <p style="color:#9CA3AF;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">كود التفعيل</p>
                <div style="background:#0D1B2A;border-radius:10px;padding:14px 20px;display:inline-block;min-width:260px;">
                  <span style="color:#00E5FF;font-size:22px;font-weight:900;letter-spacing:3px;font-family:monospace;">
                    ${licenseKey}
                  </span>
                </div>
                <p style="color:#9CA3AF;font-size:11px;margin:12px 0 0;">انسخ الكود وأدخله في التطبيق</p>
              </div>

              <!-- Steps -->
              <p style="color:#F9FAFB;font-size:14px;font-weight:700;margin:0 0 12px;">كيف تفعّل اشتراكك؟</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${[
                  ["1", "افتح تطبيق Prime Fit"],
                  ["2", "أدخل كود التفعيل في الحقل المخصص"],
                  ["3", "اضغط على زر \"تفعيل\" واستمتع!"],
                ].map(([n, step]) => `
                <tr>
                  <td style="padding:6px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:28px;height:28px;background:#00E5FF;border-radius:50%;text-align:center;vertical-align:middle;">
                          <span style="color:#0D1B2A;font-weight:900;font-size:13px;">${n}</span>
                        </td>
                        <td style="padding-right:10px;color:#9CA3AF;font-size:13px;">${step}</td>
                      </tr>
                    </table>
                  </td>
                </tr>`).join("")}
              </table>

              <!-- CTA -->
              <div style="text-align:center;margin:28px 0 0;">
                <a href="https://primefit.app" style="background:linear-gradient(135deg,#00E5FF,#00B8CC);color:#0D1B2A;text-decoration:none;font-weight:900;font-size:15px;padding:14px 36px;border-radius:12px;display:inline-block;">
                  افتح التطبيق الآن 💪
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0D1B2A;padding:20px;text-align:center;border-top:1px solid #1F2937;">
              <p style="color:#4B5563;font-size:11px;margin:0;">
                هذا البريد أُرسل تلقائياً عند اكتمال طلبك. لا ترد على هذا البريد.
              </p>
              <p style="color:#4B5563;font-size:11px;margin:6px 0 0;">
                للمساعدة: WhatsApp 65068000
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  // Plain text fallback
  const text = `
مرحباً ${firstName}،

شكراً لاشتراكك في Prime Fit!

كود التفعيل الخاص بك: ${licenseKey}

لتفعيل الاشتراك:
1. افتح تطبيق Prime Fit
2. أدخل كود التفعيل
3. اضغط "تفعيل"

للمساعدة: WhatsApp 65068000
  `.trim();

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: ENV.smtpFrom,
      to,
      subject: `🏋️ كود تفعيل Prime Fit — طلب #${orderNumber}`,
      text,
      html,
    });
    console.log(`[Email] License key sent to ${to} (order #${orderNumber})`);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send license email:", err);
    return false;
  }
}

export async function sendBroadcastEmail({
  to,
  customerName,
  subject,
  body,
}: {
  to: string;
  customerName: string | null;
  subject: string;
  body: string;
}): Promise<boolean> {
  if (!ENV.smtpUser || !ENV.smtpPass) {
    console.warn("[Email] SMTP not configured — skipping broadcast email");
    return false;
  }

  const firstName = customerName ? customerName.split(" ")[0] : "عزيزي المشترك";

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0D1B2A;font-family:'Cairo',Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D1B2A;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111827;border-radius:20px;overflow:hidden;border:1px solid #1F2937;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1B2E5E,#0D1B2A);padding:28px;text-align:center;">
              <h1 style="margin:0;font-size:26px;font-weight:900;color:#F9FAFB;">
                <span style="color:#00E5FF;">Prime</span> Fit
              </h1>
              <p style="margin:6px 0 0;color:#9CA3AF;font-size:13px;">رسالة من فريق Prime Fit</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="color:#F9FAFB;font-size:16px;margin:0 0 16px;">مرحباً ${firstName}! 👋</p>
              <div style="color:#D1D5DB;font-size:14px;line-height:1.8;white-space:pre-wrap;">${body.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
              <div style="text-align:center;margin:28px 0 0;">
                <a href="https://primefit.manus.space" style="background:linear-gradient(135deg,#00E5FF,#00B8CC);color:#0D1B2A;text-decoration:none;font-weight:900;font-size:15px;padding:14px 36px;border-radius:12px;display:inline-block;">
                  افتح التطبيق 💪
                </a>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#0D1B2A;padding:20px;text-align:center;border-top:1px solid #1F2937;">
              <p style="color:#4B5563;font-size:11px;margin:0;">للمساعدة: WhatsApp 65068000</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: ENV.smtpFrom,
      to,
      subject,
      text: `مرحباً ${firstName},\n\n${body}\n\nفريق Prime Fit`,
      html,
    });
    return true;
  } catch (err) {
    console.error(`[Email] Broadcast failed to ${to}:`, err);
    return false;
  }
}
