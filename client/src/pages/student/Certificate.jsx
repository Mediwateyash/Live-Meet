import React, { useRef, useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { GraduationCap, Download, Award } from 'lucide-react'
import PageLayout from '../../components/layout/PageLayout.jsx'
import Button from '../../components/ui/Button.jsx'
import useAuthStore from '../../store/authStore.js'
import { formatDate } from '../../utils/formatters.js'
import { coursesAPI } from '../../api/courses.js'
import api from '../../api/axios.js'
import html2canvas from 'html2canvas'

export default function Certificate() {
  const { courseId } = useParams()
  const { user } = useAuthStore()
  const certRef = useRef(null)
  const [course, setCourse] = useState(null)
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!courseId) return
    Promise.all([
      coursesAPI.getBySlug(courseId),
      api.get(`/progress/${courseId}`)
    ])
      .then(([courseRes, progressRes]) => {
        setCourse(courseRes.data.data || null)
        setProgress(progressRes.data.data || null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [courseId])

  const formatName = (name) => {
    if (!name) return 'Student Name';
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleDownload = async () => {
    if (!certRef.current) return
    const canvas = await html2canvas(certRef.current, { scale: 2 })
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `zenius-certificate-${courseId}.png`
    a.click()
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </PageLayout>
    )
  }

  const issueDate = progress?.completedAt ? new Date(progress.completedAt) : new Date();

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
            Certificate of Completion
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Download your certificate as a high-resolution image</p>
        </div>

        {/* Certificate */}
        <div
          ref={certRef}
          className="relative rounded-2xl overflow-hidden mx-auto shadow-xl"
          style={{
            maxWidth: 800,
            aspectRatio: '1.414',
            background: '#FFFDF9',
            border: '6px double #D4AF37',
            padding: '50px 70px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Decorative Corners */}
          <div style={{ position: 'absolute', top: 15, left: 15, width: 40, height: 40, borderTop: '2px solid #D4AF37', borderLeft: '2px solid #D4AF37', borderRadius: '4px 0 0 0' }} />
          <div style={{ position: 'absolute', top: 15, right: 15, width: 40, height: 40, borderTop: '2px solid #D4AF37', borderRight: '2px solid #D4AF37', borderRadius: '0 4px 0 0' }} />
          <div style={{ position: 'absolute', bottom: 15, left: 15, width: 40, height: 40, borderBottom: '2px solid #D4AF37', borderLeft: '2px solid #D4AF37', borderRadius: '0 0 0 4px' }} />
          <div style={{ position: 'absolute', bottom: 15, right: 15, width: 40, height: 40, borderBottom: '2px solid #D4AF37', borderRight: '2px solid #D4AF37', borderRadius: '0 0 4px 0' }} />

          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#7C3AED' }}>
              <GraduationCap size={18} color="white" />
            </div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 16, color: '#1E1B4B', letterSpacing: '0.1em' }}>ZENIUS AI</span>
          </div>

          {/* Main Certificate Content */}
          <div className="flex flex-col items-center text-center my-4 w-full">
            <Award size={42} color="#D4AF37" style={{ marginBottom: 12 }} />

            <h2 style={{ 
              fontFamily: 'Outfit, sans-serif', 
              fontWeight: 800, 
              fontSize: 20, 
              color: '#1E1B4B', 
              letterSpacing: '0.25em', 
              textTransform: 'uppercase',
              marginBottom: 10
            }}>
              Certificate of Completion
            </h2>
            
            <p style={{ color: '#57534E', fontSize: 13, marginBottom: 16, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              This is proudly presented to
            </p>

            <h1 style={{ 
              fontFamily: 'Outfit, sans-serif', 
              fontWeight: 800, 
              fontSize: 34, 
              color: '#1E1B4B', 
              marginBottom: 14, 
              letterSpacing: '0.02em'
            }}>
              {formatName(user?.fullName)}
            </h1>

            <p style={{ color: '#57534E', fontSize: 13, marginBottom: 14, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              for successfully completing the specialized course
            </p>

            <h3 style={{ 
              fontFamily: 'Georgia, serif', 
              fontWeight: 700, 
              fontSize: 22, 
              color: '#7C3AED', 
              marginBottom: 10,
              fontStyle: 'italic'
            }}>
              {course?.title || `Course #${courseId}`}
            </h3>
          </div>

          {/* Signatures & Footer info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', marginTop: 10 }}>
            {/* Signature 1 - Instructor */}
            <div style={{ textAlign: 'center', color: '#1E1B4B', fontSize: 10, flex: '1 1 0%' }}>
              <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#7C3AED', fontSize: 15, marginBottom: 6 }}>
                {course?.instructor?.fullName || 'Course Instructor'}
              </div>
              <div style={{ borderTop: '1px solid rgba(212, 175, 55, 0.6)', margin: '0 auto', maxWidth: 130, height: 1 }} />
              <div style={{ color: '#64748B', fontSize: 9, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Instructor</div>
            </div>

            {/* Date & ID */}
            <div style={{ textAlign: 'center', color: '#64748B', fontSize: 9, flex: '1.2 1 0%', paddingBottom: 4 }}>
              <div>Issue Date: {formatDate(issueDate)}</div>
              <div style={{ marginTop: 2 }}>Certificate ID: ZENO-{courseId?.slice(-6).toUpperCase()}</div>
            </div>

            {/* Signature 2 - Issued By */}
            <div style={{ textAlign: 'center', color: '#1E1B4B', fontSize: 10, flex: '1 1 0%' }}>
              <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#7C3AED', fontSize: 15, marginBottom: 6 }}>
                Zenius AI
              </div>
              <div style={{ borderTop: '1px solid rgba(212, 175, 55, 0.6)', margin: '0 auto', maxWidth: 130, height: 1 }} />
              <div style={{ color: '#64748B', fontSize: 9, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Issued By</div>
            </div>
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
