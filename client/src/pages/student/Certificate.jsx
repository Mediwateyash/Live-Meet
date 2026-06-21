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

    // Save current scroll position
    const currentScrollY = window.scrollY
    const currentScrollX = window.scrollX

    // Temporarily scroll to top-left to avoid html2canvas scroll offset crop issues
    window.scrollTo(0, 0)

    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#FFFDF9',
        logging: false,
      })
      const a = document.createElement('a')
      a.href = canvas.toDataURL('image/png')
      a.download = `zenius-certificate-${courseId}.png`
      a.click()
    } catch (error) {
      console.error('Error generating certificate:', error)
    } finally {
      // Restore original scroll position
      window.scrollTo(currentScrollX, currentScrollY)
    }
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
          data-certificate-container="true"
          className="relative mx-auto shadow-xl"
          style={{
            width: '800px',
            height: '565px',
            background: '#FFFDF9',
            borderRadius: '12px',
            boxSizing: 'border-box',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Outer Border (thick solid gold) */}
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            right: '8px',
            bottom: '8px',
            border: '2px solid #D4AF37',
            borderRadius: '8px',
            pointerEvents: 'none',
          }} />

          {/* Inner Border (thin solid gold) */}
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            right: '12px',
            bottom: '12px',
            border: '1px solid #D4AF37',
            borderRadius: '4px',
            pointerEvents: 'none',
          }} />

          {/* Decorative Corners */}
          <div style={{ position: 'absolute', top: '18px', left: '18px', width: '35px', height: '35px', borderTop: '2px solid #D4AF37', borderLeft: '2px solid #D4AF37', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '18px', right: '18px', width: '35px', height: '35px', borderTop: '2px solid #D4AF37', borderRight: '2px solid #D4AF37', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '18px', left: '18px', width: '35px', height: '35px', borderBottom: '2px solid #D4AF37', borderLeft: '2px solid #D4AF37', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '18px', right: '18px', width: '35px', height: '35px', borderBottom: '2px solid #D4AF37', borderRight: '2px solid #D4AF37', pointerEvents: 'none' }} />

           {/* Header */}
          <div style={{
            position: 'absolute',
            top: '45px',
            left: '0',
            width: '100%',
            textAlign: 'center',
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#7C3AED' }}>
                <GraduationCap size={18} color="white" />
              </div>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 16, color: '#1E1B4B', letterSpacing: '0.1em' }}>ZENIUS AI</span>
            </div>
          </div>

          {/* Main Certificate Content */}
          <div style={{
            position: 'absolute',
            top: '95px',
            left: '70px',
            right: '70px',
            textAlign: 'center',
            boxSizing: 'border-box'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <Award size={44} color="#D4AF37" style={{ display: 'inline-block' }} />
            </div>

            <h2 style={{ 
               fontFamily: 'Outfit, sans-serif', 
               fontWeight: 800, 
               fontSize: 22, 
               color: '#1E1B4B', 
               letterSpacing: '0.25em', 
               textTransform: 'uppercase',
               marginBottom: 16
             }}>
              Certificate of Completion
            </h2>
            
            <p style={{ color: '#57534E', fontSize: 14, marginBottom: 16, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              This is proudly presented to
            </p>

            <h1 style={{ 
               fontFamily: 'Outfit, sans-serif', 
               fontWeight: 800, 
               fontSize: 36, 
               color: '#1E1B4B', 
               marginBottom: 32, 
               letterSpacing: '0.02em',
               lineHeight: 1.2
             }}>
              {formatName(user?.fullName)}
            </h1>

            <p style={{ color: '#57534E', fontSize: 14, marginBottom: 30, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              for successfully completing the specialized course
            </p>

            <h3 style={{ 
               fontFamily: 'Georgia, serif', 
               fontWeight: 700, 
               fontSize: 28, 
               color: '#7C3AED', 
               marginBottom: 10,
               fontStyle: 'italic',
               lineHeight: 1.3
             }}>
              {course?.title || `Course #${courseId}`}
            </h3>
          </div>

          {/* Signatures & Footer info */}
          {/* Signature 1 - Instructor */}
          <div style={{ 
            position: 'absolute', 
            bottom: '45px', 
            left: '70px', 
            width: '160px', 
            textAlign: 'center' 
          }}>
            <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#7C3AED', fontSize: 15, marginBottom: 6, minHeight: '22px' }}>
              {course?.instructor?.fullName || 'Course Instructor'}
            </div>
            <div style={{ borderTop: '1px solid rgba(212, 175, 55, 0.6)', margin: '0 auto', width: '100%', height: 1 }} />
            <div style={{ color: '#64748B', fontSize: 9, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Instructor</div>
          </div>

          {/* Date & ID */}
          <div style={{ 
            position: 'absolute', 
            bottom: '45px', 
            left: '250px', 
            right: '250px', 
            textAlign: 'center',
            color: '#64748B', 
            fontSize: 9, 
            paddingBottom: 4 
          }}>
            <div>Issue Date: {formatDate(issueDate)}</div>
            <div style={{ marginTop: 2 }}>Certificate ID: ZENO-{courseId?.slice(-6).toUpperCase()}</div>
          </div>

          {/* Signature 2 - Issued By */}
          <div style={{ 
            position: 'absolute', 
            bottom: '45px', 
            right: '70px', 
            width: '160px', 
            textAlign: 'center' 
          }}>
            <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#7C3AED', fontSize: 15, marginBottom: 6, minHeight: '22px' }}>
              Zenius AI
            </div>
            <div style={{ borderTop: '1px solid rgba(212, 175, 55, 0.6)', margin: '0 auto', width: '100%', height: 1 }} />
            <div style={{ color: '#64748B', fontSize: 9, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Issued By</div>
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
