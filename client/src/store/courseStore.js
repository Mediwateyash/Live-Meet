import { create } from 'zustand'

const useCourseStore = create((set) => ({
  courses: [],
  featuredCourses: [],
  currentCourse: null,
  pagination: { page: 1, totalPages: 1, total: 0 },
  filters: { category: '', level: '', price: '', sort: 'popular', q: '' },
  loading: false,

  setCourses:        (courses, pagination) => set({ courses, pagination }),
  setFeatured:       (courses)             => set({ featuredCourses: courses }),
  setCurrentCourse:  (course)              => set({ currentCourse: course }),
  setFilters:        (filters)             => set((s) => ({ filters: { ...s.filters, ...filters } })),
  setLoading:        (loading)             => set({ loading }),
  clearCurrentCourse:()                    => set({ currentCourse: null }),
}))

export default useCourseStore
