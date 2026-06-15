import React, { useEffect, useState, useMemo } from 'react'
import { Calendar, Clock, Video, Plus, Edit2, Trash2, ExternalLink, CheckCircle2, Radio, Link2, Monitor } from 'lucide-react'
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
    const end = new Date(l.scheduledAt).getTime() + (l.duration || 60) * 60000
    return key === 'upcoming' ? end > now.getTime() : end <= now.getTime()
  }).length

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Live Lectures</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Schedule in-app sessions or link to Zoom / Google Meet.</p>
          </div>
          <Button onClick={openNew}><Plus size={15} /> Schedule Lecture</Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b" style={{ borderColor: 'var(--border-default)' }}>
          {[{ key: 'upcoming', label: 'Upcoming' }, { key: 'past', label: 'Past' }].map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className="px-5 py-3 text-sm font-semibold transition-all"
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
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#FEF2F2' }}>
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
              {filtered.map(lec => (
                <motion.div key={lec._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="rounded-2xl p-5 flex gap-4"
                  style={{ background: 'var(--bg-surface)', border: lec.status === 'live' ? '1.5px solid #BBF7D0' : '1px solid var(--border-default)' }}>

                  {/* Type icon */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: lec.status === 'live' ? '#F0FDF4' : lec.type === 'inapp' ? '#EDE9FE' : '#FEF2F2' }}>
                    {lec.status === 'live' ? <Radio size={22} color="#10B981" />
                      : lec.type === 'inapp' ? <Monitor size={22} color="#7C3AED" />
                      : <Link2 size={22} color="#DC2626" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{lec.title}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: lec.type === 'inapp' ? '#EDE9FE' : '#FEF2F2', color: lec.type === 'inapp' ? '#7C3AED' : '#DC2626' }}>
                          {lec.type === 'inapp' ? 'In-App' : 'By Link'}
                        </span>
                      </div>
                      <Badge variant={STATUS_BADGE[lec.status] || 'gray'}>{STATUS_LABEL[lec.status] || lec.status}</Badge>
                    </div>
                    {lec.description && <p className="text-sm mb-2 line-clamp-1" style={{ color: 'var(--text-muted)' }}>{lec.description}</p>}
                    <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <span className="flex items-center gap-1.5"><Calendar size={13} /> {fmtDate(lec.scheduledAt)} at {fmtTime(lec.scheduledAt)}</span>
                      <span className="flex items-center gap-1.5"><Clock size={13} /> {lec.duration} min</span>
                      {lec.courseId && (
                        <span className="px-2 py-0.5 rounded-full font-medium" style={{ background: '#EDE9FE', color: '#7C3AED' }}>{lec.courseId.title}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Join/Open */}
                    {lec.type === 'inapp' ? (
                      (lec.status === 'live' || lec.status === 'scheduled') && (
                        <button onClick={() => navigate(`/live/${lec._id}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={{ background: lec.status === 'live' ? '#F0FDF4' : '#EDE9FE', color: lec.status === 'live' ? '#10B981' : '#7C3AED',
                            border: `1px solid ${lec.status === 'live' ? '#BBF7D0' : '#DDD6FE'}` }}>
                          <Monitor size={12} /> {lec.status === 'live' ? 'Open Room' : 'Preview'}
                        </button>
                      )
                    ) : (
                      <a href={lec.meetingUrl} target="_blank" rel="noopener noreferrer"
                        className="p-2 rounded-lg transition-all hover:bg-[#F0FDF4]" title="Open meeting link">
                        <ExternalLink size={15} color="#10B981" />
                      </a>
                    )}

                    {/* Go live / End */}
                    {lec.status === 'scheduled' && (
                      <button onClick={() => handleStatusChange(lec, 'live')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{ background: '#F0FDF4', color: '#10B981', border: '1px solid #BBF7D0' }}>
                        <Radio size={12} /> Go Live
                      </button>
                    )}
                    {lec.status === 'live' && (
                      <button onClick={() => handleStatusChange(lec, 'ended')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                        <CheckCircle2 size={12} /> End
                      </button>
                    )}

                    {lec.status !== 'ended' && (
                      <button onClick={() => openEdit(lec)} className="p-2 rounded-lg transition-all hover:bg-[#F0EEFF]" title="Edit">
                        <Edit2 size={15} color="#7C3AED" />
                      </button>
                    )}
                    <button onClick={() => setDeleteId(lec._id)} className="p-2 rounded-lg transition-all hover:bg-red-50" title="Delete">
                      <Trash2 size={15} color="#EF4444" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Schedule / Edit Form Modal */}
        <Modal isOpen={showForm} onClose={closeForm} title={editId ? 'Edit Lecture' : 'Schedule New Lecture'} size="md">
          <form onSubmit={handleSave} className="space-y-4">
            {/* Type toggle */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Session Type</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'link',  icon: Link2,   label: 'External Link', sub: 'Zoom, Google Meet, Teams…', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
                  { value: 'inapp', icon: Monitor,  label: 'In-App Session', sub: 'Built-in live room',       color: '#7C3AED', bg: '#EDE9FE', border: '#DDD6FE' },
                ].map(({ value, icon: Icon, label, sub, color, bg, border }) => (
                  <button type="button" key={value}
                    onClick={() => setForm(p => ({ ...p, type: value }))}
                    className="flex items-center gap-3 p-3.5 rounded-xl text-left transition-all"
                    style={{ border: `2px solid ${form.type === value ? color : 'var(--border-default)'}`,
                      background: form.type === value ? bg : 'white' }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: form.type === value ? bg : 'var(--bg-muted)', border: form.type === value ? `1px solid ${border}` : 'none' }}>
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
              <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#EDE9FE', border: '1px solid #DDD6FE' }}>
                <Monitor size={16} color="#7C3AED" className="mt-0.5 shrink-0" />
                <p className="text-xs" style={{ color: '#5B21B6' }}>
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
          <div className="flex items-center gap-3 mb-5 p-4 rounded-xl" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: '#FEE2E2' }}>
              <Trash2 size={18} color="#DC2626" />
            </div>
            <p className="text-sm" style={{ color: '#B91C1C' }}>This will permanently delete the lecture and it won't be visible to students.</p>
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
