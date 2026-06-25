import React from 'react'
import LegalLayout, { LegalSection, LegalSubSection, LegalTodo, LegalList, LegalInfo } from './LegalLayout.jsx'
import { Mail, MapPin, Clock, Phone } from 'lucide-react'

const SECTIONS = [
  { id: 'overview', title: 'Overview' },
  { id: 'contact-methods', title: 'Contact Methods' },
  { id: 'grievance-officer', title: 'Grievance Officer' },
  { id: 'complaints', title: 'Types of Complaints' },
  { id: 'resolution-process', title: 'Resolution Process' },
  { id: 'escalation', title: 'Escalation' },
  { id: 'legal-rights', title: 'Your Legal Rights' },
]

export default function Grievance() {
  return (
    <LegalLayout
      title="Contact & Grievance"
      description="Zenius AI Contact and Grievance page — how to reach us, submit complaints, and escalate unresolved issues. Compliant with India's IT (Intermediary Guidelines) Rules, 2021."
      sections={SECTIONS}
      version="1.0"
      effectiveDate="June 26, 2026"
      lastUpdated="June 26, 2026"
    >
      <LegalSection id="overview" title="Overview">
        <p>
          Zenius AI is committed to addressing user concerns promptly and fairly. This page describes how to
          contact us, how to raise a formal grievance, and what to expect from our resolution process.
        </p>
        <p style={{ marginTop: 10 }}>
          In compliance with the{' '}
          <strong>Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</strong>{' '}
          under the Information Technology Act, 2000, Zenius AI has designated a Grievance Officer to handle
          complaints from Indian users.
        </p>
        <LegalTodo>
          The Grievance Officer details below are placeholders. Fill in the actual officer's full name, designation,
          and contact information before publishing. Indian law requires this officer to acknowledge complaints
          within 24 hours and resolve them within 15 days.
        </LegalTodo>
      </LegalSection>

      <LegalSection id="contact-methods" title="Contact Methods">
        <p>You can reach Zenius AI through the following channels:</p>

        <LegalSubSection title="2.1 In-Platform Support Ticket (Preferred)">
          <p>
            The fastest way to get help is through our built-in support system. Log into your account and navigate
            to <strong>Contact Us</strong> in the sidebar. Select the appropriate category:
          </p>
          <LegalList items={[
            'Bug Report — for technical issues, errors, or broken features',
            'General Feedback — for suggestions or general observations',
            'Course Question — for content-related queries about a specific course',
            'Feature Request — to suggest new features or improvements',
            'Other — for anything not covered above',
          ]} />
          <p style={{ marginTop: 8 }}>
            Responses to support tickets are sent directly through the Platform. You will receive an in-app
            notification when the admin replies.
          </p>
        </LegalSubSection>

        <LegalSubSection title="2.2 Email">
          <LegalTodo>
            Replace this with the actual support email address once confirmed.
          </LegalTodo>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginTop: 8,
            background: 'var(--bg-surface)', border: '1px solid var(--border-purple)',
            borderRadius: 10, padding: '12px 16px',
          }}>
            <Mail size={16} color="#7C3AED" />
            <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>
              TODO: support@zenius.ai
            </span>
          </div>
        </LegalSubSection>

        <LegalSubSection title="2.3 Response Time">
          <LegalList items={[
            'Support ticket replies: typically within 2–5 business days',
            'Formal grievances: acknowledged within 24 hours, resolved within 15 days (as required by Indian IT Rules)',
            'Security vulnerability reports: reviewed within 48 hours',
          ]} />
          <LegalTodo>
            Confirm and commit to these response time SLAs with your team before publishing.
          </LegalTodo>
        </LegalSubSection>
      </LegalSection>

      <LegalSection id="grievance-officer" title="Grievance Officer">
        <LegalInfo>
          The Grievance Officer is appointed as required under Rule 3(2) of the Information Technology
          (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021.
        </LegalInfo>

        <div style={{
          background: 'var(--bg-surface)',
          border: '2px solid var(--border-purple)',
          borderRadius: 16,
          padding: '24px',
          marginTop: 16,
        }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 16 }}>
            Grievance Officer Details
          </div>

          {[
            {
              Icon: 'person',
              label: 'Full Name',
              value: 'TODO: [Grievance Officer Full Name]',
              todo: true,
            },
            {
              label: 'Designation',
              value: 'TODO: [e.g., Chief Privacy Officer / Compliance Manager]',
              todo: true,
            },
            {
              label: 'Organisation',
              value: 'TODO: [Registered Legal Entity Name — e.g., Zenius AI Technologies Pvt. Ltd.]',
              todo: true,
            },
            {
              label: 'Email',
              value: 'TODO: grievance@zenius.ai',
              todo: true,
            },
            {
              label: 'Postal Address',
              value: 'TODO: [Full registered office address including PIN code, City, State, India]',
              todo: true,
            },
            {
              label: 'Office Hours',
              value: 'TODO: Monday–Friday, 10:00 AM – 6:00 PM IST',
              todo: false,
            },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', gap: 12, alignItems: 'flex-start',
              marginBottom: 12, paddingBottom: 12,
              borderBottom: i < 5 ? '1px solid var(--border-default)' : 'none',
            }}>
              <span style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.06em', color: 'var(--text-muted)',
                minWidth: 110, paddingTop: 2,
              }}>{item.label}</span>
              <span style={{
                fontSize: 14,
                color: item.todo ? '#B45309' : 'var(--text-primary)',
                fontWeight: item.todo ? 600 : 400,
              }}>{item.value}</span>
            </div>
          ))}
        </div>

        <LegalTodo>
          All Grievance Officer fields above must be filled with real information before this page is published.
          Indian law requires this officer to be a real, named individual reachable at the given address and email.
        </LegalTodo>
      </LegalSection>

      <LegalSection id="complaints" title="Types of Complaints">
        <p>You may raise a formal grievance for any of the following:</p>
        <LegalList items={[
          'Violation of your privacy or unauthorised use of your personal data',
          'Account incorrectly suspended or banned',
          'Harmful, illegal, or infringing content that was not removed after reporting',
          'Instructor misconduct or misrepresentation in a course',
          'Harassment or bullying in live lectures or via the platform',
          'Unresolved payment or refund disputes',
          'Breach of your data protection rights under India\'s DPDPA, 2023',
          'Any violation of these Terms & Conditions or related policies',
        ]} />
      </LegalSection>

      <LegalSection id="resolution-process" title="Resolution Process">
        <p>Our grievance resolution follows these steps:</p>

        {[
          {
            step: '01',
            title: 'Submit Your Complaint',
            desc: 'Send your grievance by email to the Grievance Officer or submit a support ticket with the subject "Formal Grievance — [brief description]".',
          },
          {
            step: '02',
            title: 'Acknowledgement',
            desc: 'We will acknowledge receipt of your complaint within 24 hours.',
          },
          {
            step: '03',
            title: 'Investigation',
            desc: 'Our team will investigate the matter. We may request additional information from you during this period.',
          },
          {
            step: '04',
            title: 'Resolution',
            desc: 'We will communicate our decision and the action taken within 15 calendar days of receiving the complaint.',
          },
          {
            step: '05',
            title: 'Appeal',
            desc: 'If you are unsatisfied with the outcome, you may escalate the complaint as described in the Escalation section below.',
          },
        ].map(({ step, title, desc }) => (
          <div key={step} style={{
            display: 'flex', gap: 16, marginBottom: 16,
            background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
            borderRadius: 12, padding: '16px',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: 'rgba(124,58,237,0.1)',
              color: '#7C3AED', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>{step}</div>
            <div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
                {title}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</div>
            </div>
          </div>
        ))}
      </LegalSection>

      <LegalSection id="escalation" title="Escalation">
        <p>
          If your grievance remains unresolved after the 15-day period, or if you are unsatisfied with our response,
          you may escalate the matter to:
        </p>

        <LegalSubSection title="6.1 Appellate Committee">
          <p>
            Under the IT Rules 2021, users may appeal to the Grievance Appellate Committee (GAC) established by
            the Government of India. As of the effective date of this policy, the GAC is operational at:
          </p>
          <LegalInfo>
            Grievance Appellate Committee — Ministry of Electronics and Information Technology (MeitY), Government of India.
            Visit <a href="https://gac.gov.in" style={{ color: '#7C3AED' }} target="_blank" rel="noreferrer">gac.gov.in</a> for
            more information.
          </LegalInfo>
        </LegalSubSection>

        <LegalSubSection title="6.2 Consumer Forum">
          <p>
            For consumer disputes, you may approach the appropriate Consumer Disputes Redressal Forum under the
            Consumer Protection Act, 2019.
          </p>
        </LegalSubSection>

        <LegalSubSection title="6.3 Data Protection Authority">
          <p>
            For data protection complaints, once the Data Protection Board of India is established under the
            Digital Personal Data Protection Act, 2023, you may lodge a complaint with it.
          </p>
        </LegalSubSection>
      </LegalSection>

      <LegalSection id="legal-rights" title="Your Legal Rights">
        <p>As a user of Zenius AI, you have the following rights under Indian law:</p>
        <LegalList items={[
          'Right to access personal data we hold about you (Digital Personal Data Protection Act, 2023)',
          'Right to correct inaccurate personal data',
          'Right to erasure of your personal data (subject to legal obligations)',
          'Right to data portability',
          'Right to withdraw consent for data processing',
          'Right to grievance redressal under IT (Intermediary Guidelines) Rules, 2021',
          'Right to approach consumer courts under Consumer Protection Act, 2019',
        ]} />
        <p style={{ marginTop: 12 }}>
          To exercise any of these rights, contact our Grievance Officer at the details listed above.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
