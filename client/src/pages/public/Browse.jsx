import React, { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { SlidersHorizontal, X, BookOpen } from 'lucide-react'
import PageLayout from '../../components/layout/PageLayout.jsx'
import CourseCard from '../../components/shared/CourseCard.jsx'
import { SkeletonCard } from '../../components/ui/Skeleton.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import { coursesAPI } from '../../api/courses.js'
import { useDebounce } from '../../hooks/useDebounce.js'
import { containerVariants } from '../../utils/animations.js'
import { CATEGORIES, LEVELS } from '../../utils/constants.js'

const SORT_OPTIONS = [
  { value: 'popular',  label: 'Most Popular' },
  { value: 'newest',   label: 'Newest' },
  { value: 'rating',   label: 'Highest Rated' },
  { value: 'price-asc',label: 'Price: Low to High' },
  { value: 'price-desc',label: 'Price: High to Low' },
]

export default function Browse() {
  const [params, setParams] = useSearchParams()

  const [courses,  setCourses]  = useState([])
  const [total,    setTotal]    = useState(0)
  const [pages,    setPages]    = useState(1)
  const [loading,  setLoading]  = useState(true)
  const [page,     setPage]     = useState(1)

  const [q,        setQ]        = useState(params.get('q') || '')
  const [category, setCategory] = useState(params.get('category') || '')
  const [level,    setLevel]    = useState('')
  const [price,    setPrice]    = useState('')
  const [sort,     setSort]     = useState('popular')
  const [showFilters, setShowFilters] = useState(false)

  // Keep q in sync when the URL search param changes (e.g. Navbar search navigates here)
  useEffect(() => {
    const urlQ = params.get('q') || ''
    setQ(urlQ)
  }, [params])

  const debouncedQ = useDebounce(q, 300)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await coursesAPI.browse({ q: debouncedQ, category, level, price, sort, page, limit: 12 })
      setCourses(data.data)
      setTotal(data.total)
      setPages(data.totalPages)
    } catch {
      setCourses([])
    } finally {
      setLoading(false)
    }
  }, [debouncedQ, category, level, price, sort, page])

  useEffect(() => { fetch() }, [fetch])
  useEffect(() => { setPage(1) }, [debouncedQ, category, level, price, sort])

  const clearFilters = () => {
    setCategory(''); setLevel(''); setPrice(''); setQ(''); setSort('popular')
  }

  const hasFilters = category || level || price || q

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-8">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 bg-white rounded-2xl p-5 shadow-card" style={{ border: '1px solid var(--border-purple)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Filters</h3>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs flex items-center gap-1" style={{ color: '#7C3AED' }}>
                  <X size={12} /> Clear
                </button>
              )}
            </div>

            {/* Category */}
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Category</p>
              <div className="space-y-1.5">
                {CATEGORIES.map(cat => (
                  <label key={cat} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={category === cat}
                      onChange={() => setCategory(c => c === cat ? '' : cat)}
                      className="rounded border-gray-300 text-purple-600"
                      style={{ accentColor: '#7C3AED' }}
                    />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Level */}
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Level</p>
              <div className="space-y-1.5">
                {['All', ...LEVELS].map(l => (
                  <label key={l} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={(l === 'All' && !level) || level === l}
                      onChange={() => setLevel(l === 'All' ? '' : l)}
                      style={{ accentColor: '#7C3AED' }}
                    />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{l}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Price</p>
              <div className="space-y-1.5">
                {[['', 'All'], ['free', 'Free'], ['paid', 'Paid']].map(([val, lbl]) => (
                  <label key={lbl} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={price === val} onChange={() => setPrice(val)} style={{ accentColor: '#7C3AED' }} />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{lbl}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Sort bar */}
          <div className="flex flex-wrap gap-3 items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button className="lg:hidden flex items-center gap-1.5 text-sm font-medium" style={{ color: '#7C3AED' }} onClick={() => setShowFilters(p => !p)}>
                <SlidersHorizontal size={15} /> Filters
              </button>
              <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{total} courses</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Sort by:</span>
              {SORT_OPTIONS.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setSort(o.value)}
                  className="text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  style={{
                    color: sort === o.value ? '#7C3AED' : 'var(--text-secondary)',
                    background: sort === o.value ? 'rgba(124, 58, 237, 0.08)' : 'transparent',
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : courses.length === 0 ? (
            <EmptyState icon={BookOpen} title="No courses found" description="Try adjusting your filters or search query." action={{ label: 'Clear filters', onClick: clearFilters }} />
          ) : (
            <motion.div
              variants={containerVariants}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              {courses.map(course => <CourseCard key={course._id} course={course} />)}
            </motion.div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {[...Array(pages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className="w-9 h-9 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    background: page === i + 1 ? '#7C3AED' : 'white',
                    color: page === i + 1 ? 'white' : 'var(--text-secondary)',
                    border: '1px solid var(--border-default)',
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
