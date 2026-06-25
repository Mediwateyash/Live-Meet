import React from 'react'
import LegalLayout, { LegalSection, LegalSubSection, LegalTodo, LegalList, LegalInfo } from './LegalLayout.jsx'

const SECTIONS = [
  { id: 'overview', title: 'Overview' },
  { id: 'platform-ip', title: 'Platform Intellectual Property' },
  { id: 'course-content', title: 'Course Content & Instructor IP' },
  { id: 'user-content', title: 'User-Generated Content' },
  { id: 'ai-generated', title: 'AI-Generated Content' },
  { id: 'certificates', title: 'Certificates' },
  { id: 'third-party', title: 'Third-Party Content' },
  { id: 'dmca', title: 'Copyright Infringement & Takedown' },
  { id: 'trademarks', title: 'Trademarks' },
  { id: 'open-source', title: 'Open Source' },
  { id: 'contact', title: 'Copyright Contact' },
]

export default function Copyright() {
  return (
    <LegalLayout
      title="Copyright & Intellectual Property"
      description="Zenius AI Copyright and Intellectual Property Policy — who owns course content, AI-generated MCQs, certificates, and user-uploaded materials on the platform."
      sections={SECTIONS}
      version="1.0"
      effectiveDate="June 26, 2026"
      lastUpdated="June 26, 2026"
    >
      <LegalSection id="overview" title="Overview">
        <p>
          This Copyright & Intellectual Property Policy explains the ownership of all content on the Zenius AI
          platform at <a href="https://live-meet.onrender.com" style={{ color: '#7C3AED' }}>https://live-meet.onrender.com</a>,
          including platform code, course videos, AI-generated quiz questions, study notes, and user-generated content.
        </p>
        <p style={{ marginTop: 10 }}>
          All original content on this Platform is protected under applicable intellectual property laws, including
          the Indian Copyright Act, 1957 and relevant international conventions.
        </p>
        <LegalTodo>
          Insert the legal entity name and its year of establishment or copyright registration details here.
        </LegalTodo>
      </LegalSection>

      <LegalSection id="platform-ip" title="Platform Intellectual Property">
        <p>The following are the exclusive intellectual property of Zenius AI:</p>
        <LegalList items={[
          'The "Zenius AI" name and wordmark',
          'The Zenius AI logo and visual identity (graduation cap icon, purple colour scheme)',
          'The Platform codebase — both server-side (Node.js/Express) and client-side (React)',
          'The Platform\'s unique user interface design, layout, and visual components',
          'The Platform\'s AI MCQ generation workflow and processing pipeline',
          'SEO metadata, structured data schema, and sitemap generation logic',
          'The built-in WebRTC live room architecture and session management system',
          'The certificate template design and generation logic',
        ]} />

        <LegalSubSection title="1.1 Restricted Use">
          <p>
            You may not copy, reproduce, modify, distribute, publish, display, or create derivative works from any
            of the above without explicit written permission from Zenius AI.
          </p>
        </LegalSubSection>
      </LegalSection>

      <LegalSection id="course-content" title="Course Content & Instructor IP">
        <LegalSubSection title="2.1 Instructor Ownership">
          <p>
            Instructors who create and publish courses on Zenius AI retain all intellectual property rights in
            their original course content, including:
          </p>
          <LegalList items={[
            'Recorded lesson videos',
            'Course slide decks, scripts, and teaching materials',
            'Course thumbnails and promotional images (if original)',
            'Written descriptions, learning objectives, and curricula',
            'Study notes uploaded for students',
          ]} />
        </LegalSubSection>

        <LegalSubSection title="2.2 Licence to Zenius AI">
          <p>
            By publishing a course on Zenius AI, instructors grant Zenius AI a <strong>non-exclusive, worldwide,
            royalty-free licence</strong> to:
          </p>
          <LegalList items={[
            'Host, store, and serve the course content to enrolled students via the Platform',
            'Display course metadata (title, description, thumbnail) on public course listing pages',
            'Generate and display SEO metadata from course information',
            'Create platform previews and promotional materials for the course',
          ]} />
          <p style={{ marginTop: 10 }}>
            This licence is limited to Platform operation and does not grant Zenius AI the right to sell or
            license the instructor's content to third parties.
          </p>
        </LegalSubSection>

        <LegalSubSection title="2.3 Student Access">
          <p>
            Students who enrol in a course are granted a limited, personal, non-transferable licence to view and
            access the course content <strong>only through the Platform</strong>. Students must not:
          </p>
          <LegalList items={[
            'Download, copy, or reproduce lesson videos',
            'Re-upload or redistribute course materials elsewhere',
            'Share course access credentials with others',
            'Screen-record course content for distribution',
          ]} />
        </LegalSubSection>
      </LegalSection>

      <LegalSection id="user-content" title="User-Generated Content">
        <LegalSubSection title="3.1 Reviews">
          <p>
            Course reviews and ratings submitted by students are authored by the student. By submitting a review,
            the student grants Zenius AI a licence to display and moderate that review on the Platform.
          </p>
        </LegalSubSection>

        <LegalSubSection title="3.2 Support Tickets">
          <p>
            Content submitted in support tickets (messages and replies) may be retained by Zenius AI for
            administrative, audit, and quality assurance purposes. The submitting user retains ownership.
          </p>
        </LegalSubSection>

        <LegalSubSection title="3.3 Profile Data">
          <p>
            User-uploaded profile photos and bio content remain the property of the user. By uploading, users
            grant Zenius AI a licence to display this content to other Platform users.
          </p>
        </LegalSubSection>
      </LegalSection>

      <LegalSection id="ai-generated" title="AI-Generated Content">
        <p>
          The Zenius AI platform features an AI MCQ Generator that creates multiple-choice questions from
          instructor-uploaded course materials (PDFs, documents). Regarding ownership of AI-generated content:
        </p>
        <LegalList items={[
          'The AI-generated MCQ questions are generated by the Platform\'s AI system using the instructor\'s uploaded material as input',
          'Instructors may use, edit, and publish AI-generated MCQs within the Platform under these Terms',
          'Zenius AI retains the right to the AI generation process, model, and infrastructure',
          'The ownership of AI-generated output as a standalone work is subject to evolving Indian and international law — no absolute claim is asserted by either party at this time',
        ]} />
        <LegalTodo>
          Consult a technology lawyer on the ownership of AI-generated content under Indian Copyright Act, 1957,
          particularly given recent amendments and evolving case law in this area.
        </LegalTodo>
      </LegalSection>

      <LegalSection id="certificates" title="Certificates">
        <p>
          Completion certificates generated by Zenius AI upon course completion are designed and produced by
          Zenius AI. The certificate design, template, and platform branding remain the intellectual property
          of Zenius AI.
        </p>
        <p style={{ marginTop: 10 }}>
          Earners (students) receive a personal, non-transferable right to display their certificate for
          professional and educational purposes. You may:
        </p>
        <LegalList items={[
          'Download your certificate as a PDF',
          'Display it on your professional profile (e.g., LinkedIn)',
          'Include it in your resume or portfolio',
        ]} />
        <p style={{ marginTop: 10 }}>You may not:</p>
        <LegalList items={[
          'Alter or edit the certificate design, name, or content',
          'Sell or transfer your certificate to another person',
          'Represent the certificate as a government, university, or professional certification',
        ]} />
      </LegalSection>

      <LegalSection id="third-party" title="Third-Party Content">
        <LegalSubSection title="7.1 YouTube">
          <p>
            Course lessons may embed YouTube videos. Such videos remain the intellectual property of their
            respective creators and are subject to YouTube's Terms of Service and applicable copyright laws.
            Zenius AI does not claim ownership of YouTube-hosted content.
          </p>
        </LegalSubSection>

        <LegalSubSection title="7.2 Cloudinary">
          <p>
            Media files are stored on Cloudinary's CDN. The files uploaded by instructors remain their property;
            Cloudinary acts as a storage and delivery intermediary.
          </p>
        </LegalSubSection>

        <LegalSubSection title="7.3 Open Source Libraries">
          <p>
            Zenius AI's codebase uses open source libraries including React, Node.js, Express, Mongoose,
            Framer Motion, Lucide React, and others. These are used under their respective open source licences
            (MIT, Apache 2.0, etc.).
          </p>
        </LegalSubSection>
      </LegalSection>

      <LegalSection id="dmca" title="Copyright Infringement & Takedown">
        <p>
          If you believe that content on Zenius AI infringes your copyright, please submit a takedown notice
          containing the following:
        </p>
        <LegalList items={[
          'Your full name and contact information (email, phone)',
          'A description of the copyrighted work you claim has been infringed',
          'The specific URL or course page on Zenius AI where the infringing content appears',
          'A statement that you have a good faith belief that the use is not authorised by the copyright owner',
          'A statement that the information in your notice is accurate and that you are the copyright owner or authorised to act on behalf of the owner',
          'Your electronic or physical signature',
        ]} />
        <LegalTodo>
          Add the dedicated copyright/DMCA contact email address here (e.g., copyright@zenius.ai).
        </LegalTodo>

        <LegalInfo>
          Upon receiving a valid takedown notice, Zenius AI will review the claim and, if valid, remove the
          infringing content within a reasonable period. Repeat infringers may have their accounts terminated.
        </LegalInfo>

        <LegalSubSection title="8.1 Counter-Notice">
          <p>
            If you believe your content was removed by mistake, you may submit a counter-notice to the same
            copyright contact address. Include your contact information, a description of the removed content,
            a statement under penalty of perjury that the content was removed by mistake, and your consent
            to the jurisdiction of the appropriate court.
          </p>
        </LegalSubSection>
      </LegalSection>

      <LegalSection id="trademarks" title="Trademarks">
        <p>
          "Zenius AI" and associated logos are pending or registered trademarks of the Platform operator.
        </p>
        <LegalTodo>
          Confirm trademark registration status and add the registration number if applicable.
        </LegalTodo>
        <p style={{ marginTop: 10 }}>
          You must not use the Zenius AI name or logo without written permission, including in:
        </p>
        <LegalList items={[
          'Promotional materials implying endorsement by Zenius AI',
          'Domain names or social media handles that could cause confusion',
          'Course materials or content on other platforms',
          'Any commercial product or service',
        ]} />
      </LegalSection>

      <LegalSection id="open-source" title="Open Source">
        <p>
          Portions of the Zenius AI platform may be made available as open source software under appropriate
          licences.
        </p>
        <LegalTodo>
          If you intend to open source any part of the platform, add the repository link and applicable licence
          (e.g., MIT, Apache 2.0) here.
        </LegalTodo>
      </LegalSection>

      <LegalSection id="contact" title="Copyright Contact">
        <LegalTodo>
          Add a dedicated copyright/DMCA email address here (e.g., copyright@zenius.ai or legal@zenius.ai).
        </LegalTodo>
        <p>
          For copyright-related queries or to submit a takedown notice, contact our Grievance Officer via the{' '}
          <a href="/legal/grievance" style={{ color: '#7C3AED' }}>Grievance page</a> or email us directly at
          the address to be provided above.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
