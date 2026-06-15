import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

const getBaseUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000';
    }
    return '';
};

const baseUrl = getBaseUrl();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await axios.get(`${baseUrl}/api/auth/profile`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setUser({ ...res.data, token });
                } catch (error) {
                    console.error("Auth check failed", error);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };
        fetchUser();
    }, []);

    const login = async (email, password) => {
        const res = await axios.post(`${baseUrl}/api/auth/login`, { email, password });
        setUser(res.data);
        localStorage.setItem('token', res.data.token);
        return res;
    };

    const register = async (name, email, password, role, classVal, batch) => {
        const res = await axios.post(`${baseUrl}/api/auth/register`, { 
            name, 
            email, 
            password, 
            role,
            class: classVal,
            batch
        });
        if (res.data.isApproved) {
            setUser(res.data);
            localStorage.setItem('token', res.data.token);
        }
        return res;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
