import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit, Eye, Trash2, BookOpen, FileText, ClipboardList, Brain, Video, TrendingUp } from 'lucide-react'
import PageLayout from '../../components/layout/PageLayout.jsx'
import Button from '../../components/ui/Button.jsx'
import Badge from '../../components/ui/Badge.jsx'
import ConfirmModal from '../../components/ui/ConfirmModal.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import { instructorAPI } from '../../api/instructor.js'
import { coursesAPI } from '../../api/courses.js'
import { formatPrice } from '../../utils/formatters.js'
import toast from 'react-hot-toast'

const STATUS_BADGE = { published: 'green', draft: 'amber', archived: 'gray' }

export default function InstructorCourses() {
  const navigate = useNavigate()
  const [courses,  setCourses]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  const load = () => {
    instructorAPI.getCourses()
      .then(({ data }) => setCourses(data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async () => {
    setDeleting(confirmId)
    try {
      await coursesAPI.delete(confirmId)
      setCourses(c => c.filter(x => x._id !== confirmId))
      toast.success('Course deleted')
    } catch {
      toast.error('Could not delete course')
    } finally {
      setDeleting(null)
      setConfirmId(null)
    }
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>My Courses</h1>
          <Button onClick={() => navigate('/instructor/courses/new')}>
            <Plus size={16} /> New Course
          </Button>
        </div>

        {loading ? (
          <div className="skeleton h-64 rounded-2xl" />
        ) : courses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No courses yet"
            description="Start creating your first course!"
            action={{ label: 'Create Course', onClick: () => navigate('/instructor/courses/new') }}
          />
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', boxShadow: '0 2px 8px rgba(109,40,217,0.06)' }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: 'var(--z-purple-100)', borderBottom: '1px solid var(--border-purple)' }}>
                  {['Course', 'Status', 'Students', 'Revenue', 'Rating', 'Manage', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {courses.map((course, i) => (
                  <tr key={course._id} style={{ borderBottom: i < courses.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img src={course.thumbnail || 'https://placehold.co/48x34/EDE9FE/7C3AED?text=C'} className="w-12 h-8 rounded-lg object-cover" alt="" />
                        <span className="text-sm font-medium line-clamp-1" style={{ color: 'var(--text-primary)' }}>{course.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={STATUS_BADGE[course.status] || 'gray'}>{course.status}</Badge>
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{course.enrolledStudents?.length || 0}</td>
                    <td className="px-5 py-4 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatPrice((course.enrolledStudents?.length || 0) * course.price)}</td>
                    <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{course.avgRating?.toFixed(1) || '—'} ★</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        {[
                          { icon: FileText,      title: 'Notes',         color: '#7C3AED', bg: 'rgba(109,40,217,0.12)',  path: (id) => `/instructor/quizzes/create?courseId=${id}` },
                          { icon: ClipboardList, title: 'Tests',         color: '#2563EB', bg: 'rgba(37,99,235,0.12)',   path: (id) => `/instructor/quizzes?courseId=${id}` },
                          { icon: Brain,         title: 'MCQ',           color: '#10B981', bg: 'rgba(16,185,129,0.12)',  path: (id) => `/instructor/quizzes/create?courseId=${id}` },
                          { icon: Video,         title: 'Live Lectures', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  path: (id) => `/instructor/live-lectures?courseId=${id}` },
                          { icon: TrendingUp,    title: 'Progress',      color: '#EC4899', bg: 'rgba(236,72,153,0.12)',  path: (id) => `/instructor/quizzes/results?courseId=${id}` },
                        ].map(({ icon: Icon, title, color, bg, path }) => (
                          <button key={title} title={title} className="p-1.5 rounded-lg transition-colors" onClick={() => navigate(path(course._id))}
                            onMouseEnter={e => e.currentTarget.style.background = bg}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <Icon size={14} color={color} />
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => navigate(`/instructor/courses/${course._id}/edit`)} className="p-1.5 rounded-lg transition-colors" title="Edit"
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(109,40,217,0.12)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><Edit size={15} color="#7C3AED" /></button>
                        <button onClick={() => navigate(`/course/${course.slug}`)} className="p-1.5 rounded-lg transition-colors" title="Preview"
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.12)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><Eye size={15} color="#2563EB" /></button>
                        <button onClick={() => setConfirmId(course._id)} className="p-1.5 rounded-lg transition-colors" title="Delete"
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><Trash2 size={15} color="#EF4444" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ConfirmModal
          isOpen={!!confirmId}
          onClose={() => setConfirmId(null)}
          onConfirm={handleDelete}
          title="Delete Course"
          message="Are you sure you want to delete this course? This action cannot be undone."
          confirmLabel="Delete"
          confirmVariant="danger"
          loading={!!deleting}
        />
      </div>
    </PageLayout>
  )
}
