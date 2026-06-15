import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Calendar, Clock, Video, BookOpen, PlusCircle, Edit, Trash2, ExternalLink, ArrowRight, User, Users, FileText, CheckCircle, AlertTriangle, Link as LinkIcon } from 'lucide-react';

const LectureSchedules = () => {
    const { user } = useContext(AuthContext);
    const [lectures, setLectures] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form states
    const [topic, setTopic] = useState('');
    const [description, setDescription] = useState('');
    const [subject, setSubject] = useState('');
    const [teacher, setTeacher] = useState('');
    const [classVal, setClassVal] = useState('10th');
    const [batch, setBatch] = useState('Batch A');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState(60);
    const [meetingUrl, setMeetingUrl] = useState('');
    
    // Edit state
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Filter states
    const [studentSubjectFilter, setStudentSubjectFilter] = useState('');
    const [teacherTab, setTeacherTab] = useState('upcoming'); // 'upcoming' or 'completed'

    useEffect(() => {
        fetchLectures();
        if (user.role === 'admin') {
            fetchTeachers();
        }
    }, [user]);

    const fetchLectures = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');
            const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
            const res = await axios.get(`${baseUrl}/api/lectures`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLectures(res.data);
        } catch (error) {
            console.error("Failed to fetch lectures", error);
            setError(error.response?.data?.message || "Failed to connect to the server.");
        } finally {
            setLoading(false);
        }
    };

    const fetchTeachers = async () => {
        try {
            const token = localStorage.getItem('token');
            const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
            const res = await axios.get(`${baseUrl}/api/lectures/teachers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTeachers(res.data);
            if (res.data.length > 0) {
                setTeacher(res.data[0]._id);
            }
        } catch (error) {
            console.error("Failed to fetch teachers", error);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        const missingFields = [];
        if (!topic.trim()) missingFields.push('Lecture Topic');
        if (!subject.trim()) missingFields.push('Subject');
        if (!date) missingFields.push('Date');
        if (!time) missingFields.push('Time');
        if (!meetingUrl.trim()) missingFields.push('Meeting URL');
        if (!teacher) missingFields.push('Teacher');
        if (!classVal) missingFields.push('Class');
        if (!batch) missingFields.push('Batch');

        if (missingFields.length > 0) {
            return setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        }

        const scheduledAtDate = new Date(`${date}T${time}`);
        if (isNaN(scheduledAtDate.getTime())) {
            return setError('Invalid date or time');
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
            const payload = {
                topic: topic.trim(),
                description: description.trim(),
                subject: subject.trim(),
                scheduledAt: scheduledAtDate.toISOString(),
                duration: Number(duration),
                meetingUrl: meetingUrl.trim(),
                teacher,
                class: classVal,
                batch
            };

            if (editingId) {
                const res = await axios.put(`${baseUrl}/api/lectures/${editingId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setLectures(lectures.map(l => l._id === editingId ? res.data : l));
                setEditingId(null);
            } else {
                const res = await axios.post(`${baseUrl}/api/lectures/create`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setLectures([res.data, ...lectures]);
            }

            // Reset form
            setTopic('');
            setDescription('');
            setSubject('');
            setDate('');
            setTime('');
            setDuration(60);
            setMeetingUrl('');
            if (teachers.length > 0) {
                setTeacher(teachers[0]._id);
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Action failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditClick = (lec) => {
        setEditingId(lec._id);
        setTopic(lec.topic);
        setDescription(lec.description || '');
        setSubject(lec.subject);
        setTeacher(lec.teacher?._id || lec.teacher || '');
        setClassVal(lec.class);
        setBatch(lec.batch);
        
        // Parse date/time
        const localDate = new Date(lec.scheduledAt);
        const yyyy = localDate.getFullYear();
        const mm = String(localDate.getMonth() + 1).padStart(2, '0');
        const dd = String(localDate.getDate()).padStart(2, '0');
        setDate(`${yyyy}-${mm}-${dd}`);
        
        const hh = String(localDate.getHours()).padStart(2, '0');
        const min = String(localDate.getMinutes()).padStart(2, '0');
        setTime(`${hh}:${min}`);
        
        setDuration(lec.duration);
        setMeetingUrl(lec.meetingUrl);
        
        // Scroll to form on small devices
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteClick = async (lecId) => {
        if (!window.confirm("Are you sure you want to delete this scheduled lecture?")) return;
        try {
            const token = localStorage.getItem('token');
            const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
            await axios.delete(`${baseUrl}/api/lectures/${lecId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLectures(lectures.filter(l => l._id !== lecId));
        } catch (error) {
            alert(error.response?.data?.message || "Failed to delete lecture schedule");
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setTopic('');
        setDescription('');
        setSubject('');
        setDate('');
        setTime('');
        setDuration(60);
        setMeetingUrl('');
        if (teachers.length > 0) {
            setTeacher(teachers[0]._id);
        }
    };

    if (loading) {
        return (
            <div className="py-20 text-center text-gray-500 max-w-7xl mx-auto">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                Loading lectures data...
            </div>
        );
    }

    // --- RENDER ADMIN LAYOUT ---
    if (user.role === 'admin') {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-[fadeIn_0.3s_ease-out]">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-primary" />
                        Lecture Scheduling Module
                    </h1>
                    <p className="text-gray-500 mt-1">Centralized dashboard for scheduling, managing, and viewing lectures</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Lecture Scheduling Form */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6 self-start">
                        <div className="border-b border-gray-100 pb-4">
                            <h2 className="text-lg font-bold text-gray-950 flex items-center gap-2">
                                <PlusCircle className="w-5 h-5 text-primary" />
                                {editingId ? 'Edit Lecture Schedule' : 'Schedule New Lecture'}
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">Fill in the fields below to schedule a lecture</p>
                        </div>

                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Lecture Topic *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    placeholder="e.g. Calculus Basics"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Subject *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    placeholder="e.g. Mathematics"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Class *</label>
                                    <select
                                        className="w-full border border-gray-200 rounded-lg px-3.5 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white transition-all cursor-pointer"
                                        value={classVal}
                                        onChange={(e) => setClassVal(e.target.value)}
                                    >
                                        <option value="10th">10th</option>
                                        <option value="11th">11th</option>
                                        <option value="12th">12th</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Batch *</label>
                                    <select
                                        className="w-full border border-gray-200 rounded-lg px-3.5 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white transition-all cursor-pointer"
                                        value={batch}
                                        onChange={(e) => setBatch(e.target.value)}
                                    >
                                        <option value="Batch A">Batch A</option>
                                        <option value="Batch B">Batch B</option>
                                        <option value="Batch C">Batch C</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Assign Teacher *</label>
                                <select
                                    required
                                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white transition-all cursor-pointer"
                                    value={teacher}
                                    onChange={(e) => setTeacher(e.target.value)}
                                >
                                    {teachers.length === 0 ? (
                                        <option value="">No approved teachers found</option>
                                    ) : (
                                        teachers.map(t => (
                                            <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
                                        ))
                                    )}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Date *</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full border border-gray-200 rounded-lg px-3.5 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all cursor-pointer"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Time *</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full border border-gray-200 rounded-lg px-3.5 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all cursor-pointer"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Duration (minutes) *</label>
                                <input
                                    type="number"
                                    required
                                    min="10"
                                    max="300"
                                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Meeting URL *</label>
                                <input
                                    type="url"
                                    required
                                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    placeholder="https://meet.google.com/xyz"
                                    value={meetingUrl}
                                    onChange={(e) => setMeetingUrl(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Description (Optional)</label>
                                <textarea
                                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    placeholder="Brief lecture description..."
                                    rows="2"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-primary hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                    {submitting ? 'Processing...' : (editingId ? 'Update Schedule' : 'Schedule Lecture')}
                                </button>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={cancelEdit}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* All Schedules list */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden self-start">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" /> Active Lecture Schedules
                            </h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Topic & Subject</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Teacher</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Class/Batch</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Scheduled At</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {lectures.length > 0 ? (
                                        lectures.map((lec) => (
                                            <tr key={lec._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-gray-900">{lec.topic}</div>
                                                    <div className="text-xs font-medium text-primary bg-indigo-50 px-2 py-0.5 rounded inline-block mt-1">{lec.subject}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900">{lec.teacher?.name || 'Unassigned'}</div>
                                                    <div className="text-xs text-gray-500">{lec.teacher?.email}</div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-700 text-sm">
                                                    <span className="font-medium bg-gray-100 px-2 py-1 rounded text-gray-800 text-xs">
                                                        {lec.class} - {lec.batch}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(lec.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                                                    <div className="flex items-center gap-1.5 mt-0.5"><Clock className="w-3.5 h-3.5" /> {new Date(lec.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} ({lec.duration} min)</div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end items-center gap-2">
                                                        <a 
                                                            href={lec.meetingUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-gray-400 hover:text-green-600 p-2 rounded-lg hover:bg-green-50 transition-colors"
                                                            title="Join Meeting"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                        </a>
                                                        <button
                                                            onClick={() => handleEditClick(lec)}
                                                            className="text-gray-400 hover:text-primary p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                                                            title="Edit Schedule"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(lec._id)}
                                                            className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                                            title="Delete Schedule"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-16 text-center text-gray-500">
                                                No lectures scheduled yet. Add one using the form on the left.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER TEACHER LAYOUT ---
    if (user.role === 'teacher') {
        const now = new Date();
        const filteredLectures = lectures.filter(lec => {
            const dateObj = new Date(lec.scheduledAt);
            const durationMin = Number(lec.duration) || 60;
            const isFinished = (dateObj.getTime() + durationMin * 60000) < now.getTime();
            if (teacherTab === 'upcoming') {
                return !isFinished;
            } else {
                return isFinished;
            }
        });

        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-[fadeIn_0.3s_ease-out]">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-primary" />
                        My Lecture Schedule
                    </h1>
                    <p className="text-gray-500 mt-1">View your assigned upcoming and completed lectures and access meet links directly</p>
                </div>

                {/* Tab selector */}
                <div className="border-b border-gray-200">
                    <div className="flex gap-6 -mb-px">
                        <button
                            onClick={() => setTeacherTab('upcoming')}
                            className={`pb-4 px-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                                teacherTab === 'upcoming' 
                                    ? 'border-primary text-primary' 
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Upcoming Lectures
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${teacherTab === 'upcoming' ? 'bg-indigo-100 text-primary' : 'bg-gray-100 text-gray-600'}`}>
                                {lectures.filter(l => new Date(l.scheduledAt) >= now).length}
                            </span>
                        </button>
                        <button
                            onClick={() => setTeacherTab('completed')}
                            className={`pb-4 px-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                                teacherTab === 'completed' 
                                    ? 'border-primary text-primary' 
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Completed Lectures
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${teacherTab === 'completed' ? 'bg-indigo-100 text-primary' : 'bg-gray-100 text-gray-600'}`}>
                                {lectures.filter(l => new Date(l.scheduledAt) < now).length}
                            </span>
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Date & Time</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Subject</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Topic & Description</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Class/Batch</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredLectures.length > 0 ? (
                                    filteredLectures.map((lec) => (
                                        <tr key={lec._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                                <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-gray-400" /> {new Date(lec.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                                <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500"><Clock className="w-4 h-4" /> {new Date(lec.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} ({lec.duration} mins)</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="bg-indigo-50 text-primary px-2.5 py-1 rounded text-xs font-semibold uppercase">{lec.subject}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900">{lec.topic}</div>
                                                {lec.description && <p className="text-xs text-gray-500 mt-1 max-w-sm line-clamp-2">{lec.description}</p>}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className="font-medium bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs">
                                                    {lec.class} - {lec.batch}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <a
                                                    href={lec.meetingUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 bg-primary hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm"
                                                >
                                                    <Video className="w-4 h-4" /> Join
                                                </a>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-16 text-center text-gray-500">
                                            No {teacherTab} lectures assigned to you.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-green-50/50 border border-green-100 p-5 rounded-2xl flex items-start gap-4">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-green-800">Assigned Lectures Guidelines</h4>
                        <ul className="list-disc list-inside text-xs text-green-700/90 space-y-1 mt-2">
                            <li>Teachers cannot create, modify or delete schedules created by Admins.</li>
                            <li>You only have visibility of sessions specifically assigned to your user account.</li>
                            <li>Join the classroom 5 minutes prior to the scheduled start time using the Join button.</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER STUDENT LAYOUT ---
    if (user.role === 'student') {
        const subjects = [...new Set(lectures.map(l => l.subject).filter(Boolean))];
        const filteredLectures = studentSubjectFilter 
            ? lectures.filter(l => l.subject === studentSubjectFilter) 
            : lectures;

        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-[fadeIn_0.3s_ease-out]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                            <Calendar className="w-8 h-8 text-primary" />
                            My Lectures
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Schedules relevant to Class: <span className="font-bold text-primary">{user.class || 'Unassigned'}</span>, Batch: <span className="font-bold text-primary">{user.batch || 'Unassigned'}</span>
                        </p>
                    </div>
                    {subjects.length > 0 && (
                        <div>
                            <select
                                value={studentSubjectFilter}
                                onChange={(e) => setStudentSubjectFilter(e.target.value)}
                                className="border border-gray-200 bg-white rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm cursor-pointer"
                            >
                                <option value="">All Subjects</option>
                                {subjects.map(sub => (
                                    <option key={sub} value={sub}>{sub}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Date & Time</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Subject</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Lecture Topic & Info</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Teacher</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredLectures.length > 0 ? (
                                    filteredLectures.map((lec) => (
                                        <tr key={lec._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                                <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-gray-400" /> {new Date(lec.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                                <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500"><Clock className="w-4 h-4" /> {new Date(lec.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} ({lec.duration} min)</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="bg-indigo-50 text-primary px-2.5 py-1 rounded text-xs font-semibold uppercase">{lec.subject}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900">{lec.topic}</div>
                                                {lec.description && <p className="text-xs text-gray-500 mt-1 max-w-sm line-clamp-2">{lec.description}</p>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{lec.teacher?.name || 'Guest Teacher'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <a
                                                    href={lec.meetingUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 bg-primary hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm"
                                                >
                                                    <Video className="w-4 h-4" /> Join
                                                </a>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-16 text-center text-gray-500">
                                            {studentSubjectFilter ? 'No lectures found matching the selected subject filter.' : 'No lectures scheduled for your class & batch at this moment.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-2xl flex items-start gap-4">
                    <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-indigo-900">Student Portal Information</h4>
                        <ul className="list-disc list-inside text-xs text-indigo-700/90 space-y-1 mt-2">
                            <li>Students only have access to view lectures matched with their specific class and batch.</li>
                            <li>You have read-only access and cannot edit schedules or join sessions assigned to other student groups.</li>
                            <li>Please use the Join button to connect to the meeting rooms when they start.</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default LectureSchedules;
