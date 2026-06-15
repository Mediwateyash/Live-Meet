import { create } from 'zustand'

const useUIStore = create((set) => ({
  sidebarOpen: false,
  mobileSidebarOpen: false,

  toggleSidebar:       ()  => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setMobileSidebar:    (v) => set({ mobileSidebarOpen: v }),
  closeSidebar:        ()  => set({ sidebarOpen: false, mobileSidebarOpen: false }),
}))

export default useUIStore
