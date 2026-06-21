import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios.js';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Upload, Brain, CheckCircle, AlertCircle, Loader, RefreshCw, FileText, Clock, AlertTriangle, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import PageLayout from '../../components/layout/PageLayout.jsx';

const FakeProgress = () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress(prev => {
                // approaches 95% logarithmically
                const remaining = 95 - prev;
                return prev + Math.max(0.5, remaining * 0.1);
            });
        }, 500);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
            <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${progress}%` }} 
            />
        </div>
    );
};

const CreateQuiz = () => {
    const [searchParams] = useSearchParams();
    const urlCourseId = searchParams.get('courseId');
    const navigate = useNavigate();

    // ----------------------------------------------------------------------
    // 1. DASHBOARD STATE (Layout & Materials List)
    // ----------------------------------------------------------------------
    const [materials, setMaterials] = useState([]);
    const [loadingMaterials, setLoadingMaterials] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const fetchMaterials = useCallback(async () => {
        try {
            const res = await api.get('/material');
            setMaterials(res.data);
        } catch (error) {
            console.error("Failed to fetch materials", error);
        } finally {
            setLoadingMaterials(false);
        }
    }, []);

    useEffect(() => {
        fetchMaterials();
        // Setup polling every 5 seconds to check for background queue updates
        const interval = setInterval(fetchMaterials, 5000);
        return () => clearInterval(interval);
    }, [refreshTrigger, fetchMaterials]);

    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        setDeletingId(confirmDeleteId);
        try {
            await api.delete(`/material/${confirmDeleteId}`);
            setMaterials(materials.filter(m => m._id !== confirmDeleteId));
            toast.success("Material deleted");
        } catch (error) {
            toast.error("Failed to delete material.");
        } finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'processing': return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
            case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
            case 'failed': return <AlertTriangle className="w-5 h-5 text-red-500" />;
            default: return null;
        }
    };

    // ----------------------------------------------------------------------
    // 2. UPLOAD & GENERATE STATE (Left Panel)
    // ----------------------------------------------------------------------
    const [file, setFile] = useState(null);
    const [chapterName, setChapterName] = useState('');
    const [startPage, setStartPage] = useState('');
    const [endPage, setEndPage] = useState('');
    const [mcqCount, setMcqCount] = useState(10);
    const [status, setStatus] = useState('idle'); // idle, uploading, error
    const [message, setMessage] = useState('');

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus('idle');
            setMessage('');
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        
        if (startPage && startPage < 1) { setStatus('error'); setMessage('Start page must be 1 or greater.'); return; }
        if (startPage && endPage && parseInt(startPage) > parseInt(endPage)) { setStatus('error'); setMessage('End page must be greater than or equal to start page.'); return; }
        if (mcqCount < 1 || mcqCount > 15) { setStatus('error'); setMessage('MCQ count must be between 1 and 15.'); return; }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('mcqCount', mcqCount);
        if (chapterName) formData.append('chapterName', chapterName);
        if (startPage) formData.append('startPage', startPage);
        if (endPage) formData.append('endPage', endPage);

        try {
            setStatus('uploading');
            await api.post('/material/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            // Instantly clear form and trigger refresh so it appears in the right panel as "Pending"
            setFile(null);
            setChapterName('');
            setStartPage('');
            setEndPage('');
            setStatus('idle');
            setRefreshTrigger(prev => prev + 1);
            toast.success("Document uploaded securely! Processing in background.");
            
        } catch (error) {
            setStatus('error');
            setMessage(error.response?.data?.message || 'Upload failed');
        }
    };

    // ----------------------------------------------------------------------
    // 3. QUIZ PUBLISHING STATE (Right Panel overrides list when active)
    // ----------------------------------------------------------------------
    const [publishingMaterial, setPublishingMaterial] = useState(null);
    const [mcqs, setMcqs] = useState([]);
    const [selectedMcqs, setSelectedMcqs] = useState(new Set());
    const [quizTitle, setQuizTitle] = useState('');
    const [quizTimer, setQuizTimer] = useState(15);
    const [courses, setCourses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState(urlCourseId || '');

    useEffect(() => {
        api.get('/instructor/courses').then(res => setCourses(res.data.data || [])).catch(console.error);
    }, []);

    const handlePrepareQuiz = async (material) => {
        try {
            setPublishingMaterial(material);
            setQuizTitle(material.chapterName || material.fileName.replace(/\.[^/.]+$/, ""));
            const res = await api.get(`/mcq/material/${material._id}`);
            setMcqs(res.data);
            setSelectedMcqs(new Set(res.data.map(m => m._id)));
        } catch (error) {
            toast.error("Failed to load generated MCQs");
            setPublishingMaterial(null);
        }
    };

    const toggleSelection = (id) => {
        const newSet = new Set(selectedMcqs);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedMcqs(newSet);
    };

    const handlePublish = async () => {
        if (selectedMcqs.size === 0) return toast.error("Please select at least one question.");
        if (!selectedCourseId) return toast.error("Please select a target course.");
        if (!quizTitle) return toast.error("Please provide a Quiz Title.");
        
        try {
            await api.post('/quiz/create', {
                title: quizTitle,
                timer: quizTimer,
                courseId: selectedCourseId,
                mcqIds: Array.from(selectedMcqs)
            });
            toast.success("Quiz successfully published to the course!");
            navigate('/instructor'); 
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to publish quiz');
        }
    };

    return (
        <>
        <PageLayout noFooter={true}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" style={{ background: 'var(--bg-page)', minHeight: '100%' }}>
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-lg transition-colors hover:bg-[rgba(109,40,217,0.1)]"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>MCQ Generator</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* ---------------------------------------------------------------- */}
                {/* LEFT PANEL: UPLOAD & GENERATE MCQS (1 column)                    */}
                {/* ---------------------------------------------------------------- */}
                <div className="xl:col-span-1 space-y-8">
                    <div className="p-6 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Upload className="w-5 h-5 text-indigo-600" />
                            Upload & Generate MCQs
                        </h3>
                        
                        <div className="mt-2 text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                            Supported formats: PDF, DOCX, PPTX, TXT. Max size: 10MB.
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-4">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                                    className="w-full text-sm text-gray-500
                                        file:mr-4 file:py-2.5 file:px-4
                                        file:rounded-md file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-indigo-50 file:text-indigo-600
                                        hover:file:bg-indigo-100"
                                />
                                
                                <input
                                    type="text"
                                    value={chapterName}
                                    onChange={(e) => setChapterName(e.target.value)}
                                    className="w-full p-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#7C3AED]"
                                    style={{ background: 'var(--bg-page)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                                    placeholder="Optional Module/Chapter Name"
                                />
                            </div>
                            
                            <div className="flex flex-col mb-2 mt-2">
                                <label className="flex justify-between text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                                    <span>Number of Questions</span>
                                    <span className="font-bold" style={{ color: '#7C3AED' }}>{mcqCount}</span>
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="15"
                                    value={mcqCount}
                                    onChange={(e) => setMcqCount(parseInt(e.target.value))}
                                    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#7C3AED]"
                                    style={{ background: 'var(--border-default)' }}
                                />
                                <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                    <span>1</span>
                                    <span>15</span>
                                </div>
                            </div>
                            
                            <div className="flex items-end gap-3 sm:gap-4 flex-wrap sm:flex-nowrap mt-2">
                                <div className="flex-1 w-full sm:w-auto">
                                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Start Page (Optional)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={startPage}
                                        onChange={(e) => setStartPage(e.target.value)}
                                        className="w-full p-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#7C3AED]"
                                        style={{ background: 'var(--bg-page)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                                        placeholder="e.g. 1"
                                    />
                                </div>
                                <div className="flex-1 w-full sm:w-auto">
                                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>End Page (Optional)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={endPage}
                                        onChange={(e) => setEndPage(e.target.value)}
                                        className="w-full p-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#7C3AED]"
                                        style={{ background: 'var(--bg-page)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                                        placeholder="e.g. 5"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleUpload}
                                disabled={!file || status === 'uploading'}
                                className="mt-2 w-full px-6 py-3 bg-[#8B5CF6] text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                            >
                                {status === 'uploading' && <Loader className="w-4 h-4 animate-spin" />}
                                Generate MCQs
                            </button>
                        </div>
                        
                        {status === 'error' && (
                            <div className="mt-5 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm font-medium border border-red-100">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                                {message}
                            </div>
                        )}
                    </div>
                </div>

                {/* ---------------------------------------------------------------- */}
                {/* RIGHT PANEL: MATERIALS LIST OR PUBLISH WORKFLOW (2 columns)      */}
                {/* ---------------------------------------------------------------- */}
                <div className="xl:col-span-2">
                    {!publishingMaterial ? (
                        // STATE A: Show Your Study Materials List
                        <div className="rounded-xl overflow-hidden h-full flex flex-col" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                            <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-default)', background: 'var(--bg-muted)' }}>
                                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Your Study Materials</h3>
                                <button onClick={fetchMaterials} className="text-sm flex items-center gap-1 font-medium transition-colors" style={{ color: '#7C3AED' }}>
                                    <RefreshCw className={`w-4 h-4 ${loadingMaterials ? 'animate-spin' : ''}`} /> Refresh
                                </button>
                            </div>
                            
                            {materials.length === 0 ? (
                                <div className="p-12 text-center flex flex-col items-center" style={{ color: 'var(--text-muted)' }}>
                                    <FileText className="w-12 h-12 mb-3" style={{ color: 'var(--border-default)' }} />
                                    No materials uploaded yet. Upload a document to start generating quizzes!
                                </div>
                            ) : (
                                <ul className="flex-1 overflow-y-auto max-h-[700px]">
                                    {materials.map((m) => (
                                        <li key={m._id} className="p-4 sm:px-6 transition-colors flex items-center justify-between group"
                                            style={{ borderBottom: '1px solid var(--border-default)' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-muted)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 rounded-lg" style={{ background: 'rgba(109,40,217,0.1)', color: '#7C3AED' }}>
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="text-md font-semibold line-clamp-1" style={{ color: 'var(--text-primary)' }} title={m.chapterName || m.fileName}>{m.chapterName || m.fileName}</h4>
                                                    <div className="text-xs mt-1 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                                                        <span className="uppercase font-medium px-2 py-0.5 rounded" style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>{m.fileType}</span>
                                                        {m.startPage && m.endPage && (
                                                            <span className="font-medium px-2 py-0.5 rounded" style={{ background: 'rgba(109,40,217,0.1)', color: '#7C3AED' }}>Pages: {m.startPage}–{m.endPage}</span>
                                                        )}
                                                        <span>• {new Date(m.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    {m.chapterName && <div className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><FileText className="w-3 h-3"/> {m.fileName}</div>}
                                                    {m.status === 'failed' && m.error && (
                                                        <div className="text-xs text-red-500 mt-1 font-medium">Failed: {m.error}</div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className="flex items-center gap-2">
                                                        {getStatusIcon(m.status)}
                                                        <span className="text-sm capitalize font-medium hidden sm:inline" style={{ color: 'var(--text-secondary)' }}>
                                                            {m.status === 'processing' ? 'Generating...' : m.status}
                                                        </span>
                                                    </div>
                                                    {m.status === 'processing' && <FakeProgress />}
                                                </div>
                                                {m.status === 'completed' && (
                                                    <button
                                                        onClick={() => handlePrepareQuiz(m)}
                                                        className="ml-4 px-3 py-1.5 text-sm rounded-md font-bold transition-colors"
                                                        style={{ background: 'var(--bg-page)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                                                        onMouseEnter={e => e.currentTarget.style.color = '#7C3AED'}
                                                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}
                                                    >
                                                        Create Quiz
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => setConfirmDeleteId(m._id)} 
                                                    className="ml-2 p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                    title="Delete Material"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ) : (
                        // STATE B: Review & Publish Quiz
                        <div className="rounded-xl flex flex-col h-full animate-fade-in" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                            <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-default)', background: 'var(--bg-muted)' }}>
                                <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                    <Brain className="w-5 h-5" style={{ color: '#7C3AED' }} />
                                    Review & Publish Quiz
                                </h3>
                                <button
                                    onClick={() => setPublishingMaterial(null)}
                                    style={{ color: 'var(--text-muted)' }}
                                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>Target Course</label>
                                        <select
                                            required
                                            value={selectedCourseId}
                                            onChange={e => setSelectedCourseId(e.target.value)}
                                            className="w-full p-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#7C3AED]"
                                            style={{ background: 'var(--bg-page)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                                        >
                                            <option value="">-- Select Course --</option>
                                            {courses.map(c => (
                                                <option key={c._id} value={c._id}>{c.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>Timer (Minutes)</label>
                                        <input
                                            required
                                            type="number"
                                            min="1"
                                            value={quizTimer}
                                            onChange={e => setQuizTimer(Number(e.target.value))}
                                            className="w-full p-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#7C3AED]"
                                            style={{ background: 'var(--bg-page)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>Quiz Title</label>
                                    <input
                                        required
                                        type="text"
                                        value={quizTitle}
                                        onChange={e => setQuizTitle(e.target.value)}
                                        className="w-full p-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#7C3AED]"
                                        style={{ background: 'var(--bg-page)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                                    />
                                </div>

                                <div className="pt-4" style={{ borderTop: '1px solid var(--border-default)' }}>
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-bold" style={{ color: 'var(--text-primary)' }}>Select Questions</h4>
                                        <span className="text-sm font-medium px-2 py-1 rounded" style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>{selectedMcqs.size} of {mcqs.length} selected</span>
                                    </div>
                                    <div className="space-y-3">
                                        {mcqs.map((mcq, idx) => (
                                            <label
                                                key={mcq._id}
                                                className="flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all"
                                                style={{
                                                    background: selectedMcqs.has(mcq._id) ? 'rgba(109,40,217,0.1)' : 'var(--bg-page)',
                                                    border: selectedMcqs.has(mcq._id) ? '1px solid rgba(109,40,217,0.4)' : '1px solid var(--border-default)',
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="mt-1 flex-shrink-0 w-4 h-4 accent-[#7C3AED]"
                                                    checked={selectedMcqs.has(mcq._id)}
                                                    onChange={() => toggleSelection(mcq._id)}
                                                />
                                                <div className="flex-1">
                                                    <div className="flex gap-2 mb-2">
                                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                                            mcq.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                                            mcq.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                            {mcq.difficulty || 'medium'}
                                                        </span>
                                                    </div>
                                                    <p className="font-medium text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}><span className="mr-2 font-bold" style={{ color: 'var(--text-muted)' }}>Q{idx+1}.</span>{mcq.question}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-6 flex justify-end gap-3 rounded-b-xl" style={{ borderTop: '1px solid var(--border-default)', background: 'var(--bg-muted)' }}>
                                <button
                                    onClick={() => setPublishingMaterial(null)}
                                    className="px-6 py-2.5 font-medium rounded-lg transition-colors"
                                    style={{ color: 'var(--text-secondary)' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--border-default)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePublish}
                                    disabled={selectedMcqs.size === 0}
                                    className="px-8 py-2.5 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center gap-2 transition-all"
                                    style={{ background: '#10B981' }}
                                    onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.background = '#059669')}
                                    onMouseLeave={e => e.currentTarget.style.background = '#10B981'}
                                >
                                    <Plus className="w-5 h-5"/>
                                    Publish Course Quiz
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
        </PageLayout>

        <ConfirmModal
            isOpen={!!confirmDeleteId}
            onClose={() => setConfirmDeleteId(null)}
            onConfirm={handleDelete}
            title="Delete Material"
            message="Are you sure you want to delete this material and all its MCQs? This action cannot be undone."
            confirmLabel="Delete"
            confirmVariant="danger"
            loading={!!deletingId}
        />
        </>
    );
};

export default CreateQuiz;
