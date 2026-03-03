import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Email configuration
const createTransporter = () => {
  // For production, use real SMTP (Gmail, SendGrid, etc.)
  if (process.env.NODE_ENV === 'production' && process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Production without SMTP: skip emails entirely
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️ SMTP not configured in production. Emails will be skipped.');
    return null;
  }

  // Development: Use Ethereal email (captured emails can be viewed in browser)
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: process.env.ETHEREAL_USER || 'demo@ethereal.email',
      pass: process.env.ETHEREAL_PASS || 'demo_password'
    }
  });
};

// Email template loader
const loadTemplate = (templateName) => {
  const templatePath = path.join(__dirname, '..', 'templates', 'emails', `${templateName}.html`);

  if (fs.existsSync(templatePath)) {
    return fs.readFileSync(templatePath, 'utf-8');
  }

  // Fallback to simple text template
  return null;
};

// Replace template variables
const renderTemplate = (template, variables) => {
  let html = template;

  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, variables[key]);
  });

  return html;
};

// Base email styling
const baseStyles = `
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      background-color: #0a0a0f; 
      color: #ffffff; 
      margin: 0; 
      padding: 20px; 
    }
    .email-container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: linear-gradient(to bottom, #12121a, #1a1a24);
      border-radius: 16px; 
      padding: 32px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .header { 
      text-align: center; 
      border-bottom: 1px solid rgba(255,255,255,0.1); 
      padding-bottom: 24px; 
      margin-bottom: 24px; 
    }
    .logo { 
      font-size: 28px; 
      font-weight: 700; 
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .content { 
      padding: 20px 0; 
      line-height: 1.7; 
      color: #a1a1aa;
    }
    .content h2 {
      color: #ffffff;
      font-size: 24px;
      margin-bottom: 16px;
    }
    .button { 
      display: inline-block; 
      padding: 14px 32px; 
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white !important; 
      text-decoration: none; 
      border-radius: 10px; 
      font-weight: 600;
      margin: 20px 0;
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .info-box {
      background: rgba(99, 102, 241, 0.1);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }
    .info-box h3 {
      color: #6366f1;
      margin: 0 0 10px;
      font-size: 16px;
    }
    .info-box p {
      margin: 5px 0;
      color: #a1a1aa;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
    }
    .status-pending { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
    .status-reviewed { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
    .status-shortlisted { background: rgba(139, 92, 246, 0.2); color: #8b5cf6; }
    .status-interview { background: rgba(99, 102, 241, 0.2); color: #6366f1; }
    .status-offered { background: rgba(16, 185, 129, 0.2); color: #10b981; }
    .status-rejected { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
    .footer { 
      text-align: center; 
      margin-top: 32px; 
      padding-top: 24px;
      border-top: 1px solid rgba(255,255,255,0.1);
      color: #71717a;
      font-size: 13px;
    }
    .footer a { color: #6366f1; text-decoration: none; }
  </style>
`;

// Email service class
class EmailService {
  constructor() {
    this.transporter = null;
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@resumeanalyzer.ai';
    this.fromName = process.env.FROM_NAME || 'Resume Analyzer';
  }

  async init() {
    try {
      this.transporter = createTransporter();

      // Verify connection in development
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 Email service initialized (Development mode)');
      }

      return true;
    } catch (error) {
      console.error('Email service initialization failed:', error);
      return false;
    }
  }

  async sendEmail({ to, subject, html, text }) {
    try {
      if (!this.transporter) {
        await this.init();
      }

      // Skip email if transporter is not available (e.g. SMTP not configured in production)
      if (!this.transporter) {
        console.log(`📧 Email skipped (no SMTP configured): "${subject}" to ${to}`);
        return { success: true, skipped: true, messageId: null };
      }

      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
        ...(arguments[0].icalEvent && {
          icalEvent: arguments[0].icalEvent
        })
      };

      const info = await this.transporter.sendMail(mailOptions);

      // In development, log the Ethereal preview URL
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 Email sent:', nodemailer.getTestMessageUrl(info));
      }

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  // Welcome email for new users
  async sendWelcomeEmail(user) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>${baseStyles}</head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">🎯 Resume Analyzer</div>
          </div>
          <div class="content">
            <h2>Welcome aboard, ${user.firstName}! 🎉</h2>
            <p>Thank you for joining Resume Analyzer - your AI-powered career companion. We're excited to help you take the next step in your career journey.</p>
            
            <div class="info-box">
              <h3>🚀 What you can do now:</h3>
              <p>✨ Upload your resume for AI-powered analysis</p>
              <p>📊 Get instant ATS compatibility scores</p>
              <p>🎯 Discover jobs that match your skills</p>
              <p>💬 Chat with our AI career assistant</p>
            </div>
            
            <center>
              <a href="${process.env.FRONTEND_URL}/dashboard" class="button">
                Go to Dashboard →
              </a>
            </center>
            
            <p>Need help? Our AI assistant is available 24/7 to answer your questions.</p>
          </div>
          <div class="footer">
            <p>© 2024 Resume Analyzer. All rights reserved.</p>
            <p><a href="${process.env.FRONTEND_URL}">Visit our website</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: `Welcome to Resume Analyzer, ${user.firstName}! 🎉`,
      html
    });
  }

  // Application status update email
  async sendApplicationStatusEmail(application, user, job) {
    const statusMessages = {
      PENDING: 'Your application has been received',
      REVIEWED: 'Your application is being reviewed',
      SHORTLISTED: 'Congratulations! You\'ve been shortlisted',
      INTERVIEW: 'Great news! You\'ve been selected for an interview',
      OFFERED: 'Amazing! You\'ve received a job offer',
      REJECTED: 'Update on your application',
      WITHDRAWN: 'Your application has been withdrawn'
    };

    const statusColors = {
      PENDING: 'pending',
      REVIEWED: 'reviewed',
      SHORTLISTED: 'shortlisted',
      INTERVIEW: 'interview',
      OFFERED: 'offered',
      REJECTED: 'rejected',
      WITHDRAWN: 'rejected'
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>${baseStyles}</head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">🎯 Resume Analyzer</div>
          </div>
          <div class="content">
            <h2>${statusMessages[application.status]}</h2>
            
            <div class="info-box">
              <h3>📋 Application Details</h3>
              <p><strong>Position:</strong> ${job.title}</p>
              <p><strong>Company:</strong> ${job.company}</p>
              <p><strong>Status:</strong> <span class="status-badge status-${statusColors[application.status]}">${application.status}</span></p>
            </div>
            
            ${application.status === 'INTERVIEW' ? `
            <div class="info-box">
              <h3>📅 Next Steps</h3>
              <p>Check your dashboard for interview details and schedule.</p>
              <p>Make sure to prepare by reviewing the job requirements and your application.</p>
            </div>
            ` : ''}
            
            ${application.status === 'OFFERED' ? `
            <div class="info-box">
              <h3>🎊 Congratulations!</h3>
              <p>The recruiter is eager to have you on board. Log in to view the offer details.</p>
            </div>
            ` : ''}
            
            <center>
              <a href="${process.env.FRONTEND_URL}/dashboard/applications" class="button">
                View Application →
              </a>
            </center>
          </div>
          <div class="footer">
            <p>© 2024 Resume Analyzer. All rights reserved.</p>
            <p><a href="${process.env.FRONTEND_URL}">Visit our website</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: `${statusMessages[application.status]} - ${job.title} at ${job.company}`,
      html
    });
  }

  // Interview scheduled email
  async sendInterviewScheduledEmail(interview, candidate, job, recruiter) {
    const interviewDate = new Date(interview.scheduledAt);
    const formattedDate = interviewDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = interviewDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const typeLabels = {
      PHONE: '📞 Phone Interview',
      VIDEO: '📹 Video Interview',
      ONSITE: '🏢 Onsite Interview',
      TECHNICAL: '💻 Technical Interview',
      HR: '👥 HR Interview'
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>${baseStyles}</head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">🎯 Resume Analyzer</div>
          </div>
          <div class="content">
            <h2>Your Interview is Scheduled! 🎉</h2>
            <p>Great news, ${candidate.firstName}! Your interview for the ${job.title} position at ${job.company} has been scheduled.</p>
            
            <div class="info-box">
              <h3>${typeLabels[interview.type]}</h3>
              <p><strong>📅 Date:</strong> ${formattedDate}</p>
              <p><strong>⏰ Time:</strong> ${formattedTime}</p>
              <p><strong>⏱️ Duration:</strong> ${interview.duration} minutes</p>
              ${interview.location && interview.type !== 'VIDEO' ? `<p><strong>📍 Location:</strong> ${interview.location}</p>` : ''}
              ${interview.type === 'VIDEO' && interview.meetingLink ? `<p><strong>🔗 Meeting Link:</strong> <a href="${interview.meetingLink}" style="color: #6366f1;">${interview.meetingLink}</a></p>` : ''}
            </div>
            
            <div class="info-box">
              <h3>👤 Your Interviewer</h3>
              <p>${recruiter.firstName} ${recruiter.lastName}</p>
              <p>${recruiter.email}</p>
            </div>
            
            ${interview.notes ? `
            <div class="info-box">
              <h3>📝 Additional Notes</h3>
              <p>${interview.notes}</p>
            </div>
            ` : ''}
            
            <center>
              <a href="${process.env.FRONTEND_URL}/dashboard/applications" class="button">
                View Interview Details →
              </a>
            </center>
            
            <p style="margin-top: 24px; font-size: 14px;">
              <strong>Pro Tips:</strong><br>
              • Test your video/audio setup 15 minutes before<br>
              • Have your resume and the job description ready<br>
              • Prepare questions about the role and company<br>
              • Join the meeting 5 minutes early
            </p>
          </div>
          <div class="footer">
            <p>© 2024 Resume Analyzer. All rights reserved.</p>
            <p><a href="${process.env.FRONTEND_URL}">Visit our website</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Generate ICS Calendar event
    const endTime = new Date(interviewDate.getTime() + interview.duration * 60000);
    const icalEvent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Resume Analyzer//EN
BEGIN:VEVENT
UID:${interview.id}@resumeanalyzer.ai
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${interviewDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${endTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:Interview: ${job.title} at ${job.company}
ORGANIZER;CN="${recruiter.firstName} ${recruiter.lastName}":mailto:${recruiter.email}
ATTENDEE;CN="${candidate.firstName} ${candidate.lastName}";RSVP=TRUE:mailto:${candidate.email}
DESCRIPTION:Interview for ${job.title} position.\\n${interview.notes || ''}\\nMeeting Link: ${interview.meetingLink || 'N/A'}
LOCATION:${interview.type === 'VIDEO' ? interview.meetingLink : (interview.location || 'N/A')}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    // Send to Candidate
    const candidateResult = await this.sendEmail({
      to: candidate.email,
      subject: `📅 Interview Scheduled: ${job.title} at ${job.company}`,
      html: html.replace('Great news,', `Great news, ${candidate.firstName}!`),
      icalEvent: {
        filename: 'interview.ics',
        method: 'request',
        content: icalEvent
      }
    });

    // Send to Recruiter (slightly modified text ideally, but reusing for simplicity)
    const recruiterHtml = html.replace(
      `<p>Great news, ${candidate.firstName}! Your interview for the ${job.title} position at ${job.company} has been scheduled.</p>`,
      `<p>Hi ${recruiter.firstName}, this is a confirmation that you have scheduled an interview with ${candidate.firstName} ${candidate.lastName} for the ${job.title} role.</p>`
    );

    const recruiterResult = await this.sendEmail({
      to: recruiter.email,
      subject: `📅 Interview Scheduled with ${candidate.firstName} ${candidate.lastName} for ${job.title}`,
      html: recruiterHtml,
      icalEvent: {
        filename: 'interview.ics',
        method: 'request',
        content: icalEvent
      }
    });

    return {
      candidateResult,
      recruiterResult,
      success: candidateResult.success && recruiterResult.success
    };
  }

  // Interview reminder email (send 24 hours before)
  async sendInterviewReminderEmail(interview, candidate, job) {
    const interviewDate = new Date(interview.scheduledAt);
    const formattedDate = interviewDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = interviewDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>${baseStyles}</head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">🎯 Resume Analyzer</div>
          </div>
          <div class="content">
            <h2>Interview Reminder ⏰</h2>
            <p>Hi ${candidate.firstName}, this is a friendly reminder that your interview is coming up tomorrow!</p>
            
            <div class="info-box">
              <h3>📋 Interview Details</h3>
              <p><strong>Position:</strong> ${job.title}</p>
              <p><strong>Company:</strong> ${job.company}</p>
              <p><strong>📅 Date:</strong> ${formattedDate}</p>
              <p><strong>⏰ Time:</strong> ${formattedTime}</p>
              ${interview.meetingLink ? `<p><strong>🔗 Join:</strong> <a href="${interview.meetingLink}" style="color: #6366f1;">${interview.meetingLink}</a></p>` : ''}
            </div>
            
            <center>
              <a href="${process.env.FRONTEND_URL}/dashboard/applications" class="button">
                View Details →
              </a>
            </center>
            
            <p>Good luck! You've got this! 💪</p>
          </div>
          <div class="footer">
            <p>© 2024 Resume Analyzer. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: candidate.email,
      subject: `⏰ Reminder: Interview Tomorrow - ${job.title} at ${job.company}`,
      html
    });
  }

  // New job match notification
  async sendNewMatchEmail(user, matches) {
    const matchesHtml = matches.slice(0, 5).map(match => `
      <div class="info-box" style="margin-bottom: 12px;">
        <h3>${match.job.title}</h3>
        <p><strong>${match.job.company}</strong> • ${match.job.location || 'Remote'}</p>
        <p>Match Score: <strong style="color: #10b981;">${Math.round(match.overallScore)}%</strong></p>
      </div>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>${baseStyles}</head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">🎯 Resume Analyzer</div>
          </div>
          <div class="content">
            <h2>New Job Matches for You! 🎯</h2>
            <p>Hi ${user.firstName}, we found ${matches.length} new job${matches.length > 1 ? 's' : ''} that match your profile!</p>
            
            ${matchesHtml}
            
            ${matches.length > 5 ? `<p style="text-align: center; color: #a1a1aa;">...and ${matches.length - 5} more matches</p>` : ''}
            
            <center>
              <a href="${process.env.FRONTEND_URL}/dashboard/matches" class="button">
                View All Matches →
              </a>
            </center>
          </div>
          <div class="footer">
            <p>© 2024 Resume Analyzer. All rights reserved.</p>
            <p><a href="${process.env.FRONTEND_URL}/settings/notifications">Manage email preferences</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: `🎯 ${matches.length} New Job Match${matches.length > 1 ? 'es' : ''} Found!`,
      html
    });
  }

  // Password reset email
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>${baseStyles}</head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">🎯 Resume Analyzer</div>
          </div>
          <div class="content">
            <h2>Reset Your Password 🔐</h2>
            <p>Hi ${user.firstName}, we received a request to reset your password.</p>
            
            <center>
              <a href="${resetUrl}" class="button">
                Reset Password →
              </a>
            </center>
            
            <p style="margin-top: 24px; font-size: 14px; color: #71717a;">
              This link will expire in 1 hour. If you didn't request this, please ignore this email.
            </p>
            
            <p style="font-size: 14px; color: #71717a;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #6366f1; word-break: break-all;">${resetUrl}</a>
            </p>
          </div>
          <div class="footer">
            <p>© 2024 Resume Analyzer. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: '🔐 Reset Your Password - Resume Analyzer',
      html
    });
  }
}

// Export singleton instance
const emailService = new EmailService();
export default emailService;
