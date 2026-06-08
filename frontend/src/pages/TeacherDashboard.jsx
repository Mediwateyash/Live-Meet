import React from 'react';
import { Users, Video, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const TeacherDashboard = () => {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Teacher Dashboard</h1>
                <Link to="/teacher/live-classes/create" className="bg-primary hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2">
                    <PlusCircle className="w-5 h-5" />
                    Schedule Live Class
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-48">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 text-primary rounded-lg">
                            <Video className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-950">Live Classes</h3>
                            <p className="text-sm text-gray-500">Create, manage, and start live classes for students.</p>
                        </div>
                    </div>
                    <div>
                        <Link to="/teacher/live-classes" className="text-primary hover:text-indigo-700 font-medium inline-flex items-center gap-1">
                            Go to Live Classes &rarr;
                        </Link>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-48">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                            <Users className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-950">User Management</h3>
                            <p className="text-sm text-gray-500">View and manage users registered in the system.</p>
                        </div>
                    </div>
                    <div>
                        <span className="text-gray-400 text-sm italic">Access via admin panel or navbar</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;
