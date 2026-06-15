import React, { useRef } from 'react'
import { useParams } from 'react-router-dom'
import { GraduationCap, Download, Award } from 'lucide-react'
import PageLayout from '../../components/layout/PageLayout.jsx'
import Button from '../../components/ui/Button.jsx'
import useAuthStore from '../../store/authStore.js'
import { formatDate } from '../../utils/formatters.js'
import html2canvas from 'html2canvas'

export default function Certificate() {
  const { courseId } = useParams()
  const { user } = useAuthStore()
  const certRef = useRef(null)

  const handleDownload = async () => {
    if (!certRef.current) return
    const canvas = await html2canvas(certRef.current, { scale: 2 })
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `zenius-certificate-${courseId}.png`
    a.click()
  }

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
            Certificate of Completion
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Download your certificate as an image</p>
        </div>

        {/* Certificate */}
        <div
          ref={certRef}
          className="relative rounded-2xl overflow-hidden mx-auto"
          style={{
            maxWidth: 800,
            aspectRatio: '1.414',
            background: 'linear-gradient(135deg, #1E1B4B 0%, #2E1065 60%, #1E1B4B 100%)',
            border: '4px solid #7C3AED',
            padding: '40px 60px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Decorative corner */}
          <div style={{ position: 'absolute', top: 20, left: 20, width: 60, height: 60, borderTop: '2px solid #7C3AED', borderLeft: '2px solid #7C3AED', borderRadius: '8px 0 0 0' }} />
          <div style={{ position: 'absolute', bottom: 20, right: 20, width: 60, height: 60, borderBottom: '2px solid #7C3AED', borderRight: '2px solid #7C3AED', borderRadius: '0 0 8px 0' }} />

          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#7C3AED' }}>
              <GraduationCap size={20} color="white" />
            </div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 20, color: '#A78BFA' }}>Zenius AI</span>
          </div>

          <Award size={48} color="#F59E0B" style={{ marginBottom: 16 }} />

          <p style={{ color: '#C4B5FD', fontSize: 14, marginBottom: 8, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Certificate of Completion
          </p>
          <p style={{ color: '#94A3B8', fontSize: 14, marginBottom: 12 }}>This certifies that</p>

          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 32, color: 'white', marginBottom: 8, textAlign: 'center' }}>
            {user?.fullName}
          </h2>

          <p style={{ color: '#94A3B8', fontSize: 14, marginBottom: 8 }}>has successfully completed</p>

          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 18, color: '#A78BFA', marginBottom: 24, textAlign: 'center' }}>
            Course #{courseId}
          </h3>

          <div style={{ display: 'flex', gap: 40, color: '#64748B', fontSize: 12 }}>
            <span>Date: {formatDate(new Date())}</span>
            <span>ID: ZENO-{courseId?.slice(-6).toUpperCase()}</span>
          </div>
        </div>

        <div className="flex justify-center mt-8">
          <Button onClick={handleDownload} size="lg">
            <Download size={18} /> Download Certificate
          </Button>
        </div>
      </div>
    </PageLayout>
  )
}
