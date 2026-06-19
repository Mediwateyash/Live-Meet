import React, { useState, useEffect } from 'react';
import api from '../../api/axios.js';
import { ArrowLeft, Search, Trash2, Clock, BookOpen, ExternalLink, Play, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

const ManageQuizzes = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        try {
            setLoading(true);
            const res = await api.get('/quiz');
            setQuizzes(res.data);
        } catch (error) {
            console.error("Failed to fetch quizzes", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this quiz? This action cannot be undone.")) return;
        try {
            await api.delete(`/quiz/${id}`);
            setQuizzes(quizzes.filter(q => q._id !== id));
        } catch (error) {
            console.error("Failed to delete quiz", error);
            alert("Failed to delete quiz");
        }
    };

    const filteredQuizzes = quizzes.filter(q => 
        q.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-gray-500">Loading quizzes...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Link to="/teacher" className="text-gray-500 hover:text-primary transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Manage Quizzes</h1>
                        <p className="text-gray-500 text-sm mt-1">View, manage and delete your created quizzes</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="Search quizzes..."
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none w-full md:w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Link 
                        to="/teacher/quizzes/create" 
                        className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        Create New
                    </Link>
                </div>
            </div>

            {filteredQuizzes.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">No quizzes found</h3>
                    <p className="text-gray-500 mb-6">You haven't created any quizzes yet or no match for your search.</p>
                    <Link 
                        to="/teacher/quizzes/create" 
                        className="text-primary font-medium hover:underline"
                    >
                        Create your first quiz now
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredQuizzes.map((quiz) => (
                        <div key={quiz._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-gray-900 line-clamp-2 flex-1">{quiz.title}</h3>
                                <button 
                                    onClick={() => handleDelete(quiz._id)}
                                    className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                    title="Delete Quiz"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Clock className="w-4 h-4" />
                                    <span>{quiz.timer} Minutes Duration</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <BookOpen className="w-4 h-4" />
                                    <span>{quiz.mcqIds.length} Multiple Choice Questions</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Calendar className="w-4 h-4" />
                                    <span>Created on {new Date(quiz.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-gray-50 flex gap-2">
                                <Link 
                                    to={`/student/quiz/${quiz._id}`} 
                                    className="flex-1 inline-flex items-center justify-center gap-2 bg-indigo-50 text-primary px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors"
                                >
                                    <Play className="w-4 h-4" /> Preview
                                </Link>
                                <button 
                                    onClick={() => {
                                        const url = `${window.location.origin}/student/quiz/${quiz._id}`;
                                        navigator.clipboard.writeText(url);
                                        alert("Quiz link copied to clipboard!");
                                    }}
                                    className="flex items-center justify-center p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
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
    );
};

export default ManageQuizzes;
