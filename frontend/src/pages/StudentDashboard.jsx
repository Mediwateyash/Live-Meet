import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Clock, Video, Calendar } from 'lucide-react';

const StudentDashboard = () => {
    const [liveClasses, setLiveClasses] = useState([]);
    const [liveSubjectFilter, setLiveSubjectFilter] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                
                // Fetch live classes
                const liveRes = await axios.get('http://localhost:5000/api/live-class', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setLiveClasses(liveRes.data.filter(c => c.status === 'scheduled' || c.status === 'live'));
                
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading your dashboard...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Student Dashboard</h1>

            {/* Upcoming Live Classes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Video className="w-5 h-5 text-primary" /> Upcoming Live Classes
                    </h3>
                    {(() => { 
                        const subjects = [...new Set(liveClasses.map(c => c.subject).filter(Boolean))]; 
                        return subjects.length > 0 ? (
                            <select 
                                value={liveSubjectFilter} 
                                onChange={e => setLiveSubjectFilter(e.target.value)} 
                                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-primary focus:border-primary"
                            >
                                <option value="">All Subjects</option>
                                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        ) : null; 
                    })()}
                </div>
                {liveClasses.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No live classes scheduled. Check back later!</div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {(liveSubjectFilter ? liveClasses.filter(c => c.subject === liveSubjectFilter) : liveClasses).map(cls => (
                            <li key={cls._id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className="text-lg font-semibold text-gray-900">{cls.title}</h4>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                                            cls.status === 'live' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {cls.status === 'live' && <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>}
                                            {cls.status}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1 flex flex-wrap items-center gap-4">
                                        {cls.subject && <span className="bg-indigo-50 text-primary px-2 py-0.5 rounded text-xs font-medium">{cls.subject}</span>}
                                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(cls.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(cls.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                                        <span>{cls.duration} mins</span>
                                        {cls.createdBy?.name && <span>by {cls.createdBy.name}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {cls.status === 'live' ? (
                                        <Link to={`/live/${cls._id}`} className="px-6 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors shadow-sm flex items-center gap-1.5">
                                            <Video className="w-4 h-4" /> Join Now
                                        </Link>
                                    ) : (
                                        <span className="px-4 py-2 bg-gray-100 text-gray-500 rounded-md text-sm font-medium">Scheduled</span>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default StudentDashboard;
