import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { modalVariants } from '../../utils/animations.js'

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl', xxl: 'max-w-4xl', '3xl': 'max-w-5xl' }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`relative rounded-2xl shadow-glass w-full ${widths[size]} z-10 flex flex-col max-h-[85vh] md:max-h-[90vh]`}
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-purple)' }}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b rounded-t-2xl overflow-hidden shrink-0" style={{ borderColor: 'var(--border-default)' }}>
                <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg transition-colors touch-target flex items-center justify-center"
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <X size={18} color="var(--text-secondary)" />
                </button>
              </div>
            )}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
