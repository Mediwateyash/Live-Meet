import React from 'react'
import LegalLayout, { LegalSection, LegalSubSection, LegalTodo, LegalList, LegalInfo } from './LegalLayout.jsx'

const SECTIONS = [
  { id: 'overview', title: 'Overview' },
  { id: 'payment-status', title: 'Current Payment Status' },
  { id: 'free-courses', title: 'Free Courses' },
  { id: 'paid-courses', title: 'Paid Courses' },
  { id: 'cancellation', title: 'Cancellation Policy' },
  { id: 'refund-process', title: 'Refund Process' },
  { id: 'non-refundable', title: 'Non-Refundable Items' },
  { id: 'disputes', title: 'Payment Disputes' },
  { id: 'contact', title: 'Contact Us' },
]

export default function RefundPolicy() {
  return (
    <LegalLayout
      title="Refund & Cancellation Policy"
      description="Zenius AI Refund and Cancellation Policy — understand our current refund rules, which courses are free, and how to raise a payment dispute."
      sections={SECTIONS}
      version="1.0"
      effectiveDate="June 26, 2026"
      lastUpdated="June 26, 2026"
    >
      <LegalSection id="overview" title="Overview">
        <p>
          This Refund & Cancellation Policy governs purchases made on the Zenius AI platform at{' '}
          <a href="https://live-meet.onrender.com" style={{ color: '#7C3AED' }}>https://live-meet.onrender.com</a>.
          Please read this policy carefully before enrolling in any paid course.
        </p>
        <LegalTodo>
          This policy must be reviewed and expanded by the operator once a payment gateway is integrated.
          The current policy reflects the platform as analysed from the codebase (no live payment gateway found).
        </LegalTodo>
      </LegalSection>

      <LegalSection id="payment-status" title="Current Payment Status">
        <LegalInfo>
          <strong>Developer Note:</strong> Based on analysis of the Zenius AI codebase, courses have a{' '}
          <code>price</code> field stored in Indian Rupees (INR), but <strong>no active payment gateway</strong>{' '}
          (e.g., Razorpay, Stripe, PayU) has been integrated at this time. Course enrollment is currently processed
          without a live payment flow.
        </LegalInfo>
        <LegalTodo>
          Once a payment gateway is integrated, replace this section with: (1) the name of the payment processor,
          (2) accepted payment methods (cards, UPI, net banking, wallets, etc.), (3) whether GST is applied
          (mandatory for Indian digital services), (4) your GST/GSTIN number, and (5) the exact refund window.
        </LegalTodo>
      </LegalSection>

      <LegalSection id="free-courses" title="Free Courses">
        <p>
          Courses priced at ₹0 (free) are available to all registered users at no charge. No payment is taken and
          therefore no refund is applicable for free course enrollments.
        </p>
      </LegalSection>

      <LegalSection id="paid-courses" title="Paid Courses">
        <LegalSubSection title="4.1 Pricing">
          <p>
            Paid course prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes unless otherwise stated.
          </p>
          <LegalTodo>
            Confirm whether listed prices are inclusive or exclusive of GST (18% on digital educational services in India)
            and update this section accordingly.
          </LegalTodo>
        </LegalSubSection>

        <LegalSubSection title="4.2 Refund Window">
          <LegalTodo>
            Define the refund window once payment is live. A common industry standard for online learning is
            7 or 30 days from enrollment, provided less than a specified percentage of the course has been completed
            (e.g., less than 30% of lessons watched).
          </LegalTodo>
        </LegalSubSection>

        <LegalSubSection title="4.3 Refund Conditions">
          <LegalTodo>
            Define refund eligibility conditions, for example:
            (a) course content materially misrepresented,
            (b) technical error in enrollment,
            (c) course removed by instructor within 7 days of purchase.
          </LegalTodo>
        </LegalSubSection>
      </LegalSection>

      <LegalSection id="cancellation" title="Cancellation Policy">
        <LegalSubSection title="5.1 Cancellation Before Enrollment">
          <p>
            If you have added a course to your wishlist but have not enrolled, you may remove it at any time without any charge.
          </p>
        </LegalSubSection>

        <LegalSubSection title="5.2 Cancellation After Enrollment">
          <LegalTodo>
            Define the cancellation process for paid enrollments and whether cancellation results in an automatic refund
            or requires a separate refund request.
          </LegalTodo>
        </LegalSubSection>

        <LegalSubSection title="5.3 Instructor Cancellation">
          <p>
            In rare cases, Zenius AI may remove or archive a course. If a paid course you enrolled in is removed by the
            platform within 30 days of your enrollment, you will be eligible for a full refund.
          </p>
          <LegalTodo>
            Once a payment gateway is live, define the exact refund timeline for instructor-removed courses
            and the process for initiating such refunds.
          </LegalTodo>
        </LegalSubSection>
      </LegalSection>

      <LegalSection id="refund-process" title="Refund Process">
        <LegalTodo>
          Add the step-by-step refund process once a payment gateway is integrated:
          1. How to request a refund (via support ticket or dedicated form).
          2. Required information (order ID, enrollment date, reason).
          3. Review timeline (e.g., within 5–7 business days).
          4. Refund method (original payment method, bank transfer, etc.).
          5. Refund credit timeline (e.g., 7–14 working days depending on bank).
        </LegalTodo>
        <p>
          Currently, to raise any payment-related concern, please submit a support ticket via the{' '}
          <a href="/contact" style={{ color: '#7C3AED' }}>Contact Us</a> page with the subject "Payment Issue".
        </p>
      </LegalSection>

      <LegalSection id="non-refundable" title="Non-Refundable Items">
        <p>The following are not eligible for refund regardless of circumstances:</p>
        <LegalList items={[
          'Courses for which a completion certificate has already been issued',
          'Enrollments where more than 80% of lessons have been accessed (TODO: confirm threshold)',
          'Course material (notes/PDFs) that have been downloaded',
          'Any services consumed during a completed live lecture session',
          'Quiz attempts already taken',
        ]} />
        <LegalTodo>
          Confirm these non-refundable conditions with the business team and legal counsel before publishing.
        </LegalTodo>
      </LegalSection>

      <LegalSection id="disputes" title="Payment Disputes">
        <p>
          If you have a dispute regarding a payment, please contact us first through the{' '}
          <a href="/contact" style={{ color: '#7C3AED' }}>support system</a> before initiating a chargeback with your bank or payment provider.
          Unwarranted chargebacks may result in account suspension.
        </p>
        <LegalTodo>
          Add the payment processor's dispute resolution process once integrated (e.g., Razorpay Dispute Resolution link).
        </LegalTodo>
        <p style={{ marginTop: 10 }}>
          For unresolved disputes, you may escalate to our{' '}
          <a href="/legal/grievance" style={{ color: '#7C3AED' }}>Grievance Officer</a>.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="Contact Us">
        <LegalTodo>
          Add official refund/billing contact email and response time commitment here.
        </LegalTodo>
        <p>
          For refund or cancellation requests, submit a ticket via{' '}
          <a href="/contact" style={{ color: '#7C3AED' }}>Contact Us</a> with the subject "Refund Request" and include
          your enrolled course name, enrollment date, and registered email address.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
