import React, { useState, useEffect } from 'react';
import api from '../../api/axios.js';
import { ArrowLeft, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageLayout from '../../components/layout/PageLayout.jsx';

const TeacherResults = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const res = await api.get('/result/teacher');
                setResults(res.data);
            } catch (error) {
                console.error("Failed to fetch teacher results", error);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, []);

    const filteredResults = results.filter(res => 
        (res.studentId?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (res.quizId?.title?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <PageLayout noFooter={true}>
                <div className="w-full py-24 flex justify-center items-center">
                    <div className="w-12 h-12 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout noFooter={true}>
            <div className="w-full max-w-[1536px] mx-auto px-6 lg:px-10 py-8" style={{ background: 'var(--bg-page)' }}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/instructor/dashboard" className="text-gray-500 hover:text-primary transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>Student Results</h1>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Monitor all student performance across your quizzes</p>
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="Search student or quiz..."
                            className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none w-full md:w-80"
                            style={{ 
                                borderColor: 'var(--border-default)', 
                                backgroundColor: 'var(--bg-surface)', 
                                color: 'var(--text-primary)' 
                            }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="rounded-xl shadow-sm border overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead style={{ backgroundColor: 'var(--bg-muted)', borderBottom: '1px solid var(--border-default)' }}>
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Student</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Quiz Title</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Score</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Date</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-right" style={{ color: 'var(--text-secondary)' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ divideColor: 'var(--border-default)' }}>
                                {filteredResults.length > 0 ? (
                                    filteredResults.map((res) => (
                                        <tr key={res._id} className="hover:bg-gray-50/50 dark:hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                                                        {res.studentId?.name?.charAt(0).toUpperCase() || '?'}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{res.studentId?.name || 'Unknown'}</div>
                                                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{res.studentId?.email || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium" style={{ color: 'var(--text-secondary)' }}>
                                                {res.quizId?.title || 'Practice Quiz'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold ${
                                                    res.score >= 70 ? 'text-green-700 bg-green-100 dark:bg-emerald-950/20 dark:text-emerald-400' : 
                                                    res.score >= 40 ? 'text-yellow-700 bg-yellow-100 dark:bg-amber-950/20 dark:text-amber-400' : 
                                                    'text-red-700 bg-red-100 dark:bg-rose-950/20 dark:text-rose-400'
                                                }`}>
                                                    {res.score}%
                                                </span>
                                            </td>
                                            <td className="text-sm px-6 py-4" style={{ color: 'var(--text-muted)' }}>
                                                {new Date(res.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                {res.score >= 40 ? (
                                                    <span className="text-green-600 dark:text-emerald-400 text-sm font-medium">Passed</span>
                                                ) : (
                                                    <span className="text-red-600 dark:text-rose-400 text-sm font-medium">Failed</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link 
                                                    to={`/student/results/${res._id}`}
                                                    className="text-primary hover:text-indigo-800 dark:text-[#A78BFA] dark:hover:text-[#C4B5FD] font-semibold text-sm"
                                                >
                                                    View Details
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500" style={{ color: 'var(--text-muted)' }}>
                                            No results found matching your criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
};

export default TeacherResults;
