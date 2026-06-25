import React from 'react'
import LegalLayout, { LegalSection, LegalSubSection, LegalTodo, LegalList, LegalInfo } from './LegalLayout.jsx'

const SECTIONS = [
  { id: 'overview', title: 'Overview' },
  { id: 'data-collected', title: 'Data We Collect' },
  { id: 'how-we-use', title: 'How We Use Your Data' },
  { id: 'cookies-storage', title: 'Cookies & Local Storage' },
  { id: 'third-parties', title: 'Third-Party Services' },
  { id: 'data-retention', title: 'Data Retention' },
  { id: 'your-rights', title: 'Your Rights' },
  { id: 'children', title: 'Children\'s Privacy' },
  { id: 'security', title: 'Security Measures' },
  { id: 'changes', title: 'Changes to This Policy' },
  { id: 'contact', title: 'Contact & Grievance' },
]

export default function PrivacyPolicy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      description="Zenius AI Privacy Policy — learn what data we collect, how we use it, and your rights as a user of our AI-powered learning platform."
      sections={SECTIONS}
      version="1.0"
      effectiveDate="June 26, 2026"
      lastUpdated="June 26, 2026"
    >
      <LegalSection id="overview" title="Overview">
        <p>
          Zenius AI ("<strong>we</strong>", "<strong>our</strong>", "<strong>us</strong>") operates the online learning platform
          available at <a href="https://live-meet.onrender.com" style={{ color: '#7C3AED' }}>https://live-meet.onrender.com</a>{' '}
          (the "<strong>Platform</strong>"). This Privacy Policy explains what personal information we collect,
          why we collect it, how it is stored, and what your rights are with respect to that information.
        </p>
        <LegalTodo>
          Replace "Zenius AI" above with the registered legal entity name (e.g., "Zenius AI Technologies Private Limited")
          and add the registered office address.
        </LegalTodo>
        <p>
          By creating an account or using the Platform, you acknowledge that you have read and understood this Privacy Policy.
          If you do not agree, please do not use the Platform.
        </p>
      </LegalSection>

      <LegalSection id="data-collected" title="Data We Collect">
        <LegalSubSection title="2.1 Account Registration Data">
          <p>When you register, we collect:</p>
          <LegalList items={[
            'Full name',
            'Email address',
            'Password (stored as a bcrypt hash — we never store plaintext passwords)',
            'Role: student (default) or instructor (upon application approval)',
          ]} />
        </LegalSubSection>

        <LegalSubSection title="2.2 Profile Data (Optional)">
          <p>Users may voluntarily provide:</p>
          <LegalList items={[
            'Avatar / profile photo',
            'Bio (up to 500 characters)',
            'Areas of expertise',
            'LinkedIn profile URL',
            'Portfolio URL',
            'Phone number (stored with restricted access, not exposed by default)',
            'Department',
          ]} />
        </LegalSubSection>

        <LegalSubSection title="2.3 Learning Activity Data">
          <p>We collect data about how you use the Platform:</p>
          <LegalList items={[
            'Courses enrolled in and wishlist entries',
            'Lesson-level progress (which lessons you have completed)',
            'Quiz attempt history and scores',
            'Certificates generated',
            'Notes viewed or downloaded',
          ]} />
        </LegalSubSection>

        <LegalSubSection title="2.4 Live Lecture Data">
          <p>When you join a live lecture:</p>
          <LegalList items={[
            'Session join time and leave time (attendance record)',
            'Total duration in session',
            'Your user ID linked to the session',
          ]} />
          <p style={{ marginTop: 8 }}>
            <strong>Built-in Live Room (WebRTC):</strong> Audio and video streams in the built-in live room are transmitted
            peer-to-peer via WebRTC and are <strong>not recorded or stored</strong> by Zenius AI unless explicitly stated otherwise.
          </p>
        </LegalSubSection>

        <LegalSubSection title="2.5 Instructor-Uploaded Content">
          <p>Instructors who create courses upload:</p>
          <LegalList items={[
            'Course thumbnails and preview videos',
            'Lesson videos (hosted on Cloudinary)',
            'Course material files (PDFs and documents for AI MCQ generation)',
            'Study notes per course',
          ]} />
        </LegalSubSection>

        <LegalSubSection title="2.6 Support Tickets">
          <p>When you submit a support ticket, we store:</p>
          <LegalList items={[
            'Subject and category (Bug Report, General Feedback, Course Question, Feature Request, Other)',
            'Message body',
            'Admin reply and reply timestamp',
          ]} />
        </LegalSubSection>

        <LegalSubSection title="2.7 Technical & Security Data">
          <LegalList items={[
            'Authentication tokens (JWT access token and refresh token) stored in HttpOnly cookies — not accessible to JavaScript',
            'Login attempt count and account lockout timestamp (for brute-force protection)',
            'Password reset token (hashed HMAC, stored temporarily with a 1-hour expiry)',
            'Token version for invalidating old sessions',
          ]} />
        </LegalSubSection>

        <LegalSubSection title="2.8 Instructor Application Data">
          <p>When a student applies to become an instructor:</p>
          <LegalList items={[
            'Application status (none / pending / approved / rejected)',
            'Admin rejection reason (if applicable)',
          ]} />
        </LegalSubSection>
      </LegalSection>

      <LegalSection id="how-we-use" title="How We Use Your Data">
        <LegalList items={[
          'To create and authenticate your account using JWT tokens in secure HttpOnly cookies',
          'To display your learning progress, quiz results, and earned certificates',
          'To allow instructors to create, manage, and publish courses',
          'To power the AI MCQ Generator — uploaded material text is extracted and processed to generate quiz questions',
          'To track live lecture attendance and display it to instructors',
          'To send transactional emails (e.g., password reset links, instructor approval/rejection notifications)',
          'To display in-app notifications',
          'To process and respond to support tickets',
          'To generate dynamic SEO metadata for course pages',
          'To protect accounts using brute-force lockout (5 failed attempts → 30-minute lock)',
          'To maintain an audit log for administrative security purposes',
        ]} />

        <LegalInfo>
          We do not use your data for advertising, profiling for third-party marketing, or sell your personal information to any third party.
        </LegalInfo>
      </LegalSection>

      <LegalSection id="cookies-storage" title="Cookies & Local Storage">
        <LegalSubSection title="4.1 Authentication Cookies">
          <p>We set two HttpOnly, Secure cookies after login:</p>
          <LegalList items={[
            'accessToken — short-lived JWT (15 minutes) used to authenticate API requests',
            'refreshToken — longer-lived JWT used to silently refresh your session without re-login',
          ]} />
          <p>These cookies are <strong>not accessible to JavaScript</strong> on the page and are flagged <code>HttpOnly</code> and <code>Secure</code>.</p>
        </LegalSubSection>

        <LegalSubSection title="4.2 CSRF Cookie">
          <p>A CSRF token cookie is set to protect against cross-site request forgery attacks on state-changing API calls.</p>
        </LegalSubSection>

        <LegalSubSection title="4.3 Local Storage">
          <p>Your dark mode preference and UI state are stored in the browser's <code>localStorage</code>. No personal data is stored there.</p>
        </LegalSubSection>

        <p>For detailed cookie information, see our <a href="/cookie-policy" style={{ color: '#7C3AED' }}>Cookie Policy</a>.</p>
      </LegalSection>

      <LegalSection id="third-parties" title="Third-Party Services">
        <p>We share data with the following third-party processors only to the extent necessary to provide the Platform:</p>

        <LegalSubSection title="5.1 Cloudinary">
          <p>
            Profile avatars, course thumbnails, lesson videos, and uploaded course materials are stored on Cloudinary's cloud
            infrastructure. Cloudinary is governed by its own{' '}
            <a href="https://cloudinary.com/privacy" style={{ color: '#7C3AED' }} target="_blank" rel="noreferrer">Privacy Policy</a>.
          </p>
        </LegalSubSection>

        <LegalSubSection title="5.2 MongoDB Atlas">
          <p>All structured platform data (user accounts, course data, quiz results, support tickets) is stored in MongoDB Atlas.
            Data is encrypted at rest.</p>
        </LegalSubSection>

        <LegalSubSection title="5.3 Email / SMTP Provider">
          <p>We use an SMTP email provider (Gmail SMTP by default) to send transactional emails such as password reset links and
            instructor status updates. Your email address is transmitted to deliver these messages.</p>
        </LegalSubSection>

        <LegalSubSection title="5.4 YouTube">
          <p>Some course lessons embed YouTube videos. YouTube may set its own cookies when you interact with embedded players.
            YouTube is governed by Google's{' '}
            <a href="https://policies.google.com/privacy" style={{ color: '#7C3AED' }} target="_blank" rel="noreferrer">Privacy Policy</a>.
          </p>
        </LegalSubSection>

        <LegalTodo>
          If a payment gateway (e.g., Razorpay, Stripe) is integrated in the future, add a section here describing what
          financial data is shared with the payment processor. Do not store card details on Zenius AI servers.
        </LegalTodo>
      </LegalSection>

      <LegalSection id="data-retention" title="Data Retention">
        <LegalList items={[
          'Account data is retained for as long as your account remains active',
          'Password reset tokens expire after 1 hour and are immediately deleted after use',
          'JWT access tokens are blacklisted immediately upon logout and expire automatically after 15 minutes',
          'Support ticket data is retained indefinitely for audit and quality purposes',
          'Course material uploaded for AI processing is stored in MongoDB with the extracted text',
          'Live lecture attendance records are stored for the lifetime of the lecture record',
        ]} />
        <p style={{ marginTop: 12 }}>
          If you request account deletion, we will delete or anonymise all personal data within a reasonable period,
          subject to legal obligations.
        </p>
        <LegalTodo>Define the exact account deletion request process and maximum deletion timeframe (e.g., 30 days).</LegalTodo>
      </LegalSection>

      <LegalSection id="your-rights" title="Your Rights">
        <p>
          Under applicable Indian law (Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023)
          and in accordance with good data governance practice, you have the right to:
        </p>
        <LegalList items={[
          'Access — request a copy of the personal data we hold about you',
          'Correction — ask us to correct inaccurate or incomplete data via your Profile Settings',
          'Deletion — request deletion of your account and associated personal data',
          'Portability — request your data in a structured, machine-readable format',
          'Withdraw Consent — where processing is based on your consent, you may withdraw it at any time',
          'Grievance Redressal — raise complaints via our Grievance Officer (see Contact section below)',
        ]} />
        <p style={{ marginTop: 12 }}>
          To exercise any of these rights, please contact us at the address listed in the{' '}
          <a href="#contact" style={{ color: '#7C3AED' }}>Contact section</a> below.
        </p>
      </LegalSection>

      <LegalSection id="children" title="Children's Privacy">
        <p>
          Zenius AI is not directed at children under the age of <strong>13 years</strong>. We do not knowingly collect
          personal information from children under 13. If you are a parent or guardian and believe your child has provided
          personal data to us, please contact us immediately and we will delete the data.
        </p>
        <LegalInfo>
          Users between 13 and 18 years of age should use the Platform only with appropriate parental or guardian consent.
        </LegalInfo>
      </LegalSection>

      <LegalSection id="security" title="Security Measures">
        <p>We implement the following technical and organisational security measures:</p>
        <LegalList items={[
          'Passwords hashed using bcrypt (cost factor 12) — never stored in plain text',
          'Authentication via HttpOnly + Secure JWT cookies — not accessible to client-side JavaScript',
          'CSRF token protection on all state-changing requests',
          'Account lockout after 5 consecutive failed login attempts (30-minute lock)',
          'Token blacklisting on logout to prevent replay attacks',
          'Rotating refresh tokens — reuse of a previous refresh token triggers automatic revocation',
          'MongoDB NoSQL injection sanitisation middleware',
          'HTTP security headers via Helmet.js (HSTS, CSP, X-Frame-Options, etc.)',
          'Rate limiting on authentication and API endpoints',
          'CORS restricted to approved origins only',
        ]} />
        <p style={{ marginTop: 12 }}>
          Despite these measures, no internet transmission is 100% secure. We cannot guarantee absolute security of data
          transmitted over the internet.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. When we do, we will revise the "Last Updated" date at the
          top of this page and, where appropriate, notify you via in-app notification or email. Continued use of the Platform
          after changes constitutes acceptance of the revised policy.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="Contact & Grievance">
        <LegalTodo>
          Fill in: Official support email address, Grievance Officer's full name, designation, email address, and
          registered office postal address as required under India's IT (Intermediary Guidelines) Rules, 2021.
        </LegalTodo>
        <LegalSubSection title="Contact Us">
          <LegalList items={[
            'Email: TODO — support@zenius.ai (replace with actual address)',
            'Platform: Use the "Contact Us" feature in your account dashboard to submit a support ticket',
          ]} />
        </LegalSubSection>
        <LegalSubSection title="Grievance Officer">
          <LegalList items={[
            'Name: TODO — [Grievance Officer Full Name]',
            'Designation: TODO — [e.g., Chief Privacy Officer]',
            'Email: TODO — [grievance@zenius.ai]',
            'Address: TODO — [Registered Office Address, City, State, PIN, India]',
            'Response time: Within 30 days of receipt of complaint',
          ]} />
        </LegalSubSection>
      </LegalSection>
    </LegalLayout>
  )
}
