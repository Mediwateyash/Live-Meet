import React, { useEffect, useState, useMemo } from 'react'
import { Calendar, Clock, Video, Trash2, ExternalLink, Search, Radio, AlertTriangle, Plus, Edit2, Link2, Monitor, Users, Download } from 'lucide-react'
import PageLayout from '../../components/layout/PageLayout.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Button from '../../components/ui/Button.jsx'
import Select from '../../components/ui/Select.jsx'
import { liveLecturesAPI } from '../../api/liveLectures.js'
import { adminAPI } from '../../api/admin.js'
import toast from 'react-hot-toast'

const STATUS_BADGE  = { scheduled: 'blue', live: 'green', ended: 'gray' }
const STATUS_LABEL  = { scheduled: 'Scheduled', live: '● Live', ended: 'Ended' }
const EMPTY_FORM    = { title: '', description: '', courseId: '', instructor: '', scheduledAt: '', duration: 60, meetingUrl: '', type: 'link' }

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtTime(d) {
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}
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

export default function AdminLiveLectures() {
  const [lectures,  setLectures]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [instructorFilter, setInstructorFilter] = useState('')
  const [deleteId,  setDeleteId]  = useState(null)
  const [deleting,  setDeleting]  = useState(false)

  const [courses,      setCourses]      = useState([])
  const [instructors,  setInstructors]  = useState([])
  const [showForm,     setShowForm]     = useState(false)
  const [editId,       setEditId]       = useState(null)
  const [form,         setForm]         = useState(EMPTY_FORM)
  const [saving,       setSaving]       = useState(false)
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

  const loadData = () => {
    setLoading(true)
    Promise.all([
      liveLecturesAPI.adminGetAll(),
      adminAPI.getCourses({ limit: 1000 }),
      adminAPI.getInstructors()
    ])
      .then(([lRes, cRes, iRes]) => {
        setLectures(lRes.data?.data || [])
        setCourses(cRes.data?.data || [])
        setInstructors(iRes.data?.data || [])
      })
      .catch((err) => {
        toast.error('Failed to load data')
        console.error(err)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  const courseOptions = useMemo(() => {
    let filteredCourses = courses
    if (form.instructor) {
      filteredCourses = courses.filter(c => {
        const instId = c.instructor?._id || c.instructor
        return instId?.toString() === form.instructor?.toString()
      })
    }
    return [
      { value: '', label: 'No specific course (general)' },
      ...filteredCourses.map(c => ({ value: c._id, label: c.title })),
    ]
  }, [courses, form.instructor])

  const instructorOptions = useMemo(() => [
    { value: '', label: 'Select Instructor' },
    ...instructors.map(i => ({ value: i._id, label: i.fullName })),
  ], [instructors])

  const handleInstructorChange = (newInstId) => {
    setForm(p => {
      const selectedCourse = courses.find(c => c._id === p.courseId)
      const courseInstId = selectedCourse ? (selectedCourse.instructor?._id || selectedCourse.instructor) : null
      const isOwnedByNewInstructor = courseInstId && courseInstId.toString() === newInstId.toString()
      return {
        ...p,
        instructor: newInstId,
        courseId: isOwnedByNewInstructor ? p.courseId : ''
      }
    })
  }

  const openNew  = () => { setEditId(null); setForm(EMPTY_FORM); setShowForm(true) }
  const openEdit = lec => {
    setEditId(lec._id)
    setForm({
      title: lec.title,
      description: lec.description || '',
      courseId: lec.courseId?._id || '',
      instructor: lec.instructor?._id || lec.instructor || '',
      scheduledAt: toLocalInput(lec.scheduledAt),
      duration: lec.duration,
      meetingUrl: lec.meetingUrl || '',
      type: lec.type || 'link'
    })
    setShowForm(true)
  }
  const closeForm = () => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM) }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.scheduledAt) return toast.error('Title and date/time are required')
    if (!form.instructor) return toast.error('Instructor is required')
    if (form.type === 'link' && !form.meetingUrl.trim()) return toast.error('Meeting URL is required for external link sessions')
    
    setSaving(true)
    try {
      const payload = {
        ...form,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        courseId: form.courseId || null,
        duration: Number(form.duration),
      }
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
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return lectures.filter(l => {
      const matchSearch = !q
        || l.title?.toLowerCase().includes(q)
        || l.instructor?.fullName?.toLowerCase().includes(q)
        || l.courseId?.title?.toLowerCase().includes(q)
      const matchStatus = !statusFilter || l.status === statusFilter
      const matchInstructor = !instructorFilter || (l.instructor?._id || l.instructor) === instructorFilter
      return matchSearch && matchStatus && matchInstructor
    })
  }, [lectures, search, statusFilter, instructorFilter])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await liveLecturesAPI.remove(deleteId)
      setLectures(ls => ls.filter(l => l._id !== deleteId))
      toast.success('Lecture deleted')
    } catch {
      toast.error('Could not delete lecture')
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
              Live Lectures
            </h1>
            {!loading && (
              <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ background: '#EDE9FE', color: '#7C3AED' }}>
                {filtered.length} of {lectures.length} lectures
              </span>
            )}
          </div>
          <Button onClick={openNew}><Plus size={15} /> Schedule Lecture</Button>
        </div>

        {/* Search + filter */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" color="var(--text-muted)" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, instructor or course…"
              className="input-field"
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>
          <Select
            value={instructorFilter}
            onChange={setInstructorFilter}
            options={[
              { value: '', label: 'All Instructors' },
              ...instructors.map(i => ({ value: i._id, label: i.fullName }))
            ]}
            placeholder="All Instructors"
            className="w-48"
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: '', label: 'All statuses' },
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'live',      label: 'Live' },
              { value: 'ended',     label: 'Ended' },
            ]}
            placeholder="All statuses"
            className="w-44"
          />
        </div>

        {loading ? (
          <div className="skeleton h-64 rounded-2xl" />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
            <Video size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-base font-medium">
              {lectures.length === 0 ? 'No live lectures yet' : 'No lectures match your search'}
            </p>
            {(search || statusFilter || instructorFilter) && (
              <button
                onClick={() => { setSearch(''); setStatusFilter(''); setInstructorFilter('') }}
                className="mt-3 text-sm font-semibold"
                style={{ color: '#7C3AED' }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden shadow-card" style={{ border: '1px solid var(--border-default)' }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#EDE9FE', borderBottom: '1px solid var(--border-purple)' }}>
                  {['Lecture', 'Instructor', 'Course', 'Scheduled', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: '#5B21B6' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((lec, i) => {
                  const isExpanded = expandedLecId === lec._id
                  return (
                    <React.Fragment key={lec._id}>
                      <tr className="transition-colors hover:bg-[#FAFAFE]"
                        style={{ borderBottom: i < filtered.length - 1 && !isExpanded ? '1px solid var(--border-default)' : 'none' }}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                              style={{ background: lec.status === 'live' ? '#F0FDF4' : '#FEF2F2' }}>
                              {lec.status === 'live'
                                ? <Radio size={16} color="#10B981" />
                                : <Video size={16} color="#DC2626" />}
                            </div>
                            <div>
                              <p className="text-sm font-semibold line-clamp-1" style={{ color: 'var(--text-primary)' }}>{lec.title}</p>
                              {lec.description && (
                                <p className="text-xs line-clamp-1" style={{ color: 'var(--text-muted)' }}>{lec.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {lec.instructor?.avatar ? (
                              <img src={lec.instructor.avatar} className="w-7 h-7 rounded-full" alt="" />
                            ) : (
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
                                {lec.instructor?.fullName?.charAt(0)}
                              </div>
                            )}
                            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                              {lec.instructor?.fullName || '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {lec.courseId ? (
                            <span className="text-xs px-2 py-1 rounded-lg font-medium"
                              style={{ background: '#EDE9FE', color: '#7C3AED' }}>
                              {lec.courseId.title}
                            </span>
                          ) : (
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>General</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <Calendar size={12} /> {fmtDate(lec.scheduledAt)}
                          </div>
                          <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            <Clock size={12} /> {fmtTime(lec.scheduledAt)} · {lec.duration} min
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant={STATUS_BADGE[lec.status] || 'gray'}>{STATUS_LABEL[lec.status] || lec.status}</Badge>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            {lec.status === 'ended' && (
                              <button
                                onClick={() => setExpandedLecId(isExpanded ? null : lec._id)}
                                className={`p-2 rounded-lg transition-all ${isExpanded ? 'bg-[#EDE9FE]' : 'hover:bg-[#EDE9FE]'}`}
                                title="View Attendance"
                              >
                                <Users size={15} color="#7C3AED" />
                              </button>
                            )}
                            {lec.type === 'inapp' ? (
                              (lec.status === 'live' || lec.status === 'scheduled') && (
                                <a
                                  href={`/live/${lec._id}`}
                                  className="p-2 rounded-lg transition-all hover:bg-[#F0FDF4]"
                                  title={lec.status === 'live' ? 'Open Room' : 'Preview'}
                                >
                                  <Monitor size={15} color="#10B981" />
                                </a>
                              )
                            ) : (
                              lec.meetingUrl && (
                                <a
                                  href={lec.meetingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 rounded-lg transition-all hover:bg-[#F0FDF4]"
                                  title="Open meeting"
                                >
                                  <ExternalLink size={15} color="#10B981" />
                                </a>
                              )
                            )}
                            {lec.status !== 'ended' && (
                              <button
                                onClick={() => openEdit(lec)}
                                className="p-2 rounded-lg transition-all hover:bg-[#EDE9FE]"
                                title="Edit"
                              >
                                <Edit2 size={15} color="#7C3AED" />
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteId(lec._id)}
                              className="p-2 rounded-lg transition-all hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 size={15} color="#EF4444" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-[#FAF9FF]" style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
                          <td colSpan={6} className="px-8 py-5">
                            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
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
                                <table className="w-full text-xs">
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
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Delete modal */}
        <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Lecture" size="sm">
          <div className="flex items-center gap-3 mb-5 p-4 rounded-xl" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: '#FEE2E2' }}>
              <AlertTriangle size={20} color="#DC2626" />
            </div>
            <p className="text-sm" style={{ color: '#B91C1C' }}>
              This will permanently delete this live lecture.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" size="sm" onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}>Delete</Button>
          </div>
        </Modal>

        {/* Schedule / Edit Form Modal */}
        <Modal isOpen={showForm} onClose={closeForm} title={editId ? 'Edit Lecture' : 'Schedule New Lecture'} size="md">
          <form onSubmit={handleSave} className="space-y-4">
            {/* Type toggle */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Session Type</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'link',  icon: Link2,   label: 'External Link', sub: 'Zoom, Google Meet, Teams…', color: '#DC2626', bg: 'rgba(220,38,38,0.1)', border: 'rgba(220,38,38,0.3)' },
                  { value: 'inapp', icon: Monitor,  label: 'In-App Session', sub: 'Built-in live room',       color: '#7C3AED', bg: 'rgba(109,40,217,0.1)', border: 'rgba(109,40,217,0.3)' },
                ].map(({ value, icon: Icon, label, sub, color, bg, border }) => (
                  <button type="button" key={value}
                    onClick={() => setForm(p => ({ ...p, type: value }))}
                    className="flex items-center gap-3 p-3.5 rounded-xl text-left transition-all"
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Instructor *</label>
                <Select value={form.instructor} onChange={handleInstructorChange} options={instructorOptions} placeholder="Select Instructor" required />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Linked Course</label>
                <Select value={form.courseId} onChange={v => setForm(p => ({ ...p, courseId: v }))} options={courseOptions} placeholder="No specific course" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                  Students will join the built-in live room at <strong>/live/{'{session-id}'}</strong>. The instructor can share camera and screen directly.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Description <span className="normal-case font-normal" style={{ color: 'var(--text-muted)' }}>(optional)</span>
              </label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="What will they cover in this session?" rows={2} className="input-field resize-none" />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" size="sm" onClick={closeForm}>Cancel</Button>
              <Button type="submit" size="sm" loading={saving}>{editId ? 'Update' : 'Schedule Lecture'}</Button>
            </div>
          </form>
        </Modal>
      </div>
    </PageLayout>
  )
}
