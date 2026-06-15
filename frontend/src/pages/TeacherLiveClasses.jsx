import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Video, Calendar, Clock, Users, Trash2, Edit3, Play, Eye, ChevronDown, ChevronUp, Filter, Download } from 'lucide-react';

const TeacherLiveClasses = () => {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedAttendance, setExpandedAttendance] = useState(null);
    const [attendanceData, setAttendanceData] = useState({});
    const [subjectFilter, setSubjectFilter] = useState('');
    const [editingClass, setEditingClass] = useState(null);
    const [editForm, setEditForm] = useState({ title: '', description: '', subject: '', scheduledDay: '', scheduledMonth: '', scheduledYear: '', scheduledTime: '', duration: '' });
    const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
    const months = [
        { value: '01', label: 'Jan' },
        { value: '02', label: 'Feb' },
        { value: '03', label: 'Mar' },
        { value: '04', label: 'Apr' },
        { value: '05', label: 'May' },
        { value: '06', label: 'Jun' },
        { value: '07', label: 'Jul' },
        { value: '08', label: 'Aug' },
        { value: '09', label: 'Sep' },
        { value: '10', label: 'Oct' },
        { value: '11', label: 'Nov' },
        { value: '12', label: 'Dec' }
    ];
    const currentYear = new Date().getFullYear();
    const years = [String(currentYear), String(currentYear + 1), String(currentYear + 2)];

    const now = new Date();
    const currentYearNum = now.getFullYear();
    const currentMonthNum = now.getMonth() + 1;
    const currentDayNum = now.getDate();

    const getDaysInMonth = (year, month) => {
        if (!month) return 31;
        const y = year ? Number(year) : currentYearNum;
        const m = Number(month);
        return new Date(y, m, 0).getDate();
    };

    const filteredMonths = months.filter(m => {
        if (editForm.scheduledYear === String(currentYearNum)) {
            return Number(m.value) >= currentMonthNum;
        }
        return true;
    });

    const maxDays = getDaysInMonth(editForm.scheduledYear, editForm.scheduledMonth);
    const filteredDays = Array.from({ length: maxDays }, (_, i) => String(i + 1).padStart(2, '0')).filter(d => {
        if (editForm.scheduledYear === String(currentYearNum) && editForm.scheduledMonth === String(currentMonthNum).padStart(2, '0')) {
            return Number(d) >= currentDayNum;
        }
        return true;
    });

    useEffect(() => {
        if (editForm.scheduledYear === String(currentYearNum)) {
            if (editForm.scheduledMonth && Number(editForm.scheduledMonth) < currentMonthNum) {
                setEditForm(prev => ({ ...prev, scheduledMonth: '', scheduledDay: '' }));
            }
        }
    }, [editForm.scheduledYear]);

    useEffect(() => {
        const max = getDaysInMonth(editForm.scheduledYear, editForm.scheduledMonth);
        if (editForm.scheduledDay && Number(editForm.scheduledDay) > max) {
            setEditForm(prev => ({ ...prev, scheduledDay: '' }));
        }
        if (editForm.scheduledYear === String(currentYearNum) && editForm.scheduledMonth === String(currentMonthNum).padStart(2, '0')) {
            if (editForm.scheduledDay && Number(editForm.scheduledDay) < currentDayNum) {
                setEditForm(prev => ({ ...prev, scheduledDay: '' }));
            }
        }
    }, [editForm.scheduledMonth, editForm.scheduledYear]);
    const [classToDelete, setClassToDelete] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    const fetchClasses = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/live-class', { headers });
            setClasses(res.data);
        } catch (error) {
            console.error('Failed to fetch live classes', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchClasses(); }, []);

    const triggerDeleteConfirm = (id) => {
        setClassToDelete(id);
    };

    const confirmDelete = async () => {
        if (!classToDelete) return;
        try {
            await axios.delete(`http://localhost:5000/api/live-class/${classToDelete}`, { headers });
            setClasses(prev => prev.filter(c => c._id !== classToDelete));
            setClassToDelete(null);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete');
        }
    };

    const handleStart = async (id) => {
        try {
            await axios.put(`http://localhost:5000/api/live-class/${id}/start`, {}, { headers });
            window.location.href = `/live/${id}`;
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to start class');
        }
    };

    const toggleAttendance = async (classId) => {
        if (expandedAttendance === classId) {
            setExpandedAttendance(null);
            return;
        }
        try {
            const res = await axios.get(`http://localhost:5000/api/live-class/${classId}/attendance`, { headers });
            setAttendanceData(prev => ({ ...prev, [classId]: res.data }));
            setExpandedAttendance(classId);
        } catch (error) {
            console.error('Failed to fetch attendance', error);
        }
    };

    const downloadCSV = (classTitle, attendanceRecords) => {
        if (!attendanceRecords || attendanceRecords.length === 0) {
            alert('No attendance data available to download.');
            return;
        }

        const headers = ['Student Name', 'Email', 'First Joined At', 'Last Left At', 'Total Duration (min)'];
        
        const rows = attendanceRecords.map(att => {
            const joinTime = new Date(att.joinedAt).toLocaleString('en-IN');
            const leaveTime = att.leftAt ? new Date(att.leftAt).toLocaleString('en-IN') : '—';
            return [
                `"${(att.studentId?.name || 'Unknown').replace(/"/g, '""')}"`,
                `"${(att.studentId?.email || '—').replace(/"/g, '""')}"`,
                `"${joinTime}"`,
                `"${leaveTime}"`,
                att.totalDurationMin !== undefined ? att.totalDurationMin : 0
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        
        const formattedTitle = classTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        link.setAttribute('download', `attendance-${formattedTitle}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleEditClick = (cls) => {
        setEditingClass(cls._id);
        
        let localDay = '';
        let localMonth = '';
        let localYear = '';
        let localTime = '';
        if (cls.scheduledAt) {
            const dateObj = new Date(cls.scheduledAt);
            localDay = String(dateObj.getDate()).padStart(2, '0');
            localMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
            localYear = String(dateObj.getFullYear());
            
            const hours = String(dateObj.getHours()).padStart(2, '0');
            const minutes = String(dateObj.getMinutes()).padStart(2, '0');
            localTime = `${hours}:${minutes}`;
        }

        setEditForm({
            title: cls.title,
            description: cls.description || '',
            subject: cls.subject || '',
            scheduledDay: localDay,
            scheduledMonth: localMonth,
            scheduledYear: localYear,
            scheduledTime: localTime,
            duration: cls.duration
        });
    };

    const handleEditSave = async (id) => {
        try {
            if (!editForm.scheduledDay || !editForm.scheduledMonth || !editForm.scheduledYear || !editForm.scheduledTime) {
                alert('Scheduled date & time is required');
                return;
            }

            const scheduledAtDate = new Date(`${editForm.scheduledYear}-${editForm.scheduledMonth}-${editForm.scheduledDay}T${editForm.scheduledTime}`);
            if (scheduledAtDate < new Date()) {
                alert('Scheduled date & time must be in the future');
                return;
            }

            const scheduledAt = scheduledAtDate.toISOString();
            await axios.put(`http://localhost:5000/api/live-class/${id}`, {
                title: editForm.title,
                description: editForm.description,
                subject: editForm.subject,
                scheduledAt,
                duration: Number(editForm.duration)
            }, { headers });
            setEditingClass(null);
            fetchClasses();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update');
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            scheduled: 'bg-blue-100 text-blue-700',
            live: 'bg-green-100 text-green-700 animate-pulse',
            ended: 'bg-red-100 text-red-700'
        };
        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
                {status === 'live' && <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>}
                {status}
            </span>
        );
    };

    const subjects = [...new Set(classes.map(c => c.subject).filter(Boolean))];
    const filtered = subjectFilter ? classes.filter(c => c.subject === subjectFilter) : classes;

    if (loading) return <div className="p-8 text-center">Loading live classes...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                    <Video className="w-8 h-8 text-primary" />
                    Live Classes
                </h1>
                <Link
                    to="/teacher/live-classes/create"
                    className="bg-primary hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
                >
                    + Schedule New Class
                </Link>
            </div>

            {/* Subject filter */}
            {subjects.length > 0 && (
                <div className="flex items-center gap-3 relative z-30" ref={dropdownRef}>
                    <Filter className="w-4 h-4 text-gray-500" />
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-750 flex items-center justify-between gap-2 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-w-[170px] transition-all"
                        >
                            <span className="truncate">{subjectFilter || 'All Subjects'}</span>
                            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 flex-shrink-0 ${isDropdownOpen ? 'transform rotate-180' : ''}`} />
                        </button>
                        
                        {isDropdownOpen && (
                            <div className="absolute left-0 mt-1.5 w-56 rounded-xl bg-white border border-gray-150 shadow-lg py-1.5 z-40 animate-[scaleIn_0.15s_ease-out] origin-top-left">
                                <button
                                    onClick={() => {
                                        setSubjectFilter('');
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${!subjectFilter ? 'bg-indigo-50/70 text-primary font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
                                >
                                    All Subjects
                                </button>
                                {subjects.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => {
                                            setSubjectFilter(s);
                                            setIsDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${subjectFilter === s ? 'bg-indigo-50/70 text-primary font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Classes list */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="text-lg font-semibold text-gray-800">Your Classes ({filtered.length})</h3>
                </div>

                {filtered.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No live classes yet. Schedule one to get started!</div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {filtered.map(cls => (
                            <li key={cls._id} className="p-6 hover:bg-indigo-50/60 hover:shadow-sm transition-all duration-200">
                                {editingClass === cls._id ? (
                                    /* Edit form */
                                    <div className="space-y-3">
                                        <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} placeholder="Title" />
                                        <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} placeholder="Description" />
                                        <div className="grid grid-cols-6 gap-2">
                                            <input className="border border-gray-300 rounded-lg px-2 py-2 text-xs focus:ring-primary focus:border-primary" value={editForm.subject} onChange={e => setEditForm({ ...editForm, subject: e.target.value })} placeholder="Subject" />
                                            <select
                                                value={editForm.scheduledDay}
                                                onChange={e => setEditForm({ ...editForm, scheduledDay: e.target.value })}
                                                className="border border-gray-300 rounded-lg px-1 py-2 text-xs focus:outline-none focus:ring-primary focus:border-primary bg-white cursor-pointer"
                                                required
                                            >
                                                <option value="">DD</option>
                                                {filteredDays.map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                            <select
                                                value={editForm.scheduledMonth}
                                                onChange={e => setEditForm({ ...editForm, scheduledMonth: e.target.value })}
                                                className="border border-gray-300 rounded-lg px-1 py-2 text-xs focus:outline-none focus:ring-primary focus:border-primary bg-white cursor-pointer"
                                                required
                                            >
                                                <option value="">MM</option>
                                                {filteredMonths.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                            </select>
                                            <select
                                                value={editForm.scheduledYear}
                                                onChange={e => setEditForm({ ...editForm, scheduledYear: e.target.value })}
                                                className="border border-gray-300 rounded-lg px-1 py-2 text-xs focus:outline-none focus:ring-primary focus:border-primary bg-white cursor-pointer"
                                                required
                                            >
                                                <option value="">YYYY</option>
                                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                            <input type="time" className="border border-gray-300 rounded-lg px-2 py-2 text-xs focus:ring-primary focus:border-primary" value={editForm.scheduledTime} onChange={e => setEditForm({ ...editForm, scheduledTime: e.target.value })} />
                                            <input type="number" className="border border-gray-300 rounded-lg px-2 py-2 text-xs focus:ring-primary focus:border-primary" min={10} step={5} value={editForm.duration} onChange={e => setEditForm({ ...editForm, duration: e.target.value })} placeholder="Duration (min)" />
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditSave(cls._id)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Save</button>
                                            <button onClick={() => setEditingClass(null)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    /* Normal display */
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="text-lg font-semibold text-gray-900">{cls.title}</h4>
                                                {getStatusBadge(cls.status)}
                                            </div>
                                            {cls.description && <p className="text-sm text-gray-500 mb-2">{cls.description}</p>}
                                            <div className="text-sm text-gray-500 flex flex-wrap items-center gap-4">
                                                {cls.subject && <span className="bg-indigo-50 text-primary px-2 py-0.5 rounded text-xs font-medium">{cls.subject}</span>}
                                                {cls.class && <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs font-medium">Class: {cls.class}</span>}
                                                {cls.batch && <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-xs font-medium">{cls.batch}</span>}
                                                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(cls.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(cls.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                                                <span>{cls.duration} mins</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {cls.status === 'scheduled' && (
                                                <>
                                                    <button onClick={() => handleStart(cls._id)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5"><Play className="w-4 h-4" /> Start</button>
                                                    <button onClick={() => handleEditClick(cls)} className="p-2 text-gray-500 hover:text-primary hover:bg-indigo-50 rounded-lg transition-colors"><Edit3 className="w-4 h-4" /></button>
                                                    <button onClick={() => triggerDeleteConfirm(cls._id)} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                </>
                                            )}
                                            {cls.status === 'live' && (
                                                <Link to={`/live/${cls._id}`} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5">
                                                    <Video className="w-4 h-4" /> Rejoin Session
                                                </Link>
                                            )}
                                            {cls.status === 'ended' && (
                                                <button onClick={() => toggleAttendance(cls._id)} className="px-4 py-2 bg-indigo-50 text-primary border border-indigo-100 hover:bg-indigo-100 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-sm">
                                                    <Eye className="w-4 h-4" /> Attendance
                                                    {expandedAttendance === cls._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Attendance section */}
                                {expandedAttendance === cls._id && attendanceData[cls._id] && (
                                    <div className="mt-5 p-5 bg-slate-50/70 border border-slate-100 rounded-xl shadow-inner animate-[fadeIn_0.25s_ease-out]">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                            <h5 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                                <Users className="w-4 h-4 text-primary" /> Attendance Report
                                                <span className="bg-indigo-100/70 text-primary px-2 py-0.5 rounded-full text-xs font-semibold">{attendanceData[cls._id].length} students</span>
                                            </h5>
                                            {attendanceData[cls._id].length > 0 && (
                                                <button
                                                    onClick={() => downloadCSV(cls.title, attendanceData[cls._id])}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm shadow-green-100"
                                                >
                                                    <Download className="w-3.5 h-3.5" /> Download Attendance (CSV)
                                                </button>
                                            )}
                                        </div>
                                        {attendanceData[cls._id].length === 0 ? (
                                            <p className="text-sm text-gray-500 bg-white p-4 rounded-lg border border-gray-100 text-center">No students attended this class.</p>
                                        ) : (
                                            <div className="overflow-hidden border border-gray-150 rounded-xl bg-white shadow-sm">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="bg-indigo-100/70 border-b border-indigo-200 text-left text-xs font-bold uppercase tracking-wider text-indigo-900">
                                                                <th className="px-5 py-3 font-bold">Student</th>
                                                                <th className="px-5 py-3 font-bold">Email</th>
                                                                <th className="px-5 py-3 font-bold">First Joined</th>
                                                                <th className="px-5 py-3 font-bold">Last Left</th>
                                                                <th className="px-5 py-3 font-bold">Total Duration</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {attendanceData[cls._id].map(att => {
                                                                const joinTime = new Date(att.joinedAt);
                                                                const leaveTime = att.leftAt ? new Date(att.leftAt) : null;
                                                                return (
                                                                    <tr key={att._id} className="hover:bg-slate-50/60 transition-colors">
                                                                        <td className="px-5 py-3.5 font-bold text-gray-900">{att.studentId?.name || 'Unknown'}</td>
                                                                        <td className="px-5 py-3.5 text-gray-500">{att.studentId?.email || '—'}</td>
                                                                        <td className="px-5 py-3.5 text-gray-500">
                                                                            {joinTime.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} {joinTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                                        </td>
                                                                        <td className="px-5 py-3.5 text-gray-500">
                                                                            {leaveTime ? (
                                                                                <>
                                                                                    {leaveTime.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} {leaveTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                                                </>
                                                                            ) : <span className="text-gray-400">—</span>}
                                                                        </td>
                                                                        <td className="px-5 py-3.5 text-indigo-600 font-semibold">
                                                                            {(() => {
                                                                                const mins = att.totalDurationMin || 0;
                                                                                const h = Math.floor(mins / 60);
                                                                                const m = mins % 60;
                                                                                return h > 0 ? `${h} hr ${m} min` : `${m} min`;
                                                                            })()}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </li>
                        ))}
                     </ul>
                )}
            </div>

            {/* Confirmation Modal */}
            {classToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop with blur */}
                    <div 
                        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ease-out animate-[fadeIn_0.2s_ease-out]" 
                        onClick={() => setClassToDelete(null)}
                    ></div>
                    
                    {/* Modal Dialog Content */}
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full p-6 relative z-10 transform scale-100 transition-all duration-300 ease-out animate-[scaleIn_0.2s_ease-out]">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-rose-50 text-rose-600 rounded-full flex-shrink-0">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Delete Class</h3>
                                <p className="text-sm text-gray-500">Are you sure you want to delete this class?</p>
                            </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 mt-6">
                            <button 
                                onClick={() => setClassToDelete(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition-colors shadow-sm shadow-rose-200"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherLiveClasses;
