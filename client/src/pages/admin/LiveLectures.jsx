import React, { useEffect, useState, useMemo } from 'react'
import { Calendar, Clock, Video, Trash2, ExternalLink, Search, Radio, AlertTriangle } from 'lucide-react'
import PageLayout from '../../components/layout/PageLayout.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Button from '../../components/ui/Button.jsx'
import Select from '../../components/ui/Select.jsx'
import { liveLecturesAPI } from '../../api/liveLectures.js'
import toast from 'react-hot-toast'

const STATUS_BADGE  = { scheduled: 'blue', live: 'green', ended: 'gray' }
const STATUS_LABEL  = { scheduled: 'Scheduled', live: '● Live', ended: 'Ended' }

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtTime(d) {
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export default function AdminLiveLectures() {
  const [lectures,  setLectures]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deleteId,  setDeleteId]  = useState(null)
  const [deleting,  setDeleting]  = useState(false)

  useEffect(() => {
    liveLecturesAPI.adminGetAll()
      .then(({ data }) => setLectures(data.data || []))
      .catch(() => setLectures([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return lectures.filter(l => {
      const matchSearch = !q
        || l.title?.toLowerCase().includes(q)
        || l.instructor?.fullName?.toLowerCase().includes(q)
        || l.courseId?.title?.toLowerCase().includes(q)
      const matchStatus = !statusFilter || l.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [lectures, search, statusFilter])

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
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
            Live Lectures
          </h1>
          {!loading && (
            <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ background: '#EDE9FE', color: '#7C3AED' }}>
              {filtered.length} of {lectures.length} lectures
            </span>
          )}
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
            {(search || statusFilter) && (
              <button
                onClick={() => { setSearch(''); setStatusFilter('') }}
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
                {filtered.map((lec, i) => (
                  <tr key={lec._id} className="transition-colors hover:bg-[#FAFAFE]"
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
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
                        <a
                          href={lec.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg transition-all hover:bg-[#F0FDF4]"
                          title="Open meeting"
                        >
                          <ExternalLink size={15} color="#10B981" />
                        </a>
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
                ))}
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
      </div>
    </PageLayout>
  )
}
