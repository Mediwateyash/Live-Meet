import React, { useEffect, useState, useMemo } from 'react'
import { Calendar, Clock, Video, Plus, Edit2, Trash2, ExternalLink, CheckCircle2, Radio, Link2, Monitor, Users, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout.jsx'
import Button from '../../components/ui/Button.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Select from '../../components/ui/Select.jsx'
import { liveLecturesAPI } from '../../api/liveLectures.js'
import { instructorAPI } from '../../api/instructor.js'
import toast from 'react-hot-toast'

const STATUS_BADGE  = { scheduled: 'blue', live: 'green', ended: 'gray' }
const STATUS_LABEL  = { scheduled: 'Scheduled', live: '● Live', ended: 'Ended' }
const EMPTY_FORM    = { title: '', description: '', courseId: '', scheduledAt: '', duration: 60, meetingUrl: '', type: 'link' }

function fmtDate(d) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }
function fmtTime(d) { return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }
function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function formatAttendanceTime(dateString) {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '—'
  const day = date.getDate()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[date.getMonth()]
  let hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'pm' : 'am'
  hours = hours % 12
  hours = hours ? hours : 12
  const formattedHours = String(hours).padStart(2, '0')
  return `${day} ${month} ${formattedHours}:${minutes} ${ampm}`
}

function getAttendanceDetails(att, lecture) {
  let firstJoined = null
  let lastLeft = null
  let totalDurationMs = 0

  if (att.sessions && att.sessions.length > 0) {
    const joinedTimes = att.sessions.map(s => new Date(s.joinedAt).getTime()).filter(t => !isNaN(t))
    if (joinedTimes.length > 0) {
      firstJoined = new Date(Math.min(...joinedTimes))
    }
    const leftTimes = att.sessions.map(s => s.leftAt ? new Date(s.leftAt).getTime() : null).filter(Boolean)
    if (leftTimes.length > 0) {
      lastLeft = new Date(Math.max(...leftTimes))
    }
    att.sessions.forEach(sess => {
      const join = new Date(sess.joinedAt).getTime()
      if (isNaN(join)) return
      let leave = sess.leftAt ? new Date(sess.leftAt).getTime() : null
      if (!leave) {
        leave = lecture.endedAt ? new Date(lecture.endedAt).getTime() : Date.now()
      }
      if (!isNaN(leave) && leave >= join) {
        totalDurationMs += (leave - join)
      }
    })
  } else if (att.joinedAt) {
    firstJoined = new Date(att.joinedAt)
    const end = lecture.endedAt ? new Date(lecture.endedAt) : new Date(new Date(att.joinedAt).getTime() + (lecture.duration || 60) * 60000)
    lastLeft = end
    totalDurationMs = Math.max(0, end.getTime() - firstJoined.getTime())
  }
  const durationMin = Math.round(totalDurationMs / 60000)
  const durationText = durationMin >= 60
    ? `${(totalDurationMs / 3600000).toFixed(2)} hrs`
    : `${durationMin} min`
  return {
    firstJoined: firstJoined ? firstJoined.toISOString() : null,
    lastLeft: lastLeft ? lastLeft.toISOString() : null,
    durationText
  }
}

export default function InstructorLiveLectures() {
  const navigate   = useNavigate()
  const [lectures, setLectures] = useState([])
  const [courses,  setCourses]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState('upcoming')
  const [showForm, setShowForm] = useState(false)
  const [editId,   setEditId]   = useState(null)
  const [form,     setForm]     = useState(EMPTY_FORM)
  const [saving,   setSaving]   = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [expandedLecId, setExpandedLecId] = useState(null)

  const handleDownloadCSV = (lec) => {
    const headers = ['Student Name', 'Email Address', 'First Joined', 'Last Left', 'Total Duration']
    const rows = (lec.attendance || []).map(att => {
      const details = getAttendanceDetails(att, lec)
      return [
        att.user?.fullName || 'Deleted User',
        att.user?.email || '—',
        details.firstJoined ? formatAttendanceTime(details.firstJoined) : '—',
        details.lastLeft ? formatAttendanceTime(details.lastLeft) : '—',
        details.durationText
      ]
    })
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `attendance_${lec.title.replace(/\s+/g, '_')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const load = () => {
    setLoading(true)
    Promise.all([ liveLecturesAPI.getMine(), instructorAPI.getCourses() ])
      .then(([lRes, cRes]) => { setLectures(lRes.data.data || []); setCourses(cRes.data.data || []) })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const now = new Date()
  const filtered = useMemo(() => lectures.filter(l => {
    if (l.status === 'ended') return tab === 'past'
    const end = new Date(l.scheduledAt).getTime() + (l.duration || 60) * 60000
    return tab === 'upcoming' ? end > now.getTime() : end <= now.getTime()
  }), [lectures, tab])

  const courseOptions = useMemo(() => [
    { value: '', label: 'No specific course (general)' },
    ...courses.map(c => ({ value: c._id, label: c.title })),
  ], [courses])

  const openNew  = () => { setEditId(null); setForm(EMPTY_FORM); setShowForm(true) }
  const openEdit = lec => {
    setEditId(lec._id)
    setForm({ title: lec.title, description: lec.description || '', courseId: lec.courseId?._id || '',
      scheduledAt: toLocalInput(lec.scheduledAt), duration: lec.duration, meetingUrl: lec.meetingUrl || '', type: lec.type || 'link' })
    setShowForm(true)
  }
  const closeForm = () => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM) }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.scheduledAt) return toast.error('Title and date/time are required')
    if (form.type === 'link' && !form.meetingUrl.trim()) return toast.error('Meeting URL is required for external link sessions')
    setSaving(true)
    try {
      const payload = { ...form, scheduledAt: new Date(form.scheduledAt).toISOString(),
        courseId: form.courseId || null, duration: Number(form.duration) }
      if (editId) {
        const { data } = await liveLecturesAPI.update(editId, payload)
        setLectures(ls => ls.map(l => l._id === editId ? data.data : l))
        toast.success('Lecture updated')
      } else {
        const { data } = await liveLecturesAPI.create(payload)
        setLectures(ls => [data.data, ...ls])
        toast.success('Lecture scheduled!')
      }
      closeForm()
    } catch (err) { toast.error(err.response?.data?.message || 'Could not save') }
    finally { setSaving(false) }
  }

  const handleStatusChange = async (lec, newStatus) => {
    try {
      const { data } = await liveLecturesAPI.update(lec._id, { status: newStatus })
      setLectures(ls => ls.map(l => l._id === lec._id ? data.data : l))
      toast.success(`Marked as ${newStatus}`)
    } catch { toast.error('Could not update status') }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await liveLecturesAPI.remove(deleteId)
      setLectures(ls => ls.filter(l => l._id !== deleteId))
      toast.success('Lecture deleted')
    } catch { toast.error('Could not delete') }
    finally { setDeleting(false); setDeleteId(null) }
  }

  const countFor = key => lectures.filter(l => {
    if (l.status === 'ended') return key === 'past'
    const end = new Date(l.scheduledAt).getTime() + (l.duration || 60) * 60000
    return key === 'upcoming' ? end > now.getTime() : end <= now.getTime()
  }).length

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Live Lectures</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Schedule in-app sessions or link to Zoom / Google Meet.</p>
          </div>
          <Button onClick={openNew} className="w-full sm:w-auto justify-center"><Plus size={15} /> Schedule Lecture</Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b overflow-x-auto -webkit-overflow-scrolling-touch scrollbar-none pb-1" style={{ borderColor: 'var(--border-default)' }}>
          {[{ key: 'upcoming', label: 'Upcoming' }, { key: 'past', label: 'Past' }].map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className="px-5 py-3 text-sm font-semibold transition-all whitespace-nowrap"
              style={{ color: tab === key ? '#7C3AED' : 'var(--text-secondary)',
                borderBottom: tab === key ? '2px solid #7C3AED' : '2px solid transparent', marginBottom: -1 }}>
              {label}
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full"
                style={{ background: tab === key ? '#EDE9FE' : 'var(--bg-muted)', color: tab === key ? '#7C3AED' : 'var(--text-muted)' }}>
                {countFor(key)}
              </span>
            </button>
          ))}
        </div>

        {/* Lecture list */}
        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(220,38,38,0.12)' }}>
              <Video size={28} color="#DC2626" />
            </div>
            <p className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No {tab} lectures</p>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
              {tab === 'upcoming' ? 'Schedule a new live session for your students.' : 'Completed sessions will appear here.'}
            </p>
            {tab === 'upcoming' && <Button size="sm" onClick={openNew}><Plus size={14} /> Schedule Now</Button>}
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filtered.map(lec => {
                const isExpanded = expandedLecId === lec._id
                return (
                  <motion.div key={lec._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="rounded-2xl p-5 flex flex-col gap-4"
                    style={{ background: 'var(--bg-surface)', border: lec.status === 'live' ? '1.5px solid rgba(16,185,129,0.4)' : '1px solid var(--border-default)' }}>

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          {/* Type icon */}
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: lec.status === 'live' ? 'rgba(16,185,129,0.14)' : lec.type === 'inapp' ? 'rgba(109,40,217,0.14)' : 'rgba(220,38,38,0.14)' }}>
                            {lec.status === 'live' ? <Radio size={22} color="#10B981" />
                              : lec.type === 'inapp' ? <Monitor size={22} color="#7C3AED" />
                              : <Link2 size={22} color="#DC2626" />}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{lec.title}</h3>
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ background: lec.type === 'inapp' ? 'rgba(109,40,217,0.14)' : 'rgba(220,38,38,0.14)', color: lec.type === 'inapp' ? '#7C3AED' : '#DC2626' }}>
                                {lec.type === 'inapp' ? 'In-App' : 'By Link'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 sm:ml-2">
                          {lec.description && <p className="text-sm mb-1.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>{lec.description}</p>}
                          <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <span className="flex items-center gap-1.5"><Calendar size={13} /> {fmtDate(lec.scheduledAt)} at {fmtTime(lec.scheduledAt)}</span>
                            <span className="flex items-center gap-1.5"><Clock size={13} /> {lec.duration} min</span>
                            {lec.courseId && (
                              <span className="px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(109,40,217,0.14)', color: '#7C3AED' }}>{lec.courseId.title}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-3 lg:pt-0" style={{ borderColor: 'var(--border-default)' }}>
                        <Badge variant={STATUS_BADGE[lec.status] || 'gray'}>{STATUS_LABEL[lec.status] || lec.status}</Badge>
                        
                        {lec.status === 'ended' && (
                          <button
                            onClick={() => setExpandedLecId(isExpanded ? null : lec._id)}
                            className="p-2 rounded-lg transition-all touch-target flex items-center justify-center"
                            title="View Attendance"
                            style={{ background: isExpanded ? 'rgba(109,40,217,0.12)' : 'transparent' }}
                            onMouseEnter={e => !isExpanded && (e.currentTarget.style.background = 'rgba(109,40,217,0.12)')}
                            onMouseLeave={e => !isExpanded && (e.currentTarget.style.background = 'transparent')}
                          >
                            <Users size={15} color="#7C3AED" />
                          </button>
                        )}
                        
                        {/* Join/Open */}
                        {lec.type === 'inapp' ? (
                          (lec.status === 'live' || lec.status === 'scheduled') && (
                            <button onClick={() => navigate(`/live/${lec._id}`)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all touch-target"
                              style={{ background: lec.status === 'live' ? 'rgba(16,185,129,0.14)' : 'rgba(109,40,217,0.14)', color: lec.status === 'live' ? '#10B981' : '#7C3AED',
                                border: `1px solid ${lec.status === 'live' ? 'rgba(16,185,129,0.3)' : 'rgba(109,40,217,0.3)'}` }}>
                              <Monitor size={12} /> {lec.status === 'live' ? 'Open Room' : 'Preview'}
                            </button>
                          )
                        ) : (
                          <a href={lec.meetingUrl} target="_blank" rel="noopener noreferrer"
                            className="p-2 rounded-lg transition-all touch-target flex items-center justify-center" title="Open meeting link"
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.12)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <ExternalLink size={15} color="#10B981" />
                          </a>
                        )}

                        {/* Go live / End */}
                        {lec.status === 'scheduled' && (
                          <button onClick={() => handleStatusChange(lec, 'live')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all touch-target"
                            style={{ background: 'rgba(16,185,129,0.14)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}>
                            <Radio size={12} /> Go Live
                          </button>
                        )}
                        {lec.status === 'live' && (
                          <button onClick={() => handleStatusChange(lec, 'ended')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all touch-target"
                            style={{ background: 'rgba(220,38,38,0.14)', color: '#DC2626', border: '1px solid rgba(220,38,38,0.3)' }}>
                            <CheckCircle2 size={12} /> End
                          </button>
                        )}

                        {lec.status !== 'ended' && (
                          <button onClick={() => openEdit(lec)} className="p-2 rounded-lg transition-all touch-target flex items-center justify-center" title="Edit"
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(109,40,217,0.12)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <Edit2 size={15} color="#7C3AED" />
                          </button>
                        )}
                        <button onClick={() => setDeleteId(lec._id)} className="p-2 rounded-lg transition-all touch-target flex items-center justify-center" title="Delete"
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <Trash2 size={15} color="#EF4444" />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="pt-4 border-t flex flex-col" style={{ borderColor: 'var(--border-default)' }}>
                        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                          <h4 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
                            <Users size={16} /> Attendance Report ({lec.attendance?.length || 0} {lec.attendance?.length === 1 ? 'student' : 'students'})
                          </h4>
                          {(lec.attendance?.length > 0) && (
                            <button
                              onClick={() => handleDownloadCSV(lec)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90 shrink-0"
                              style={{ background: '#10B981', color: '#FFFFFF' }}
                            >
                              <Download size={14} /> Download Attendance (CSV)
                            </button>
                          )}
                        </div>
                        {(!lec.attendance || lec.attendance.length === 0) ? (
                          <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>
                            No students attended this session.
                          </p>
                        ) : (
                          <div className="max-h-64 overflow-y-auto border rounded-xl" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
                            <div className="table-responsive">
                              <table className="w-full min-w-[560px] text-xs">
                                <thead>
                                  <tr className="attendance-header-row">
                                    <th className="text-left px-4 py-2.5 attendance-header-th">Student</th>
                                    <th className="text-left px-4 py-2.5 attendance-header-th">Email</th>
                                    <th className="text-left px-4 py-2.5 attendance-header-th">First Joined</th>
                                    <th className="text-left px-4 py-2.5 attendance-header-th">Last Left</th>
                                    <th className="text-left px-4 py-2.5 attendance-header-th">Total Duration</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {lec.attendance.map((att, idx) => {
                                    const details = getAttendanceDetails(att, lec)
                                    return (
                                      <tr key={idx} className="border-b last:border-b-0" style={{ borderColor: 'var(--border-default)' }}>
                                        <td className="px-4 py-2.5 font-bold" style={{ color: 'var(--text-primary)' }}>
                                          {att.user?.fullName || 'Deleted User'}
                                        </td>
                                        <td className="px-4 py-2.5" style={{ color: 'var(--text-secondary)' }}>
                                          {att.user?.email || '—'}
                                        </td>
                                        <td className="px-4 py-2.5" style={{ color: 'var(--text-secondary)' }}>
                                          {details.firstJoined ? formatAttendanceTime(details.firstJoined) : '—'}
                                        </td>
                                        <td className="px-4 py-2.5" style={{ color: 'var(--text-secondary)' }}>
                                          {details.lastLeft ? formatAttendanceTime(details.lastLeft) : '—'}
                                        </td>
                                        <td className="px-4 py-2.5 font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                          {details.durationText}
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Schedule / Edit Form Modal */}
        <Modal isOpen={showForm} onClose={closeForm} title={editId ? 'Edit Lecture' : 'Schedule New Lecture'} size="md">
          <form onSubmit={handleSave} className="space-y-4">
            {/* Type toggle */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Session Type</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { value: 'link',  icon: Link2,   label: 'External Link', sub: 'Zoom, Google Meet, Teams…', color: '#DC2626', bg: 'rgba(220,38,38,0.1)', border: 'rgba(220,38,38,0.3)' },
                  { value: 'inapp', icon: Monitor,  label: 'In-App Session', sub: 'Built-in live room',       color: '#7C3AED', bg: 'rgba(109,40,217,0.1)', border: 'rgba(109,40,217,0.3)' },
                ].map(({ value, icon: Icon, label, sub, color, bg, border }) => (
                  <button type="button" key={value}
                    onClick={() => setForm(p => ({ ...p, type: value }))}
                    className="flex items-center gap-3 p-3.5 rounded-xl text-left transition-all w-full"
                    style={{ border: `2px solid ${form.type === value ? color : 'var(--border-default)'}`,
                      background: form.type === value ? bg : 'var(--bg-muted)' }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: form.type === value ? bg : 'var(--bg-hover)', border: form.type === value ? `1px solid ${border}` : 'none' }}>
                      <Icon size={18} color={form.type === value ? color : 'var(--text-muted)'} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: form.type === value ? color : 'var(--text-primary)' }}>{label}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Lecture Title *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Introduction to React Hooks" className="input-field" required />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Linked Course</label>
              <Select value={form.courseId} onChange={v => setForm(p => ({ ...p, courseId: v }))} options={courseOptions} placeholder="No specific course" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Date & Time *</label>
                <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Duration (min)</label>
                <input type="number" min="10" max="300" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: Number(e.target.value) }))} className="input-field" />
              </div>
            </div>

            {form.type === 'link' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Meeting URL * <span className="normal-case font-normal ml-1" style={{ color: 'var(--text-muted)' }}>(Google Meet, Zoom, Teams…)</span>
                </label>
                <input type="url" value={form.meetingUrl} onChange={e => setForm(p => ({ ...p, meetingUrl: e.target.value }))}
                  placeholder="https://meet.google.com/abc-defg-hij" className="input-field" required={form.type === 'link'} />
              </div>
            )}

            {form.type === 'inapp' && (
              <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(109,40,217,0.1)', border: '1px solid rgba(109,40,217,0.25)' }}>
                <Monitor size={16} color="#7C3AED" className="mt-0.5 shrink-0" />
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Students will join your built-in live room at <strong>/live/{'{session-id}'}</strong>. You can share camera and screen directly from the room.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Description <span className="normal-case font-normal" style={{ color: 'var(--text-muted)' }}>(optional)</span>
              </label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="What will you cover in this session?" rows={2} className="input-field resize-none" />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" size="sm" onClick={closeForm}>Cancel</Button>
              <Button type="submit" size="sm" loading={saving}>{editId ? 'Update' : 'Schedule Lecture'}</Button>
            </div>
          </form>
        </Modal>

        {/* Delete confirm */}
        <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Lecture" size="sm">
          <div className="flex items-center gap-3 mb-5 p-4 rounded-xl" style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(220,38,38,0.15)' }}>
              <Trash2 size={18} color="#DC2626" />
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>This will permanently delete the lecture and it won't be visible to students.</p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" size="sm" onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}>Delete</Button>
          </div>
        </Modal>
      </div>
    </PageLayout>
  )
}
