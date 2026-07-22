const nodemailer = require('nodemailer')
const ApiError = require('../utils/ApiError')

class EmailService {
  /**
   * Safely builds nodemailer transporter or returns null if unconfigured
   */
  getTransporter() {
    const host = process.env.SMTP_HOST
    const port = parseInt(process.env.SMTP_PORT || '587', 10)
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS

    if (!host || !user || !pass || user.includes('placeholder') || pass.includes('placeholder')) {
      return null
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    })
  }

  /**
   * Dispatches branded OTP email template via SMTP
   */
  async sendOtpEmail({ to, otp, purpose, expiresMinutes = 5, tenantName = 'C.K. Classes' }) {
    const transporter = this.getTransporter()
    if (!transporter) {
      throw new ApiError('SMTP email provider is not configured.', 500, 'OTP_DELIVERY_FAILED')
    }

    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@ckclasses.com'
    
    const purposeTitles = {
      email_verification: 'Email Verification',
      password_reset: 'Password Reset Verification',
      login: 'Login Verification',
      student_activation: 'Student Account Activation',
      parent_activation: 'Parent Account Activation',
      staff_activation: 'Staff Account Activation',
      phone_verification: 'Verification Code'
    }
    const title = purposeTitles[purpose] || 'Verification Code'

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 16px; background-color: #FFFFFF;">
        <div style="text-align: center; padding-bottom: 16px; border-bottom: 1px solid #EDF2F7;">
          <h2 style="color: #1E3A8A; margin: 0; font-size: 20px; font-weight: 800;">${tenantName}</h2>
          <p style="color: #64748B; font-size: 12px; margin-top: 4px; font-weight: 600;">Institutional Management Portal</p>
        </div>
        <div style="padding: 24px 0; text-align: center;">
          <p style="color: #334155; font-size: 14px; margin-bottom: 16px; font-weight: 600;">Your 6-digit ${title} is:</p>
          <div style="display: inline-block; background: #F0F9FF; border: 2px dashed #0284C7; padding: 12px 28px; border-radius: 12px; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #0369A1;">
            ${otp}
          </div>
          <p style="color: #64748B; font-size: 12px; margin-top: 16px; font-weight: 600;">This verification code expires in <strong>${expiresMinutes} minutes</strong>.</p>
        </div>
        <div style="background: #FEF2F2; border: 1px solid #FCA5A5; padding: 12px; border-radius: 8px; color: #991B1B; font-size: 11px; font-weight: 600; text-align: left;">
          <strong>Security Warning:</strong> If you did not request this verification code, please ignore this email. Never share your verification code or login details with anyone.
        </div>
      </div>
    `

    try {
      await transporter.sendMail({
        from: `${tenantName} <${fromAddress}>`,
        to,
        subject: `[${tenantName}] Your Verification Code: ${otp}`,
        html: htmlContent
      })
      return { success: true }
    } catch (err) {
      console.error('[EmailService Error]:', err.message)
      throw new ApiError('Failed to dispatch OTP email. Please try again later.', 500, 'OTP_DELIVERY_FAILED')
    }
  }

  /**
   * Dispatches general/bulk email template via SMTP
   */
  async sendEmail({ to, subject, html, text, tenantName = 'C.K. Classes' }) {
    const transporter = this.getTransporter()
    if (!transporter) {
      throw new ApiError('SMTP email provider is not configured.', 500, 'EMAIL_DELIVERY_FAILED')
    }

    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@ckclasses.com'

    try {
      await transporter.sendMail({
        from: `${tenantName} <${fromAddress}>`,
        to,
        subject: subject || `Notification from ${tenantName}`,
        html: html || `<div style="font-family: Arial, sans-serif;">${text || ''}</div>`,
        text: text || ''
      })
      return { success: true }
    } catch (err) {
      console.error('[EmailService Error]:', err.message)
      throw new ApiError('Failed to dispatch email. Please try again later.', 500, 'EMAIL_DELIVERY_FAILED')
    }
  }
}

module.exports = new EmailService()
