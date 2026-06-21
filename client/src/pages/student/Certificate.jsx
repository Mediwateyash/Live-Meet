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
    coursesAPI.getBySlug(courseId)
      .then(async (courseRes) => {
        const courseData = courseRes.data.data || null
        setCourse(courseData)
        if (courseData?._id) {
          try {
            const progressRes = await api.get(`/progress/${courseData._id}`)
            setProgress(progressRes.data.data || null)
          } catch {}
        }
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

    // Add a minor delay to allow browser layout to settle after scrolling
    await new Promise(resolve => setTimeout(resolve, 50))

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
  const isCompleted = (progress?.percentComplete || 0) >= 100;

  if (!isCompleted) {
    return (
      <PageLayout>
        <div className="max-w-md mx-auto px-6 py-20 flex flex-col items-center text-center">
          <div
            className="w-full rounded-2xl p-8 shadow-lg"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-left">
                <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Certification</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Earn yours by finishing the course</p>
              </div>
              <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--bg-muted)' }}>
                <Award size={22} color="var(--text-muted)" />
              </div>
            </div>
            <p className="text-sm mb-6 text-left" style={{ color: 'var(--text-muted)' }}>
              Complete all course lessons to unlock your official verified certificate.
            </p>
            <button
              disabled
              className="w-full py-3 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
            >
              Locked ({Math.round(progress?.percentComplete || 0)}% Done)
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

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
          {/* SVG Borders & Corner Decorations to prevent html2canvas line crossover rendering artifacts */}
          <svg
            width="800"
            height="565"
            viewBox="0 0 800 565"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '800px',
              height: '565px',
              pointerEvents: 'none',
            }}
          >
            {/* Outer Border (thick solid gold) */}
            <rect
              x="8"
              y="8"
              width="784"
              height="549"
              rx="8"
              ry="8"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="2"
            />

            {/* Inner Border (thin solid gold) */}
            <rect
              x="12"
              y="12"
              width="776"
              height="541"
              rx="4"
              ry="4"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="1"
            />

            {/* Decorative Corners */}
            {/* Top-Left */}
            <path
              d="M18,53 L18,18 L53,18"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="2"
            />
            {/* Top-Right */}
            <path
              d="M747,18 L782,18 L782,53"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="2"
            />
            {/* Bottom-Left */}
            <path
              d="M53,547 L18,547 L18,512"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="2"
            />
            {/* Bottom-Right */}
            <path
              d="M747,547 L782,547 L782,512"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="2"
            />
          </svg>

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
            right: '70px', 
            width: '160px', 
            textAlign: 'center',
            display: 'block'
          }}>
            <div style={{ 
              fontFamily: 'Georgia, serif', 
              fontStyle: 'italic', 
              color: '#7C3AED', 
              fontSize: 15, 
              marginBottom: 6, 
              minHeight: '22px',
              textAlign: 'center',
              width: '100%',
              display: 'block'
            }}>
              {course?.instructor?.fullName || 'Course Instructor'}
            </div>
            <div style={{ 
              height: '1px', 
              backgroundColor: 'rgba(212, 175, 55, 0.6)', 
              margin: '0 auto', 
              width: '100%',
              display: 'block'
            }} />
            <div style={{ 
              color: '#64748B', 
              fontSize: 9, 
              marginTop: 4, 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em',
              textAlign: 'center',
              width: '100%',
              display: 'block'
            }}>Instructor</div>
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
            paddingBottom: 4,
            display: 'block'
          }}>
            <div style={{ width: '100%', textAlign: 'center', display: 'block' }}>Issue Date: {formatDate(issueDate)}</div>
            <div style={{ marginTop: 2, width: '100%', textAlign: 'center', display: 'block' }}>Certificate ID: ZENO-{courseId?.slice(-6).toUpperCase()}</div>
          </div>

          {/* Signature 2 - Issued By */}
          <div style={{ 
            position: 'absolute', 
            bottom: '45px', 
            left: '70px', 
            width: '160px', 
            textAlign: 'center',
            display: 'block'
          }}>
            <div style={{ 
              fontFamily: 'Georgia, serif', 
              fontStyle: 'italic', 
              color: '#7C3AED', 
              fontSize: 15, 
              marginBottom: 6, 
              minHeight: '22px',
              textAlign: 'center',
              width: '100%',
              display: 'block'
            }}>
              Zenius AI
            </div>
            <div style={{ 
              height: '1px', 
              backgroundColor: 'rgba(212, 175, 55, 0.6)', 
              margin: '0 auto', 
              width: '100%',
              display: 'block'
            }} />
            <div style={{ 
              color: '#64748B', 
              fontSize: 9, 
              marginTop: 4, 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em',
              textAlign: 'center',
              width: '100%',
              display: 'block'
            }}>Issued By</div>
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
