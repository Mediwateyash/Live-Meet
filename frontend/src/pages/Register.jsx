import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [errorMsg, setErrorMsg] = useState('');
    
    const { register, user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (user && user.isApproved !== false) {
            if (user.role === 'admin') navigate('/admin');
            else if (user.role === 'teacher') navigate('/teacher');
            else navigate('/student');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await register(name, email, password, role);
            // If it's a teacher, the backend might return them as unapproved
            // but the context might have already set the user.
            // Let's check the role from the form since we know it.
            if (role === 'teacher') {
                setErrorMsg('Your approval request has been sent to admin. You will be informed once confirmed.');
                // Logout the user if they were automatically logged in by the context
                // But the context update might trigger the useEffect navigation first.
            }
        } catch (error) {
            setErrorMsg(error.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <div>
                    <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
                        Create an account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Already have an account? <Link to="/login" className="font-medium text-primary hover:text-indigo-500">Sign in instead</Link>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {errorMsg && <div className="p-3 bg-red-100 text-red-700 rounded text-sm text-center font-medium">{errorMsg}</div>}
                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label className="sr-only">Name</label>
                            <input type="text" required className="appearance-none rounded relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div>
                            <label className="sr-only">Email address</label>
                            <input type="email" required className="appearance-none rounded relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div>
                            <label className="sr-only">Password</label>
                            <input type="password" required className="appearance-none rounded relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 block w-full py-3 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <button type="submit" className="group relative w-full flex justify-center py-3 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">
                            Register Now
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
