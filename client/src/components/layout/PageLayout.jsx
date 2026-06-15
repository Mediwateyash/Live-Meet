import React from 'react'
import { motion } from 'framer-motion'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'
import { pageVariants } from '../../utils/animations.js'

export default function PageLayout({ children, noFooter = false, className = '' }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-page)' }}>
      <Navbar />
      <motion.main
        variants={pageVariants}
        initial="initial"
        animate="animate"
        className={`flex-1 ${className}`}
      >
        {children}
      </motion.main>
      {!noFooter && <Footer />}
    </div>
  )
}
