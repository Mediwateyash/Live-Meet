import React, { useState, useEffect } from 'react';
import api from '../../api/axios.js';
import { ArrowLeft, Search, Calendar, User, BookOpen, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

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

    if (loading) return <div className="p-8 text-center text-gray-500">Loading results...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Link to="/teacher" className="text-gray-500 hover:text-primary transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Student Results</h1>
                        <p className="text-gray-500 text-sm mt-1">Monitor all student performance across your quizzes</p>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input 
                        type="text" 
                        placeholder="Search student or quiz..."
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none w-full md:w-80"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Quiz Title</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredResults.length > 0 ? (
                                filteredResults.map((res) => (
                                    <tr key={res._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                    {res.studentId?.name?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{res.studentId?.name || 'Unknown'}</div>
                                                    <div className="text-xs text-gray-500">{res.studentId?.email || 'N/A'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">{res.quizId.title}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold ${
                                                res.score >= 70 ? 'text-green-700 bg-green-100' : 
                                                res.score >= 40 ? 'text-yellow-700 bg-yellow-100' : 
                                                'text-red-700 bg-red-100'
                                            }`}>
                                                {res.score}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-sm">
                                            {new Date(res.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {res.score >= 40 ? (
                                                <span className="text-green-600 text-sm font-medium">Passed</span>
                                            ) : (
                                                <span className="text-red-600 text-sm font-medium">Failed</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link 
                                                to={`/student/results/${res._id}`}
                                                className="text-primary hover:text-indigo-800 font-semibold text-sm"
                                            >
                                                View Details
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        No results found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TeacherResults;
