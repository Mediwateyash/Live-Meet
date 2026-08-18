import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios.js';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Upload, Brain, CheckCircle, AlertCircle, Loader, RefreshCw, FileText, Clock, AlertTriangle, Trash2, X, Edit2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
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

    const fetchMaterials = useCallback(async () => {
        try {
            const url = urlCourseId ? `/material?courseId=${urlCourseId}` : '/material';
            const res = await api.get(url);
            setMaterials(res.data);
        } catch (error) {
            console.error("Failed to fetch materials", error);
        } finally {
            setLoadingMaterials(false);
        }
    }, [urlCourseId]);

    useEffect(() => {
        fetchMaterials();
        // Setup polling every 5 seconds to check for background queue updates
        const interval = setInterval(fetchMaterials, 5000);
        return () => clearInterval(interval);
    }, [refreshTrigger, fetchMaterials]);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this material and all its MCQs?")) return;
        try {
            await api.delete(`/material/${id}`);
            setMaterials(materials.filter(m => m._id !== id));
            toast.success("Material deleted");
        } catch (error) {
            toast.error("Failed to delete material.");
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
    const [generateMCQ, setGenerateMCQ] = useState(true);
    const [mcqCount, setMcqCount] = useState(10);
    const [generateWH, setGenerateWH] = useState(false);
    const [whCount, setWhCount] = useState(5);
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
        if (whCount < 1 || whCount > 15) { setStatus('error'); setMessage('WH count must be between 1 and 15.'); return; }
        if (!generateMCQ && !generateWH) { setStatus('error'); setMessage('Please select at least one generation option.'); return; }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('generateMCQ', generateMCQ);
        formData.append('mcqCount', mcqCount);
        formData.append('generateWH', generateWH);
        formData.append('whCount', whCount);
        if (selectedCourseId || urlCourseId) formData.append('courseId', selectedCourseId || urlCourseId);
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
        api.get('/instructor/courses')
            .then(res => {
                const list = res.data.data || [];
                setCourses(list);
                // If urlCourseId is set, lock/preselect it. Otherwise if there is only 1 course, auto select it.
                if (urlCourseId && list.some(c => c._id === urlCourseId)) {
                    setSelectedCourseId(urlCourseId);
                } else if (list.length === 1 && !selectedCourseId) {
                    setSelectedCourseId(list[0]._id);
                }
            })
            .catch(console.error);
    }, [urlCourseId]);

    // Inline Editing State
    const [editingMcqId, setEditingMcqId] = useState(null);
    const [editFormData, setEditFormData] = useState({});

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
            navigate('/instructor/quizzes'); 
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to publish quiz');
        }
    };

    const handleEditClick = (e, mcq) => {
        e.preventDefault(); // prevent triggering the checkbox label
        setEditingMcqId(mcq._id);
        setEditFormData({ ...mcq });
    };

    const handleEditChange = (field, value) => {
        setEditFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleOptionChange = (idx, value) => {
        const newOptions = [...editFormData.options];
        newOptions[idx] = value;
        setEditFormData(prev => ({ ...prev, options: newOptions }));
    };

    const saveMcqEdit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.put(`/mcq/${editingMcqId}`, editFormData);
            setMcqs(mcqs.map(m => m._id === editingMcqId ? res.data : m));
            setEditingMcqId(null);
            toast.success("Question updated!");
        } catch (error) {
            toast.error("Failed to update question.");
        }
    };

    return (
        <PageLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/instructor/dashboard" className="text-gray-500 hover:text-indigo-600 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-[var(--text-primary)] tracking-tight">Teacher Dashboard</h1>
                    </div>
                </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* ---------------------------------------------------------------- */}
                {/* LEFT PANEL: UPLOAD & GENERATE MCQS (1 column)                    */}
                {/* ---------------------------------------------------------------- */}
                <div className="xl:col-span-1 space-y-8">
                    <div className="bg-white dark:bg-[var(--bg-surface)] p-6 rounded-xl shadow-sm border border-gray-100 dark:border-[var(--border-default)]">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-[var(--text-primary)] flex items-center gap-2">
                            <Upload className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            Upload & Generate
                        </h3>
                        
                        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Supported formats: PDF, DOCX, PPTX, TXT, JPG, PNG. Max size: 10MB.
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-4">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                                    className="w-full text-sm text-gray-500 dark:text-gray-400
                                        file:mr-4 file:py-2.5 file:px-4
                                        file:rounded-md file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-indigo-50 file:text-indigo-600
                                        hover:file:bg-indigo-100
                                        file:dark:bg-indigo-950/40 file:dark:text-indigo-400
                                        hover:file:dark:bg-indigo-900/30"
                                />
                                
                                <input
                                    type="text"
                                    value={chapterName}
                                    onChange={(e) => setChapterName(e.target.value)}
                                    className="w-full p-2.5 bg-white dark:bg-[var(--bg-body)] border border-gray-300 dark:border-[var(--border-default)] rounded-lg focus:ring-indigo-600 focus:border-indigo-600 text-gray-900 dark:text-[var(--text-primary)] text-sm shadow-sm"
                                    placeholder="Optional Module/Chapter Name"
                                />
                            </div>
                            
                            <div className="flex flex-col gap-4 mb-2 mt-2">
                                <div className="flex items-center gap-3 bg-gray-50 dark:bg-[var(--bg-body)] p-3 rounded-lg border border-gray-200 dark:border-[var(--border-default)]">
                                    <input 
                                        type="checkbox" 
                                        id="gen-mcq-main"
                                        checked={generateMCQ}
                                        onChange={(e) => setGenerateMCQ(e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-600"
                                    />
                                    <label htmlFor="gen-mcq-main" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer flex-1">
                                        Generate MCQs
                                    </label>
                                    {generateMCQ && (
                                        <div className="flex items-center gap-2 w-1/2">
                                            <input 
                                                type="range" min="1" max="15" value={mcqCount} 
                                                onChange={(e) => setMcqCount(parseInt(e.target.value))}
                                                className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                            />
                                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 w-6 text-right">{mcqCount}</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex items-center gap-3 bg-gray-50 dark:bg-[var(--bg-body)] p-3 rounded-lg border border-gray-200 dark:border-[var(--border-default)]">
                                    <input 
                                        type="checkbox" 
                                        id="gen-wh-main"
                                        checked={generateWH}
                                        onChange={(e) => setGenerateWH(e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-600"
                                    />
                                    <label htmlFor="gen-wh-main" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer flex-1">
                                        Generate WH Questions
                                    </label>
                                    {generateWH && (
                                        <div className="flex items-center gap-2 w-1/2">
                                            <input 
                                                type="range" min="1" max="15" value={whCount} 
                                                onChange={(e) => setWhCount(parseInt(e.target.value))}
                                                className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                            />
                                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 w-6 text-right">{whCount}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex items-end gap-3 sm:gap-4 flex-wrap sm:flex-nowrap mt-2">
                                <div className="flex-1 w-full sm:w-auto">
                                    <label className="block text-[11px] font-bold text-gray-550 dark:text-gray-400 uppercase tracking-wider mb-1">Start Page (Optional)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={startPage}
                                        onChange={(e) => setStartPage(e.target.value)}
                                        className="w-full p-2.5 bg-white dark:bg-[var(--bg-body)] border border-gray-300 dark:border-[var(--border-default)] rounded-lg focus:ring-indigo-600 focus:border-indigo-600 text-gray-900 dark:text-[var(--text-primary)] text-sm shadow-sm"
                                        placeholder="e.g. 1"
                                    />
                                </div>
                                <div className="flex-1 w-full sm:w-auto">
                                    <label className="block text-[11px] font-bold text-gray-550 dark:text-gray-400 uppercase tracking-wider mb-1">End Page (Optional)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={endPage}
                                        onChange={(e) => setEndPage(e.target.value)}
                                        className="w-full p-2.5 bg-white dark:bg-[var(--bg-body)] border border-gray-300 dark:border-[var(--border-default)] rounded-lg focus:ring-indigo-600 focus:border-indigo-600 text-gray-900 dark:text-[var(--text-primary)] text-sm shadow-sm"
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
                                Generate
                            </button>
                        </div>
                        
                        {status === 'error' && (
                            <div className="mt-5 p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-lg flex items-center gap-2 text-sm font-medium border border-red-100 dark:border-red-900/30">
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
                        <div className="bg-white dark:bg-[var(--bg-surface)] rounded-xl shadow-sm border border-gray-100 dark:border-[var(--border-default)] overflow-hidden h-full flex flex-col">
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-[var(--border-default)] flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/10">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-[var(--text-primary)]">Your Study Materials</h3>
                                <button onClick={fetchMaterials} className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 font-medium">
                                    <RefreshCw className={`w-4 h-4 ${loadingMaterials ? 'animate-spin' : ''}`} /> Refresh
                                </button>
                            </div>
                            
                            {materials.length === 0 ? (
                                <div className="p-12 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
                                    <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                                    No materials uploaded yet. Upload a document to start generating quizzes!
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-100 dark:divide-[var(--border-default)] flex-1 overflow-y-auto max-h-[700px]">
                                    {materials.map((m) => (
                                        <li key={m._id} className="p-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-850/40 transition-colors flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-lg text-indigo-600 dark:text-indigo-400">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="text-md font-semibold text-gray-900 dark:text-[var(--text-primary)] line-clamp-1" title={m.chapterName || m.fileName}>{m.chapterName || m.fileName}</h4>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                                                        <span className="uppercase font-medium bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">{m.fileType}</span>
                                                        {m.startPage && m.endPage && (
                                                            <span className="font-medium bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded">Pages: {m.startPage}–{m.endPage}</span>
                                                        )}
                                                        <span>• {new Date(m.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    {m.chapterName && <div className="text-xs text-gray-450 dark:text-gray-550 mt-0.5 flex items-center gap-1"><FileText className="w-3 h-3"/> {m.fileName}</div>}
                                                    {m.status === 'failed' && m.error && (
                                                        <div className="text-xs text-red-500 mt-1 font-medium">Failed: {m.error}</div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className="flex items-center gap-2">
                                                        {getStatusIcon(m.status)}
                                                        <span className="text-sm text-gray-600 dark:text-gray-300 capitalize font-medium hidden sm:inline">
                                                            {m.status === 'processing' ? 'Generating...' : m.status}
                                                        </span>
                                                    </div>
                                                    {m.status === 'processing' && <FakeProgress />}
                                                </div>
                                                {m.status === 'completed' && (
                                                    <button 
                                                        onClick={() => handlePrepareQuiz(m)} 
                                                        className="ml-4 px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-colors shadow-sm"
                                                    >
                                                        Create Quiz
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handleDelete(m._id)} 
                                                    className="ml-2 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors"
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
                        <div className="bg-white dark:bg-[var(--bg-surface)] rounded-xl shadow-sm border border-gray-100 dark:border-[var(--border-default)] flex flex-col h-full animate-fade-in">
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-[var(--border-default)] flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/10">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-[var(--text-primary)] flex items-center gap-2">
                                    <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> 
                                    Review & Publish Quiz
                                </h3>
                                <button 
                                    onClick={() => setPublishingMaterial(null)} 
                                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Target Course</label>
                                        <select 
                                            required
                                            value={selectedCourseId}
                                            onChange={e => setSelectedCourseId(e.target.value)}
                                            className="w-full p-2.5 bg-white dark:bg-[var(--bg-body)] border border-gray-300 dark:border-[var(--border-default)] text-gray-900 dark:text-[var(--text-primary)] rounded-lg focus:ring-indigo-600 focus:border-indigo-600 text-sm shadow-sm"
                                        >
                                            <option value="">-- Select Course --</option>
                                            {courses.map(c => (
                                                <option key={c._id} value={c._id}>{c.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Timer (Minutes)</label>
                                        <input 
                                            required
                                            type="number" 
                                            min="1"
                                            value={quizTimer}
                                            onChange={e => setQuizTimer(Number(e.target.value))}
                                            className="w-full p-2.5 bg-white dark:bg-[var(--bg-body)] border border-gray-300 dark:border-[var(--border-default)] text-gray-900 dark:text-[var(--text-primary)] rounded-lg focus:ring-indigo-600 focus:border-indigo-600 text-sm shadow-sm"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Quiz Title</label>
                                    <input 
                                        required
                                        type="text" 
                                        value={quizTitle}
                                        onChange={e => setQuizTitle(e.target.value)}
                                        className="w-full p-2.5 bg-white dark:bg-[var(--bg-body)] border border-gray-300 dark:border-[var(--border-default)] text-gray-900 dark:text-[var(--text-primary)] rounded-lg focus:ring-indigo-600 focus:border-indigo-600 text-sm shadow-sm"
                                    />
                                </div>

                                <div className="pt-4 border-t border-gray-100 dark:border-[var(--border-default)]">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-bold text-gray-800 dark:text-[var(--text-primary)]">Select Questions</h4>
                                        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{selectedMcqs.size} of {mcqs.length} selected</span>
                                    </div>
                                    <div className="space-y-3">
                                        {mcqs.map((mcq, idx) => {
                                            if (editingMcqId === mcq._id) {
                                                return (
                                                    <div key={mcq._id} className="p-4 rounded-lg border border-indigo-300 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/20 shadow-sm space-y-4">
                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">Question {idx+1}</label>
                                                            <textarea 
                                                                className="w-full p-2 bg-white dark:bg-[var(--bg-body)] text-gray-900 dark:text-[var(--text-primary)] border border-gray-300 dark:border-[var(--border-default)] rounded text-sm focus:ring-indigo-500 focus:border-indigo-500" 
                                                                rows="2"
                                                                value={editFormData.question}
                                                                onChange={(e) => handleEditChange('question', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {editFormData.options.map((opt, oIdx) => (
                                                                <div key={oIdx} className="flex items-center gap-2">
                                                                    <span className="text-xs font-bold text-gray-550 dark:text-gray-450">{String.fromCharCode(65 + oIdx)}.</span>
                                                                    <input 
                                                                        type="text" 
                                                                        className="flex-1 p-2 bg-white dark:bg-[var(--bg-body)] text-gray-900 dark:text-[var(--text-primary)] border border-gray-300 dark:border-[var(--border-default)] rounded text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                                        value={opt}
                                                                        onChange={(e) => handleOptionChange(oIdx, e.target.value)}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">Correct Answer (must match an option exactly)</label>
                                                            <select 
                                                                className="w-full p-2 bg-white dark:bg-[var(--bg-body)] text-gray-900 dark:text-[var(--text-primary)] border border-gray-300 dark:border-[var(--border-default)] rounded text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                                value={editFormData.correctAnswer}
                                                                onChange={(e) => handleEditChange('correctAnswer', e.target.value)}
                                                            >
                                                                {editFormData.options.map((opt, oIdx) => (
                                                                    <option key={oIdx} value={opt}>{opt}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="flex justify-end gap-2 pt-2 border-t border-indigo-100 dark:border-indigo-900">
                                                            <button onClick={() => setEditingMcqId(null)} className="px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                                                            <button onClick={saveMcqEdit} className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded hover:bg-indigo-700 flex items-center gap-1"><Save className="w-3 h-3"/> Save</button>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <label key={mcq._id} className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${selectedMcqs.has(mcq._id) ? 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900 shadow-sm' : 'bg-white dark:bg-[var(--bg-surface)] border-gray-200 dark:border-[var(--border-default)] hover:bg-gray-50 dark:hover:bg-gray-850'}`}>
                                                    <input 
                                                        type="checkbox"
                                                        className="mt-1 flex-shrink-0 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-600"
                                                        checked={selectedMcqs.has(mcq._id)}
                                                        onChange={() => toggleSelection(mcq._id)}
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                                                mcq.difficulty === 'easy' ? 'bg-green-100 dark:bg-emerald-950/40 text-green-700 dark:text-emerald-400' :
                                                                mcq.difficulty === 'hard' ? 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400' :
                                                                'bg-yellow-100 dark:bg-amber-950/40 text-yellow-700 dark:text-amber-400'
                                                            }`}>
                                                                {mcq.difficulty || 'medium'}
                                                            </span>
                                                            <button onClick={(e) => handleEditClick(e, mcq)} className="text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-1" title="Edit Question">
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        <p className="font-medium text-gray-800 dark:text-gray-200 text-sm leading-relaxed"><span className="text-gray-400 dark:text-gray-500 mr-2 font-bold">Q{idx+1}.</span>{mcq.question}</p>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-6 border-t border-gray-100 dark:border-[var(--border-default)] bg-gray-50 dark:bg-gray-900/10 flex justify-end gap-3 rounded-b-xl">
                                <button 
                                    onClick={() => setPublishingMaterial(null)}
                                    className="px-6 py-2.5 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-850 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handlePublish}
                                    disabled={selectedMcqs.size === 0}
                                    className="px-8 py-2.5 bg-[#10B981] text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-600 shadow-md flex items-center gap-2 transition-all"
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
    );
};

export default CreateQuiz;
