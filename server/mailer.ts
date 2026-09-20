import nodemailer from "nodemailer";

// Lazy-initialized nodemailer transporter
let transporter: nodemailer.Transporter | null = null;

export function getMailTransporter(): nodemailer.Transporter {
  if (!transporter) {
    const host = process.env.SMTP_HOST || "smtp.hostinger.com";
    const port = parseInt(process.env.SMTP_PORT || "465", 10);
    const user = process.env.SMTP_USER || "support@nekomon.online";
    const pass = process.env.SMTP_PASS;
    if (!pass) throw new Error("SMTP_PASS must be configured");

    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465 (SSL), false for other ports (587 STARTTLS)
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return transporter;
}

/**
 * Send real verification email with link and 6-digit OTP code
 */
export async function sendVerificationEmail({
  to,
  verificationUrl,
  otpCode,
  isEn = false
}: {
  to: string;
  verificationUrl: string;
  otpCode?: string;
  isEn?: boolean;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!process.env.SMTP_PASS) {
      console.warn(`[AUTH] Notice: SMTP_PASS is not configured in this environment.`);
      console.log(`[AUTH] Verification URL for ${to}: ${verificationUrl}${otpCode ? ` (OTP: ${otpCode})` : ""}`);
      return { success: true, messageId: `dev-simulated-${Date.now()}` };
    }
    const mailer = getMailTransporter();
    const sender = `"Nekomon Online Support" <${process.env.SMTP_USER || "support@nekomon.online"}>`;

    const subject = isEn 
      ? `⚔️ Nekomon TCG - Verify Your Email Address (${otpCode || "Action Required"})`
      : `⚔️ Nekomon TCG - Verifikasi Pendaftaran Akun (${otpCode || "Aksi Diperlukan"})`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="${isEn ? "en" : "id"}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isEn ? "Email Verification" : "Verifikasi Email"}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #060b14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #060b14; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background: linear-gradient(180deg, #0f172a 0%, #090e1a 100%); border: 1px solid #1e293b; border-top: 3px solid #eab308; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); overflow: hidden;">
          
          <!-- Header Banner -->
          <tr>
            <td align="center" style="padding: 35px 30px 20px 30px; text-align: center;">
              <div style="display: inline-block; padding: 6px 14px; background: rgba(234, 179, 8, 0.15); border: 1px solid rgba(234, 179, 8, 0.3); border-radius: 20px; font-size: 11px; font-weight: 800; color: #facc15; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 12px;">
                NEKOMON TRADING CARD GAME
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                ${isEn ? "Verify Your Account" : "Verifikasi Akun Baru"}
              </h1>
              <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 13px;">
                ${isEn 
                  ? "Welcome to Nekomon Arena! Please verify your email to begin your tactical journey." 
                  : "Selamat datang di Arena Nekomon! Verifikasi email Anda untuk memulai petualangan."}
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 30px;">
              <hr style="border: none; border-top: 1px solid #1e293b; margin: 0;">
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 25px 30px;">
              <p style="margin: 0 0 16px 0; color: #cbd5e1; font-size: 14px; line-height: 1.6;">
                ${isEn 
                  ? `You recently registered on Nekomon with email <strong>${to}</strong>. Click the verification button below or copy your 6-digit security code:`
                  : `Anda baru saja mendaftarkan email <strong>${to}</strong> pada Nekomon TCG. Silakan klik tombol verifikasi di bawah atau gunakan 6 digit kode OTP Anda:`}
              </p>

              <!-- Main CTA Button -->
              <div style="text-align: center; margin: 25px 0 20px 0;">
                <a href="${verificationUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%); color: #020617; font-size: 14px; font-weight: 800; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 15px rgba(234, 179, 8, 0.35); text-transform: uppercase; letter-spacing: 0.5px;">
                  ${isEn ? "Verify Email Now ⚔️" : "Verifikasi Email Sekarang ⚔️"}
                </a>
              </div>

              ${otpCode ? `
              <!-- OTP Code Alternative Box -->
              <div style="background: rgba(2, 6, 23, 0.7); border: 1px dashed #334155; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0;">
                <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
                  ${isEn ? "Or Enter 6-Digit OTP Code:" : "Atau Masukkan 6 Digit Kode OTP:"}
                </div>
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 30px; font-weight: 900; color: #facc15; letter-spacing: 6px; user-select: all;">
                  ${otpCode}
                </div>
                <div style="font-size: 10px; color: #64748b; margin-top: 4px;">
                  ${isEn ? "Expires in 15 minutes" : "Berlaku selama 15 menit"}
                </div>
              </div>
              ` : ""}

              <p style="margin: 20px 0 0 0; color: #64748b; font-size: 11px; line-height: 1.5;">
                ${isEn 
                  ? "If the button above does not work, copy and paste this link into your browser:" 
                  : "Jika tombol di atas tidak dapat diklik, salin dan buka tautan berikut di browser Anda:"}
                <br>
                <a href="${verificationUrl}" style="color: #38bdf8; word-break: break-all; text-decoration: underline;">${verificationUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #080c14; padding: 20px 30px; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 11px; line-height: 1.5;">
                ${isEn 
                  ? "If you did not request this registration, please ignore this email." 
                  : "Jika Anda tidak merasa mendaftar akun di Nekomon, abaikan email ini."}
              </p>
              <p style="margin: 8px 0 0 0; color: #475569; font-size: 10px;">
                © ${new Date().getFullYear()} Nekomon Online • support@nekomon.online
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

    const info = await mailer.sendMail({
      from: sender,
      to,
      subject,
      text: isEn 
        ? `Nekomon TCG Email Verification:\nClick link: ${verificationUrl}\nOr use OTP code: ${otpCode || ""}\nValid for 15 minutes.` 
        : `Verifikasi Email Nekomon TCG:\nBuka link: ${verificationUrl}\nAtau gunakan kode OTP: ${otpCode || ""}\nBerlaku selama 15 menit.`,
      html: htmlContent
    });

    console.log(`[SMTP] Verification email sent successfully to ${to}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error(`[SMTP ERROR] Failed to send verification email to ${to}:`, err);
    return { success: false, error: err.message || "Failed to send email" };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail({
  to,
  resetUrl,
  isEn = false
}: {
  to: string;
  resetUrl: string;
  isEn?: boolean;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!process.env.SMTP_PASS) {
      console.warn(`[AUTH] Notice: SMTP_PASS is not configured in this environment.`);
      console.log(`[AUTH] Password reset link for ${to}: ${resetUrl}`);
      return { success: true, messageId: `dev-simulated-${Date.now()}` };
    }
    const mailer = getMailTransporter();
    const sender = `"Nekomon Online Support" <${process.env.SMTP_USER || "support@nekomon.online"}>`;

    const subject = isEn 
      ? `🔐 Nekomon TCG - Password Reset Request`
      : `🔐 Nekomon TCG - Permintaan Reset Kata Sandi`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="${isEn ? "en" : "id"}">
<head>
  <meta charset="UTF-8">
  <title>${isEn ? "Reset Password" : "Reset Sandi"}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #060b14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #060b14; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background: #0f172a; border: 1px solid #1e293b; border-top: 3px solid #f97316; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); overflow: hidden;">
          <tr>
            <td align="center" style="padding: 35px 30px 20px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800;">
                ${isEn ? "Reset Your Password" : "Reset Kata Sandi Akun"}
              </h1>
              <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 13px;">
                ${isEn ? "You requested a password reset for your Nekomon account." : "Anda mengajukan permohonan reset sandi untuk akun Nekomon Anda."}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 25px 30px; text-align: center;">
              <p style="margin: 0 0 20px 0; color: #cbd5e1; font-size: 14px; line-height: 1.6;">
                ${isEn 
                  ? "Click the button below to choose a new password. This link is valid for 15 minutes."
                  : "Klik tombol di bawah ini untuk mengatur kata sandi baru. Tautan ini berlaku selama 15 menit."}
              </p>
              <a href="${resetUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; font-size: 14px; font-weight: 800; text-decoration: none; padding: 14px 30px; border-radius: 10px; text-transform: uppercase;">
                ${isEn ? "Reset Password 🔐" : "Reset Kata Sandi 🔐"}
              </a>
              <p style="margin: 25px 0 0 0; color: #64748b; font-size: 11px;">
                <a href="${resetUrl}" style="color: #38bdf8; word-break: break-all;">${resetUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #080c14; padding: 20px 30px; border-top: 1px solid #1e293b; text-align: center; color: #64748b; font-size: 11px;">
              © ${new Date().getFullYear()} Nekomon Online • support@nekomon.online
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const info = await mailer.sendMail({
      from: sender,
      to,
      subject,
      text: `Reset Password link: ${resetUrl}`,
      html: htmlContent
    });

    console.log(`[SMTP] Reset password email sent to ${to}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error(`[SMTP ERROR] Failed to send password reset email to ${to}:`, err);
    return { success: false, error: err.message || "Failed to send reset email" };
  }
}
