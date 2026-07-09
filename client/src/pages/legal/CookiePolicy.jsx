import React from 'react'
import LegalLayout, { LegalSection, LegalSubSection, LegalTodo, LegalList, LegalInfo } from './LegalLayout.jsx'

const SECTIONS = [
  { id: 'what-are-cookies', title: 'What Are Cookies?' },
  { id: 'cookies-we-use', title: 'Cookies We Use' },
  { id: 'local-storage', title: 'Local Storage' },
  { id: 'third-party', title: 'Third-Party Cookies' },
  { id: 'managing', title: 'Managing Cookies' },
  { id: 'updates', title: 'Policy Updates' },
  { id: 'contact', title: 'Contact Us' },
]

export default function CookiePolicy() {
  return (
    <LegalLayout
      title="Cookie Policy"
      description="Zenius AI Cookie Policy — learn exactly which cookies we set, why, and how to manage them on your device."
      sections={SECTIONS}
      version="1.0"
      effectiveDate="June 26, 2026"
      lastUpdated="June 26, 2026"
    >
      <LegalSection id="what-are-cookies" title="What Are Cookies?">
        <p>
          Cookies are small text files placed on your device by a website when you visit it. They are widely used to make
          websites work, improve user experience, and provide security. Cookies can be "session cookies" (deleted when you
          close your browser) or "persistent cookies" (remain for a set period or until manually deleted).
        </p>
        <p style={{ marginTop: 10 }}>
          This Cookie Policy applies to the Zenius AI platform at{' '}
          <a href="https://live-meet.onrender.com" style={{ color: '#7C3AED' }}>https://live-meet.onrender.com</a>.
          It should be read alongside our <a href="/privacy-policy" style={{ color: '#7C3AED' }}>Privacy Policy</a>.
        </p>
      </LegalSection>

      <LegalSection id="cookies-we-use" title="Cookies We Use">
        <LegalInfo>
          Zenius AI sets only a small number of essential cookies. We do not use advertising, tracking, or analytics
          cookies of any kind.
        </LegalInfo>

        <LegalSubSection title="2.1 accessToken (Essential)">
          <LegalList items={[
            'Purpose: Authenticates your identity for API requests after login',
            'Type: HttpOnly, Secure (not accessible to JavaScript)',
            'Duration: 15 minutes — automatically refreshed by the refreshToken cookie',
            'Set by: Zenius AI server on login, registration, or token refresh',
            'Removable: Yes — deleted when you log out or when the 15-minute TTL expires',
          ]} />
        </LegalSubSection>

        <LegalSubSection title="2.2 refreshToken (Essential)">
          <LegalList items={[
            'Purpose: Silently refreshes your accessToken without requiring you to log in again',
            'Type: HttpOnly, Secure (not accessible to JavaScript)',
            'Duration: Longer-lived than the access token; exact duration configurable in server environment',
            'Set by: Zenius AI server on login or registration',
            'Removable: Yes — deleted when you log out; also invalidated server-side on logout',
          ]} />
          <LegalInfo>
            For security, the refreshToken is rotated on every use. If a previously issued refresh token is reused
            (e.g., by an attacker), the server automatically revokes all sessions for your account.
          </LegalInfo>
        </LegalSubSection>

        <LegalSubSection title="2.3 CSRF Token Cookie (Security)">
          <LegalList items={[
            'Purpose: Protects against Cross-Site Request Forgery (CSRF) attacks on state-changing actions',
            'Type: Not HttpOnly (intentionally readable by JavaScript for CSRF header submission)',
            'Duration: Session cookie — deleted when the browser is closed',
            'Set by: Zenius AI server CSRF middleware',
          ]} />
        </LegalSubSection>

        <div style={{
          overflowX: 'auto',
          marginTop: 20,
          border: '1px solid var(--border-default)',
          borderRadius: 12,
        }}>
          <table style={{
            width: '100%', borderCollapse: 'collapse',
            fontSize: 13, color: 'var(--text-secondary)',
          }}>
            <thead>
              <tr style={{ background: 'var(--bg-muted)' }}>
                {['Cookie Name', 'Category', 'Duration', 'HttpOnly'].map(h => (
                  <th key={h} style={{
                    padding: '10px 14px', textAlign: 'left', fontFamily: 'Outfit, sans-serif',
                    fontWeight: 700, color: 'var(--text-primary)', fontSize: 12,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['accessToken', 'Essential / Auth', '15 minutes', '✅ Yes'],
                ['refreshToken', 'Essential / Auth', 'Extended session', '✅ Yes'],
                ['CSRF Token', 'Essential / Security', 'Session', '❌ No (by design)'],
              ].map(([name, cat, dur, ho], i) => (
                <tr key={name} style={{ borderTop: '1px solid var(--border-default)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-muted)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#7C3AED', fontFamily: 'monospace' }}>{name}</td>
                  <td style={{ padding: '10px 14px' }}>{cat}</td>
                  <td style={{ padding: '10px 14px' }}>{dur}</td>
                  <td style={{ padding: '10px 14px' }}>{ho}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LegalSection>

      <LegalSection id="local-storage" title="Local Storage">
        <p>
          In addition to cookies, the Platform uses the browser's <code>localStorage</code> API to persist certain
          non-personal UI preferences:
        </p>
        <LegalList items={[
          'darkMode — stores your light/dark theme preference (boolean value)',
          'UI state (e.g., sidebar open/closed) — used to maintain interface consistency between sessions',
        ]} />
        <p style={{ marginTop: 10 }}>
          No personal identifiers or authentication data are stored in <code>localStorage</code>. These values stay on
          your device and are never transmitted to our servers.
        </p>
      </LegalSection>

      <LegalSection id="third-party" title="Third-Party Cookies">
        <LegalSubSection title="4.1 YouTube">
          <p>
            Some course lessons embed YouTube videos. When you interact with a YouTube embed, YouTube may set cookies on
            your device according to Google's own policies. These cookies are outside Zenius AI's control. See{' '}
            <a href="https://policies.google.com/privacy" style={{ color: '#7C3AED' }} target="_blank" rel="noreferrer">
              Google's Privacy Policy
            </a>{' '}
            for details.
          </p>
        </LegalSubSection>

        <LegalSubSection title="4.2 Cloudinary">
          <p>
            Media files (images, videos) are served from Cloudinary's CDN. Cloudinary may set performance or
            analytics cookies per its own policy. See{' '}
            <a href="https://cloudinary.com/privacy" style={{ color: '#7C3AED' }} target="_blank" rel="noreferrer">
              Cloudinary's Privacy Policy
            </a>.
          </p>
        </LegalSubSection>

        <LegalInfo>
          Zenius AI does not use Google Analytics, Facebook Pixel, advertising networks, or any third-party marketing cookies.
        </LegalInfo>
      </LegalSection>

      <LegalSection id="managing" title="Managing Cookies">
        <p>
          You can control cookies through your browser settings. Most browsers allow you to view, block, or delete cookies.
          Here are quick links to cookie settings for common browsers:
        </p>
        <LegalList items={[
          'Google Chrome — Settings → Privacy and Security → Cookies and other site data',
          'Mozilla Firefox — Preferences → Privacy & Security → Cookies and Site Data',
          'Safari — Preferences → Privacy → Manage Website Data',
          'Microsoft Edge — Settings → Cookies and site permissions → Cookies and site data',
        ]} />
        <LegalInfo>
          ⚠️ Blocking the accessToken or refreshToken cookies will prevent you from logging into Zenius AI,
          as these are essential for authentication.
        </LegalInfo>
        <p style={{ marginTop: 12 }}>
          You can delete all Zenius AI cookies by logging out of the Platform, which clears both authentication cookies
          from your browser.
        </p>
      </LegalSection>

      <LegalSection id="updates" title="Policy Updates">
        <p>
          We may update this Cookie Policy if we change the cookies we use. Changes will be reflected by an updated
          "Last Updated" date on this page. Where significant, we will notify users via in-app notification.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="Contact Us">
        <LegalTodo>
          Add official contact email and physical address for cookie-related queries.
        </LegalTodo>
        <p>
          Questions about our cookie usage? Contact us via the{' '}
          <a href="/contact" style={{ color: '#7C3AED' }}>support system</a> or see our{' '}
          <a href="/legal/grievance" style={{ color: '#7C3AED' }}>Grievance page</a>.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
