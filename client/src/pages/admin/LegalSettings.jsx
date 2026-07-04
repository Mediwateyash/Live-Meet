import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Shield, FileText, ArrowLeft, ExternalLink, Edit2, CheckCircle2, AlertTriangle, HelpCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

import PageLayout from '../../components/layout/PageLayout.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Button from '../../components/ui/Button.jsx'
import useLegalStore from '../../store/legalStore.js'
import { formatDate } from '../../utils/formatters.js'

const LEGAL_PAGES_META = [
  {
    key: 'privacy-policy',
    label: 'Privacy Policy',
    path: '/privacy-policy',
    desc: 'Details user data collection, storage, and processing rights under Indian IT Law.',
    sections: [
      'Overview', 'Data We Collect', 'How We Use Your Data', 'Cookies & Local Storage',
      'Third-Party Services', 'Data Retention', 'Your Rights', "Children's Privacy",
      'Security Measures', 'Changes to This Policy', 'Contact & Grievance'
    ]
  },
  {
    key: 'terms-and-conditions',
    label: 'Terms & Conditions',
    path: '/terms-and-conditions',
    desc: 'Core service agreements, rules of use, and Indian jurisdiction governing terms.',
    sections: [
      'Overview', 'Account Terms', 'Course Access & Licensing', 'Payments & Refunds',
      'Content Upload Rules', 'AI & MCQ Code Generator', 'Prohibited Activities',
      'IP Ownership', 'Limitation of Liability', 'Termination', 'Indian Jurisdiction & Governing Law'
    ]
  },
  {
    key: 'cookie-policy',
    label: 'Cookie Policy',
    path: '/cookie-policy',
    desc: 'Explains what cookies are, why we use them, and user consent choices.',
    sections: [
      'Overview', 'What Are Cookies', 'Types of Cookies We Use', 'Why We Use Cookies',
      'Third-Party Cookies', 'Managing Cookies', 'Local Storage Usage', 'Updates to Policy', 'Contact Details'
    ]
  },
  {
    key: 'refund-policy',
    label: 'Refund & Cancellation',
    path: '/refund-policy',
    desc: 'Specifies refund eligibility, cancellation process, and instructor payout impacts.',
    sections: [
      'Overview', 'Refund Eligibility', 'Non-Refundable Items', 'Cancellation Process',
      'Instructor Compensation Impact', 'Dispute Resolution', 'Contact Info'
    ]
  }
]

export default function LegalSettings() {
  const navigate = useNavigate()
  const { pages, loaded, loading, fetchPages, togglePage } = useLegalStore()
  const [toggling, setToggling] = useState({})
  const [editModalPage, setEditModalPage] = useState(null)

  useEffect(() => {
    fetchPages(true)
  }, [fetchPages])

  const handleToggle = async (key) => {
    setToggling(prev => ({ ...prev, [key]: true }))
    try {
      const updated = await togglePage(key)
      toast.success(`${updated.pageKey} is now ${updated.isEnabled ? 'enabled' : 'disabled'}!`)
    } catch {
      toast.error(`Failed to toggle status for ${key}`)
    } finally {
      setToggling(prev => ({ ...prev, [key]: false }))
    }
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Breadcrumb / Back button */}
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 mb-6 text-sm font-semibold transition-colors hover:text-[#7C3AED]"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#7C3AED' }}>
                <Shield size={20} color="white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                Feature Flag Settings
              </h1>
            </div>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Enable or disable visibility of legal documents and website features. Disabled pages will show a beautiful fallback screen.
            </p>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold w-fit"
            style={{ background: 'var(--z-purple-100, #F3E8FF)', color: '#7C3AED', border: '1px solid rgba(124,58,237,0.1)' }}
          >
            <CheckCircle2 size={14} />
            Phase 1: Feature Flags Live
          </div>
        </div>

        {/* Legal Pages Grid */}
        {loading && !loaded ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-48 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {LEGAL_PAGES_META.map((meta) => {
              const dbPage = pages[meta.key]
              const isEnabled = dbPage ? dbPage.isEnabled : true
              const isToggling = toggling[meta.key]
              const lastToggled = dbPage?.lastToggledAt ? new Date(dbPage.lastToggledAt) : null

              return (
                <div
                  key={meta.key}
                  className="rounded-2xl p-5 sm:p-6 transition-all hover:shadow-md border flex flex-col justify-between"
                  style={{
                    background: 'var(--bg-surface)',
                    borderColor: isEnabled ? 'var(--border-default)' : 'rgba(239, 68, 68, 0.2)',
                  }}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            background: isEnabled ? 'var(--z-purple-100, rgba(124, 58, 237, 0.15))' : 'var(--danger-bg, rgba(239, 68, 68, 0.15))',
                            color: isEnabled ? 'var(--z-purple-500, #7C3AED)' : 'var(--danger, #EF4444)'
                          }}
                        >
                          <FileText size={18} />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                            {meta.label}
                          </h3>
                          <a
                            href={meta.path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold mt-0.5 hover:underline"
                            style={{ color: '#7C3AED' }}
                          >
                            View Live <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>

                      {/* Status indicator */}
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0"
                        style={{
                          background: isEnabled ? 'var(--success-bg, rgba(16, 185, 129, 0.15))' : 'var(--danger-bg, rgba(239, 68, 68, 0.15))',
                          color: isEnabled ? 'var(--success, #10B981)' : 'var(--danger, #EF4444)'
                        }}
                      >
                        {isEnabled ? 'Live' : 'Offline'}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs mb-5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      {meta.desc}
                    </p>
                  </div>

                  {/* Controls */}
                  <div className="border-t pt-4" style={{ borderColor: 'var(--border-default)' }}>
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div>
                        <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                          Status Visibility
                        </span>
                        {lastToggled && (
                          <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            Toggled: {formatDate(lastToggled)}
                          </p>
                        )}
                      </div>

                      {/* Switch button */}
                      <button
                        onClick={() => handleToggle(meta.key)}
                        disabled={isToggling}
                        style={{
                          position: 'relative',
                          width: '46px',
                          height: '24px',
                          borderRadius: '9999px',
                          background: isEnabled ? 'var(--success, #10B981)' : 'var(--border-default, #D1D5DB)',
                          border: 'none',
                          cursor: isToggling ? 'not-allowed' : 'pointer',
                          transition: 'background-color 0.2s',
                          padding: 0,
                          opacity: isToggling ? 0.6 : 1,
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            top: '2px',
                            left: isEnabled ? '24px' : '2px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: '#FFFFFF',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            transition: 'left 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isToggling && (
                            <svg className="animate-spin h-3 w-3 text-gray-400" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                          )}
                        </span>
                      </button>
                    </div>

                    {/* Edit button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs font-semibold flex items-center justify-center gap-1.5"
                      onClick={() => setEditModalPage(meta)}
                    >
                      <Edit2 size={12} />
                      Edit Content & Sections
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Phase 2 Informational modal */}
        <Modal
          isOpen={!!editModalPage}
          onClose={() => setEditModalPage(null)}
          title={`Edit Page Content — ${editModalPage?.label}`}
          size="lg"
        >
          {editModalPage && (
            <div style={{ fontFamily: 'Outfit, sans-serif' }}>
              <div
                className="flex items-start gap-3 p-4 rounded-xl mb-6"
                style={{
                  background: 'var(--warning-bg, rgba(245, 158, 11, 0.15))',
                  border: '1px solid var(--warning, #F59E0B)'
                }}
              >
                <AlertTriangle size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--warning, #F59E0B)' }} />
                <div>
                  <h4 className="font-bold text-xs" style={{ color: 'var(--warning, #D97706)' }}>
                    Phase 2 Content Editor (Schema Ready)
                  </h4>
                  <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    Per user requirements, legal content is currently read-only. However, the database schema (<code>LegalPage.customContent</code>) is fully structured to support dynamic section HTML overrides without database migrations.
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <span className="text-[11px] font-bold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
                  Page Key in MongoDB
                </span>
                <p
                  className="text-sm font-semibold mt-0.5 py-1.5 px-3 rounded-lg w-fit"
                  style={{ background: 'var(--bg-muted, #F3F4F6)', color: 'var(--text-primary)' }}
                >
                  {editModalPage.key}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-bold tracking-wider uppercase block mb-3" style={{ color: 'var(--text-muted)' }}>
                  Dynamic Section Outlines (Phase 2 Targets)
                </span>
                <div
                  className="max-h-[220px] overflow-y-auto border rounded-xl divide-y p-2"
                  style={{ borderColor: 'var(--border-default)', background: 'var(--bg-surface)' }}
                >
                  {editModalPage.sections.map((section, idx) => (
                    <div
                      key={idx}
                      className="py-2.5 px-3 flex items-center justify-between text-xs border-b last:border-b-0"
                      style={{ borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                    >
                      <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        {idx + 1}. {section}
                      </span>
                      <span
                        className="text-[9px] font-bold px-2 py-0.5 rounded select-none flex items-center gap-1"
                        style={{
                          background: 'var(--z-purple-100, rgba(124, 58, 237, 0.15))',
                          color: 'var(--z-purple-50, #8B5CF6)',
                          border: '1px solid var(--border-purple, rgba(124, 58, 237, 0.2))'
                        }}
                      >
                        <HelpCircle size={10} />
                        <code>{section.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}</code>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 border-t pt-4" style={{ borderColor: 'var(--border-default)' }}>
                <Button variant="outline" onClick={() => setEditModalPage(null)}>
                  Close
                </Button>
                <Button disabled={true}>
                  Save Overrides (Phase 2 Locked)
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </PageLayout>
  )
}
