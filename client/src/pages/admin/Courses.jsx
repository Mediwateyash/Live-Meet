import React, { useEffect, useState, useMemo } from 'react'
import { Eye, Trash2, ToggleLeft, ToggleRight, AlertTriangle, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Button from '../../components/ui/Button.jsx'
import Select from '../../components/ui/Select.jsx'
import { adminAPI } from '../../api/admin.js'
import { formatDate } from '../../utils/formatters.js'
import toast from 'react-hot-toast'

const STATUS_BADGE = { published: 'green', draft: 'amber', archived: 'gray' }

export default function AdminCourses() {
  const navigate = useNavigate()
  const [courses,  setCourses]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [instructorFilter, setInstructorFilter] = useState('')

  const [deleteModal,  setDeleteModal]  = useState(null)
  const [suspendModal, setSuspendModal] = useState(null)
  const [deleting,     setDeleting]     = useState(false)
  const [suspending,   setSuspending]   = useState(false)

  useEffect(() => {
    adminAPI.getCourses()
      .then(({ data }) => setCourses(data.data || []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false))
  }, [])

  // Build unique instructor options from loaded courses
  const instructorOptions = useMemo(() => {
    const seen = new Map()
    courses.forEach(c => {
      if (c.instructor?._id && !seen.has(c.instructor._id)) {
        seen.set(c.instructor._id, c.instructor.fullName)
      }
    })
    return [
      { value: '', label: 'All instructors' },
      ...[...seen.entries()].map(([id, name]) => ({ value: id, label: name })),
    ]
  }, [courses])

  // Client-side filter
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return courses.filter(c => {
      const matchSearch = !q
        || c.title?.toLowerCase().includes(q)
        || c.instructor?.fullName?.toLowerCase().includes(q)
      const matchInstructor = !instructorFilter || c.instructor?._id === instructorFilter
      return matchSearch && matchInstructor
    })
  }, [courses, search, instructorFilter])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await adminAPI.deleteCourse(deleteModal._id)
      setCourses(c => c.filter(x => x._id !== deleteModal._id))
      toast.success('Course deleted')
    } catch {
      toast.error('Could not delete course')
    } finally {
      setDeleting(false)
      setDeleteModal(null)
    }
  }

  const handleSuspend = async () => {
    const newStatus = suspendModal.status === 'published' ? 'archived' : 'published'
    setSuspending(true)
    try {
      await adminAPI.updateCourseApproval(suspendModal._id, { status: newStatus })
      setCourses(c => c.map(x => x._id === suspendModal._id ? { ...x, status: newStatus } : x))
      toast.success(`Course ${newStatus}`)
    } catch {
      toast.error('Could not update course')
    } finally {
      setSuspending(false)
      setSuspendModal(null)
    }
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
            All Courses
          </h1>
          {!loading && (
            <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ background: '#EDE9FE', color: '#7C3AED' }}>
              {filtered.length} of {courses.length} courses
            </span>
          )}
        </div>

        {/* Search + filter bar */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" color="var(--text-muted)" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by course or instructor…"
              className="input-field"
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>
          <Select
            value={instructorFilter}
            onChange={setInstructorFilter}
            options={instructorOptions}
            placeholder="All instructors"
            className="w-52"
          />
        </div>

        {loading ? (
          <div className="skeleton h-64 rounded-2xl" />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
            <p className="text-base font-medium">
              {courses.length === 0 ? 'No courses found' : 'No courses match your search'}
            </p>
            {(search || instructorFilter) && (
              <button
                onClick={() => { setSearch(''); setInstructorFilter('') }}
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
                  {['Course', 'Instructor', 'Students', 'Status', 'Created', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: '#5B21B6' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((course, i) => (
                  <tr key={course._id} className="transition-colors hover:bg-[#FAFAFE]" style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={course.thumbnail || 'https://placehold.co/48x34/EDE9FE/7C3AED?text=C'}
                          className="w-12 h-8 rounded-lg object-cover shrink-0"
                          alt=""
                        />
                        <span className="text-sm font-medium line-clamp-1" style={{ color: 'var(--text-primary)' }}>{course.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {course.instructor?.fullName || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {course.enrolledStudents?.length || 0}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={STATUS_BADGE[course.status] || 'gray'}>{course.status}</Badge>
                    </td>
                    <td className="px-5 py-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatDate(course.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => navigate(`/course/${course.slug}`)}
                          className="p-2 rounded-lg transition-all hover:bg-[#F0EEFF] hover:shadow-sm"
                          title="View Course"
                        >
                          <Eye size={15} color="#7C3AED" />
                        </button>
                        <button
                          onClick={() => setSuspendModal(course)}
                          className="p-2 rounded-lg transition-all hover:bg-amber-50 hover:shadow-sm"
                          title={course.status === 'published' ? 'Archive Course' : 'Publish Course'}
                        >
                          {course.status === 'published'
                            ? <ToggleRight size={15} color="#D97706" />
                            : <ToggleLeft size={15} color="#16A34A" />}
                        </button>
                        <button
                          onClick={() => setDeleteModal(course)}
                          className="p-2 rounded-lg transition-all hover:bg-red-50 hover:shadow-sm"
                          title="Delete Course"
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
        <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Course" size="sm">
          <div className="flex items-center gap-3 mb-5 p-4 rounded-xl" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: '#FEE2E2' }}>
              <AlertTriangle size={20} color="#DC2626" />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: '#991B1B' }}>Are you sure?</p>
              <p className="text-sm" style={{ color: '#B91C1C' }}>
                This will permanently delete <strong>{deleteModal?.title}</strong>.
              </p>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" size="sm" onClick={() => setDeleteModal(null)} disabled={deleting}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}>Delete</Button>
          </div>
        </Modal>

        {/* Suspend/publish modal */}
        <Modal isOpen={!!suspendModal} onClose={() => setSuspendModal(null)} title={suspendModal?.status === 'published' ? 'Archive Course' : 'Publish Course'} size="sm">
          <div className="flex items-center gap-3 mb-5 p-4 rounded-xl" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: '#FEF3C7' }}>
              <AlertTriangle size={20} color="#D97706" />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: '#92400E' }}>Are you sure?</p>
              <p className="text-sm" style={{ color: '#A16207' }}>
                {suspendModal?.status === 'published'
                  ? <>Archive <strong>{suspendModal?.title}</strong> — hidden from students.</>
                  : <>Publish <strong>{suspendModal?.title}</strong> — visible to students.</>}
              </p>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" size="sm" onClick={() => setSuspendModal(null)} disabled={suspending}>Cancel</Button>
            <Button size="sm" onClick={handleSuspend} loading={suspending}>
              {suspendModal?.status === 'published' ? 'Archive' : 'Publish'}
            </Button>
          </div>
        </Modal>
      </div>
    </PageLayout>
  )
}
