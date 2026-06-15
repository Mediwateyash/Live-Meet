import React from 'react'
import StudentLayout from '../../components/layout/StudentLayout.jsx'
import { TrendingUp } from 'lucide-react'

export default function Progress() {
  return (
    <StudentLayout>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(124,58,237,0.1)' }}>
          <TrendingUp size={30} color="#7C3AED" />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Progress</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Your learning progress and analytics will appear here. Coming soon.</p>
      </div>
    </StudentLayout>
  )
}
