import React, { useEffect, useState } from 'react'
import { MessageSquare, ArrowLeft, Send, CheckCircle2, Mail, Clock, ChevronDown, ChevronUp, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { motion, AnimatePresence } from 'framer-motion'
import PageLayout from '../../components/layout/PageLayout.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import { supportAPI } from '../../api/support.js'
import { formatDateTime } from '../../utils/formatters.js'
import toast from 'react-hot-toast'

export default function AdminSupport() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('pending') // 'pending' | 'replied'
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState({}) // ticketId -> text
  const [replying, setReplying] = useState({}) // ticketId -> bool
  const [expandedStudents, setExpandedStudents] = useState({})
  const [searchQuery, setSearchQuery] = useState('')


  const loadTickets = async () => {
    setLoading(true)
    try {
      const { data } = await supportAPI.adminGetAllTickets()
      setTickets(data.data || [])
    } catch (err) {
      toast.error('Failed to load support tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
  }, [])

  const handleSendReply = async (ticketId) => {
    const text = replyText[ticketId] || ''
    if (!text.trim()) {
      toast.error('Please enter a response')
      return
    }

    setReplying(prev => ({ ...prev, [ticketId]: true }))
    try {
      await supportAPI.adminReplyTicket(ticketId, text.trim())
      toast.success('Reply sent successfully!')
      setReplyText(prev => ({ ...prev, [ticketId]: '' }))
      loadTickets()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reply')
    } finally {
      setReplying(prev => ({ ...prev, [ticketId]: false }))
    }
  }

  const handleReplyTextChange = (ticketId, val) => {
    setReplyText(prev => ({ ...prev, [ticketId]: val }))
  }

  const toggleExpandStudent = (studentId) => {
    setExpandedStudents(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }))
  }

  // Filter tickets by active tab and search query
  const filteredTickets = tickets.filter(t => {
    if (t.status !== tab) return false
    if (!searchQuery.trim()) return true

    const query = searchQuery.toLowerCase().trim()
    const studentName = t.student?.fullName?.toLowerCase() || ''
    const studentEmail = t.student?.email?.toLowerCase() || ''
    const ticketSubject = t.subject?.toLowerCase() || ''
    const ticketMessage = t.message?.toLowerCase() || ''
    const ticketCategory = t.category?.toLowerCase() || ''

    return studentName.includes(query) ||
           studentEmail.includes(query) ||
           ticketSubject.includes(query) ||
           ticketMessage.includes(query) ||
           ticketCategory.includes(query)
  })

  // Group filtered tickets by student
  const groupTicketsByStudent = (ticketsList) => {
    const groups = {}
    ticketsList.forEach(ticket => {
      const studentId = ticket.student?._id || 'unknown'
      if (!groups[studentId]) {
        groups[studentId] = {
          student: ticket.student,
          tickets: []
        }
      }
      groups[studentId].tickets.push(ticket)
    })
    return Object.values(groups)
  }

  const groupedStudents = groupTicketsByStudent(filteredTickets)

  return (
    <PageLayout noFooter={true}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

        {/* Back navigation */}
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-1.5 text-sm font-medium mb-4 hover:text-[#7C3AED] transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-extrabold mb-1" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
            Student Support & Feedback
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Read reports, general feedback, and reply to student queries.
          </p>
        </div>

        {/* Controls Row: Tabs on Left, Search on Right */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          {/* Tabs with horizontal scroll wrapper on mobile */}
          <div className="overflow-x-auto -webkit-overflow-scrolling-touch pb-1 scrollbar-none">
            <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--z-purple-100)' }}>
              <button
                onClick={() => setTab('pending')}
                className="px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all whitespace-nowrap"
                style={{
                  background: tab === 'pending' ? '#7C3AED' : 'transparent',
                  color: tab === 'pending' ? 'white' : 'var(--text-secondary)',
                }}
              >
                Pending ({tickets.filter(t => t.status === 'pending').length})
              </button>
              <button
                onClick={() => setTab('replied')}
                className="px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all whitespace-nowrap"
                style={{
                  background: tab === 'replied' ? '#7C3AED' : 'transparent',
                  color: tab === 'replied' ? 'white' : 'var(--text-secondary)',
                }}
              >
                Replied ({tickets.filter(t => t.status === 'replied').length})
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" color="var(--text-secondary)" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student, email, subject..."
              className="w-full pl-11 pr-4 py-2 rounded-xl text-sm outline-none transition-all border font-medium placeholder:text-[#94A3B8]"
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
                fontFamily: 'Inter, sans-serif',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              }}
              onFocus={e => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)' }}
              onBlur={e =>  { e.target.style.borderColor = 'var(--border-default)'; e.target.style.boxShadow = 'none' }}
            />
          </div>
        </div>

        {/* Student Grouped List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-2xl" />
            ))}
          </div>
        ) : groupedStudents.length === 0 ? (
          <div
            className="text-center py-16 rounded-2xl"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-muted)',
            }}
          >
            <MessageSquare size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-base font-medium">No messages found</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {tab === 'pending'
                ? 'All student feedback and report requests have been answered.'
                : 'No replied support tickets to display.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedStudents.map((group) => {
              const studentId = group.student?._id || 'unknown'
              const isExpanded = expandedStudents[studentId]
              const ticketCount = group.tickets.length

              return (
                <div
                  key={studentId}
                  className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col transition-all"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
                >
                  {/* Student Card Header */}
                  <div
                    onClick={() => toggleExpandStudent(studentId)}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-opacity-50 transition-colors"
                    style={{ backgroundColor: isExpanded ? 'var(--bg-hover)' : 'transparent' }}
                  >
                    {/* Student Info */}
                    <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                      {group.student?.avatar ? (
                        <img
                          src={group.student.avatar}
                          alt={group.student.fullName}
                          className="w-11 h-11 rounded-full object-cover shrink-0 border border-slate-200"
                        />
                      ) : (
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center text-white text-base font-bold shrink-0"
                          style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}
                        >
                          {group.student?.fullName?.charAt(0).toUpperCase() || 'S'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="text-base font-bold block truncate" style={{ color: 'var(--text-primary)' }}>
                          {group.student?.fullName || 'Unknown Student'}
                        </span>
                        <span className="text-xs flex items-center gap-1 truncate" style={{ color: 'var(--text-muted)' }}>
                          <Mail size={12} className="shrink-0" />
                          <span className="truncate">{group.student?.email || 'N/A'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Messages indicator info */}
                    <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 gap-3">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'var(--z-purple-100)', color: '#7C3AED' }}>
                        {ticketCount} {ticketCount === 1 ? 'Message' : 'Messages'}
                      </span>
                      <div style={{ color: 'var(--text-secondary)' }} className="shrink-0">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Tickets List for this student */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 border-t space-y-6 bg-opacity-30" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-page)' }}>
                          {group.tickets.map((ticket, index) => (
                            <div
                              key={ticket._id}
                              className="p-5 rounded-2xl border flex flex-col gap-4 shadow-sm"
                              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
                            >
                              {/* Message Header */}
                              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: 'var(--border-default)' }}>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: 'var(--z-purple-100)', color: '#7C3AED' }}>
                                    {ticket.category}
                                  </span>
                                  <span className="text-xs font-bold break-words" style={{ color: 'var(--text-primary)' }}>
                                    Subject: {ticket.subject}
                                  </span>
                                </div>
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                  {formatDateTime(ticket.createdAt)}
                                </span>
                              </div>

                              {/* Student Message Body */}
                              <div>
                                <h6 className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                                  Student Message
                                </h6>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                                  {ticket.message}
                                </p>
                              </div>

                              {/* Message Reply Form / Admin Reply */}
                              {ticket.status === 'pending' ? (
                                <div className="space-y-3 pt-2">
                                  <label className="text-[10px] font-semibold uppercase tracking-wider block" style={{ color: 'var(--text-secondary)' }}>
                                    Write Response
                                  </label>
                                  <textarea
                                    rows={3}
                                    value={replyText[ticket._id] || ''}
                                    onChange={(e) => handleReplyTextChange(ticket._id, e.target.value)}
                                    placeholder="Type response..."
                                    className="input-field resize-none"
                                  />
                                  <div className="flex justify-end">
                                    <Button
                                      onClick={() => handleSendReply(ticket._id)}
                                      loading={replying[ticket._id]}
                                      variant="primary"
                                      size="sm"
                                    >
                                      <Send size={13} />
                                      Send Reply
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className="p-4 rounded-xl border relative"
                                  style={{
                                    background: 'var(--bg-muted)',
                                    borderColor: 'rgba(16, 185, 129, 0.25)',
                                  }}
                                >
                                  <div className="flex flex-wrap items-center gap-1.5 mb-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                    <div className="flex items-center gap-1.5">
                                      <CheckCircle2 size={13} />
                                      <span>Admin Response</span>
                                    </div>
                                    {ticket.repliedAt && (
                                      <span className="font-normal flex items-center gap-1 sm:ml-auto" style={{ color: 'var(--text-muted)' }}>
                                        <Clock size={11} />
                                        {formatDateTime(ticket.repliedAt)}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                                    {ticket.reply}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </PageLayout>
  )
}
