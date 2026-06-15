import React, { useEffect, useState } from 'react'
import { Check, X, Eye, User, Mail, Phone, Briefcase, FileText, ExternalLink } from 'lucide-react'
import PageLayout from '../../components/layout/PageLayout.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Button from '../../components/ui/Button.jsx'
import { adminAPI } from '../../api/admin.js'
import { formatDate } from '../../utils/formatters.js'
import toast from 'react-hot-toast'

const STATUS_TABS = ['pending', 'approved', 'rejected']
const BADGE = { pending: 'amber', approved: 'green', rejected: 'red' }

export default function AdminRequests() {
  const [tab,       setTab]       = useState('pending')
  const [requests,  setRequests]  = useState([])
  const [loading,   setLoading]   = useState(true)

  // View detail modal
  const [viewModal,    setViewModal]    = useState(null)
  // Approve confirm modal
  const [approveModal, setApproveModal] = useState(null)
  // Reject modal
  const [rejectModal,  setRejectModal]  = useState(null)
  const [reason,       setReason]       = useState('')
  const [processing,   setProcessing]   = useState(false)

  const load = () => {
    setLoading(true)
    adminAPI.getRequests({ status: tab })
      .then(({ data }) => setRequests(data.data))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [tab])

  const handleApprove = async () => {
    setProcessing(true)
    try {
      await adminAPI.approveRequest(approveModal._id)
      toast.success(`${approveModal.fullName} approved as instructor!`)
      setApproveModal(null)
      load()
    } catch {
      toast.error('Could not approve request')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!reason.trim()) { toast.error('Please enter a rejection reason'); return }
    setProcessing(true)
    try {
      await adminAPI.rejectRequest(rejectModal._id, { reason })
      toast.success('Application rejected')
      setRejectModal(null)
      setReason('')
      load()
    } catch {
      toast.error('Could not reject request')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
          Instructor Requests
        </h1>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-8 w-fit" style={{ background: 'var(--z-purple-100)' }}>
          {STATUS_TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all"
              style={{ background: tab === t ? '#7C3AED' : 'transparent', color: tab === t ? 'white' : 'var(--text-secondary)' }}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="skeleton h-64 rounded-2xl" />
        ) : requests.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
            <User size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-base font-medium">No {tab} requests</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {tab === 'pending' ? 'All instructor applications have been reviewed.' : `No ${tab} applications to display.`}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden shadow-card" style={{ border: '1px solid var(--border-default)' }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#EDE9FE', borderBottom: '1px solid var(--border-purple)' }}>
                  {['#', 'Applicant', 'Contact', 'Expertise', 'Applied', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: '#5B21B6' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((req, i) => (
                  <tr key={req._id} className="transition-colors hover:bg-[#FAFAFE]" style={{ borderBottom: i < requests.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
                    <td className="px-5 py-4 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
                          {req.fullName?.charAt(0)}
                        </div>
                        <div>
                          <span className="text-sm font-semibold block" style={{ color: 'var(--text-primary)' }}>{req.fullName}</span>
                          {req.department && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{req.department}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs space-y-0.5" style={{ color: 'var(--text-secondary)' }}>
                        <div className="flex items-center gap-1"><Mail size={11} /> {req.email}</div>
                        {req.phone && <div className="flex items-center gap-1"><Phone size={11} /> {req.phone}</div>}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {req.expertise?.slice(0, 3).map(e => <Badge key={e} variant="purple">{e}</Badge>)}
                        {req.expertise?.length > 3 && <Badge variant="gray">+{req.expertise.length - 3}</Badge>}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(req.createdAt)}</td>
                    <td className="px-5 py-4"><Badge variant={BADGE[req.status]}>{req.status}</Badge></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        {req.status === 'pending' && (
                          <>
                            <button
                              onClick={() => setApproveModal(req)}
                              title="Approve"
                              className="p-2 rounded-lg transition-all hover:bg-green-50 hover:shadow-sm"
                              style={{ border: '1px solid transparent' }}
                              onMouseEnter={e => e.currentTarget.style.borderColor = '#10B981'}
                              onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                            >
                              <Check size={16} color="#10B981" />
                            </button>
                            <button
                              onClick={() => setRejectModal(req)}
                              title="Reject"
                              className="p-2 rounded-lg transition-all hover:bg-red-50 hover:shadow-sm"
                              style={{ border: '1px solid transparent' }}
                              onMouseEnter={e => e.currentTarget.style.borderColor = '#EF4444'}
                              onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                            >
                              <X size={16} color="#EF4444" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setViewModal(req)}
                          title="View Details"
                          className="p-2 rounded-lg transition-all hover:bg-[#F0EEFF] hover:shadow-sm"
                          style={{ border: '1px solid transparent' }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = '#7C3AED'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                        >
                          <Eye size={16} color="#7C3AED" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── View Detail Modal ── */}
        <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} title="Applicant Details" size="lg">
          {viewModal && (
            <div className="space-y-5">
              {/* Profile header */}
              <div className="flex items-center gap-4 pb-4" style={{ borderBottom: '1px solid var(--border-default)' }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0" style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
                  {viewModal.fullName?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{viewModal.fullName}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge variant={BADGE[viewModal.status]}>{viewModal.status}</Badge>
                    {viewModal.department && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{viewModal.department}</span>}
                  </div>
                </div>
              </div>

              {/* Contact info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2.5 p-3 rounded-xl" style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-default)' }}>
                  <Mail size={16} color="#7C3AED" />
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Email</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{viewModal.email}</span>
                  </div>
                </div>
                {viewModal.phone && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl" style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-default)' }}>
                    <Phone size={16} color="#7C3AED" />
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Phone</span>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{viewModal.phone}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Expertise */}
              {viewModal.expertise?.length > 0 && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-muted)' }}>Expertise</span>
                  <div className="flex flex-wrap gap-2">
                    {viewModal.expertise.map(e => <Badge key={e} variant="purple">{e}</Badge>)}
                  </div>
                </div>
              )}

              {/* Motivation */}
              {viewModal.motivation && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-muted)' }}>Motivation</span>
                  <div className="p-4 rounded-xl text-sm leading-relaxed" style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
                    {viewModal.motivation}
                  </div>
                </div>
              )}

              {/* Links */}
              {(viewModal.linkedin || viewModal.portfolio) && (
                <div className="flex gap-3">
                  {viewModal.linkedin && (
                    <a href={viewModal.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-colors hover:bg-[#F0EEFF]" style={{ color: '#7C3AED' }}>
                      <ExternalLink size={14} /> LinkedIn
                    </a>
                  )}
                  {viewModal.portfolio && (
                    <a href={viewModal.portfolio} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-colors hover:bg-[#F0EEFF]" style={{ color: '#7C3AED' }}>
                      <ExternalLink size={14} /> Portfolio
                    </a>
                  )}
                </div>
              )}

              {/* Rejection reason (if rejected) */}
              {viewModal.status === 'rejected' && viewModal.rejectionReason && (
                <div className="p-4 rounded-xl" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                  <span className="text-xs font-semibold uppercase tracking-wider block mb-1" style={{ color: '#B91C1C' }}>Rejection Reason</span>
                  <p className="text-sm" style={{ color: '#991B1B' }}>{viewModal.rejectionReason}</p>
                </div>
              )}

              {/* Applied date */}
              <div className="text-xs pt-2" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-default)' }}>
                Applied on {formatDate(viewModal.createdAt)}
                {viewModal.reviewedAt && <> · Reviewed on {formatDate(viewModal.reviewedAt)}</>}
              </div>

              {/* Action buttons for pending */}
              {viewModal.status === 'pending' && (
                <div className="flex gap-3 justify-end pt-2">
                  <Button variant="danger" size="sm" onClick={() => { setViewModal(null); setRejectModal(viewModal) }}>
                    Reject
                  </Button>
                  <Button size="sm" onClick={() => { setViewModal(null); setApproveModal(viewModal) }}>
                    Approve
                  </Button>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* ── Approve Confirmation Modal ── */}
        <Modal isOpen={!!approveModal} onClose={() => setApproveModal(null)} title="Approve Instructor" size="sm">
          <div className="flex items-center gap-3 mb-5 p-4 rounded-xl" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: '#DCFCE7' }}>
              <Check size={20} color="#16A34A" />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: '#166534' }}>Are you sure?</p>
              <p className="text-sm" style={{ color: '#15803D' }}>
                This will grant <strong>{approveModal?.fullName}</strong> instructor access immediately.
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
          <div className="flex items-center gap-3 mb-4 p-4 rounded-xl" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: '#FEE2E2' }}>
              <X size={20} color="#DC2626" />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: '#991B1B' }}>Are you sure?</p>
              <p className="text-sm" style={{ color: '#B91C1C' }}>
                Reject application from <strong>{rejectModal?.fullName}</strong>
              </p>
            </div>
          </div>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
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
