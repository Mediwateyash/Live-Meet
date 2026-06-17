import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useUIStore = create(
  persist(
    (set) => ({
      sidebarOpen: false,
      mobileSidebarOpen: false,
      darkMode: false,

      // Auth modal global state
      authModal: false,
      authModalTab: 'login',   // 'login' | 'register'
      authModalHint: '',
      openAuthModal: (tab = 'login', hint = '') => set({ authModal: true, authModalTab: tab, authModalHint: hint }),
      closeAuthModal: () => set({ authModal: false }),

      toggleSidebar:    () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setMobileSidebar: (v) => set({ mobileSidebarOpen: v }),
      closeSidebar:     () => set({ sidebarOpen: false, mobileSidebarOpen: false }),
      toggleDarkMode:   () => set((s) => {
        const next = !s.darkMode
        if (next) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        return { darkMode: next }
      }),
      initDarkMode: (val) => {
        if (val) document.documentElement.classList.add('dark')
        else document.documentElement.classList.remove('dark')
      },
    }),
    {
      name: 'zenius-ui',
      partialize: (s) => ({ darkMode: s.darkMode }), // authModal intentionally excluded
    }
  )
)

export default useUIStore
