import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios.js';
import { Brain, Play, Clock, FileText, Plus, X, Upload, RefreshCw, CheckCircle2, RotateCcw } from 'lucide-react';
import Spinner from '../ui/Spinner.jsx';
import toast from 'react-hot-toast';

const FakeProgress = () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress(prev => {
                const remaining = 95 - prev;
                return prev + Math.max(0.5, remaining * 0.1);
            });
        }, 500);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden mt-4">
            <div 
                className="h-full bg-[#7C3AED] rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${progress}%` }} 
            />
        </div>
    );
};

export default function CourseQuizzes({ courseId }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [completedQuizIds, setCompletedQuizIds] = useState(new Set());
  const navigate = useNavigate();

  // Generator state
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState('');

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const [quizzesRes, resultsRes] = await Promise.all([
        api.get(`/quiz?courseId=${courseId}`),
        api.get('/result/my-results')
      ]);
      setQuizzes(quizzesRes.data);
      const completedIds = new Set(resultsRes.data.map(r => r.quizId?._id || r.quizId));
      setCompletedQuizIds(completedIds);
    } catch (error) {
      console.error('Failed to fetch quizzes', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) fetchQuizzes();
  }, [courseId]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!file || !title) return toast.error("Please provide a title and upload a file.");
    
    try {
        setGenerating(true);
        setGenStep('Uploading notes and analyzing...');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        
        // 1. Upload Material
        const matRes = await api.post('/material/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        const materialId = matRes.data.material._id;
        
        setGenStep('Extracting questions from AI...');
        // 2. Fetch Generated MCQs
        const mcqRes = await api.get(`/mcq/material/${materialId}`);
        const mcqs = mcqRes.data;
        if (!mcqs || mcqs.length === 0) throw new Error("AI failed to generate questions.");
        
        setGenStep('Finalizing your Quiz...');
        // 3. Create Quiz
        const mcqIds = mcqs.map(m => m._id);
        await api.post('/quiz/create', {
            title,
            timer: mcqIds.length * 2, // 2 mins per question
            courseId,
            mcqIds
        });
        
        toast.success("Practice Quiz Generated!");
        setShowModal(false);
        setFile(null);
        setTitle('');
        fetchQuizzes();
    } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || err.message || "Failed to generate quiz");
    } finally {
        setGenerating(false);
        setGenStep('');
    }
  };

  if (loading) {
    return <div className="py-12 flex justify-center"><Spinner size={30} color="#7C3AED" /></div>;
  }

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Course Quizzes</h3>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#7C3AED] hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Create Practice Quiz
        </button>
      </div>

      {quizzes.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center border border-gray-800 rounded-2xl" style={{ background: '#1A1A2E' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(124,58,237,0.15)' }}>
            <Brain size={26} color="#A78BFA" />
          </div>
          <p className="text-lg font-semibold text-white mb-2">No Quizzes Available</p>
          <p className="text-sm max-w-md text-gray-400">There are no AI-generated quizzes for this course yet. Upload your own notes to generate a personal practice quiz!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quizzes.map(quiz => {
            const isCompleted = completedQuizIds.has(quiz._id);
            return (
              <div key={quiz._id} className="bg-[#1A1A2E] border border-gray-800 rounded-xl p-5 hover:border-[#7C3AED] transition-colors cursor-pointer group" onClick={() => navigate(`/quizzes/${quiz._id}/take`)}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-lg font-semibold text-white">{quiz.title}</h4>
                      {isCompleted && <CheckCircle2 size={18} className="text-[#10B981]" />}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1.5"><Clock size={16} /> {quiz.timer} mins</div>
                      <div className="flex items-center gap-1.5"><FileText size={16} /> {quiz.mcqIds?.length || 0} Questions</div>
                      {quiz.visibility === 'private' && (
                        <span className="bg-gray-800 text-xs px-2 py-0.5 rounded-md text-gray-300">Personal</span>
                      )}
                    </div>
                  </div>
                  <button className="flex items-center gap-2 bg-gray-800 group-hover:bg-[#7C3AED] text-gray-400 group-hover:text-white px-3 py-2 rounded-lg transition-colors text-sm font-semibold">
                    {isCompleted ? (
                      <>
                        <RotateCcw size={16} /> Regive
                      </>
                    ) : (
                      <>
                        <Play size={16} /> Start
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Generator Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1A1A2E] border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Brain size={20} className="text-[#7C3AED]" /> Generate Practice Quiz
              </h3>
              <button onClick={() => !generating && setShowModal(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleGenerate} className="p-5 space-y-4">
              {generating ? (
                <div className="flex flex-col items-center justify-center gap-2 p-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-indigo-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
                    <RefreshCw className="w-10 h-10 animate-spin text-[#7C3AED] relative z-10" />
                  </div>
                  <span className="text-white font-bold mt-2 animate-pulse text-lg">Generating your custom test...</span>
                  <span className="text-gray-400 text-sm">AI is reading your document and crafting questions</span>
                  <FakeProgress />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Quiz Title</label>
                    <input 
                      type="text" 
                      value={title} 
                      onChange={e => setTitle(e.target.value)}
                      disabled={generating}
                      placeholder="e.g. Chapter 4 Practice Test"
                      className="w-full bg-[#0F0F1A] border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#7C3AED]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Upload Notes (PDF/PPTX/TXT)</label>
                    <div className="relative border-2 border-dashed border-gray-700 rounded-xl p-6 text-center hover:border-[#7C3AED] transition-colors cursor-pointer bg-[#0F0F1A]">
                      <input 
                        type="file" 
                        onChange={e => setFile(e.target.files[0])}
                        disabled={generating}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept=".pdf,.pptx,.txt"
                        required
                      />
                      <Upload size={24} className="mx-auto text-gray-500 mb-2" />
                      <p className="text-sm font-medium text-white mb-1">
                        {file ? file.name : "Click to upload or drag & drop"}
                      </p>
                      <p className="text-xs text-gray-500">PDF, PPTX, or TXT up to 10MB</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button 
                      type="submit" 
                      disabled={generating || !file || !title}
                      className="w-full flex items-center justify-center gap-2 bg-[#7C3AED] hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-medium transition-colors"
                    >
                      <Brain size={18} />
                      Generate with AI
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
