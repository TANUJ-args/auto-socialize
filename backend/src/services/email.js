import nodemailer from 'nodemailer';

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendOtpEmail = async (email, code) => {
  const mailOptions = {
    from: `"SocialFlow" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Your SocialFlow Login Code',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #000; font-size: 24px; margin: 0;">SocialFlow</h1>
        </div>
        
        <div style="background: #f5f5f5; border-radius: 8px; padding: 30px; text-align: center;">
          <h2 style="color: #333; font-size: 18px; margin: 0 0 20px;">Your verification code</h2>
          <div style="background: #fff; border: 2px solid #e0e0e0; border-radius: 8px; padding: 20px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #000;">
            ${code}
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            This code expires in 10 minutes. Don't share it with anyone.
          </p>
        </div>
        
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
          If you didn't request this code, you can safely ignore this email.
        </p>
      </div>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`);
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error('Failed to send email');
  }
};