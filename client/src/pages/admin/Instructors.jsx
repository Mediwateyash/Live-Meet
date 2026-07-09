import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, BookOpen, Users, ChevronRight, Search } from 'lucide-react'
import PageLayout from '../../components/layout/PageLayout.jsx'
import { adminAPI } from '../../api/admin.js'
import { SkeletonCard } from '../../components/ui/Skeleton.jsx'

export default function AdminInstructors() {
  const navigate = useNavigate()
  const [instructors, setInstructors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    adminAPI.getInstructors()
      .then(({ data }) => setInstructors(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = instructors.filter(i =>
    i.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    i.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
              Manage Instructors
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Select an instructor to manage their courses
            </p>
          </div>
          <div className="relative w-full sm:w-auto">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" color="var(--text-secondary)" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search instructors..."
              className="pl-9 pr-4 py-2 text-sm rounded-xl border outline-none w-full sm:w-[220px]"
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
              onFocus={e => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border-default)'; e.target.style.boxShadow = 'none' }}
            />
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8">
          <div className="flex-1 px-4 py-3 rounded-xl text-sm font-medium text-center sm:text-left" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
            <span className="font-bold" style={{ color: '#7C3AED' }}>{instructors.length}</span> total instructors
          </div>
          <div className="flex-1 px-4 py-3 rounded-xl text-sm font-medium text-center sm:text-left" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
            <span className="font-bold" style={{ color: '#7C3AED' }}>{instructors.reduce((a, i) => a + (i.courseCount || 0), 0)}</span> total courses
          </div>
          <div className="flex-1 px-4 py-3 rounded-xl text-sm font-medium text-center sm:text-left" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
            <span className="font-bold" style={{ color: '#7C3AED' }}>{instructors.reduce((a, i) => a + (i.studentCount || 0), 0)}</span> total students
          </div>
        </div>

        {/* Instructor grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#F0EEFF' }}>
              <GraduationCap size={32} color="#7C3AED" />
            </div>
            <p className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>No instructors found</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {search ? 'Try a different search term.' : 'No approved instructors yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(inst => (
              <button
                key={inst._id}
                onClick={() => navigate(`/admin/instructors/${inst._id}`)}
                className="text-left group rounded-2xl p-5 transition-all hover:shadow-lg"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {inst.avatar ? (
                      <img src={inst.avatar} alt={inst.fullName} className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold shrink-0"
                        style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
                        {inst.fullName?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
                        {inst.fullName}
                      </p>
                      <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{inst.email}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} color="var(--text-muted)" className="shrink-0 mt-1 transition-transform group-hover:translate-x-0.5" />
                </div>

                {inst.expertise?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {inst.expertise.slice(0, 3).map(ex => (
                      <span key={ex} className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: '#F0EEFF', color: '#7C3AED' }}>
                        {ex}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 pt-3" style={{ borderTop: '1px solid var(--border-default)' }}>
                  <div className="flex items-center gap-1.5">
                    <BookOpen size={13} color="#7C3AED" />
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      {inst.courseCount || 0} course{inst.courseCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users size={13} color="#10B981" />
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      {inst.studentCount || 0} student{inst.studentCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
