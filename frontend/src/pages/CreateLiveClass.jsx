import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Video, Calendar, Clock, BookOpen, FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const CreateLiveClass = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [subject, setSubject] = useState('');
    const [scheduledDay, setScheduledDay] = useState('');
    const [scheduledMonth, setScheduledMonth] = useState('');
    const [scheduledYear, setScheduledYear] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [duration, setDuration] = useState(10);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    const now = new Date();
    const currentYearNum = now.getFullYear();
    const currentMonthNum = now.getMonth() + 1; // 1-12
    const currentDayNum = now.getDate();

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
    const years = [String(currentYearNum), String(currentYearNum + 1), String(currentYearNum + 2)];

    // Get days in selected month
    const getDaysInMonth = (year, month) => {
        if (!month) return 31;
        const y = year ? Number(year) : currentYearNum;
        const m = Number(month);
        return new Date(y, m, 0).getDate();
    };

    // Filter available options based on today's date
    const filteredMonths = months.filter(m => {
        if (scheduledYear === String(currentYearNum)) {
            return Number(m.value) >= currentMonthNum;
        }
        return true;
    });

    const maxDays = getDaysInMonth(scheduledYear, scheduledMonth);
    const filteredDays = Array.from({ length: maxDays }, (_, i) => String(i + 1).padStart(2, '0')).filter(d => {
        if (scheduledYear === String(currentYearNum) && scheduledMonth === String(currentMonthNum).padStart(2, '0')) {
            return Number(d) >= currentDayNum;
        }
        return true;
    });

    // Reset month if it becomes invalid when changing year
    useEffect(() => {
        if (scheduledYear === String(currentYearNum)) {
            if (scheduledMonth && Number(scheduledMonth) < currentMonthNum) {
                setScheduledMonth('');
                setScheduledDay('');
            }
        }
    }, [scheduledYear]);

    // Reset day if it becomes invalid when changing month or year
    useEffect(() => {
        const max = getDaysInMonth(scheduledYear, scheduledMonth);
        if (scheduledDay && Number(scheduledDay) > max) {
            setScheduledDay('');
        }
        if (scheduledYear === String(currentYearNum) && scheduledMonth === String(currentMonthNum).padStart(2, '0')) {
            if (scheduledDay && Number(scheduledDay) < currentDayNum) {
                setScheduledDay('');
            }
        }
    }, [scheduledMonth, scheduledYear]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!title.trim()) return setError('Title is required');
        if (!scheduledDay || !scheduledMonth || !scheduledYear || !scheduledTime) {
            return setError('Scheduled date & time is required');
        }
        
        const scheduledAtDate = new Date(`${scheduledYear}-${scheduledMonth}-${scheduledDay}T${scheduledTime}`);
        if (scheduledAtDate < new Date()) {
            return setError('Scheduled date & time must be in the future');
        }

        if (!duration || duration < 10) return setError('Duration must be at least 10 minutes');

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const scheduledAt = scheduledAtDate.toISOString();
            await axios.post('http://localhost:5000/api/live-class/create', {
                title: title.trim(),
                description: description.trim(),
                subject: subject.trim(),
                scheduledAt,
                duration: Number(duration)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate('/teacher/live-classes');
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to create live class');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            <div className="flex items-center gap-3">
                <Link to="/teacher/live-classes" className="text-gray-500 hover:text-primary transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                     <Video className="w-8 h-8 text-primary" />
                    Schedule Live Class
                </h1>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm text-center font-medium">{error}</div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" /> Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                            placeholder="e.g. Introduction to Neural Networks"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Description
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                            placeholder="Brief description of the class content..."
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Subject Tag
                        </label>
                        <input
                            type="text"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                            placeholder="e.g. Machine Learning, Data Structures"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-755 mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Date *
                            </label>
                            <div className="grid grid-cols-3 gap-1.5">
                                <select
                                    value={scheduledDay}
                                    onChange={e => setScheduledDay(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-2 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white cursor-pointer"
                                    required
                                >
                                    <option value="">DD</option>
                                    {filteredDays.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <select
                                    value={scheduledMonth}
                                    onChange={e => setScheduledMonth(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-2 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white cursor-pointer"
                                    required
                                >
                                    <option value="">MM</option>
                                    {filteredMonths.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                </select>
                                <select
                                    value={scheduledYear}
                                    onChange={e => setScheduledYear(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-2 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white cursor-pointer"
                                    required
                                >
                                    <option value="">YYYY</option>
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-755 mb-2 flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Time *
                            </label>
                            <input
                                type="time"
                                value={scheduledTime}
                                onChange={e => setScheduledTime(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-755 mb-2 flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Duration *
                            </label>
                            <input
                                type="number"
                                value={duration}
                                onChange={e => setDuration(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                min={10}
                                step={5}
                                max={300}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-primary hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Scheduling...' : 'Schedule Live Class'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateLiveClass;
