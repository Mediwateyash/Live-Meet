export const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
}

export const containerVariants = {
  animate: { transition: { staggerChildren: 0.07 } }
}

export const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } }
}

export const modalVariants = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  exit:    { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
}

export const sidebarVariants = {
  closed: { x: '-100%' },
  open:   { x: 0, transition: { type: 'spring', stiffness: 320, damping: 28 } }
}

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } }
}
