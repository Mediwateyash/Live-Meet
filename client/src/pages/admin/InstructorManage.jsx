import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Plus, Edit, Eye, Trash2, BookOpen, FileText, ClipboardList, Brain, Video, TrendingUp, ArrowLeft } from 'lucide-react'
import PageLayout from '../../components/layout/PageLayout.jsx'
import Button from '../../components/ui/Button.jsx'
import Badge from '../../components/ui/Badge.jsx'
import ConfirmModal from '../../components/ui/ConfirmModal.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import { adminAPI } from '../../api/admin.js'
import { coursesAPI } from '../../api/courses.js'
import { formatPrice } from '../../utils/formatters.js'
import toast from 'react-hot-toast'

const STATUS_BADGE = { published: 'green', draft: 'amber', archived: 'gray' }

export default function AdminInstructorManage() {
  const navigate = useNavigate()
  const { instructorId } = useParams()

  const [instructor, setInstructor] = useState(null)
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      adminAPI.getInstructor(instructorId),
      adminAPI.getInstructorCourses(instructorId),
    ])
      .then(([instRes, coursesRes]) => {
        setInstructor(instRes.data.data)
        setCourses(coursesRes.data.data || [])
      })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [instructorId])

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          <Link to="/admin/instructors" className="flex items-center gap-1 hover:text-[#7C3AED] transition-colors">
            <ArrowLeft size={14} /> Manage Instructors
          </Link>
          <span>›</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            {instructor?.fullName || '...'}
          </span>
        </div>

        {/* Instructor profile card */}
        {instructor && (
          <div className="rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
            {instructor.avatar ? (
              <img src={instructor.avatar} alt={instructor.fullName} className="w-16 h-16 rounded-xl object-cover shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
                {instructor.fullName?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row items-center gap-2 mb-1">
                <h2 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                  {instructor.fullName}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold shrink-0" style={{ background: '#F0FDF4', color: '#10B981' }}>
                  Approved Instructor
                </span>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{instructor.email}</p>
              {instructor.expertise?.length > 0 && (
                <div className="flex flex-wrap justify-center sm:justify-start gap-1 mt-2">
                  {instructor.expertise.map(ex => (
                    <span key={ex} className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: '#F0EEFF', color: '#7C3AED' }}>
                      {ex}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-6 shrink-0 w-full sm:w-auto justify-center sm:justify-start border-t sm:border-t-0 pt-4 sm:pt-0" style={{ borderColor: 'var(--border-default)' }}>
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#7C3AED' }}>{courses.length}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Courses</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#10B981' }}>
                  {courses.reduce((a, c) => a + (c.enrolledStudents?.length || 0), 0)}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Students</p>
              </div>
            </div>
          </div>
        )}

        {/* Courses section header */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <h3 className="text-lg font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
            Courses
          </h3>
          <Button onClick={() => navigate(`/admin/instructors/${instructorId}/courses/new`)}>
            <Plus size={15} /> New Course
          </Button>
        </div>

        {loading ? (
          <div className="skeleton h-64 rounded-2xl" />
        ) : courses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No courses yet"
            description="Create the first course for this instructor."
            action={{ label: 'Create Course', onClick: () => navigate(`/admin/instructors/${instructorId}/courses/new`) }}
          />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-card hidden md:block" style={{ border: '1px solid var(--border-default)' }}>
              <div className="table-responsive">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr style={{ background: '#EDE9FE', borderBottom: '1px solid var(--border-purple)' }}>
                      {['Course', 'Status', 'Students', 'Revenue', 'Rating', 'Manage', 'Actions'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#5B21B6' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course, i) => (
                      <tr key={course._id} className="transition-colors hover:bg-[#FAFAFE]" style={{ borderBottom: i < courses.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
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
                          <Badge variant={STATUS_BADGE[course.status] || 'gray'}>{course.status}</Badge>
                        </td>
                        <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {course.enrolledStudents?.length || 0}
                        </td>
                        <td className="px-5 py-4 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {formatPrice((course.enrolledStudents?.length || 0) * course.price)}
                        </td>
                        <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {course.avgRating?.toFixed(1) || '—'} ★
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            {[
                              { icon: FileText,      title: 'Notes',         color: '#7C3AED', bg: '#F0EEFF', path: (id) => `/instructor/courses/${id}/notes` },
                              { icon: ClipboardList, title: 'Tests',         color: '#2563EB', bg: '#EFF6FF', path: (id) => `/instructor/quizzes?courseId=${id}` },
                              { icon: Brain,         title: 'MCQ',           color: '#10B981', bg: '#F0FDF4', path: (id) => `/instructor/quizzes/create?courseId=${id}` },
                              { icon: Video,         title: 'Live Lectures', color: '#F59E0B', bg: '#FFFBEB', path: (id) => `/admin/live-lectures?courseId=${id}` },
                              { icon: TrendingUp,    title: 'Progress',      color: '#EC4899', bg: '#FDF2F8', path: (id) => `/instructor/quizzes/results?courseId=${id}` },
                            ].map(({ icon: Icon, title, color, bg, path }) => (
                              <button
                                key={title}
                                title={title}
                                className="p-1.5 rounded-lg transition-colors touch-target flex items-center justify-center"
                                onClick={() => navigate(path(course._id))}
                                onMouseEnter={e => e.currentTarget.style.background = bg}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >
                                <Icon size={14} color={color} />
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => navigate(`/admin/instructors/${instructorId}/courses/${course._id}/edit`)}
                              className="p-1.5 rounded-lg transition-colors hover:bg-[#F0EEFF] touch-target flex items-center justify-center"
                              title="Edit"
                            >
                              <Edit size={15} color="#7C3AED" />
                            </button>
                            <button
                              onClick={() => navigate(`/course/${course.slug}`)}
                              className="p-1.5 rounded-lg transition-colors hover:bg-[#EFF6FF] touch-target flex items-center justify-center"
                              title="Preview"
                            >
                              <Eye size={15} color="#2563EB" />
                            </button>
                            <button
                              onClick={() => setConfirmId(course._id)}
                              className="p-1.5 rounded-lg transition-colors hover:bg-red-50 touch-target flex items-center justify-center"
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
            </div>

            {/* Mobile Stacked Card View */}
            <div className="space-y-4 md:hidden">
              {courses.map(course => (
                <div 
                  key={course._id}
                  className="rounded-2xl p-4 border flex flex-col gap-3.5 bg-white shadow-sm"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={course.thumbnail || 'https://placehold.co/48x34/EDE9FE/7C3AED?text=C'}
                      className="w-16 h-10 rounded-lg object-cover shrink-0 mt-0.5"
                      alt=""
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold leading-snug break-words" style={{ color: 'var(--text-primary)' }}>{course.title}</h4>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        <Badge variant={STATUS_BADGE[course.status] || 'gray'}>{course.status}</Badge>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{course.avgRating?.toFixed(1) || '—'} ★</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-2 px-3 rounded-xl border bg-gray-50 dark:bg-gray-800/40" style={{ borderColor: 'var(--border-default)' }}>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>Students</span>
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{course.enrolledStudents?.length || 0}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>Revenue</span>
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {formatPrice((course.enrolledStudents?.length || 0) * course.price)}
                      </span>
                    </div>
                  </div>

                  {/* Manage Row */}
                  <div className="flex flex-col gap-1.5 border-t pt-3" style={{ borderColor: 'var(--border-default)' }}>
                    <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>Management</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { icon: FileText,      title: 'Notes',         color: '#7C3AED', bg: '#F0EEFF', path: (id) => `/instructor/courses/${id}/notes` },
                        { icon: ClipboardList, title: 'Tests',         color: '#2563EB', bg: '#EFF6FF', path: (id) => `/instructor/quizzes?courseId=${id}` },
                        { icon: Brain,         title: 'MCQ',           color: '#10B981', bg: '#F0FDF4', path: (id) => `/instructor/quizzes/create?courseId=${id}` },
                        { icon: Video,         title: 'Live Lectures', color: '#F59E0B', bg: '#FFFBEB', path: (id) => `/admin/live-lectures?courseId=${id}` },
                        { icon: TrendingUp,    title: 'Progress',      color: '#EC4899', bg: '#FDF2F8', path: (id) => `/instructor/quizzes/results?courseId=${id}` },
                      ].map(({ icon: Icon, title, color, bg, path }) => (
                        <button
                          key={title}
                          title={title}
                          className="flex-1 min-w-[50px] py-2.5 rounded-xl transition-all border flex flex-col items-center justify-center gap-1 hover:shadow-sm"
                          style={{ borderColor: 'var(--border-default)', background: bg + '1A' }}
                          onClick={() => navigate(path(course._id))}
                        >
                          <Icon size={16} color={color} />
                          <span className="text-[9px] font-bold" style={{ color }}>{title}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex gap-2 border-t pt-3" style={{ borderColor: 'var(--border-default)' }}>
                    <button
                      onClick={() => navigate(`/admin/instructors/${instructorId}/courses/${course._id}/edit`)}
                      className="flex-1 flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl border text-xs font-bold hover:bg-[#F0EEFF] transition-all touch-target"
                      style={{ color: '#7C3AED', borderColor: 'var(--border-purple)', background: 'var(--bg-surface)' }}
                    >
                      <Edit size={14} /> Edit
                    </button>
                    <button
                      onClick={() => navigate(`/course/${course.slug}`)}
                      className="flex-1 flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl border text-xs font-bold hover:bg-[#EFF6FF] transition-all touch-target"
                      style={{ color: '#2563EB', borderColor: 'rgba(37,99,235,0.2)', background: 'var(--bg-surface)' }}
                    >
                      <Eye size={14} /> Preview
                    </button>
                    <button
                      onClick={() => setConfirmId(course._id)}
                      className="flex-1 flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl border text-xs font-bold hover:bg-red-50 transition-all touch-target"
                      style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.2)', background: 'var(--bg-surface)' }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
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
