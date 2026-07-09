import React from 'react'
import LegalLayout, { LegalSection, LegalSubSection, LegalTodo, LegalList, LegalInfo } from './LegalLayout.jsx'

const SECTIONS = [
  { id: 'acceptance', title: 'Acceptance of Terms' },
  { id: 'platform-overview', title: 'Platform Overview' },
  { id: 'accounts', title: 'User Accounts & Roles' },
  { id: 'student-obligations', title: 'Student Obligations' },
  { id: 'instructor-obligations', title: 'Instructor Obligations' },
  { id: 'courses-enrollment', title: 'Courses & Enrollment' },
  { id: 'live-lectures', title: 'Live Lectures' },
  { id: 'quizzes-certificates', title: 'Quizzes & Certificates' },
  { id: 'ai-features', title: 'AI-Generated Content' },
  { id: 'intellectual-property', title: 'Intellectual Property' },
  { id: 'prohibited-conduct', title: 'Prohibited Conduct' },
  { id: 'account-suspension', title: 'Account Suspension & Termination' },
  { id: 'disclaimers', title: 'Disclaimers & Limitation of Liability' },
  { id: 'governing-law', title: 'Governing Law & Disputes' },
  { id: 'changes', title: 'Changes to Terms' },
  { id: 'contact', title: 'Contact Us' },
]

export default function Terms() {
  return (
    <LegalLayout
      title="Terms & Conditions"
      description="Zenius AI Terms and Conditions — the legal agreement governing your use of our AI-powered learning platform, live lectures, quizzes, and certificates."
      sections={SECTIONS}
      version="1.0"
      effectiveDate="June 26, 2026"
      lastUpdated="June 26, 2026"
    >
      <LegalSection id="acceptance" title="Acceptance of Terms">
        <p>
          These Terms & Conditions ("<strong>Terms</strong>") constitute a legally binding agreement between you
          ("<strong>User</strong>") and Zenius AI ("<strong>we</strong>", "<strong>our</strong>", "<strong>us</strong>")
          governing your access to and use of the Zenius AI platform at{' '}
          <a href="https://live-meet.onrender.com" style={{ color: '#7C3AED' }}>https://live-meet.onrender.com</a>{' '}
          (the "<strong>Platform</strong>").
        </p>
        <LegalTodo>
          Insert the registered legal entity name (e.g., "Zenius AI Technologies Private Limited, CIN: UXXXXXXMH2026PTC000000,
          registered at [address]") here.
        </LegalTodo>
        <p>
          By registering an account, enrolling in a course, or otherwise using the Platform, you confirm that you have read,
          understood, and agree to these Terms. If you do not agree, do not use the Platform.
        </p>
        <LegalInfo>
          You must be at least 13 years of age to use this Platform. Users between 13–18 must have parental or guardian consent.
        </LegalInfo>
      </LegalSection>

      <LegalSection id="platform-overview" title="Platform Overview">
        <p>Zenius AI is an AI-powered Learning Management System (LMS) that provides:</p>
        <LegalList items={[
          'Video-based courses organised into sections and lessons',
          'Live lectures — both external meeting link type and built-in WebRTC live room',
          'AI MCQ Generator — generates quiz questions from uploaded course materials',
          'Timed multiple-choice quizzes per course',
          'Completion certificates auto-generated upon finishing a course',
          'Study notes uploaded by instructors',
          'Progress tracking per lesson',
          'In-app notifications',
          'Student support ticket system',
          'Instructor creation and management tools',
          'Admin moderation of users, courses, and live lectures',
        ]} />
      </LegalSection>

      <LegalSection id="accounts" title="User Accounts & Roles">
        <LegalSubSection title="3.1 Account Registration">
          <p>
            You must provide accurate, current, and complete information when registering. You are responsible for maintaining
            the confidentiality of your credentials. Do not share your password with any third party.
          </p>
        </LegalSubSection>

        <LegalSubSection title="3.2 User Roles">
          <p>The Platform uses three roles:</p>
          <LegalList items={[
            'Student — the default role upon registration. Students may browse, enrol in, and learn from courses; take quizzes; join live lectures; and earn certificates.',
            'Instructor — granted after submitting an instructor application and receiving admin approval. Instructors may create and publish courses, upload study notes, host live lectures, create quizzes, and view student results.',
            'Admin — internal platform moderators who manage users, approve/reject instructor applications, oversee courses, manage live lectures, and respond to support tickets.',
          ]} />
        </LegalSubSection>

        <LegalSubSection title="3.3 Instructor Application">
          <p>
            To become an instructor, you must submit an application from within your account. Applications are reviewed by
            Zenius AI administrators. Approval is at our sole discretion. We may reject or revoke instructor status without
            specifying a reason.
          </p>
        </LegalSubSection>

        <LegalSubSection title="3.4 One Account Per User">
          <p>You may only maintain one active account. Creating multiple accounts to circumvent restrictions or bans is prohibited.</p>
        </LegalSubSection>
      </LegalSection>

      <LegalSection id="student-obligations" title="Student Obligations">
        <p>As a student you agree to:</p>
        <LegalList items={[
          'Complete quizzes and assessments independently without cheating, sharing answers, or using automated tools',
          'Respect intellectual property — do not screen-record, distribute, or reproduce course materials without permission',
          'Participate respectfully in live lectures and chats',
          'Not submit false reviews or ratings',
          'Report technical issues or concerns via the support ticket system rather than attempting to exploit them',
          'Comply with these Terms and our Community Guidelines',
        ]} />
      </LegalSection>

      <LegalSection id="instructor-obligations" title="Instructor Obligations">
        <p>As an instructor you agree to:</p>
        <LegalList items={[
          'Only upload content you own or have legal rights to publish',
          'Ensure course content is accurate, legal, and not misleading',
          'Not upload content that is obscene, hateful, discriminatory, or illegal',
          'Not upload malware, harmful scripts, or files designed to compromise users\' systems',
          'Respond to legitimate student queries in good faith',
          'Accurately describe your courses — titles, descriptions, and thumbnails must represent actual content',
          'Not use the AI MCQ generator to produce deceptive, harmful, or discriminatory assessments',
          'Accept that Zenius AI may review and remove any content that violates these Terms',
        ]} />
      </LegalSection>

      <LegalSection id="courses-enrollment" title="Courses & Enrollment">
        <LegalSubSection title="6.1 Free and Paid Courses">
          <p>
            Courses on Zenius AI may be free (price = ₹0) or priced in Indian Rupees (INR). Course pricing is set by
            instructors and is subject to change.
          </p>
          <LegalTodo>
            Once a payment gateway (e.g., Razorpay) is integrated, add the payment terms here: accepted methods,
            tax treatment (GST), and when payment is charged.
          </LegalTodo>
        </LegalSubSection>

        <LegalSubSection title="6.2 Enrollment">
          <p>
            Once enrolled, students gain access to all published lessons in that course, associated study notes, and
            any quizzes linked to the course. Enrollment is for personal, non-commercial learning purposes only.
          </p>
        </LegalSubSection>

        <LegalSubSection title="6.3 Course Availability">
          <p>
            Zenius AI does not guarantee that any particular course will remain available indefinitely. Instructors may
            archive courses or we may remove content that violates our policies.
          </p>
        </LegalSubSection>
      </LegalSection>

      <LegalSection id="live-lectures" title="Live Lectures">
        <LegalSubSection title="7.1 Types of Live Lectures">
          <p>Instructors may host live sessions in two modes:</p>
          <LegalList items={[
            'External Link — a third-party meeting URL (e.g., Google Meet, Zoom) shared with enrolled students',
            'Built-in Live Room — a WebRTC-powered live session hosted on the Platform with video, audio, screen sharing, and real-time chat',
          ]} />
        </LegalSubSection>

        <LegalSubSection title="7.2 Attendance Tracking">
          <p>
            The Platform records attendance automatically when you join a live session, including join time, leave time,
            and total duration. This data is visible to the course instructor and platform administrators.
          </p>
        </LegalSubSection>

        <LegalSubSection title="7.3 Recording">
          <p>
            Zenius AI does not automatically record built-in live room sessions. Instructors or students must not
            record live sessions without the explicit consent of all participants.
          </p>
        </LegalSubSection>
      </LegalSection>

      <LegalSection id="quizzes-certificates" title="Quizzes & Certificates">
        <LegalSubSection title="8.1 Quizzes">
          <p>
            Quizzes are timed multiple-choice assessments created by instructors and linked to specific courses. Quiz results
            are stored on the Platform and visible to both the student and the course instructor.
          </p>
        </LegalSubSection>

        <LegalSubSection title="8.2 Academic Integrity">
          <p>
            Submitting quiz answers on behalf of another user, using automated tools, or exploiting vulnerabilities to
            gain an unfair advantage is strictly prohibited and may result in account suspension.
          </p>
        </LegalSubSection>

        <LegalSubSection title="8.3 Certificates">
          <p>
            Completion certificates are generated by Zenius AI upon completing all lessons and passing any required final exam
            for a course. Certificates are digitally generated and may be downloaded in PDF format.
          </p>
          <LegalInfo>
            Zenius AI certificates are platform-issued credentials. They are not equivalent to government-recognised qualifications
            or university degrees and should not be represented as such.
          </LegalInfo>
        </LegalSubSection>
      </LegalSection>

      <LegalSection id="ai-features" title="AI-Generated Content">
        <p>
          The Platform includes an AI MCQ Generator that processes uploaded course material (e.g., PDFs) to generate
          multiple-choice questions. You understand that:
        </p>
        <LegalList items={[
          'AI-generated questions may contain errors, inaccuracies, or biases and should be reviewed by the instructor before publishing',
          'Instructors are responsible for the quality and accuracy of quizzes published on the Platform, even if generated by AI',
          'Uploading copyrighted material for AI processing without rights to do so may constitute infringement',
          'Zenius AI does not guarantee the accuracy, completeness, or fitness of AI-generated content for any particular purpose',
        ]} />
      </LegalSection>

      <LegalSection id="intellectual-property" title="Intellectual Property">
        <LegalSubSection title="10.1 Platform IP">
          <p>
            The Zenius AI name, logo, platform design, codebase, and all related marks are the intellectual property of
            Zenius AI. You may not copy, reproduce, or create derivative works of these elements without written permission.
          </p>
        </LegalSubSection>

        <LegalSubSection title="10.2 Course Content">
          <p>
            Instructors retain ownership of the original course content they create and upload. By publishing content on
            Zenius AI, instructors grant Zenius AI a non-exclusive, royalty-free licence to host, display, and deliver
            that content to enrolled students through the Platform.
          </p>
        </LegalSubSection>

        <LegalSubSection title="10.3 User-Generated Content">
          <p>
            Reviews, support ticket messages, and other user-generated content remain the property of their authors. By
            submitting such content, you grant Zenius AI a licence to use it to operate and improve the Platform.
          </p>
        </LegalSubSection>

        <p>For more detail, see our <a href="/copyright" style={{ color: '#7C3AED' }}>Copyright & Intellectual Property Policy</a>.</p>
      </LegalSection>

      <LegalSection id="prohibited-conduct" title="Prohibited Conduct">
        <p>The following is strictly prohibited on the Platform:</p>
        <LegalList items={[
          'Uploading malware, scripts, or files designed to harm users\' systems',
          'Attempting to gain unauthorised access to other users\' accounts or platform systems',
          'Scraping or automated bulk downloading of course content',
          'Reverse-engineering the Platform\'s codebase or APIs',
          'Posting content that is defamatory, obscene, hateful, or discriminatory',
          'Impersonating other users, instructors, or Zenius AI staff',
          'Sending unsolicited messages or spam to other users',
          'Attempting to manipulate course ratings or reviews fraudulently',
          'Using the Platform for any illegal purpose',
        ]} />
        <p>See also our <a href="/acceptable-use" style={{ color: '#7C3AED' }}>Acceptable Use Policy</a> and{' '}
          <a href="/community-guidelines" style={{ color: '#7C3AED' }}>Community Guidelines</a>.</p>
      </LegalSection>

      <LegalSection id="account-suspension" title="Account Suspension & Termination">
        <p>
          Zenius AI reserves the right to suspend or permanently terminate any account, at our sole discretion, with or
          without prior notice, for:
        </p>
        <LegalList items={[
          'Violation of these Terms or any associated policies',
          'Fraudulent, harmful, or illegal activity',
          'Repeated violations after warnings',
          'Providing false information during registration or instructor application',
          'Actions that damage other users or the reputation of the Platform',
        ]} />
        <p style={{ marginTop: 12 }}>
          The <code>suspended</code> flag on a user account blocks access to all Platform features. If you believe your
          account was suspended in error, contact us via the grievance process.
        </p>
      </LegalSection>

      <LegalSection id="disclaimers" title="Disclaimers & Limitation of Liability">
        <LegalSubSection title="13.1 As-Is Service">
          <p>
            The Platform is provided "as is" and "as available" without warranties of any kind, express or implied.
            We do not warrant that the Platform will be uninterrupted, error-free, or free of harmful components.
          </p>
        </LegalSubSection>

        <LegalSubSection title="13.2 Educational Disclaimer">
          <p>
            Course content on Zenius AI is for educational purposes only. It does not constitute professional advice
            (legal, medical, financial, or otherwise). Always consult a qualified professional for specific advice.
          </p>
        </LegalSubSection>

        <LegalSubSection title="13.3 Limitation of Liability">
          <p>
            To the maximum extent permitted by applicable law, Zenius AI shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages arising out of your use of or inability to use the Platform.
          </p>
          <LegalTodo>
            Have a lawyer review this limitation of liability clause for compliance with applicable Indian consumer protection laws.
          </LegalTodo>
        </LegalSubSection>
      </LegalSection>

      <LegalSection id="governing-law" title="Governing Law & Disputes">
        <p>
          These Terms are governed by the laws of India. Any disputes arising out of or in connection with these Terms shall
          be subject to the exclusive jurisdiction of the courts located in{' '}
          <LegalTodo as="inline">Insert city of jurisdiction (e.g., Mumbai, Bangalore)</LegalTodo>.
        </p>
        <LegalTodo>
          Insert the city/state of the governing jurisdiction for disputes.
        </LegalTodo>
      </LegalSection>

      <LegalSection id="changes" title="Changes to Terms">
        <p>
          We may update these Terms at any time. The revised Terms will be posted on this page with an updated
          "Last Updated" date. Where changes are material, we will notify you via in-app notification or email.
          Continued use of the Platform after changes take effect constitutes acceptance of the new Terms.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="Contact Us">
        <LegalTodo>
          Add official contact email, grievance officer details, and registered office address here.
        </LegalTodo>
        <p>
          For questions about these Terms, use the{' '}
          <a href="/contact" style={{ color: '#7C3AED' }}>Contact Us</a> feature on the Platform or visit our{' '}
          <a href="/legal/grievance" style={{ color: '#7C3AED' }}>Grievance page</a>.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
