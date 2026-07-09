import React from 'react'
import LegalLayout, { LegalSection, LegalSubSection, LegalTodo, LegalList, LegalInfo } from './LegalLayout.jsx'

const SECTIONS = [
  { id: 'our-values', title: 'Our Values' },
  { id: 'respectful-communication', title: 'Respectful Communication' },
  { id: 'course-content', title: 'Course Content Standards' },
  { id: 'live-lectures', title: 'Live Lecture Etiquette' },
  { id: 'reviews-feedback', title: 'Reviews & Feedback' },
  { id: 'support-tickets', title: 'Support Tickets' },
  { id: 'quiz-conduct', title: 'Quiz Conduct' },
  { id: 'instructor-standards', title: 'Instructor Standards' },
  { id: 'enforcement', title: 'Enforcement & Consequences' },
  { id: 'reporting', title: 'Reporting Harmful Content' },
]

export default function CommunityGuidelines() {
  return (
    <LegalLayout
      title="Community Guidelines"
      description="Zenius AI Community Guidelines — the standards of behaviour expected in live lectures, course reviews, support tickets, and all platform interactions."
      sections={SECTIONS}
      version="1.0"
      effectiveDate="June 26, 2026"
      lastUpdated="June 26, 2026"
    >
      <LegalSection id="our-values" title="Our Values">
        <p>
          Zenius AI is an educational community built around curiosity, growth, and mutual respect. We serve students
          across skill levels — from complete beginners to experienced professionals — and instructors who invest their
          knowledge in others.
        </p>
        <p style={{ marginTop: 10 }}>
          These Community Guidelines exist to ensure every person on the Platform — regardless of background, age,
          or experience level — feels safe, valued, and able to learn freely.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 20 }}>
          {[
            { emoji: '🤝', label: 'Respect', desc: 'Treat everyone with dignity' },
            { emoji: '🎓', label: 'Integrity', desc: 'Be honest in assessments' },
            { emoji: '🔒', label: 'Safety', desc: 'Protect your and others\' privacy' },
            { emoji: '📚', label: 'Accuracy', desc: 'Share correct information' },
            { emoji: '🌍', label: 'Inclusion', desc: 'Welcome all backgrounds' },
          ].map(v => (
            <div key={v.label} style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-purple)',
              borderRadius: 12, padding: '14px 16px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{v.emoji}</div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{v.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{v.desc}</div>
            </div>
          ))}
        </div>
      </LegalSection>

      <LegalSection id="respectful-communication" title="Respectful Communication">
        <p>All communication on the Platform — whether in live lecture chats, support tickets, or course reviews — must be:</p>
        <LegalList items={[
          'Respectful and constructive in tone, even when offering criticism',
          'Free from personal attacks, insults, and ad hominem remarks',
          'Free from hate speech, slurs, or content targeting individuals based on race, gender, caste, religion, sexual orientation, disability, or nationality',
          'Free from threats, intimidation, or harassment of any kind',
          'Written in a language that is clear and understandable',
        ]} />

        <LegalSubSection title="2.1 What Is Not Acceptable">
          <LegalList items={[
            '"Your course is terrible, you\'re an idiot" — personal attack (not acceptable)',
            '"This topic was confusing — I\'d love a clearer explanation of X" — constructive criticism (acceptable)',
            'Sharing another user\'s personal contact details without their consent (doxxing)',
            'Sending unsolicited messages or promotions to other users',
          ]} />
        </LegalSubSection>
      </LegalSection>

      <LegalSection id="course-content" title="Course Content Standards">
        <p>Instructors publishing content on Zenius AI must ensure their courses:</p>
        <LegalList items={[
          'Are accurate and reflect current knowledge in the subject area',
          'Have a clearly defined learning objective stated in the course description',
          'Use video, audio, and thumbnail images of reasonable quality',
          'Do not contain undisclosed promotional content or affiliate advertising',
          'Do not misrepresent the instructor\'s qualifications, credentials, or teaching experience',
          'Are appropriate for all age groups on the Platform (13+ audience)',
          'Use section and lesson titles that accurately describe the content',
        ]} />

        <LegalSubSection title="3.1 Study Notes">
          <p>Notes uploaded by instructors should:</p>
          <LegalList items={[
            'Be relevant to the course content and the specific lesson/chapter they are attached to',
            'Not contain personally identifiable information of third parties',
            'Be materials the instructor has rights to distribute',
          ]} />
        </LegalSubSection>
      </LegalSection>

      <LegalSection id="live-lectures" title="Live Lecture Etiquette">
        <LegalSubSection title="4.1 For Students (Attendees)">
          <LegalList items={[
            'Join sessions on time — your join time is recorded in the attendance log',
            'Mute your microphone when not speaking',
            'Use the chat function for questions, not off-topic conversations',
            'Do not share the meeting link or session ID with non-enrolled users',
            'Do not attempt to record the session without explicit consent from all participants',
            'Do not share inappropriate screen content during shared sessions',
          ]} />
        </LegalSubSection>

        <LegalSubSection title="4.2 For Instructors (Hosts)">
          <LegalList items={[
            'Start sessions on time or inform students of delays via notifications',
            'Moderate the chat to prevent harassment or off-topic disruption',
            'Do not share personal student data during live sessions',
            'Ensure your screen share does not reveal private information',
            'Set realistic and accurate session duration expectations',
            'Manage attendance professionally — students can see when they join and leave',
          ]} />
        </LegalSubSection>

        <LegalInfo>
          Zenius AI records attendance (join/leave timestamps and duration) for all live sessions.
          This data is visible to the course instructor and platform administrators.
        </LegalInfo>
      </LegalSection>

      <LegalSection id="reviews-feedback" title="Reviews & Feedback">
        <p>Course reviews and ratings help students make informed decisions. Your review must:</p>
        <LegalList items={[
          'Reflect your genuine, personal experience of the course',
          'Be based on content you have actually accessed',
          'Focus on the course content, delivery, and quality — not the instructor\'s personal characteristics',
          'Be written in good faith without personal vendettas',
        ]} />
        <p style={{ marginTop: 10 }}>Reviews must not:</p>
        <LegalList items={[
          'Be fake, incentivised, or submitted by people who have not taken the course',
          'Contain personal attacks on the instructor',
          'Include promotional content for competing platforms',
          'Be deliberately submitted to harm an instructor\'s reputation without basis',
        ]} />
      </LegalSection>

      <LegalSection id="support-tickets" title="Support Tickets">
        <p>The support ticket system is for genuine assistance requests. Please:</p>
        <LegalList items={[
          'Choose the correct category: Bug Report, General Feedback, Course Question, Feature Request, or Other',
          'Describe your issue clearly and concisely',
          'Do not submit multiple tickets for the same issue (this slows down our response)',
          'Treat the support team with respect — we aim to respond as quickly as possible',
          'Do not use the support system to harass or threaten staff',
        ]} />
        <LegalInfo>
          Abusive support tickets may result in account suspension.
        </LegalInfo>
      </LegalSection>

      <LegalSection id="quiz-conduct" title="Quiz Conduct">
        <p>
          Quizzes on Zenius AI are designed to assess genuine learning. All quiz attempts must be:
        </p>
        <LegalList items={[
          'Completed independently without assistance from others',
          'Submitted within the defined time limit without using time manipulation',
          'Taken without sharing answers, questions, or screenshots with others',
        ]} />
        <p style={{ marginTop: 10 }}>
          Academic dishonesty undermines the value of certificates for all learners. If you observe cheating,
          please report it via the support system.
        </p>
      </LegalSection>

      <LegalSection id="instructor-standards" title="Instructor Standards">
        <p>
          Instructors on Zenius AI are expected to uphold a high standard of professionalism because students trust
          them as educators. Beyond the technical requirements in our{' '}
          <a href="/acceptable-use" style={{ color: '#7C3AED' }}>Acceptable Use Policy</a>, instructors should:
        </p>
        <LegalList items={[
          'Be responsive and engaged with student feedback where possible',
          'Update course content when significant errors are reported',
          'Disclose any conflicts of interest in course content',
          'Not impersonate professional credentials they do not hold',
          'Create an inclusive learning environment for students of all backgrounds',
        ]} />
      </LegalSection>

      <LegalSection id="enforcement" title="Enforcement & Consequences">
        <p>
          Community Guideline violations are reviewed by platform administrators. Depending on the severity and frequency,
          consequences may include:
        </p>
        <LegalList items={[
          'Content removal (review, note, course, or comment)',
          'Warning message sent via in-app notification',
          'Temporary account suspension',
          'Permanent account ban (for serious or repeated violations)',
          'Revocation of instructor status',
          'Referral to law enforcement for illegal conduct',
        ]} />
        <LegalInfo>
          First-time, minor violations typically result in a warning. Serious violations (e.g., posting malware,
          doxxing, hate speech) may result in immediate permanent ban without warning.
        </LegalInfo>
      </LegalSection>

      <LegalSection id="reporting" title="Reporting Harmful Content">
        <p>
          See something that violates these guidelines? Please report it via:
        </p>
        <LegalList items={[
          'Support Ticket — use the "Contact Us" feature and select "Bug Report" or "Other"',
          'Grievance Officer — for serious violations, see our Grievance page',
        ]} />
        <p style={{ marginTop: 10 }}>
          All reports are investigated by our admin team. We aim to respond within 3–5 business days.
          Frivolous or malicious reports are themselves a violation of these guidelines.
        </p>
        <LegalTodo>
          Define the exact reporting response time SLA and add the Grievance Officer contact details
          once confirmed.
        </LegalTodo>
      </LegalSection>
    </LegalLayout>
  )
}
