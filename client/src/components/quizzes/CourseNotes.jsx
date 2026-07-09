import React, { useState, useEffect } from 'react';
import { FileText, ChevronDown, ChevronUp, BrainCircuit } from 'lucide-react';
import api from '../../api/axios.js';
import Spinner from '../ui/Spinner.jsx';

export default function CourseNotes() {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [whQuestions, setWhQuestions] = useState({});
    const [expandedMaterial, setExpandedMaterial] = useState(null);
    const [expandedWH, setExpandedWH] = useState({});

    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                const res = await api.get('/material');
                setMaterials(res.data || []);
            } catch (error) {
                console.error("Failed to fetch materials", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMaterials();
    }, []);

    const fetchWHQuestions = async (materialId) => {
        if (whQuestions[materialId]) {
            setExpandedMaterial(expandedMaterial === materialId ? null : materialId);
            return;
        }

        try {
            const res = await api.get(`/wh/material/${materialId}`);
            setWhQuestions(prev => ({ ...prev, [materialId]: res.data }));
            setExpandedMaterial(materialId);
        } catch (error) {
            console.error("Failed to fetch WH questions", error);
        }
    };

    const toggleWH = (questionId) => {
        setExpandedWH(prev => ({ ...prev, [questionId]: !prev[questionId] }));
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Spinner size={32} color="#7C3AED" />
            </div>
        );
    }

    if (materials.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(124,58,237,0.1)' }}>
                    <FileText size={30} color="#7C3AED" />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>No Notes Available</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Instructors haven't uploaded any notes yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 w-full max-w-4xl mx-auto">
            {materials.map((material) => (
                <div key={material._id} className="rounded-2xl border bg-[#1A1A2E] overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[rgba(124,58,237,0.15)] shrink-0">
                                <FileText size={22} color="#A78BFA" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">{material.chapterName || material.fileName}</h3>
                                <p className="text-sm text-gray-400">
                                    {material.chapterName ? `File: ${material.fileName}` : 'Uploaded Notes'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => fetchWHQuestions(material._id)}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all bg-[#7C3AED] hover:bg-[#6D28D9] text-white shrink-0"
                        >
                            <BrainCircuit size={16} /> 
                            {expandedMaterial === material._id ? 'Hide WH Questions' : 'View WH Questions'}
                        </button>
                    </div>

                    {expandedMaterial === material._id && whQuestions[material._id] && (
                        <div className="p-5 border-t bg-[rgba(0,0,0,0.2)]" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                            <h4 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                                <BrainCircuit size={18} className="text-[#A78BFA]" />
                                Socratic WH Questions
                            </h4>
                            
                            {whQuestions[material._id].length === 0 ? (
                                <p className="text-sm text-gray-400 italic">No WH Questions generated for this module.</p>
                            ) : (
                                <div className="space-y-3">
                                    {whQuestions[material._id].map((q) => (
                                        <div key={q._id} className="rounded-xl border border-[rgba(255,255,255,0.1)] overflow-hidden">
                                            <button 
                                                onClick={() => toggleWH(q._id)}
                                                className="w-full text-left p-4 flex items-center justify-between bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                                            >
                                                <span className="font-medium text-white">{q.question}</span>
                                                {expandedWH[q._id] ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                                            </button>
                                            
                                            {expandedWH[q._id] && (
                                                <div className="p-4 bg-[rgba(124,58,237,0.1)] border-t border-[rgba(124,58,237,0.2)]">
                                                    <p className="text-sm text-gray-300 leading-relaxed">{q.answer}</p>
                                                    {q.topic && (
                                                        <span className="inline-block mt-3 text-xs font-semibold px-2 py-1 rounded bg-[rgba(124,58,237,0.2)] text-[#A78BFA]">
                                                            Topic: {q.topic}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
