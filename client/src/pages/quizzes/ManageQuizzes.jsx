import React, { useState, useEffect } from 'react';
import api from '../../api/axios.js';
import { ArrowLeft, Search, Trash2, Clock, BookOpen, ExternalLink, Play, Calendar, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageLayout from '../../components/layout/PageLayout.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';

const ManageQuizzes = () => {
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        try {
            setLoading(true);
            const res = await api.get('/quiz');
            setQuizzes(res.data);
        } catch (error) {
            toast.error('Failed to load quizzes');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        setDeletingId(confirmDeleteId);
        try {
            await api.delete(`/quiz/${confirmDeleteId}`);
            setQuizzes(quizzes.filter(q => q._id !== confirmDeleteId));
            toast.success('Quiz deleted successfully');
        } catch (error) {
            toast.error('Failed to delete quiz');
        } finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
        }
    };

    const handleCopyLink = (quizId) => {
        const url = `${window.location.origin}/student/quiz/${quizId}`;
        navigator.clipboard.writeText(url).then(() => {
            toast.success('Quiz link copied to clipboard!', {
                icon: '🔗',
                style: {
                    borderRadius: '10px',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-default)',
                },
            });
        });
    };

    const filteredQuizzes = quizzes.filter(q =>
        q.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <PageLayout noFooter={true}>
            <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ background: 'var(--bg-page)' }}>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-lg transition-colors hover:bg-[rgba(109,40,217,0.1)]"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
                                Manage Quizzes
                            </h1>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                View, manage and delete your created quizzes
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3 items-center">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search quizzes..."
                                className="pl-10 pr-4 py-2 rounded-lg outline-none w-full md:w-64 focus:ring-2 focus:ring-[#7C3AED]"
                                style={{
                                    background: 'var(--bg-surface)',
                                    border: '1px solid var(--border-default)',
                                    color: 'var(--text-primary)',
                                }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => navigate('/instructor/quizzes/create')}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all shadow-sm"
                            style={{ background: '#7C3AED', color: '#fff' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#6D28D9'}
                            onMouseLeave={e => e.currentTarget.style.background = '#7C3AED'}
                        >
                            <Plus className="w-4 h-4" /> Create New
                        </button>
                    </div>
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="w-full py-24 flex justify-center items-center">
                        <div className="w-12 h-12 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredQuizzes.length === 0 ? (
                    <div className="rounded-2xl p-16 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                            style={{ background: 'var(--bg-muted)' }}>
                            <BookOpen className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
                        </div>
                        <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>No quizzes found</h3>
                        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                            You haven't created any quizzes yet or none match your search.
                        </p>
                        <button
                            onClick={() => navigate('/instructor/quizzes/create')}
                            className="text-sm font-semibold"
                            style={{ color: '#7C3AED' }}
                        >
                            Create your first quiz now →
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredQuizzes.map((quiz) => (
                            <div
                                key={quiz._id}
                                className="rounded-2xl p-6 flex flex-col transition-all hover:shadow-lg"
                                style={{
                                    background: 'var(--bg-surface)',
                                    border: '1px solid var(--border-default)',
                                    boxShadow: '0 2px 8px rgba(109,40,217,0.06)',
                                }}
                            >
                                {/* Card header */}
                                <div className="flex justify-between items-start mb-4">
                                    <h3
                                        className="text-lg font-bold line-clamp-2 flex-1 pr-2"
                                        style={{ color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}
                                    >
                                        {quiz.title}
                                    </h3>
                                    <button
                                        onClick={() => setConfirmDeleteId(quiz._id)}
                                        className="p-1.5 rounded-lg transition-colors shrink-0"
                                        style={{ color: 'var(--text-muted)' }}
                                        onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                                        title="Delete Quiz"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Info rows */}
                                <div className="space-y-2.5 mb-6">
                                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        <Clock className="w-4 h-4 shrink-0" style={{ color: '#7C3AED' }} />
                                        <span>{quiz.timer} Minutes Duration</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        <BookOpen className="w-4 h-4 shrink-0" style={{ color: '#2563EB' }} />
                                        <span>{quiz.mcqIds?.length ?? 0} Multiple Choice Questions</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        <Calendar className="w-4 h-4 shrink-0" style={{ color: '#10B981' }} />
                                        <span>Created on {new Date(quiz.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="mt-auto pt-4 flex gap-2" style={{ borderTop: '1px solid var(--border-default)' }}>
                                    <Link
                                        to={`/quizzes/${quiz._id}/take`}
                                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                                        style={{ background: 'rgba(109,40,217,0.12)', color: '#7C3AED' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(109,40,217,0.2)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(109,40,217,0.12)'}
                                    >
                                        <Play className="w-4 h-4" /> Preview
                                    </Link>
                                    <button
                                        onClick={() => handleCopyLink(quiz._id)}
                                        className="flex items-center justify-center p-2 rounded-xl transition-colors"
                                        style={{ border: '1px solid var(--border-default)', color: 'var(--text-secondary)', background: 'var(--bg-muted)' }}
                                        onMouseEnter={e => e.currentTarget.style.color = '#7C3AED'}
                                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                                        title="Copy Quiz Link"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Quiz"
                message="Are you sure you want to delete this quiz? This action cannot be undone."
                confirmLabel="Delete"
                confirmVariant="danger"
                loading={!!deletingId}
            />
        </PageLayout>
    );
};

export default ManageQuizzes;
