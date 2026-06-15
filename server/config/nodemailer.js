import nodemailer from 'nodemailer'
import 'dotenv/config'

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendEmail({ to, subject, html }) {
  await transporter.sendMail({
    from: `"Zenius AI" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  })
}

export function approvalEmail(name) {
  return {
    subject: '🎉 Instructor Application Approved — Zenius AI',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 32px; background: #F5F3FF; border-radius: 16px;">
        <h2 style="color: #7C3AED; font-family: Outfit, sans-serif;">Congratulations, ${name}!</h2>
        <p style="color: #1E1B4B; line-height: 1.7;">Your instructor application on Zenius AI has been <strong>approved</strong>. You can now create and publish courses.</p>
        <a href="${process.env.CLIENT_URL}/instructor/courses/new" style="display:inline-block; margin-top:20px; padding:12px 24px; background:#7C3AED; color:white; border-radius:10px; text-decoration:none; font-weight:600;">Create Your First Course →</a>
        <p style="margin-top: 24px; color: #64748B; font-size: 13px;">— The Zenius AI Team</p>
      </div>
    `,
  }
}

export function rejectionEmail(name, reason) {
  return {
    subject: 'Instructor Application Update — Zenius AI',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 32px; background: #F5F3FF; border-radius: 16px;">
        <h2 style="color: #1E1B4B; font-family: Outfit, sans-serif;">Application Update</h2>
        <p style="color: #1E1B4B; line-height: 1.7;">Hi ${name}, after reviewing your application we are unable to approve it at this time.</p>
        <div style="background:#FEF2F2; border-left:4px solid #EF4444; padding:16px; border-radius:8px; margin:16px 0;">
          <strong style="color:#DC2626;">Reason:</strong><br/>
          <span style="color:#374151;">${reason}</span>
        </div>
        <p style="color:#64748B; line-height:1.7;">You may reapply after addressing the concerns above. We look forward to having you on the platform.</p>
        <p style="margin-top: 24px; color: #64748B; font-size: 13px;">— The Zenius AI Team</p>
      </div>
    `,
  }
}
