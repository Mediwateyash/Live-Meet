import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios.js';
import { CheckCircle, XCircle, ArrowLeft, Award, Download, User } from 'lucide-react';
import { jsPDF } from 'jspdf';
import useAuthStore from '../../store/authStore.js';
import PageLayout from '../../components/layout/PageLayout.jsx';

const QuizResult = () => {
    const { id, resultId } = useParams();
    const actualId = id || resultId;
    const { user } = useAuthStore();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchResult = async () => {
            try {
                if (!actualId) {
                    setError("Invalid Result ID");
                    setLoading(false);
                    return;
                }
                const res = await api.get(`/result/${actualId}`);
                setResult(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchResult();
    }, [id]);

    const generatePdf = () => {
        if (!result) return;

        const doc = new jsPDF({ unit: 'pt', format: 'a4' });
        const margin = 40;
        const maxWidth = 520;
        const lineHeight = 18;
        let y = 50;

        // Title
        doc.setFontSize(22);
        doc.setTextColor(63, 63, 191); // Primary color
        doc.text('Quiz Assessment Report', margin, y);
        y += 40;

        // Student & Quiz Info
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text(`Student Name:`, margin, y);
        doc.setFont('helvetica', 'normal');
        const studentName = typeof result.studentId === 'object' ? result.studentId.name : 'N/A';
        doc.text(`${studentName}`, margin + 100, y);
        y += 20;

        doc.setFont('helvetica', 'bold');
        doc.text(`Quiz Title:`, margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(`${result.quizId.title}`, margin + 100, y);
        y += 20;

        doc.setFont('helvetica', 'bold');
        doc.text(`Score:`, margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(`${result.score}%`, margin + 100, y);
        y += 20;

        doc.setFont('helvetica', 'bold');
        doc.text(`Completed on:`, margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(`${new Date(result.createdAt).toLocaleString()}`, margin + 100, y);
        y += 40;

        // Line separator
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y - 10, margin + maxWidth, y - 10);

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Detailed Review', margin, y);
        y += 30;

        doc.setFontSize(10);
        result.answers.forEach((ans, idx) => {
            if (!ans.mcqId) return;

            if (y > 750) {
                doc.addPage();
                y = 50;
            }

            const showCorrectness = ans.mcqId.correctAnswer !== undefined;
            const isCorrect = showCorrectness && ans.selected === ans.mcqId.correctAnswer;
            
            // Question
            doc.setFont('helvetica', 'bold');
            const qLines = doc.splitTextToSize(`Q${idx + 1}. ${ans.mcqId.question}`, maxWidth);
            doc.text(qLines, margin, y);
            y += qLines.length * lineHeight;

            // Status
            if (showCorrectness) {
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(isCorrect ? 0 : 200, isCorrect ? 150 : 0, 0); // Green if correct, Red if wrong
                doc.text(isCorrect ? 'Correct' : 'Incorrect', margin, y);
                doc.setTextColor(0, 0, 0);
                y += 15;
            }

            // Options
            doc.setFont('helvetica', 'normal');
            ans.mcqId.options.forEach((opt, i) => {
                let prefix = `  ${String.fromCharCode(65 + i)}. `;
                let suffix = "";
                if (opt === ans.selected) suffix += " (Your Answer)";
                if (showCorrectness && opt === ans.mcqId.correctAnswer) suffix += " [Correct Answer]";
                
                const optLines = doc.splitTextToSize(prefix + opt + suffix, maxWidth - 20);
                doc.text(optLines, margin + 10, y);
                y += optLines.length * 14;
            });

            // Explanation
            if (showCorrectness && ans.mcqId.explanation) {
                y += 5;
                doc.setFont('helvetica', 'bold');
                doc.text('Explanation:', margin + 10, y);
                doc.setFont('helvetica', 'normal');
                const expLines = doc.splitTextToSize(ans.mcqId.explanation, maxWidth - 30);
                doc.text(expLines, margin + 80, y);
                y += Math.max(expLines.length * 14, 20);
            }

            y += 20; // Space between questions
        });

        doc.save(`QuizResult_${result.studentId?.name || 'Student'}_${result.quizId.title}.pdf`);
    };

    if (loading) return (
        <PageLayout noFooter={true}>
            <div className="w-full py-24 flex justify-center items-center">
                <div className="w-12 h-12 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
            </div>
        </PageLayout>
    );
    if (!result) return (
        <PageLayout noFooter={true}>
            <div className="p-8 text-center" style={{ color: 'var(--text-primary)' }}>Failed to load result</div>
        </PageLayout>
    );

    const backPath = user?.role === 'teacher' || user?.role === 'admin' ? '/teacher/results' : '/student';

    return (
        <PageLayout noFooter={true}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Link to={backPath} className="text-gray-500 hover:text-primary transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quiz Assessment Results</h1>
                        {result.studentId && (
                            <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                                <User className="w-4 h-4" /> Student: <span className="font-semibold text-gray-700 dark:text-gray-300">
                                    {typeof result.studentId === 'object' ? (result.studentId.name || result.studentId.email) : result.studentId}
                                </span>
                            </p>
                        )}
                    </div>
                </div>
                <button 
                    onClick={generatePdf}
                    className="flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-all shadow-sm"
                >
                    <Download className="w-4 h-4" /> Download Report
                </button>
            </div>

            <div className="bg-white dark:bg-[var(--bg-surface)] p-8 rounded-xl shadow-sm border border-gray-100 dark:border-[var(--border-default)] flex flex-col items-center justify-center text-center mb-8">
                <div className={`w-28 h-28 rounded-full flex items-center justify-center border-4 mb-4 ${result.score >= 70 ? 'bg-green-50 dark:bg-green-950/20 border-green-500 text-green-600 dark:text-emerald-400' : result.score >= 40 ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-500 text-yellow-600 dark:text-amber-400' : 'bg-red-50 dark:bg-red-950/20 border-red-500 text-red-600 dark:text-rose-400'}`}>
                    <span className="text-4xl font-bold">{result.score}%</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{result.quizId.title}</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium flex items-center gap-2">
                    <Award className="w-5 h-5"/>
                    Completed on {new Date(result.createdAt).toLocaleString()}
                </p>
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 px-2">Detailed Review</h3>
            
            <div className="space-y-6">
                {result.answers.map((ans, idx) => {
                    if (!ans.mcqId) return null; // skipped or deleted

                    const showCorrectness = ans.mcqId.correctAnswer !== undefined;
                    const isCorrect = showCorrectness && ans.selected === ans.mcqId.correctAnswer;
                    
                    const cardBorderClass = showCorrectness 
                        ? (isCorrect ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500')
                        : 'border-l-4 border-indigo-400';

                    return (
                        <div key={idx} className={`bg-white dark:bg-[var(--bg-surface)] p-6 rounded-xl shadow-sm border border-gray-100 dark:border-[var(--border-default)] ${cardBorderClass}`}>
                            <div className="flex justify-between flex-start gap-4 mb-4">
                                <h4 className="font-semibold text-lg text-gray-900 dark:text-white">
                                    <span className="text-gray-400 dark:text-gray-500 mr-2">Q{idx+1}.</span> 
                                    {ans.mcqId.question}
                                </h4>
                                {showCorrectness && (
                                    <div>
                                        {isCorrect ? <CheckCircle className="w-6 h-6 text-green-500" /> : <XCircle className="w-6 h-6 text-red-500" />}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                {ans.mcqId.options.map((opt, i) => {
                                    let bgClass = "bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-900/40 dark:border-gray-800 dark:text-gray-300";
                                    
                                    if (showCorrectness) {
                                        if (opt === ans.mcqId.correctAnswer) {
                                            bgClass = "bg-green-100 border-green-300 text-green-800 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-400 font-medium";
                                        } else if (opt === ans.selected && !isCorrect) {
                                            bgClass = "bg-red-100 border-red-300 text-red-800 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-400 line-through font-medium";
                                        }
                                    } else {
                                        if (opt === ans.selected) {
                                            bgClass = "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400 font-medium";
                                        }
                                    }

                                    return (
                                        <div key={i} className={`p-3 rounded border text-sm ${bgClass}`}>
                                            {String.fromCharCode(65 + i)}. {opt}
                                            {opt === ans.selected && <span className="ml-2 text-xs font-bold uppercase">(Your Answer)</span>}
                                        </div>
                                    )
                                })}
                            </div>

                            {showCorrectness && ans.mcqId.explanation && (
                                <div className={`mt-4 p-4 rounded-lg border ${isCorrect ? 'bg-gray-50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800' : 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30'}`}>
                                    <span className={`font-semibold block mb-1 ${isCorrect ? 'text-gray-700 dark:text-gray-300' : 'text-primary dark:text-indigo-400'}`}>Explanation:</span>
                                    <p className={`${isCorrect ? 'text-gray-600 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'} text-sm leading-relaxed`}>{ans.mcqId.explanation}</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
        </PageLayout>
    );
};

export default QuizResult;
