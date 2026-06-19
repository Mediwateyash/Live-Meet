import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios.js';
import { Clock, AlertTriangle, Calculator, FileText, X, Trash2, CheckCircle, Info, Play, ShieldAlert } from 'lucide-react';

const TakeQuiz = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();
    
    const [quiz, setQuiz] = useState(null);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState({}); // { mcqId: selectedOption }
    const [visited, setVisited] = useState({}); // { mcqId: true }
    const [timeLeft, setTimeLeft] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // Tools State
    const [showCalculator, setShowCalculator] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [notes, setNotes] = useState('');
    const [calcValue, setCalcValue] = useState('');
    const [isStarted, setIsStarted] = useState(false);
    const [strikes, setStrikes] = useState(0);
    const [isMalpractice, setIsMalpractice] = useState(false);
    const [showStrikeModal, setShowStrikeModal] = useState(false);
    const [strikeReason, setStrikeReason] = useState("");

    // Detect if device is mobile or doesn't support the Fullscreen API (e.g. Safari on iOS)
    const isMobileOrNoFullscreen = !document.documentElement.requestFullscreen || 
                                   /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const timerRef = useRef(null);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const res = await api.get(`/quiz/${quizId}`);
                setQuiz(res.data);
                setTimeLeft(res.data.timer * 60); // Convert mins to seconds
            } catch (error) {
                console.error(error);
                alert("Failed to load quiz");
                navigate('/student');
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [quizId, navigate]);

    useEffect(() => {
        if (!isStarted || submitting || isMalpractice || isMobileOrNoFullscreen) return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                handleViolation("Tab Switching Detected!");
            }
        };

        const handleFullScreenChange = () => {
            if (!document.fullscreenElement) {
                handleViolation("Full Screen Exited!");
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('fullscreenchange', handleFullScreenChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('fullscreenchange', handleFullScreenChange);
        };
    }, [isStarted, submitting, isMalpractice, strikes]);

    const handleViolation = (reason) => {
        if (showStrikeModal || isMalpractice) return; // Prevent multiple modals

        const nextStrikes = strikes + 1;
        setStrikes(nextStrikes);

        if (nextStrikes >= 3) {
            setIsMalpractice(true);
            handleCompleteSubmit(true); 
        } else {
            setStrikeReason(reason);
            setShowStrikeModal(true);
        }
    };

    const resumeFullScreen = () => {
        document.documentElement.requestFullscreen()
            .then(() => {
                setShowStrikeModal(false);
            })
            .catch(e => {
                console.error(e);
                alert("Please enable full screen to continue.");
            });
    };

    const startExamWithProctoring = () => {
        if (isMobileOrNoFullscreen) {
            setIsStarted(true);
            return;
        }

        document.documentElement.requestFullscreen()
            .then(() => {
                setIsStarted(true);
            })
            .catch((e) => {
                alert("Please allow full screen to start the exam.");
            });
    };

    useEffect(() => {
        if (!isStarted || timeLeft === null || submitting || isMalpractice) return;
        
        if (timeLeft <= 0) {
            handleCompleteSubmit();
            return;
        }

        const intervalId = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        timerRef.current = intervalId;

        return () => clearInterval(intervalId);
    }, [isStarted, timeLeft, submitting, isMalpractice]);

    const formatTime = (seconds) => {
        if (seconds === null || seconds === undefined || isNaN(seconds)) return "00:00";
        const absSeconds = Math.max(0, Math.floor(seconds));
        const m = Math.floor(absSeconds / 60).toString().padStart(2, '0');
        const s = (absSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };
    
    const handleCalcClick = (val) => {
        if (val === 'C') setCalcValue('');
        else if (val === '=') {
            try {
                // Using Function instead of eval for safety in this simple context
                setCalcValue(String(Function(`return ${calcValue}`)()));
            } catch {
                setCalcValue('Error');
            }
        } else setCalcValue(prev => prev + val);
    };

    const handleOptionSelect = (mcqId, option) => {
        setAnswers(prev => ({ ...prev, [mcqId]: option }));
    };

    const handleNext = () => {
        if (currentIdx < quiz.mcqIds.length - 1) {
            setCurrentIdx(prev => prev + 1);
        }
    };

    const handleCompleteSubmit = async (malpractice = false) => {
        const isMalpractice = typeof malpractice === 'boolean' ? malpractice : false;
        setSubmitting(true);
        clearInterval(timerRef.current);
        
        // Exit fullscreen if in it
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(e => console.error(e));
        }

        try {
            const formattedAnswers = Object.entries(answers).map(([mcqId, selected]) => ({
                mcqId,
                selected
            }));

            const res = await api.post('/result/submit', {
                quizId: quiz._id,
                answers: formattedAnswers,
                isMalpractice: isMalpractice // Optional: store this in DB if backend supports it
            });

            if (isMalpractice) {
                // If it was malpractice, we'll show the screen in the same page
                setSubmitting(false);
            } else {
                const finalResultId = res.data.resultId || res.data.result?._id || res.data._id;
                if (!finalResultId) {
                    throw new Error("Server didn't return a valid result ID");
                }
                navigate(`/student/results/${finalResultId}`);
            }
        } catch (error) {
            console.error(error);
            const errMsg = error.response?.data?.message || error.message || "Error submitting quiz";
            alert(`Error submitting quiz: ${errMsg}`);
            setSubmitting(false);
        }
    };

    useEffect(() => {
        if (!quiz || !quiz.mcqIds?.length) return;
        const currentId = quiz.mcqIds[currentIdx]._id;
        setVisited(prev => prev[currentId] ? prev : { ...prev, [currentId]: true });
    }, [quiz, currentIdx]);

    const handleSkip = () => {
        if (!quiz || !quiz.mcqIds?.length) return;
        const currentId = quiz.mcqIds[currentIdx]._id;
        setVisited(prev => ({ ...prev, [currentId]: true }));
        handleNext();
    };

    if (loading || !quiz) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-600 font-medium animate-pulse">Initializing Exam Environment...</p>
            </div>
        </div>
    );

    const currentMcq = quiz.mcqIds[currentIdx];
    const answeredCount = Object.keys(answers).length;

    if (isMalpractice) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border-2 border-rose-100 p-8 text-center">
                    <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert className="w-12 h-12" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 mb-2">EXAM TERMINATED</h1>
                    <p className="text-rose-600 font-bold mb-6 uppercase tracking-widest text-xs">Malpractice Detected</p>
                    <div className="bg-rose-50 p-4 rounded-xl text-rose-800 text-sm mb-8 leading-relaxed">
                        Multiple violations were detected during your assessment (Tab switching or exiting full screen). As per the proctoring policy, your exam has been automatically submitted and terminated.
                    </div>
                    <button 
                        onClick={() => navigate('/student')}
                        className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (!isStarted) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 p-4">
                <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-primary p-8 text-white text-center">
                        <h1 className="text-3xl font-bold mb-2">{quiz.title}</h1>
                        <p className="text-indigo-100">Please read the instructions carefully before beginning.</p>
                    </div>
                    
                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-center gap-4">
                                <div className="p-3 bg-white rounded-lg text-primary shadow-sm"><Clock className="w-6 h-6" /></div>
                                <div>
                                    <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Duration</p>
                                    <p className="text-lg font-bold text-gray-900">{quiz.timer} Minutes</p>
                                </div>
                            </div>
                            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center gap-4">
                                <div className="p-3 bg-white rounded-lg text-emerald-600 shadow-sm"><FileText className="w-6 h-6" /></div>
                                <div>
                                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Questions</p>
                                    <p className="text-lg font-bold text-gray-900">{quiz.mcqIds.length} Total</p>
                                </div>
                            </div>
                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-center gap-4">
                                <div className="p-3 bg-white rounded-lg text-amber-600 shadow-sm"><Info className="w-6 h-6" /></div>
                                <div>
                                    <p className="text-xs text-amber-600 font-bold uppercase tracking-wider">Marks</p>
                                    <p className="text-lg font-bold text-gray-900">{quiz.mcqIds.length} Marks</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-primary" /> Exam Rules & Guidelines
                            </h3>
                            <ul className="space-y-3">
                                {[
                                    "Ensure you have a stable internet connection throughout the test.",
                                    "This exam is PROCTORED. You must remain in FULL SCREEN mode.",
                                    "Switching tabs or exiting full screen more than 2 times will terminate the exam.",
                                    "The quiz will be automatically submitted when the timer reaches zero.",
                                    "Each question carries 1 mark. There is no negative marking.",
                                    "You can use the built-in Calculator and Scratchpad tools provided."
                                ].map((rule, i) => (
                                    <li key={i} className="flex items-start gap-3 text-gray-600">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                        {rule}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex flex-col items-center gap-4 pt-4 border-t border-gray-100">
                            <button 
                                onClick={startExamWithProctoring}
                                className="w-full sm:w-64 py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200 flex items-center justify-center gap-2 group"
                            >
                                <Play className="w-5 h-5 group-hover:scale-110 transition-transform" /> Start My Exam
                            </button>
                            <p className="text-sm text-gray-400">By clicking 'Start My Exam', you agree to enter full-screen mode and follow the rules.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-fadeIn">
            <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-8">
                <aside className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-8 h-fit max-h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Progress</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Jump to any question</p>
                        </div>
                        <div className="bg-indigo-50 px-3 py-1.5 rounded-lg text-primary font-bold border border-indigo-100">
                            {answeredCount}/{quiz.mcqIds.length}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 gap-3">
                        {quiz.mcqIds.map((mcq, idx) => {
                            const isCurrent = idx === currentIdx;
                            const isAnswered = Boolean(answers[mcq._id]);
                            const isVisited = Boolean(visited[mcq._id]);
                            const statusClass = isCurrent
                                ? 'bg-primary text-white border-primary shadow-lg ring-2 ring-indigo-200 ring-offset-2'
                                : isAnswered
                                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                                    : isVisited
                                        ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                                        : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50';

                            return (
                                <button
                                    key={mcq._id}
                                    onClick={() => setCurrentIdx(idx)}
                                    className={`aspect-square flex items-center justify-center rounded-xl border text-sm font-bold transition-all duration-300 ${statusClass} ${isCurrent ? 'scale-110' : 'hover:scale-105'}`}
                                    title={`Question ${idx + 1}`}
                                >
                                    {idx + 1}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100 space-y-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Legend</p>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="w-3 h-3 rounded-full bg-emerald-500" /> Attempted
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="w-3 h-3 rounded-full bg-rose-500" /> Skipped
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="w-3 h-3 rounded-full bg-white border-2 border-gray-200" /> Not visited
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600 font-bold">
                            <span className="w-3 h-3 rounded-full bg-primary" /> Current
                        </div>
                    </div>
                </aside>

                <main className="space-y-6">
                    <header className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-primary font-bold border border-indigo-100 shadow-sm">
                                Q{currentIdx + 1}
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 line-clamp-1">{quiz.title}</h1>
                                <p className="text-sm text-gray-500">Subjective MCQ Assessment</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200 mr-2">
                                <button 
                                    onClick={() => setShowCalculator(true)}
                                    className="flex items-center gap-2 px-4 py-2 hover:bg-white hover:shadow-sm rounded-lg transition text-gray-700 text-sm font-semibold"
                                >
                                    <Calculator className="w-4 h-4 text-primary" /> Calc
                                </button>
                                <button 
                                    onClick={() => setShowNotes(true)}
                                    className="flex items-center gap-2 px-4 py-2 hover:bg-white hover:shadow-sm rounded-lg transition text-gray-700 text-sm font-semibold border-l border-gray-200"
                                >
                                    <FileText className="w-4 h-4 text-primary" /> Notes
                                </button>
                            </div>
                            <div className={`flex items-center gap-3 font-mono font-bold px-5 py-2.5 rounded-xl border-2 ${timeLeft < 60 ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse' : 'bg-indigo-50 text-primary border-indigo-100 shadow-sm'}`}>
                                <Clock className="w-5 h-5"/>
                                <span className="text-xl tracking-wider">{formatTime(timeLeft)}</span>
                            </div>
                        </div>
                    </header>

                    <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[450px] flex flex-col relative overflow-hidden">
                        {/* Subtle Progress Bar at top of card */}
                        <div className="absolute top-0 left-0 h-1 bg-primary/10 w-full">
                            <div 
                                className="h-full bg-primary transition-all duration-500 ease-out" 
                                style={{ width: `${((currentIdx + 1) / quiz.mcqIds.length) * 100}%` }}
                            />
                        </div>

                        <div className="mb-10">
                            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-widest mb-4 inline-block">
                                Question {currentIdx + 1} of {quiz.mcqIds.length}
                            </span>
                            <h2 className="text-2xl font-bold text-gray-900 leading-tight">{currentMcq.question}</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4 flex-1">
                            {currentMcq.options.map((opt, i) => {
                                const isSelected = answers[currentMcq._id] === opt;
                                return (
                                    <label 
                                        key={i} 
                                        onClick={() => handleOptionSelect(currentMcq._id, opt)}
                                        className={`group relative flex items-center p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                                            isSelected 
                                            ? 'border-primary bg-indigo-50/50 ring-4 ring-indigo-50 shadow-md' 
                                            : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                            isSelected ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-400 group-hover:border-primary/50'
                                        }`}>
                                            {String.fromCharCode(65 + i)}
                                        </div>
                                        <span className={`ml-4 text-lg transition-colors ${isSelected ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                                            {opt}
                                        </span>
                                        {isSelected && (
                                            <div className="ml-auto">
                                                <CheckCircle className="w-6 h-6 text-primary" />
                                            </div>
                                        )}
                                    </label>
                                )
                            })}
                        </div>

                        <footer className="mt-10 flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-gray-50 gap-4">
                            <div className="flex items-center gap-2 text-gray-500 font-medium">
                                <Info className="w-4 h-4" />
                                {Object.keys(answers).length} of {quiz.mcqIds.length} Answered
                            </div>
                            <div className="flex gap-4 w-full sm:w-auto">
                                <button
                                    onClick={handleSkip}
                                    className="flex-1 sm:flex-none px-8 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition shadow-sm"
                                >
                                    Skip
                                </button>
                                {currentIdx < quiz.mcqIds.length - 1 ? (
                                    <button 
                                        onClick={handleNext}
                                        className="flex-1 sm:flex-none px-10 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition shadow-lg hover:shadow-gray-200"
                                    >
                                        Next Question
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleCompleteSubmit(false)}
                                        disabled={submitting}
                                        className="flex-1 sm:flex-none px-10 py-3 bg-primary text-white rounded-xl font-black hover:bg-indigo-700 transition shadow-xl hover:shadow-indigo-200 disabled:opacity-50"
                                    >
                                        {submitting ? 'Submitting...' : 'Finish & Submit'}
                                    </button>
                                )}
                            </div>
                        </footer>
                    </section>
                    
                    <div className="p-4 bg-amber-50 text-amber-800 rounded-2xl border border-amber-200 text-sm flex items-start gap-3 shadow-sm">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600" />
                        <p className="font-medium">Proctoring Notice: Please stay on this tab. Refreshing or switching windows might disqualify your attempt. The quiz will auto-submit when the timer expires.</p>
                    </div>
                </main>
            </div>

            {/* Calculator Modal */}
            {showCalculator && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[280px] overflow-hidden border border-gray-200">
                        <div className="bg-gray-900 p-4 flex justify-between items-center text-white">
                            <div className="flex items-center gap-2 font-medium">
                                <Calculator className="w-4 h-4" /> Calculator
                            </div>
                            <button onClick={() => setShowCalculator(false)} className="hover:bg-white/10 p-1 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 bg-gray-50">
                            <div className="bg-white border-2 border-gray-200 rounded-lg p-3 mb-4 text-right text-2xl font-mono h-14 flex items-center justify-end overflow-hidden">
                                {calcValue || '0'}
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {['7','8','9','/','4','5','6','*','1','2','3','-','C','0','=','+'].map(btn => (
                                    <button
                                        key={btn}
                                        onClick={() => handleCalcClick(btn)}
                                        className={`p-3 rounded-lg font-bold transition-all ${
                                            btn === '=' ? 'bg-primary text-white col-span-1' : 
                                            btn === 'C' ? 'bg-rose-100 text-rose-600' : 
                                            ['/','*','-','+'].includes(btn) ? 'bg-indigo-50 text-primary' : 'bg-white text-gray-700 border border-gray-200 shadow-sm'
                                        } hover:brightness-95 active:scale-95`}
                                    >
                                        {btn}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Notes Modal */}
            {showNotes && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200">
                        <div className="bg-primary p-4 flex justify-between items-center text-white">
                            <div className="flex items-center gap-2 font-medium">
                                <FileText className="w-4 h-4" /> Scratchpad (Notes)
                            </div>
                            <button onClick={() => setShowNotes(false)} className="hover:bg-white/10 p-1 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4">
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Jot down your rough work here..."
                                className="w-full h-64 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none text-gray-700"
                            />
                            <div className="mt-4 flex justify-between items-center">
                                <p className="text-xs text-gray-500 italic">Notes are local and will be lost on page refresh.</p>
                                <button
                                    onClick={() => setNotes('')}
                                    className="flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-lg transition font-medium"
                                >
                                    <Trash2 className="w-4 h-4" /> Reset Notes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Strike Warning Modal */}
            {showStrikeModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border-4 border-amber-400 animate-bounceIn">
                        <div className="bg-amber-400 p-6 text-center text-amber-900">
                            <ShieldAlert className="w-16 h-16 mx-auto mb-2" />
                            <h2 className="text-2xl font-black uppercase tracking-tight">Warning {strikes}/2</h2>
                        </div>
                        <div className="p-8 text-center">
                            <p className="text-gray-900 font-bold text-xl mb-2">{strikeReason}</p>
                            <p className="text-gray-600 mb-6">
                                You have violated the proctoring rules. This is your **{strikes === 1 ? 'first' : 'final'} warning**. 
                                The next violation will result in **immediate termination** of your exam.
                            </p>
                            
                            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-amber-800 text-sm mb-8 text-left">
                                <p className="font-bold mb-1 flex items-center gap-2">
                                    <Info className="w-4 h-4" /> Why did this happen?
                                </p>
                                <ul className="list-disc ml-4 space-y-1">
                                    <li>You switched to another tab or application.</li>
                                    <li>You exited full-screen mode (pressed Esc).</li>
                                    <li>You minimized the browser window.</li>
                                </ul>
                            </div>

                            <button 
                                onClick={resumeFullScreen}
                                className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-lg hover:bg-amber-600 transition shadow-lg shadow-amber-200 flex items-center justify-center gap-2"
                            >
                                <Play className="w-5 h-5" /> Re-enter Full Screen & Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TakeQuiz;
