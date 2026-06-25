import { create } from 'zustand'
import { legalAPI } from '../api/legal.js'

const useLegalStore = create((set, get) => ({
  pages: {}, // Maps pageKey -> { isEnabled, lastToggledAt }
  loading: false,
  loaded: false,

  fetchPages: async (force = false) => {
    if (get().loaded && !force) return
    set({ loading: true })
    try {
      const res = await legalAPI.getAll()
      const arr = res.data?.data || []
      const pagesObj = {}
      arr.forEach(p => {
        pagesObj[p.pageKey] = {
          isEnabled: p.isEnabled,
          lastToggledAt: p.lastToggledAt
        }
      })
      set({ pages: pagesObj, loaded: true })
    } catch (err) {
      console.error('Failed to fetch legal pages feature flags:', err)
    } finally {
      set({ loading: false })
    }
  },

  togglePage: async (key) => {
    try {
      const res = await legalAPI.toggle(key)
      const updated = res.data?.data // { pageKey, isEnabled, lastToggledAt }
      if (updated) {
        set((state) => ({
          pages: {
            ...state.pages,
            [key]: {
              isEnabled: updated.isEnabled,
              lastToggledAt: updated.lastToggledAt
            }
          }
        }))
      }
      return updated
    } catch (err) {
      console.error(`Failed to toggle legal page "${key}":`, err)
      throw err
    }
  }
}))

export default useLegalStore
