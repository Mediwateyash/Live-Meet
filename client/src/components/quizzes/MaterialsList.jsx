import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { RefreshCw, FileText, CheckCircle, Clock, AlertTriangle, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const FakeProgress = () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress(prev => {
                const remaining = 95 - prev;
                return prev + Math.max(0.5, remaining * 0.1);
            });
        }, 500);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
            <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${progress}%` }} 
            />
        </div>
    );
};

const MaterialsList = ({ refreshTrigger }) => {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMaterials = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/material', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMaterials(res.data);
        } catch (error) {
            console.error("Failed to fetch materials", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMaterials();
        // Setup polling every 10 seconds to check for queue updates
        const interval = setInterval(fetchMaterials, 10000);
        return () => clearInterval(interval);
    }, [refreshTrigger]);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this material and all its MCQs?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/material/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMaterials(materials.filter(m => m._id !== id));
        } catch (error) {
            console.error("Failed to delete material", error);
            alert("Failed to delete material.");
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'processing': return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
            case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
            case 'failed': return <AlertTriangle className="w-5 h-5 text-red-500" />;
            default: return null;
        }
    };

    if (loading && materials.length === 0) return <div className="p-4 rounded-xl bg-white shadow-sm border border-gray-100 flex justify-center items-center h-40"><RefreshCw className="w-6 h-6 animate-spin text-gray-400"/></div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-lg font-semibold text-gray-800">Your Study Materials</h3>
                <button onClick={fetchMaterials} className="text-sm text-primary hover:text-indigo-700 flex items-center gap-1 font-medium">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>
            
            {materials.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No materials uploaded yet.</div>
            ) : (
                <ul className="divide-y divide-gray-100">
                    {materials.map((m) => (
                        <li key={m._id} className="p-4 sm:px-6 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="bg-indigo-50 p-3 rounded-lg text-primary">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-md font-semibold text-gray-900 line-clamp-1" title={m.chapterName || m.fileName}>{m.chapterName || m.fileName}</h4>
                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                        <span className="uppercase font-medium bg-gray-200 px-2 py-0.5 rounded text-gray-700">{m.fileType}</span>
                                        {m.startPage && m.endPage && (
                                            <span className="font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">Pages: {m.startPage}–{m.endPage}</span>
                                        )}
                                        <span>• {new Date(m.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    {m.chapterName && <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><FileText className="w-3 h-3"/> {m.fileName}</div>}
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(m.status)}
                                        <span className="text-sm text-gray-600 capitalize font-medium hidden sm:inline">{m.status}</span>
                                    </div>
                                    {m.status === 'processing' && <FakeProgress />}
                                </div>
                                {m.status === 'completed' && (
                                    <Link 
                                        to={`/teacher/mcqs/${m._id}`} 
                                        className="ml-4 px-3 py-1.5 text-sm bg-white border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 hover:text-primary font-medium transition-colors"
                                    >
                                        View MCQs
                                    </Link>
                                )}
                                <button 
                                    onClick={() => handleDelete(m._id)} 
                                    className="ml-2 p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                    title="Delete Material"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default MaterialsList;
