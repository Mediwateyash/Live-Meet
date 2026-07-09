import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Send, Inbox, ArrowLeft, ChevronDown, ChevronUp, Clock, CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout.jsx'
import Input from '../../components/ui/Input.jsx'
import Button from '../../components/ui/Button.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Select from '../../components/ui/Select.jsx'

import { supportAPI } from '../../api/support.js'
import toast from 'react-hot-toast'
import useAuthStore from '../../store/authStore.js'
import { formatDateTime } from '../../utils/formatters.js'


export default function Contact() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin/support', { replace: true })
    }
  }, [user, navigate])

  const [activeTab, setActiveTab] = useState('new') // 'new' | 'list'
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [category, setCategory] = useState('General Feedback')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  // Expanded tickets map
  const [expandedTickets, setExpandedTickets] = useState({})

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const { data } = await supportAPI.getMyTickets()
      setTickets(data.data || [])
    } catch (err) {
      toast.error('Failed to load your support tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  useEffect(() => {
    if (activeTab === 'list') {
      fetchTickets()
    }
  }, [activeTab])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    if (message.trim().length > 5000) {
      toast.error('Message is too long (maximum 5000 characters)')
      return
    }

    setSubmitting(true)
    try {
      await supportAPI.submitTicket({
        category,
        subject: subject.trim(),
        message: message.trim(),
      })
      toast.success('Your message has been sent to support!')
      setSubject('')
      setMessage('')
      setCategory('General Feedback')
      setActiveTab('list') // switch to messages tab
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleExpand = async (ticketId) => {
    const isExpanding = !expandedTickets[ticketId]
    setExpandedTickets(prev => ({
      ...prev,
      [ticketId]: isExpanding
    }))

    if (isExpanding) {
      const ticket = tickets.find(t => t._id === ticketId)
      if (ticket && ticket.status === 'replied' && !ticket.readByStudent) {
        try {
          await supportAPI.markAsRead(ticketId)
          setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, readByStudent: true } : t))
        } catch (err) {
          console.error('Failed to mark ticket as read:', err)
        }
      }
    }
  }

  return (
    <PageLayout noFooter={true}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-medium mb-4 hover:text-[#7C3AED] transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-extrabold mb-1" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
            Contact Support & Feedback
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Send us feedback, request features, or report bugs.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap sm:flex-nowrap border-b mb-6" style={{ borderColor: 'var(--border-default)' }}>
          <button
            onClick={() => setActiveTab('new')}
            className="flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all"
            style={{
              color: activeTab === 'new' ? '#7C3AED' : 'var(--text-secondary)',
              borderBottomColor: activeTab === 'new' ? '#7C3AED' : 'transparent',
            }}
          >
            <MessageSquare size={16} />
            Send Feedback / Report
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className="flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all relative"
            style={{
              color: activeTab === 'list' ? '#7C3AED' : 'var(--text-secondary)',
              borderBottomColor: activeTab === 'list' ? '#7C3AED' : 'transparent',
            }}
          >
            <Inbox size={16} />
            My Messages
            {tickets.some(t => t.status === 'replied' && !t.readByStudent) && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#7C3AED]" />
            )}
          </button>
        </div>

        {/* Tab content */}
        <div>
          {activeTab === 'new' ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 border shadow-sm"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <Select
                  label="Category"
                  required
                  value={category}
                  onChange={(val) => setCategory(val)}
                  options={[
                    'General Feedback',
                    'Bug Report',
                    'Course Question',
                    'Feature Request',
                    'Other'
                  ]}
                />

                <Input
                  label="Subject"
                  placeholder="Summary of your feedback/issue..."
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Message Details <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="input-field resize-none"
                    placeholder="Provide a detailed description of your feedback, feature request, or technical issue... (max 5000 characters)"
                    maxLength={5000}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  loading={submitting}
                  className="w-full md:w-auto"
                >
                  <Send size={15} />
                  Submit Feedback
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="skeleton h-24 rounded-2xl" />
                  ))}
                </div>
              ) : tickets.length === 0 ? (
                <div
                  className="text-center py-16 border rounded-2xl bg-white"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
                >
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--bg-hover)' }}>
                    <Inbox size={26} color="var(--text-secondary)" />
                  </div>
                  <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    No messages yet
                  </h3>
                  <p className="text-sm text-muted-foreground" style={{ color: 'var(--text-muted)' }}>
                    Feedback and support requests you submit will appear here.
                  </p>
                </div>
              ) : (
                tickets.map((ticket) => {
                  const isExpanded = expandedTickets[ticket._id]
                  return (
                    <div
                      key={ticket._id}
                      className="border rounded-2xl overflow-hidden bg-white transition-all shadow-sm"
                      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
                    >
                      {/* Ticket Header Line */}
                      <div
                        onClick={() => toggleExpand(ticket._id)}
                        className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-opacity-50 transition-colors"
                        style={{ backgroundColor: isExpanded ? 'var(--bg-hover)' : 'transparent' }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: 'var(--z-purple-100)', color: '#7C3AED' }}>
                              {ticket.category}
                            </span>
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {formatDateTime(ticket.createdAt)}
                            </span>
                          </div>
                          <h4 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                            {ticket.subject}
                          </h4>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {ticket.status === 'replied' ? (
                            <Badge variant="green">Replied</Badge>
                          ) : (
                            <Badge variant="amber">Pending</Badge>
                          )}
                          <div style={{ color: 'var(--text-secondary)' }}>
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </div>
                        </div>
                      </div>

                      {/* Ticket Body Content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-5 border-t space-y-4 bg-opacity-30" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-page)' }}>
                              <div>
                                <h5 className="text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                                  Your Message
                                </h5>
                                <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                                  {ticket.message}
                                </p>
                              </div>

                              {ticket.status === 'replied' ? (
                                <div
                                  className="p-4 rounded-xl border relative"
                                  style={{
                                    background: 'var(--bg-surface)',
                                    borderColor: 'rgba(16, 185, 129, 0.3)',
                                  }}
                                >
                                  <div className="flex items-center gap-2 mb-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 size={14} />
                                    <span>Support Response</span>
                                    {ticket.repliedAt && (
                                      <span className="font-normal text-muted-foreground flex items-center gap-1 ml-auto" style={{ color: 'var(--text-muted)' }}>
                                        <Clock size={12} />
                                        {formatDateTime(ticket.repliedAt)}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                                    {ticket.reply}
                                  </p>
                                </div>
                              ) : (
                                <div
                                  className="p-4 rounded-xl border flex items-center gap-2 text-xs font-medium"
                                  style={{
                                    background: 'var(--bg-surface)',
                                    borderColor: 'var(--border-purple)',
                                    color: 'var(--text-secondary)',
                                  }}
                                >
                                  <Clock size={14} className="text-amber-500" />
                                  <span>We have received your message and an admin will review it shortly.</span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })
              )}
            </motion.div>
          )}
        </div>

      </div>
    </PageLayout>
  )
}
