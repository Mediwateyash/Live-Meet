import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios.js';
import { jsPDF } from 'jspdf';
import { Edit2, Trash2, ArrowLeft, Check, X } from 'lucide-react';

const ManageMCQs = () => {
    const { materialId } = useParams();
    const [mcqs, setMcqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState(null);

    useEffect(() => {
        fetchMcqs();
    }, [materialId]);

    const fetchMcqs = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/mcq/material/${materialId}`);
            setMcqs(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this MCQ?")) return;
        try {
            await api.delete(`/mcq/${id}`);
            setMcqs(mcqs.filter(m => m._id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    const handleEditClick = (mcq) => {
        setEditingId(mcq._id);
        setEditForm({ ...mcq });
    };

    const handleEditSave = async (e) => {
        e.preventDefault();
        try {
            const res = await api.put(`/mcq/${editingId}`, editForm);
            setMcqs(mcqs.map(m => m._id === editingId ? res.data : m));
            setEditingId(null);
        } catch (error) {
            console.error(error);
            alert("Failed to update");
        }
    };

    const addTextLines = (doc, text, x, y, maxWidth, lineHeight) => {
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        return y + lines.length * lineHeight;
    };

    const generatePdf = (mode) => {
        if (!mcqs || mcqs.length === 0) {
            alert('No MCQs available to download.');
            return;
        }

        const doc = new jsPDF({ unit: 'pt', format: 'a4' });
        const margin = 40;
        const maxWidth = 520;
        const lineHeight = 18;
        let y = 50;

        const includeOptions = mode !== 'questionsOnly';
        const includeAnswer = mode === 'withAnswers';

        const title = mode === 'withAnswers'
            ? 'Generated MCQs with Options and Answers'
            : mode === 'withOptions'
                ? 'Generated MCQs with Options'
                : 'Generated Questions Only';

        doc.setFontSize(18);
        doc.text(title, margin, y);
        y += 28;
        doc.setFontSize(11);

        mcqs.forEach((mcq, idx) => {
            if (y > 760) {
                doc.addPage();
                y = margin;
            }

            y = addTextLines(doc, `${idx + 1}. ${mcq.question}`, margin, y, maxWidth, lineHeight);
            y += 8;

            if (includeOptions) {
                mcq.options.forEach((opt, optionIndex) => {
                    y = addTextLines(doc, `  ${String.fromCharCode(65 + optionIndex)}. ${opt}`, margin + 8, y, maxWidth - 8, lineHeight);
                    y += 4;
                });

                if (includeAnswer) {
                    y = addTextLines(doc, `  Answer: ${mcq.correctAnswer}`, margin + 8, y, maxWidth - 8, lineHeight);
                }

                y += 12;
            } else {
                y += 12;
            }
        });

        const filename = mode === 'withAnswers'
            ? `mcqs-${materialId}-with-options-and-answers.pdf`
            : mode === 'withOptions'
                ? `mcqs-${materialId}-with-options.pdf`
                : `mcqs-${materialId}-questions-only.pdf`;
        doc.save(filename);
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading MCQs...</div>;

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <Link to="/teacher" className="text-gray-500 hover:text-primary transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Review MCQs</h1>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => generatePdf('withAnswers')}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                    >
                        Download PDF with options and answers
                    </button>
                    <button
                        onClick={() => generatePdf('withOptions')}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                    >
                        Download PDF with options only
                    </button>
                    <button
                        onClick={() => generatePdf('questionsOnly')}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900"
                    >
                        Download PDF questions only
                    </button>
                </div>
            </div>

            {mcqs.length === 0 ? (
                <div className="text-center p-8 bg-white rounded-xl shadow-sm">No MCQs found for this material.</div>
            ) : (
                <div className="space-y-6">
                    {mcqs.map((mcq, idx) => (
                        <div key={mcq._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            {editingId === mcq._id ? (
                                <div className="space-y-4">
                                    <textarea 
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
                                        value={editForm.question}
                                        onChange={(e) => setEditForm({...editForm, question: e.target.value})}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        {editForm.options.map((opt, i) => (
                                            <input 
                                                key={i}
                                                type="text"
                                                className="p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
                                                value={opt}
                                                onChange={(e) => {
                                                    const newOpts = [...editForm.options];
                                                    newOpts[i] = e.target.value;
                                                    setEditForm({...editForm, options: newOpts});
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="text-xs text-gray-500 block mb-1">Correct Answer</label>
                                            <select 
                                                className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
                                                value={editForm.correctAnswer}
                                                onChange={(e) => setEditForm({...editForm, correctAnswer: e.target.value})}
                                            >
                                                {editForm.options.map((o, i) => <option key={i} value={o}>{o}</option>)}
                                            </select>
                                        </div>
                                        <div className="w-32">
                                            <label className="text-xs text-gray-500 block mb-1">Difficulty</label>
                                            <select 
                                                className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary text-sm"
                                                value={editForm.difficulty}
                                                onChange={(e) => setEditForm({...editForm, difficulty: e.target.value})}
                                            >
                                                <option value="easy">Easy</option>
                                                <option value="medium">Medium</option>
                                                <option value="hard">Hard</option>
                                            </select>
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs text-gray-500 block mb-1">Topic</label>
                                            <input 
                                                type="text"
                                                className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary text-sm"
                                                value={editForm.topic}
                                                onChange={(e) => setEditForm({...editForm, topic: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Explanation</label>
                                        <textarea 
                                            className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
                                            value={editForm.explanation}
                                            onChange={(e) => setEditForm({...editForm, explanation: e.target.value})}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 mt-4">
                                        <button onClick={() => setEditingId(null)} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 px-3 py-1.5"><X className="w-4 h-4"/> Cancel</button>
                                        <button onClick={handleEditSave} className="flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded hover:bg-green-600"><Check className="w-4 h-4"/> Save</button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex justify-between items-start gap-4">
                                        <h3 className="font-semibold text-lg text-gray-900 flex-1"><span className="text-primary mr-2">Q{idx+1}.</span>{mcq.question}</h3>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditClick(mcq)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded transition-colors"><Edit2 className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(mcq._id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2 mb-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                            mcq.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                            mcq.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {mcq.difficulty?.toUpperCase() || 'MEDIUM'}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                            {mcq.topic || 'General'}
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                        {mcq.options.map((opt, i) => (
                                            <div key={i} className={`p-3 rounded border text-sm ${opt === mcq.correctAnswer ? 'bg-green-50 border-green-200 font-medium text-green-800' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                                                {String.fromCharCode(65 + i)}. {opt}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-100 text-sm text-blue-800">
                                        <span className="font-semibold block mb-1">Explanation:</span>
                                        {mcq.explanation}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ManageMCQs;
