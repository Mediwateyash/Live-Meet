import React from 'react'
import LegalLayout, { LegalSection, LegalSubSection, LegalTodo, LegalList, LegalInfo } from './LegalLayout.jsx'

const SECTIONS = [
  { id: 'general', title: 'General Disclaimer' },
  { id: 'educational', title: 'Educational Purpose Only' },
  { id: 'ai-content', title: 'AI-Generated Content' },
  { id: 'third-party', title: 'Third-Party Links & Services' },
  { id: 'accuracy', title: 'Accuracy of Information' },
  { id: 'technical', title: 'Technical Availability' },
  { id: 'certificates', title: 'Certificates & Credentials' },
  { id: 'live-lectures', title: 'Live Lectures' },
  { id: 'liability', title: 'Limitation of Liability' },
  { id: 'contact', title: 'Contact Us' },
]

export default function Disclaimer() {
  return (
    <LegalLayout
      title="Disclaimer"
      description="Zenius AI Disclaimer — important limitations and disclosures about the educational platform, AI-generated content, live lectures, and certificates."
      sections={SECTIONS}
      version="1.0"
      effectiveDate="June 26, 2026"
      lastUpdated="June 26, 2026"
    >
      <LegalSection id="general" title="General Disclaimer">
        <p>
          The information, content, tools, and services provided on the Zenius AI platform at{' '}
          <a href="https://live-meet.onrender.com" style={{ color: '#7C3AED' }}>https://live-meet.onrender.com</a>{' '}
          are provided for <strong>general educational and informational purposes only</strong>.
        </p>
        <p style={{ marginTop: 10 }}>
          While we strive to provide accurate and up-to-date content, Zenius AI makes no representations or warranties —
          express or implied — about the completeness, accuracy, reliability, suitability, or availability of any
          information or content on the Platform.
        </p>
        <LegalTodo>
          Insert the legal entity name of the operator here, e.g., "Zenius AI Technologies Private Limited".
        </LegalTodo>
      </LegalSection>

      <LegalSection id="educational" title="Educational Purpose Only">
        <LegalInfo>
          Content on Zenius AI is strictly educational and does not constitute professional advice of any kind.
        </LegalInfo>
        <p>Specifically:</p>
        <LegalList items={[
          'Technology and cybersecurity courses do not constitute professional security consulting advice',
          'Business or finance courses do not constitute financial, investment, tax, or accounting advice',
          'Health or wellness courses do not constitute medical or clinical advice',
          'Legal topics covered in courses do not constitute legal advice or create a solicitor-client relationship',
          'Any coding or technical content is provided for learning only — do not use in production environments without expert review',
        ]} />
        <p style={{ marginTop: 12 }}>
          Always consult a qualified professional (doctor, lawyer, financial adviser, certified security professional, etc.)
          before acting on any information you learn from this Platform.
        </p>
      </LegalSection>

      <LegalSection id="ai-content" title="AI-Generated Content">
        <p>
          Zenius AI includes an AI MCQ Generator that automatically creates multiple-choice questions from instructor-uploaded
          course material. Please be aware that:
        </p>
        <LegalList items={[
          'AI-generated questions may contain factual errors, omissions, or outdated information',
          'The AI may misinterpret ambiguous content in uploaded documents',
          'Generated questions should be reviewed and verified by the instructor before use in assessments',
          'Zenius AI does not guarantee the accuracy, completeness, or educational value of AI-generated content',
          'AI-generated content does not constitute professional academic assessment design',
          'The AI Quick Quiz feature generates questions on-demand and should be treated as a study aid, not an authoritative test',
        ]} />
        <LegalInfo>
          Instructors are solely responsible for reviewing, editing, and approving AI-generated MCQs before publishing
          them to students. Zenius AI is not liable for learning outcomes resulting from inaccurate AI-generated content.
        </LegalInfo>
      </LegalSection>

      <LegalSection id="third-party" title="Third-Party Links & Services">
        <p>
          The Platform integrates with and may link to third-party services:
        </p>
        <LegalList items={[
          'YouTube — course lessons may embed YouTube videos. We have no control over YouTube\'s content or availability.',
          'Cloudinary — course media and file uploads are hosted on Cloudinary. We cannot guarantee Cloudinary\'s 100% uptime.',
          'External live lecture links — instructors may share external meeting links (e.g., Google Meet, Zoom). We are not responsible for third-party meeting service quality, security, or content.',
          'Instructor portfolios and LinkedIn URLs — external links to instructor profiles are provided for informational purposes only.',
        ]} />
        <p style={{ marginTop: 10 }}>
          The inclusion of any third-party link does not constitute an endorsement by Zenius AI.
        </p>
      </LegalSection>

      <LegalSection id="accuracy" title="Accuracy of Information">
        <p>
          Course content is created by instructors who are independent contributors to the Platform. Zenius AI does not
          verify the accuracy of every piece of content published by instructors. We rely on our content moderation policies
          and community reporting to maintain quality.
        </p>
        <p style={{ marginTop: 10 }}>
          If you believe any course content is inaccurate, misleading, or harmful, please report it via the{' '}
          <a href="/contact" style={{ color: '#7C3AED' }}>support system</a>.
        </p>
      </LegalSection>

      <LegalSection id="technical" title="Technical Availability">
        <p>
          We aim to keep the Platform available 24/7 but do not guarantee uninterrupted access. The Platform may be
          temporarily unavailable due to:
        </p>
        <LegalList items={[
          'Scheduled or emergency server maintenance',
          'Third-party infrastructure issues (Render hosting, MongoDB Atlas, Cloudinary)',
          'WebRTC connectivity issues affecting the built-in live room',
          'Network conditions outside our control',
          'Security-related takedowns or updates',
        ]} />
        <p style={{ marginTop: 10 }}>
          Zenius AI is not responsible for any losses or inconvenience caused by Platform downtime.
        </p>
      </LegalSection>

      <LegalSection id="certificates" title="Certificates & Credentials">
        <p>
          Completion certificates issued by Zenius AI are <strong>platform-generated credentials</strong> that certify
          you have completed the course content on the Platform. They are <strong>not</strong>:
        </p>
        <LegalList items={[
          'Government-recognised qualifications',
          'University or college degrees or diplomas',
          'Professional licences (e.g., medical, legal, engineering licences)',
          'Certifications from any third-party professional body (e.g., PMI, AWS, Google)',
          'Guaranteed to be accepted by any employer',
        ]} />
        <LegalInfo>
          Represent your Zenius AI certificates accurately to employers as online course completion certificates from
          an e-learning platform, not as professional or academic qualifications.
        </LegalInfo>
      </LegalSection>

      <LegalSection id="live-lectures" title="Live Lectures">
        <p>
          Live lecture sessions, whether conducted via external meeting links or the built-in WebRTC live room, are subject
          to the following disclaimers:
        </p>
        <LegalList items={[
          'Zenius AI is not responsible for technical quality (video/audio) of external meeting platforms',
          'WebRTC live room quality depends on your internet connection and device',
          'Zenius AI does not guarantee that all scheduled live lectures will proceed as planned',
          'The content of live lectures is the responsibility of the presenting instructor',
          'We are not liable for any statements made by instructors or other participants during live sessions',
        ]} />
      </LegalSection>

      <LegalSection id="liability" title="Limitation of Liability">
        <p>
          To the fullest extent permitted by applicable law, Zenius AI and its operators, employees, and affiliates
          shall not be liable for:
        </p>
        <LegalList items={[
          'Any direct, indirect, incidental, special, or consequential damages arising from use of the Platform',
          'Loss of data, revenue, or opportunity arising from Platform unavailability',
          'Actions taken or decisions made based on educational content consumed on the Platform',
          'Errors in AI-generated quiz questions affecting student assessments',
          'Third-party service failures (Cloudinary, YouTube, external meeting providers)',
        ]} />
        <LegalTodo>
          Have an Indian legal practitioner review this limitation of liability clause for compliance with
          the Consumer Protection Act, 2019 and IT Act, 2000.
        </LegalTodo>
      </LegalSection>

      <LegalSection id="contact" title="Contact Us">
        <LegalTodo>
          Add official contact email and registered address here.
        </LegalTodo>
        <p>
          For concerns about Platform content or this Disclaimer, use the{' '}
          <a href="/contact" style={{ color: '#7C3AED' }}>Contact Us</a> feature or visit our{' '}
          <a href="/legal/grievance" style={{ color: '#7C3AED' }}>Grievance page</a>.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
