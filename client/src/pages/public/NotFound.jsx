import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Search, HelpCircle } from 'lucide-react'
import PageLayout from '../../components/layout/PageLayout.jsx'
import Button from '../../components/ui/Button.jsx'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <PageLayout noFooter={true}>
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-[#7C3AED] opacity-10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full bg-[#2563EB] opacity-5 blur-[120px] pointer-events-none" />

        <div className="max-w-md w-full relative z-10 space-y-6">
          
          {/* Animated 404 Illustration */}
          <div className="relative flex justify-center">
            <motion.h1 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, type: 'spring' }}
              className="text-9xl font-black tracking-tight"
              style={{
                fontFamily: 'Outfit, sans-serif',
                background: 'linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              404
            </motion.h1>
            
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="absolute -top-6 right-1/4 bg-[#7C3AED] p-2 rounded-2xl shadow-lg border border-purple-400/30 text-white"
            >
              <HelpCircle size={24} />
            </motion.div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
              Lost in Space?
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
            <Button 
              variant="primary" 
              onClick={() => navigate('/')}
              className="w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Home size={15} />
              Go Home
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/browse')}
              className="w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Search size={15} />
              Browse Courses
            </Button>
          </div>

        </div>

      </div>
    </PageLayout>
  )
}
