import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const { login, user } = useContext(AuthContext);
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
            await login(email, password);
            // navigation handled by useEffect
        } catch (error) {
            setErrorMsg(error.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <div>
                    <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
                        Sign in to Zenius AI
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Or <Link to="/register" className="font-medium text-primary hover:text-indigo-500">register for a new account</Link>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {errorMsg && <div className="p-3 bg-red-100 text-red-700 rounded text-sm text-center font-medium">{errorMsg}</div>}
                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label htmlFor="email-address" className="sr-only">Email address</label>
                            <input id="email-address" name="email" type="email" required className="appearance-none rounded relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input id="password" name="password" type="password" required className="appearance-none rounded relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <button type="submit" className="group relative w-full flex justify-center py-3 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">
                            Sign in
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
