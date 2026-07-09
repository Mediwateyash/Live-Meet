import React from 'react'
import LegalLayout, { LegalSection, LegalSubSection, LegalTodo, LegalList, LegalInfo } from './LegalLayout.jsx'

const SECTIONS = [
  { id: 'purpose', title: 'Purpose & Scope' },
  { id: 'account-use', title: 'Acceptable Account Use' },
  { id: 'prohibited-content', title: 'Prohibited Content & Uploads' },
  { id: 'course-creation', title: 'Course Creation Rules' },
  { id: 'quiz-integrity', title: 'Quiz & Assessment Integrity' },
  { id: 'live-lectures', title: 'Live Lecture Conduct' },
  { id: 'api-access', title: 'API & Automated Access' },
  { id: 'security', title: 'Security Obligations' },
  { id: 'reporting', title: 'Reporting Violations' },
  { id: 'enforcement', title: 'Enforcement' },
  { id: 'contact', title: 'Contact Us' },
]

export default function AcceptableUse() {
  return (
    <LegalLayout
      title="Acceptable Use Policy"
      description="Zenius AI Acceptable Use Policy — rules governing how you may use the platform, upload content, take quizzes, join live lectures, and access APIs."
      sections={SECTIONS}
      version="1.0"
      effectiveDate="June 26, 2026"
      lastUpdated="June 26, 2026"
    >
      <LegalSection id="purpose" title="Purpose & Scope">
        <p>
          This Acceptable Use Policy ("<strong>AUP</strong>") defines the standards of conduct expected from all users
          — students, instructors, and any other person accessing Zenius AI at{' '}
          <a href="https://live-meet.onrender.com" style={{ color: '#7C3AED' }}>https://live-meet.onrender.com</a>.
        </p>
        <p style={{ marginTop: 10 }}>
          This AUP forms part of our <a href="/terms-and-conditions" style={{ color: '#7C3AED' }}>Terms & Conditions</a>.
          Violating this policy may result in content removal, account suspension, or permanent ban.
        </p>
      </LegalSection>

      <LegalSection id="account-use" title="Acceptable Account Use">
        <p>You may use your Zenius AI account to:</p>
        <LegalList items={[
          'Enrol in and complete courses for your personal, non-commercial learning',
          'Submit support tickets for legitimate platform issues',
          'Apply to become an instructor to create educational courses',
          'Participate in live lectures as a learner or presenter',
          'Take quizzes and earn certificates for completed courses',
          'Upload study materials as an approved instructor',
        ]} />
        <p style={{ marginTop: 10 }}>You must not:</p>
        <LegalList items={[
          'Share your account credentials with others',
          'Create multiple accounts (duplicate accounts will be merged or deleted)',
          'Use another user\'s account without their permission',
          'Misrepresent your identity, qualifications, or affiliation',
        ]} />
      </LegalSection>

      <LegalSection id="prohibited-content" title="Prohibited Content & Uploads">
        <LegalInfo>
          This applies to all content including course videos, thumbnails, PDFs, notes, reviews, and support messages.
        </LegalInfo>
        <p>You must not upload, post, or distribute content that:</p>
        <LegalList items={[
          'Is pornographic, obscene, or sexually explicit',
          'Is hateful, discriminatory, or promotes violence based on race, religion, gender, caste, sexual orientation, disability, or nationality',
          'Constitutes harassment, bullying, or threats against any individual',
          'Contains malware, viruses, trojan horses, ransomware, or any other malicious code',
          'Infringes the copyright, trademark, patent, trade secret, or other intellectual property rights of any third party',
          'Violates any applicable law or regulation including Indian IT laws',
          'Contains personally identifiable information of third parties without their consent',
          'Is deliberately false, misleading, or deceptive (e.g., fake credentials, fabricated course reviews)',
          'Promotes illegal activities (including but not limited to fraud, piracy, drug use, or terrorism)',
        ]} />
      </LegalSection>

      <LegalSection id="course-creation" title="Course Creation Rules">
        <p>Approved instructors creating courses on Zenius AI must:</p>
        <LegalList items={[
          'Only use video content they own or have explicit licence to distribute',
          'Only upload PDF materials they own or have rights to use for AI processing',
          'Accurately represent course content in titles, descriptions, and thumbnails',
          'Not embed hidden promotional content or undisclosed affiliate links',
          'Not include content designed to capture or harvest student personal data',
          'Ensure lesson video content is relevant to the stated course topic',
          'Not recycle or resell courses from other platforms without rights',
        ]} />
        <LegalSubSection title="6.1 AI MCQ Generator">
          <p>When using the AI MCQ Generator, instructors must:</p>
          <LegalList items={[
            'Only upload documents they own or have rights to process',
            'Review all generated questions before publishing — you are responsible for their accuracy',
            'Not deliberately upload content to generate harmful, discriminatory, or misleading questions',
            'Not use the generator to create assessments for use outside this Platform without written permission',
          ]} />
        </LegalSubSection>
      </LegalSection>

      <LegalSection id="quiz-integrity" title="Quiz & Assessment Integrity">
        <p>The following quiz-related behaviours are prohibited:</p>
        <LegalList items={[
          'Using automated scripts or bots to submit quiz answers',
          'Sharing quiz questions or correct answers with other users (answer key leakage)',
          'Submitting quiz responses on behalf of another user',
          'Exploiting quiz timer vulnerabilities or network manipulation to gain extra time',
          'Attempting multiple quiz submissions to improve scores via technical manipulation',
          'Reverse-engineering the quiz submission API to pre-determine correct answers',
        ]} />
        <LegalInfo>
          Violations of quiz integrity may result in quiz result invalidation, certificate revocation, and account suspension.
        </LegalInfo>
      </LegalSection>

      <LegalSection id="live-lectures" title="Live Lecture Conduct">
        <LegalSubSection title="8.1 In the Built-in Live Room">
          <p>When using the WebRTC live room:</p>
          <LegalList items={[
            'Do not share or display illegal, offensive, or inappropriate content via screen share or camera',
            'Do not attempt to record the session without all participants\' consent',
            'Do not harass other participants via audio, video, or chat',
            'Do not share external meeting links or personal contact details in live chat without permission',
            'Mute yourself when not speaking to reduce background noise',
          ]} />
        </LegalSubSection>

        <LegalSubSection title="8.2 External Meeting Links">
          <p>
            Instructors sharing external meeting links (e.g., Google Meet, Zoom) are responsible for managing conduct
            within that external meeting. Zenius AI is not responsible for events occurring on third-party platforms.
          </p>
        </LegalSubSection>
      </LegalSection>

      <LegalSection id="api-access" title="API & Automated Access">
        <p>You must not access the Zenius AI API in ways not intended or authorised by the Platform:</p>
        <LegalList items={[
          'Do not scrape course content, user data, or any Platform data using automated tools',
          'Do not reverse-engineer or attempt to reproduce the API for commercial use',
          'Do not bypass rate limiting mechanisms via proxy rotation, IP spoofing, or distributed requests',
          'Do not conduct penetration testing, fuzzing, or vulnerability scanning without written permission from Zenius AI',
          'Do not inject malicious payloads into API requests',
        ]} />
        <p style={{ marginTop: 10 }}>
          If you discover a security vulnerability, please report it responsibly via{' '}
          <a href="/contact" style={{ color: '#7C3AED' }}>our support system</a> rather than exploiting it.
        </p>
      </LegalSection>

      <LegalSection id="security" title="Security Obligations">
        <p>You must not attempt to:</p>
        <LegalList items={[
          'Bypass the account lockout mechanism (5 failed login attempts → 30-minute lock)',
          'Reuse or replay stolen JWT tokens',
          'Forge or tamper with authentication cookies',
          'Perform CSRF attacks or attempt to circumvent CSRF protection',
          'Access another user\'s data without authorisation',
          'Exploit MongoDB query injection or any NoSQL injection vector',
          'Flood the server with requests to cause denial of service',
        ]} />
      </LegalSection>

      <LegalSection id="reporting" title="Reporting Violations">
        <p>
          If you observe a violation of this Acceptable Use Policy, please report it via:
        </p>
        <LegalList items={[
          'The in-platform "Contact Us" support ticket system (category: Bug Report or Other)',
          'Our Grievance Officer — see the Grievance page for details',
        ]} />
        <p style={{ marginTop: 10 }}>
          All reports are reviewed by the admin team. We will take appropriate action including content removal and account suspension.
        </p>
      </LegalSection>

      <LegalSection id="enforcement" title="Enforcement">
        <p>Violations of this AUP may result in any of the following actions, at Zenius AI's sole discretion:</p>
        <LegalList items={[
          'Warning notification sent to the user',
          'Removal of the offending content or course',
          'Temporary account suspension (suspended flag enabled)',
          'Permanent account ban',
          'Reporting to relevant law enforcement authorities for serious violations',
          'Legal action for damages caused by the violation',
        ]} />
        <p style={{ marginTop: 10 }}>
          Zenius AI reserves the right to take immediate action without prior notice for serious violations.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="Contact Us">
        <LegalTodo>
          Add official contact email and Grievance Officer details here.
        </LegalTodo>
        <p>
          Questions about this policy? Contact us via{' '}
          <a href="/contact" style={{ color: '#7C3AED' }}>Contact Us</a> or visit the{' '}
          <a href="/legal/grievance" style={{ color: '#7C3AED' }}>Grievance page</a>.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
