import React, { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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
  { value: 'popular',   label: 'Most Popular' },
  { value: 'newest',    label: 'Newest' },
  { value: 'rating',    label: 'Highest Rated' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc',label: 'Price: High to Low' },
]

export default function Browse() {
  const [params, setParams] = useSearchParams()

  const [courses,     setCourses]     = useState([])
  const [total,       setTotal]       = useState(0)
  const [pages,       setPages]       = useState(1)
  const [loading,     setLoading]     = useState(true)
  const [page,        setPage]        = useState(1)
  const [q,           setQ]           = useState(params.get('q') || '')
  const [category,    setCategory]    = useState(params.get('category') || '')
  const [level,       setLevel]       = useState('')
  const [price,       setPrice]       = useState('')
  const [sort,        setSort]        = useState('popular')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => { setQ(params.get('q') || '') }, [params])

  const debouncedQ = useDebounce(q, 300)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await coursesAPI.browse({ q: debouncedQ, category, level, price, sort, page, limit: 20 })
      setCourses(data.data)
      setTotal(data.total)
      setPages(data.totalPages)
    } catch {
      setCourses([])
    } finally {
      setLoading(false)
    }
  }, [debouncedQ, category, level, price, sort, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [debouncedQ, category, level, price, sort])

  const clearFilters = () => { setCategory(''); setLevel(''); setPrice(''); setQ(''); setSort('popular') }
  const hasFilters   = category || level || price || q

  return (
    <PageLayout>
      {/* ── outer container: 1700px, 32px side padding ── */}
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ maxWidth: '1700px' }}>
        <h1 style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', border: 0 }}>
          Browse Online Learning Courses | Zenius AI
        </h1>

        {/* Mobile filter bar */}
        <div className="flex items-center justify-between mb-5 lg:hidden">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            style={{ color: '#7C3AED', border: '1px solid var(--border-purple)', background: 'var(--bg-surface)' }}
            onClick={() => setShowFilters(p => !p)}
          >
            <SlidersHorizontal size={15} /> Filters
            {hasFilters && <span className="w-2 h-2 rounded-full bg-purple-600" />}
          </button>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{total} courses</span>
        </div>

        {/* Mobile drawer */}
        <AnimatePresence>
          {showFilters && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                onClick={() => setShowFilters(false)}
              />
              <motion.aside
                initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.22 }}
                className="fixed left-0 top-0 bottom-0 z-50 w-72 p-5 overflow-y-auto lg:hidden"
                style={{ background: 'var(--bg-page)' }}
              >
                <FilterPanel
                  category={category} setCategory={setCategory}
                  level={level}       setLevel={setLevel}
                  price={price}       setPrice={setPrice}
                  hasFilters={hasFilters} clearFilters={clearFilters}
                  onClose={() => setShowFilters(false)}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ── two-column layout: sidebar + grid ── */}
        <div className="flex gap-6">

          {/* Desktop sidebar — 300px fixed, sticky */}
          <aside className="hidden lg:block shrink-0 self-start sticky top-24" style={{ width: 300 }}>
            <div className="rounded-2xl p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-purple)' }}>
              <FilterPanel
                category={category} setCategory={setCategory}
                level={level}       setLevel={setLevel}
                price={price}       setPrice={setPrice}
                hasFilters={hasFilters} clearFilters={clearFilters}
              />
            </div>
          </aside>

          {/* Course grid — all remaining width */}
          <div className="flex-1 min-w-0">

            {/* Sort bar */}
            <div className="flex flex-wrap gap-3 items-center justify-between mb-6">
              <span className="text-sm font-medium hidden lg:block" style={{ color: 'var(--text-muted)' }}>{total} courses</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-medium mr-1" style={{ color: 'var(--text-muted)' }}>Sort by:</span>
                {SORT_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    onClick={() => setSort(o.value)}
                    className="text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    style={{
                      color:      sort === o.value ? '#7C3AED' : 'var(--text-secondary)',
                      background: sort === o.value ? 'rgba(124,58,237,0.1)' : 'transparent',
                    }}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cards */}
            {loading ? (
              <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                {[...Array(10)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : courses.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No courses found"
                description="Try adjusting your filters or search query."
                action={{ label: 'Clear filters', onClick: clearFilters }}
              />
            ) : (
              <motion.div
                variants={containerVariants}
                initial="initial"
                animate="animate"
                className="grid gap-5"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
              >
                {courses.map(course => <CourseCard key={course._id} course={course} />)}
              </motion.div>
            )}

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex justify-center gap-2 mt-10 flex-wrap">
                {[...Array(pages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className="w-9 h-9 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      background: page === i + 1 ? '#7C3AED' : 'var(--bg-surface)',
                      color:      page === i + 1 ? 'white'   : 'var(--text-secondary)',
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
      </div>
    </PageLayout>
  )
}

/* ── Shared filter panel (used in both desktop sidebar & mobile drawer) ── */
function FilterPanel({ category, setCategory, level, setLevel, price, setPrice, hasFilters, clearFilters, onClose }) {
  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-lg" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Filters</h3>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs flex items-center gap-1 font-semibold" style={{ color: '#7C3AED' }}>
              <X size={12} /> Clear
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="p-1 rounded-lg transition-colors"
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <X size={16} color="var(--text-muted)" />
            </button>
          )}
        </div>
      </div>

      {/* Category */}
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Category</p>
        <div className="space-y-1.5">
          {CATEGORIES.map(cat => (
            <label key={cat} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={category === cat}
                onChange={() => setCategory(c => c === cat ? '' : cat)}
                className="rounded"
                style={{ accentColor: '#7C3AED', width: 14, height: 14 }}
              />
              <span className="text-[15px] transition-colors group-hover:text-[#7C3AED]" style={{ color: 'var(--text-secondary)' }}>{cat}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Level */}
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Level</p>
        <div className="space-y-1.5">
          {['All', ...LEVELS].map(l => (
            <label key={l} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                checked={(l === 'All' && !level) || level === l}
                onChange={() => setLevel(l === 'All' ? '' : l)}
                style={{ accentColor: '#7C3AED', width: 14, height: 14 }}
              />
              <span className="text-[15px] transition-colors group-hover:text-[#7C3AED]" style={{ color: 'var(--text-secondary)' }}>{l}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Price</p>
        <div className="space-y-1.5">
          {[['', 'All'], ['free', 'Free'], ['paid', 'Paid']].map(([val, lbl]) => (
            <label key={lbl} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                checked={price === val}
                onChange={() => setPrice(val)}
                style={{ accentColor: '#7C3AED', width: 14, height: 14 }}
              />
              <span className="text-[15px] transition-colors group-hover:text-[#7C3AED]" style={{ color: 'var(--text-secondary)' }}>{lbl}</span>
            </label>
          ))}
        </div>
      </div>
    </>
  )
}
