import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Clock, Video, Calendar, BookOpen, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

const StudentDashboard = () => {
    const { user } = useContext(AuthContext);
    const [liveClasses, setLiveClasses] = useState([]);
    const [lectures, setLectures] = useState([]);
    const [liveSubjectFilter, setLiveSubjectFilter] = useState('');
    const [lectureSubjectFilter, setLectureSubjectFilter] = useState('');
    const [lectureTab, setLectureTab] = useState('upcoming');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

                const [liveRes, lectureRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/live-class', { headers }),
                    axios.get('http://localhost:5000/api/lectures', { headers })
                ]);

                setLiveClasses(liveRes.data.filter(c => c.status === 'scheduled' || c.status === 'live'));
                setLectures(lectureRes.data);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
                setError("Failed to load dashboard data. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const now = new Date();

    const categorizeLecture = (lec) => {
        const scheduledTime = new Date(lec.scheduledAt);
        const durationMs = (Number(lec.duration) || 60) * 60000;
        const endTime = new Date(scheduledTime.getTime() + durationMs);

        if (now >= scheduledTime && now <= endTime) return 'live';
        if (now < scheduledTime) return 'upcoming';
        return 'completed';
    };

    const liveLectures = lectures.filter(l => categorizeLecture(l) === 'live');
    const upcomingLectures = lectures.filter(l => categorizeLecture(l) === 'upcoming');
    const completedLectures = lectures.filter(l => categorizeLecture(l) === 'completed');

    const displayedLectures = lectureTab === 'live'
        ? liveLectures
        : lectureTab === 'upcoming'
            ? upcomingLectures
            : completedLectures;

    const filteredDisplayedLectures = lectureSubjectFilter
        ? displayedLectures.filter(l => l.subject === lectureSubjectFilter)
        : displayedLectures;

    const lectureSubjects = [...new Set(lectures.map(l => l.subject).filter(Boolean))];
    const liveClassSubjects = [...new Set(liveClasses.map(c => c.subject).filter(Boolean))];

    const getJoinButton = (lec, status) => {
        if (status === 'live') {
            return (
                <a
                    href={lec.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm flex items-center gap-1.5"
                >
                    <Video className="w-4 h-4" /> Join Now
                </a>
            );
        }
        if (status === 'upcoming') {
            const scheduledTime = new Date(lec.scheduledAt);
            const diffMs = scheduledTime - now;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);

            let timeLabel = '';
            if (diffDays > 0) timeLabel = `in ${diffDays}d ${diffHours % 24}h`;
            else if (diffHours > 0) timeLabel = `in ${diffHours}h ${diffMins % 60}m`;
            else timeLabel = `in ${diffMins}m`;

            return (
                <span className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> {timeLabel}
                </span>
            );
        }
        return (
            <span className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> Completed
            </span>
        );
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading your dashboard...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Student Dashboard</h1>
                {user?.class && (
                    <p className="text-gray-500 mt-1">
                        Class: <span className="font-bold text-primary">{user.class}</span>, Batch: <span className="font-bold text-primary">{user.batch}</span>
                    </p>
                )}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            {/* Live Now Section */}
            {(liveClasses.some(c => c.status === 'live') || liveLectures.length > 0) && (
                <div className="bg-green-50/50 border border-green-200 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-green-200 bg-green-100/50">
                        <h3 className="text-lg font-semibold text-green-800 flex items-center gap-2">
                            <span className="inline-block w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                            Live Now
                        </h3>
                    </div>
                    <div className="p-6 space-y-4">
                        {liveClasses.filter(c => c.status === 'live').map(cls => (
                            <div key={cls._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-green-100">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className="text-lg font-semibold text-gray-900">{cls.title}</h4>
                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase bg-green-100 text-green-700">
                                            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                                            live
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-500 flex flex-wrap items-center gap-3">
                                        {cls.subject && <span className="bg-indigo-50 text-primary px-2 py-0.5 rounded text-xs font-medium">{cls.subject}</span>}
                                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(cls.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                                        <span>{cls.duration} mins</span>
                                    </div>
                                </div>
                                <Link to={`/live/${cls._id}`} className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm flex items-center gap-1.5">
                                    <Video className="w-4 h-4" /> Join Now
                                </Link>
                            </div>
                        ))}
                        {liveLectures.map(lec => (
                            <div key={lec._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-green-100">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className="text-lg font-semibold text-gray-900">{lec.topic}</h4>
                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase bg-green-100 text-green-700">
                                            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                                            live
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-500 flex flex-wrap items-center gap-3">
                                        {lec.subject && <span className="bg-indigo-50 text-primary px-2 py-0.5 rounded text-xs font-medium">{lec.subject}</span>}
                                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(lec.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                                        <span>{lec.duration} mins</span>
                                        {lec.teacher?.name && <span>by {lec.teacher.name}</span>}
                                    </div>
                                </div>
                                <a
                                    href={lec.meetingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm flex items-center gap-1.5"
                                >
                                    <Video className="w-4 h-4" /> Join Now
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* My Scheduled Lectures */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-primary" /> My Scheduled Lectures
                        </h3>
                        <div className="flex items-center gap-3">
                            {lectureSubjects.length > 0 && (
                                <select
                                    value={lectureSubjectFilter}
                                    onChange={e => setLectureSubjectFilter(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-primary focus:border-primary"
                                >
                                    <option value="">All Subjects</option>
                                    {lectureSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            )}
                        </div>
                    </div>
                    {/* Tabs */}
                    <div className="flex gap-4 mt-3 border-b border-gray-200 -mb-px">
                        <button
                            onClick={() => setLectureTab('upcoming')}
                            className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                                lectureTab === 'upcoming'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Upcoming
                            {upcomingLectures.length > 0 && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${lectureTab === 'upcoming' ? 'bg-indigo-100 text-primary' : 'bg-gray-100 text-gray-600'}`}>
                                    {upcomingLectures.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setLectureTab('live')}
                            className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                                lectureTab === 'live'
                                    ? 'border-green-500 text-green-700'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Live Now
                            {liveLectures.length > 0 && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${lectureTab === 'live' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {liveLectures.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setLectureTab('completed')}
                            className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                                lectureTab === 'completed'
                                    ? 'border-gray-400 text-gray-700'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Completed
                            {completedLectures.length > 0 && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${lectureTab === 'completed' ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {completedLectures.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {filteredDisplayedLectures.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        {lectureTab === 'live'
                            ? 'No lectures happening right now.'
                            : lectureTab === 'upcoming'
                                ? 'No upcoming lectures scheduled.'
                                : 'No completed lectures yet.'
                        }
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {filteredDisplayedLectures.map(lec => {
                            const status = categorizeLecture(lec);
                            return (
                                <li key={lec._id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h4 className="text-lg font-semibold text-gray-900 truncate">{lec.topic}</h4>
                                            {status === 'live' && (
                                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase bg-green-100 text-green-700 flex-shrink-0">
                                                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                                                    live
                                                </span>
                                            )}
                                        </div>
                                        {lec.description && <p className="text-sm text-gray-500 mb-2 line-clamp-1">{lec.description}</p>}
                                        <div className="text-sm text-gray-500 flex flex-wrap items-center gap-3">
                                            {lec.subject && <span className="bg-indigo-50 text-primary px-2 py-0.5 rounded text-xs font-medium">{lec.subject}</span>}
                                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(lec.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(lec.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                                            <span>{lec.duration} mins</span>
                                            {lec.teacher?.name && <span>by {lec.teacher.name}</span>}
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0">
                                        {getJoinButton(lec, status)}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Upcoming Live Classes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Video className="w-5 h-5 text-primary" /> Live Classes
                    </h3>
                    {liveClassSubjects.length > 0 && (
                        <select
                            value={liveSubjectFilter}
                            onChange={e => setLiveSubjectFilter(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-primary focus:border-primary"
                        >
                            <option value="">All Subjects</option>
                            {liveClassSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    )}
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
