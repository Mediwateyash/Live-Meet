import React, { useEffect, useState } from 'react'
import {
  Check,
  X,
  Eye,
  User,
  Mail,
  Phone,
  Briefcase,
  FileText,
  ExternalLink,
  Globe,
  GraduationCap,
  Building,
  Clock,
  BookOpen,
  Video,
  FileCheck,
  Download,
  Sparkles,
} from 'lucide-react'
import PageLayout from '../../components/layout/PageLayout.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Button from '../../components/ui/Button.jsx'
import { adminAPI } from '../../api/admin.js'
import { formatDate } from '../../utils/formatters.js'
import toast from 'react-hot-toast'

const STATUS_TABS = ['pending', 'approved', 'rejected']
const BADGE = { pending: 'amber', approved: 'green', rejected: 'red' }

// Custom Brand Icons for LinkedIn & GitHub
const LinkedInIcon = ({ size = 15, className = "text-purple-600" }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
  </svg>
)

const GitHubIcon = ({ size = 15, className = "text-purple-600" }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/>
  </svg>
)

export default function AdminRequests() {
  const [tab, setTab] = useState('pending')
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  // View detail modal
  const [viewModal, setViewModal] = useState(null)
  // Approve confirm modal
  const [approveModal, setApproveModal] = useState(null)
  // Reject modal
  const [rejectModal, setRejectModal] = useState(null)
  const [reason, setReason] = useState('')
  const [processing, setProcessing] = useState(false)

  const load = () => {
    setLoading(true)
    adminAPI
      .getRequests({ status: tab })
      .then(({ data }) => setRequests(data.data))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [tab])

  const handleApprove = async () => {
    setProcessing(true)
    try {
      await adminAPI.approveRequest(approveModal._id)
      toast.success(`${approveModal.fullName} approved as instructor!`)
      setApproveModal(null)
      if (viewModal?._id === approveModal?._id) setViewModal(null)
      load()
    } catch {
      toast.error('Could not approve request')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!reason.trim()) {
      toast.error('Please enter a rejection reason')
      return
    }
    setProcessing(true)
    try {
      await adminAPI.rejectRequest(rejectModal._id, { reason })
      toast.success('Application rejected')
      setRejectModal(null)
      if (viewModal?._id === rejectModal?._id) setViewModal(null)
      setReason('')
      load()
    } catch {
      toast.error('Could not reject request')
    } finally {
      setProcessing(false)
    }
  }

  const handlePreviewResume = (resume) => {
    if (!resume) return
    const url = typeof resume === 'string' ? resume : resume.dataUrl
    if (!url) {
      toast.error('Resume URL not available')
      return
    }
    if (url.startsWith('data:application/pdf')) {
      const win = window.open('')
      if (win) {
        win.document.write(
          `<iframe src="${url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
        )
        win.document.title = resume.name || 'Resume Preview'
      } else {
        toast.error('Pop-up blocked. Please allow pop-ups to view PDF.')
      }
    } else {
      window.open(url, '_blank')
    }
  }

  const handleDownloadResume = (resume) => {
    if (!resume) return
    const url = typeof resume === 'string' ? resume : resume.dataUrl
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = resume.name || 'Resume.pdf'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <h1 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
          Instructor Requests
        </h1>

        {/* Tabs with horizontal scroll wrapper on mobile */}
        <div className="overflow-x-auto -webkit-overflow-scrolling-touch mb-8 pb-1 scrollbar-none">
          <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--z-purple-100)' }}>
            {STATUS_TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all whitespace-nowrap"
                style={{ background: tab === t ? '#7C3AED' : 'transparent', color: tab === t ? 'white' : 'var(--text-secondary)' }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="skeleton h-64 rounded-2xl" />
        ) : requests.length === 0 ? (
          <div className="text-center py-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400">
            <User size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-base font-medium">No {tab} requests</p>
            <p className="text-sm mt-1 text-slate-500">
              {tab === 'pending' ? 'All instructor applications have been reviewed.' : `No ${tab} applications to display.`}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-card hidden md:block border border-slate-200 dark:border-slate-800">
              <div className="table-responsive">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr style={{ background: '#EDE9FE', borderBottom: '1px solid var(--border-purple)' }}>
                      {['#', 'Applicant', 'Contact', 'Department / Expertise', 'Applied', 'Status', 'Actions'].map((h) => (
                        <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: '#5B21B6' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req, i) => (
                      <tr key={req._id || i} className="transition-colors hover:bg-purple-50/20 border-b border-slate-100 dark:border-slate-800">
                        <td className="px-5 py-4 text-sm font-medium text-slate-400">{i + 1}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
                              {req.fullName?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <span className="text-sm font-semibold block text-slate-900 dark:text-white">{req.fullName}</span>
                              {req.occupation && <span className="text-xs text-slate-400 block">{req.occupation}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-xs space-y-0.5 text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-1"><Mail size={11} /> {req.email}</div>
                            {req.phone && <div className="flex items-center gap-1"><Phone size={11} /> {req.phone}</div>}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            {req.department && <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 block">{req.department}</span>}
                            <div className="flex flex-wrap gap-1">
                              {req.expertise?.slice(0, 2).map((e) => <Badge key={e} variant="purple">{e}</Badge>)}
                              {req.expertise?.length > 2 && <Badge variant="gray">+{req.expertise.length - 2}</Badge>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-400">{formatDate(req.createdAt)}</td>
                        <td className="px-5 py-4"><Badge variant={BADGE[req.status]}>{req.status}</Badge></td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            {req.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => setApproveModal(req)}
                                  title="Approve"
                                  className="p-2 rounded-lg transition-all hover:bg-emerald-50 text-emerald-600 border border-emerald-200"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  onClick={() => setRejectModal(req)}
                                  title="Reject"
                                  className="p-2 rounded-lg transition-all hover:bg-rose-50 text-rose-600 border border-rose-200"
                                >
                                  <X size={16} />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => setViewModal(req)}
                              title="View Details"
                              className="p-2 rounded-lg transition-all hover:bg-purple-50 text-purple-600 border border-purple-200"
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Stacked Card View */}
            <div className="space-y-4 md:hidden">
              {requests.map((req, i) => (
                <div key={req._id || i} className="rounded-2xl p-4 border flex flex-col gap-3.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
                        {req.fullName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-bold block truncate text-slate-900 dark:text-white">{req.fullName}</span>
                        {req.department && <span className="text-xs text-purple-600 font-semibold">{req.department}</span>}
                      </div>
                    </div>
                    <Badge variant={BADGE[req.status]}>{req.status}</Badge>
                  </div>

                  <div className="flex flex-col gap-1.5 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 truncate"><Mail size={12} className="shrink-0" /> {req.email}</div>
                    {req.phone && <div className="flex items-center gap-1.5"><Phone size={12} className="shrink-0" /> {req.phone}</div>}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                    <span>Applied: {formatDate(req.createdAt)}</span>
                  </div>

                  <div className="flex gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                    {req.status === 'pending' && (
                      <>
                        <button
                          onClick={() => setApproveModal(req)}
                          className="flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-xl border text-xs font-bold text-emerald-600 border-emerald-200 bg-emerald-50/50"
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          onClick={() => setRejectModal(req)}
                          className="flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-xl border text-xs font-bold text-rose-600 border-rose-200 bg-rose-50/50"
                        >
                          <X size={14} /> Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setViewModal(req)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-xl border text-xs font-bold text-purple-600 border-purple-200 bg-purple-50/50"
                    >
                      <Eye size={14} /> Review All Fields
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Upgrade 17-Field Admin Review Modal ── */}
        <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} title="Instructor Application Review" size="xl">
          {viewModal && (
            <div className="space-y-6 pb-20 sm:pb-16 relative">
              {/* 1. Applicant Summary Header */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-inner">
                    {viewModal.fullName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold tracking-tight">{viewModal.fullName}</h3>
                    <p className="text-xs text-purple-200 mt-0.5 flex items-center gap-2">
                      <span>{viewModal.department || 'General Educator'}</span>
                      <span>•</span>
                      <span>{viewModal.occupation || 'Applicant'}</span>
                      <span>•</span>
                      <span>{viewModal.experience || 'Fresher'}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    viewModal.status === 'approved'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      : viewModal.status === 'rejected'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                  }`}>
                    {viewModal.status === 'approved' ? '🟢 Approved' : viewModal.status === 'rejected' ? '🔴 Rejected' : '🟡 Pending Review'}
                  </span>
                </div>
              </div>

              {/* 2. Personal Information */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center gap-2">
                  <User size={15} className="text-purple-600" />
                  <span>Personal Information</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                    <span className="text-slate-400 text-[11px] block font-medium">Full Name</span>
                    <span className="font-semibold text-slate-900 dark:text-white block mt-0.5">{viewModal.fullName}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                    <span className="text-slate-400 text-[11px] block font-medium">Email Address</span>
                    <span className="font-semibold text-slate-900 dark:text-white truncate block mt-0.5">{viewModal.email}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                    <span className="text-slate-400 text-[11px] block font-medium">Phone Number</span>
                    <span className="font-semibold text-slate-900 dark:text-white block mt-0.5">{viewModal.phone || 'N/A'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                    <span className="text-slate-400 text-[11px] block font-medium">Country</span>
                    <span className="font-semibold text-slate-900 dark:text-white block mt-0.5">{viewModal.country || 'India'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                    <span className="text-slate-400 text-[11px] block font-medium">Applied Date</span>
                    <span className="font-semibold text-slate-900 dark:text-white block mt-0.5">{formatDate(viewModal.createdAt)}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                    <span className="text-slate-400 text-[11px] block font-medium">Status</span>
                    <span className="font-semibold capitalize text-purple-700 dark:text-purple-300 block mt-0.5">{viewModal.status}</span>
                  </div>
                </div>
              </div>

              {/* 3. Professional Information */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center gap-2">
                  <GraduationCap size={15} className="text-purple-600" />
                  <span>Professional Information</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs sm:text-sm">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                    <span className="text-slate-400 text-[11px] block font-medium">Department / Subject Area</span>
                    <span className="font-semibold text-slate-900 dark:text-white block mt-0.5">{viewModal.department || 'Not Provided'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                    <span className="text-slate-400 text-[11px] block font-medium">Highest Qualification</span>
                    <span className="font-semibold text-slate-900 dark:text-white block mt-0.5">{viewModal.qualification || 'Not Provided'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                    <span className="text-slate-400 text-[11px] block font-medium">Current Occupation</span>
                    <span className="font-semibold text-slate-900 dark:text-white block mt-0.5">{viewModal.occupation || 'Not Provided'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                    <span className="text-slate-400 text-[11px] block font-medium">Organization / Company</span>
                    <span className="font-semibold text-slate-900 dark:text-white block mt-0.5">{viewModal.organization || 'Not Provided'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 sm:col-span-2 lg:col-span-2">
                    <span className="text-slate-400 text-[11px] block font-medium">Total Teaching Experience</span>
                    <span className="font-semibold text-slate-900 dark:text-white block mt-0.5">{viewModal.experience || 'Not Provided'}</span>
                  </div>
                </div>
              </div>

              {/* 4. Course Information */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center gap-2">
                  <BookOpen size={15} className="text-purple-600" />
                  <span>Course Information</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 sm:col-span-2">
                    <span className="text-slate-400 text-[11px] block font-medium mb-1.5">Topics to Teach</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(viewModal.expertise || viewModal.topics || []).map((t) => (
                        <span key={t} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          {t}
                        </span>
                      ))}
                      {(!viewModal.expertise || viewModal.expertise.length === 0) && (
                        <span className="text-xs text-slate-400">None specified</span>
                      )}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                    <span className="text-slate-400 text-[11px] block font-medium mb-1.5">Teaching Mode</span>
                    <Badge variant="purple">{viewModal.teachingMode || 'Recorded / Live'}</Badge>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 sm:col-span-3">
                    <span className="text-slate-400 text-[11px] block font-medium mb-1.5">Languages You Can Teach In</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(viewModal.languages || ['English']).map((lang) => (
                        <span key={lang} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                          🗣 {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Professional Bio */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center gap-2">
                  <User size={15} className="text-purple-600" />
                  <span>Professional Bio</span>
                </h4>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {viewModal.bio || viewModal.motivation || 'No professional bio provided.'}
                </div>
              </div>

              {/* 6. Motivation */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase tracking-wider font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                  <Sparkles size={15} className="text-purple-600" />
                  <span>Why do you want to teach on Zenius AI?</span>
                </h4>
                <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-xs sm:text-sm text-purple-950 dark:text-purple-200 leading-relaxed">
                  {viewModal.motivation || 'No motivation answer provided.'}
                </div>
              </div>

              {/* 7. Professional Links */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center gap-2">
                  <Globe size={15} className="text-purple-600" />
                  <span>Professional Links</span>
                </h4>
                <div className="flex flex-wrap gap-3">
                  {viewModal.linkedin ? (
                    <a
                      href={viewModal.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200 transition-colors"
                    >
                      <LinkedInIcon size={14} /> View LinkedIn Profile
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 p-2 rounded-xl bg-slate-100 dark:bg-slate-800">LinkedIn: Not Provided</span>
                  )}
                  {viewModal.portfolio ? (
                    <a
                      href={viewModal.portfolio}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      <GitHubIcon size={14} /> View GitHub / Portfolio
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 p-2 rounded-xl bg-slate-100 dark:bg-slate-800">Portfolio: Not Provided</span>
                  )}
                </div>
              </div>

              {/* 8. Resume Upload */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center gap-2">
                  <FileCheck size={15} className="text-purple-600" />
                  <span>Resume Document</span>
                </h4>
                {viewModal.resume ? (
                  <div className="p-4 rounded-2xl border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                        <FileCheck size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs">
                          {typeof viewModal.resume === 'object' ? viewModal.resume.name : 'Uploaded Resume.pdf'}
                        </div>
                        <div className="text-xs text-slate-500">PDF Format • Verified Upload</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePreviewResume(viewModal.resume)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center gap-1.5"
                      >
                        <Eye size={14} /> Preview Resume
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadResume(viewModal.resume)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 transition-colors flex items-center gap-1.5"
                      >
                        <Download size={14} /> Download
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-400">
                    No resume document uploaded for this application.
                  </div>
                )}
              </div>

              {/* Rejection reason (if rejected) */}
              {viewModal.status === 'rejected' && viewModal.rejectionReason && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300">
                  <span className="font-bold uppercase tracking-wider block mb-1">Rejection Reason</span>
                  <p>{viewModal.rejectionReason}</p>
                </div>
              )}

              {/* Sticky Action Footer */}
              {viewModal.status === 'pending' && (
                <div className="sticky bottom-0 left-0 right-0 p-4 -mx-6 -mb-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 rounded-b-2xl shadow-xl z-20">
                  <Button
                    variant="danger"
                    size="sm"
                    className="px-6 py-2.5 rounded-xl font-bold"
                    onClick={() => {
                      setRejectModal(viewModal)
                    }}
                  >
                    Reject Application
                  </Button>
                  <Button
                    size="sm"
                    className="px-6 py-2.5 rounded-xl font-bold"
                    onClick={() => {
                      setApproveModal(viewModal)
                    }}
                  >
                    Approve Application
                  </Button>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* ── Approve Confirmation Modal ── */}
        <Modal isOpen={!!approveModal} onClose={() => setApproveModal(null)} title="Approve Instructor" size="sm">
          <div className="flex items-center gap-3 mb-5 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-emerald-100 dark:bg-emerald-900 text-emerald-600">
              <Check size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900 dark:text-emerald-300">Confirm Approval</p>
              <p className="text-xs text-emerald-800 dark:text-emerald-400 mt-0.5">
                This will grant <strong>{approveModal?.fullName}</strong> full instructor privileges immediately.
              </p>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" size="sm" onClick={() => setApproveModal(null)}>No, Cancel</Button>
            <Button size="sm" onClick={handleApprove} loading={processing}>Yes, Approve</Button>
          </div>
        </Modal>

        {/* ── Reject Confirmation Modal ── */}
        <Modal isOpen={!!rejectModal} onClose={() => { setRejectModal(null); setReason('') }} title="Reject Application" size="sm">
          <div className="flex items-center gap-3 mb-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-rose-100 dark:bg-rose-900 text-rose-600">
              <X size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-900 dark:text-rose-300">Confirm Rejection</p>
              <p className="text-xs text-rose-800 dark:text-rose-400 mt-0.5">
                Decline application for <strong>{rejectModal?.fullName}</strong>
              </p>
            </div>
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for rejection (required)..."
            rows={3}
            className="input-field resize-none mb-4"
          />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" size="sm" onClick={() => { setRejectModal(null); setReason('') }}>No, Cancel</Button>
            <Button variant="danger" size="sm" onClick={handleReject} loading={processing}>Yes, Reject</Button>
          </div>
        </Modal>
      </div>
    </PageLayout>
  )
}
