import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { BookOpen, LogOut, User as UserIcon, Video } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true);
    };

    const confirmLogout = () => {
        logout();
        setShowLogoutConfirm(false);
        navigate('/login');
    };

    return (
        <>
            <nav className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex-shrink-0 flex items-center">
                            <Link to="/" className="flex items-center text-primary font-bold text-xl gap-2">
                                <BookOpen className="w-6 h-6" />
                                <span>Zenius AI</span>
                            </Link>
                        </div>
                        <div className="flex items-center space-x-4">
                            {user ? (
                                <>
                                    <span className="text-gray-700 font-medium flex items-center gap-1.5 hidden sm:flex">
                                        <UserIcon className="w-4 h-4" />
                                        {user.name} ({user.role})
                                    </span>
                                    {(user.role === 'teacher' || user.role === 'admin') && (
                                        <Link to="/teacher" className="text-gray-600 hover:text-primary font-medium">Teacher</Link>
                                    )}
                                    {(user.role === 'teacher' || user.role === 'admin') && (
                                        <Link to="/teacher/live-classes" className="text-gray-600 hover:text-primary font-medium flex items-center gap-1"><Video className="w-4 h-4" />Live</Link>
                                    )}
                                    {(user.role === 'student' || user.role === 'admin') && (
                                        <Link to="/student" className="text-gray-600 hover:text-primary font-medium">Student</Link>
                                    )}
                                    {user.role === 'admin' && (
                                        <Link to="/admin" className="text-indigo-600 hover:text-indigo-800 font-bold">Admin Panel</Link>
                                    )}
                                    <button
                                        onClick={handleLogoutClick}
                                        className="text-gray-600 hover:text-red-500 flex items-center gap-1 font-medium transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span className="hidden sm:inline">Logout</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className="text-gray-600 hover:text-primary font-medium">Login</Link>
                                    <Link to="/register" className="bg-primary hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors border border-transparent">
                                        Register
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
            
            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop with blur */}
                    <div 
                        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ease-out animate-[fadeIn_0.2s_ease-out]" 
                        onClick={() => setShowLogoutConfirm(false)}
                    ></div>
                    
                    {/* Modal Dialog Content */}
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-sm w-full p-6 relative z-10 transform scale-100 transition-all duration-300 ease-out animate-[scaleIn_0.2s_ease-out]">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-rose-50 text-rose-600 rounded-full flex-shrink-0">
                                <LogOut className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Logout</h3>
                                <p className="text-sm text-gray-500">Are you sure you want to log out?</p>
                            </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 mt-6">
                            <button 
                                onClick={() => setShowLogoutConfirm(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmLogout}
                                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition-colors shadow-sm shadow-rose-200"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;
