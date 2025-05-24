# FileNest - Simple Client File Request & Collection Tool

FileNest is a modern, user-friendly tool that allows professionals to request, collect, and organize files from clients via a secure, shareable link - without logins, email chaos, or confusing portals.

## Progress Tracker

### Day 1 (Completed)
- ✅ Project setup
- ✅ Repository initialization
- ✅ Supabase DB configuration
- ✅ Backend Express server configuration
- ✅ Frontend React application setup

### Day 2 (Completed)
- ✅ "Create Request" form
- ✅ Link generation
- ✅ Sharing options

### Day 3 (Completed)
- ✅ Beautiful landing page with clear messaging ("Request files from anyone in seconds")
- ✅ "Create File Request" form with fields for email, description, deadline
- ✅ Backend integration to create request and generate unique link
- ✅ "Share Link" page with copy functionality and sharing options
- ✅ Client upload page (accessible via unique link)
- ✅ Drag-and-drop file upload UI with progress tracking
- ✅ Success messages and interface feedback

### Upcoming Tasks
- **Day 4**: Set up email notifications
- **Day 5**: Build dashboard (view/download files):Day 5: Notifications, Expiry, and Polish
 Integrate SendGrid or Nodemailer for email notifications

 Notify user when files are uploaded

 (Phase 2: Reminder emails to clients if files not uploaded by deadline)

 Implement link auto-expiry (hide upload form after expiry)

 Add error handling and user-friendly messages throughout

 Add loading states and basic accessibility improvements----- email part remaining :Yes, there are several good free options for email services that you can use in production:
SendGrid:
Free tier: 100 emails/day
Reliable and widely used
Easy integration with Node.js
Offers analytics and deliverability insights
Mailgun:
Free tier: 5,000 emails/month for 3 months
Good for transactional emails
Offers email validation and analytics
Mailjet:
Free tier: 6,000 emails/month (200 emails/day)
User-friendly interface
Offers email templates and analytics
Amazon SES (Simple Email Service):
Free tier: 62,000 emails/month (when hosted on AWS)
Highly scalable and cost-effective
Requires more setup compared to others
Postmark:
Free trial: 100 emails/month
Focused on transactional emails
Fast and reliable delivery
Next Steps
Choose a service based on your expected email volume and features needed
Set up an account with the chosen service
Update your backend to use the service's API for sending emails
These services provide better deliverability and analytics compared to using Gmail SMTP directly.

- **Day 6**: Add auto-expiry logic, polish UI:Day 6: Payments & Security
 Integrate Stripe for premium features 

 Free tier: 1 active request, 100MB storage, 7-day expiry

 Paid tier: Unlimited requests, more storage, longer expiry

 Add basic GDPR compliance features (delete request/files, privacy policy link)

 Ensure all file uploads are encrypted at rest (Supabase/S3 default)

 Review and tighten CORS, rate limiting, and input validation
- **Day 7**: Test, bugfix, deploy MVP:Day 7: Testing, Deployment & Launch
 Thoroughly test all user flows (manual + automated)

 Fix bugs and polish UI/UX

 Deploy frontend (Vercel/Netlify)

 Deploy backend (Railway/Render/Heroku)

 Set up domain, HTTPS, and email sending (verify domain if needed)

 Create and deploy simple SEO landing page

 Submit to Product Hunt, Indie Hackers, Reddit (optional, or after feedback)

 Collect feedback from first users

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: Supabase (Postgres)
- **File Storage**: Supabase Storage
- **Email**: Nodemailer
- **Hosting**: Vercel (frontend), Railway (backend)

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/filenest.git
cd filenest
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   Create `.env` file in the root directory with the following:
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_key
EMAIL_HOST=your_email_host
EMAIL_PORT=your_email_port
EMAIL_USER=your_email_user
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=your_email_from
FRONTEND_URL=http://localhost:3000
```

4. Start the development server:
```bash
npm start
```

## Features (MVP)

- Create file request link
- File upload (no login)
- Email notifications
- Dashboard to view/download files
- Download all as ZIP
- Auto-expiry of links 