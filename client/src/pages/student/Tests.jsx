import React, { useState, useEffect } from 'react'
import StudentLayout from '../../components/layout/StudentLayout.jsx'
import { ClipboardList, Play, Clock, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios.js'
import Spinner from '../../components/ui/Spinner.jsx'

export default function Tests() {
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/quiz')
      .then(res => setQuizzes(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
            My Tests & Quizzes
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Access all course quizzes and your personal AI-generated practice tests.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size={40} color="#7C3AED" /></div>
        ) : quizzes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(124,58,237,0.1)' }}>
              <ClipboardList size={30} color="#7C3AED" />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No Quizzes Available</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>You don't have any quizzes yet. Go to a course to generate one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map(quiz => (
              <div 
                key={quiz._id} 
                onClick={() => navigate(`/quizzes/${quiz._id}/take`)}
                className="bg-[#1A1A2E] border border-gray-800 rounded-xl p-5 hover:border-[#7C3AED] transition-colors cursor-pointer group flex flex-col"
              >
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-white mb-3 line-clamp-2">{quiz.title}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-4">
                    <div className="flex items-center gap-1.5"><Clock size={16} /> {quiz.timer} mins</div>
                    <div className="flex items-center gap-1.5"><FileText size={16} /> {quiz.mcqIds?.length || 0} Qs</div>
                    {quiz.visibility === 'private' && (
                      <span className="bg-[#7C3AED]/20 text-[#A78BFA] text-xs px-2 py-0.5 rounded-md font-medium">Personal</span>
                    )}
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-800 flex justify-between items-center">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Ready to start?</span>
                  <button className="bg-gray-800 group-hover:bg-[#7C3AED] text-gray-400 group-hover:text-white p-2.5 rounded-lg transition-colors">
                    <Play size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  )
}
