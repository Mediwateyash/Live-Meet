import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MaterialUpload = ({ onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [chapterName, setChapterName] = useState('');
    const [startPage, setStartPage] = useState('');
    const [endPage, setEndPage] = useState('');
    const [mcqCount, setMcqCount] = useState(10);
    const [status, setStatus] = useState('idle'); // idle, uploading, processing, success, error
    const [message, setMessage] = useState('');
    const [pollingMaterialId, setPollingMaterialId] = useState(null);
    
    const navigate = useNavigate();

    useEffect(() => {
        let interval;
        let timeout;

        if (pollingMaterialId && status === 'processing') {
            interval = setInterval(async () => {
                try {
                    const token = localStorage.getItem('token');
                    const res = await axios.get(`http://localhost:5000/api/material/${pollingMaterialId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    
                    if (res.data.status === 'completed') {
                        setStatus('success');
                        setMessage('MCQs generated successfully! Redirecting...');
                        setPollingMaterialId(null);
                        clearInterval(interval);
                        clearTimeout(timeout);
                        if (onUploadSuccess) onUploadSuccess();
                        
                        setTimeout(() => {
                            navigate(`/teacher/mcqs/${pollingMaterialId}`);
                        }, 1500);
                        
                    } else if (res.data.status === 'failed') {
                        setStatus('error');
                        setMessage(res.data.error || 'MCQ Generation failed during processing.');
                        setPollingMaterialId(null);
                        clearInterval(interval);
                        clearTimeout(timeout);
                        if (onUploadSuccess) onUploadSuccess();
                    }
                } catch (error) {
                    console.error("Polling error", error);
                }
            }, 2000); // Check every 2 seconds
            
            // Timeout after 3 minutes (180s)
            timeout = setTimeout(() => {
                clearInterval(interval);
                setStatus('error');
                setMessage('Processing timed out. Please check the materials list later.');
                setPollingMaterialId(null);
                if (onUploadSuccess) onUploadSuccess();
            }, 180000);
        }
        
        return () => {
            if (interval) clearInterval(interval);
            if (timeout) clearTimeout(timeout);
        };
    }, [pollingMaterialId, status, navigate, onUploadSuccess]);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus('idle');
            setMessage('');
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        
        // Client-side validation
        if (startPage && startPage < 1) {
            setStatus('error');
            setMessage('Start page must be 1 or greater.');
            return;
        }
        if (startPage && endPage && parseInt(startPage) > parseInt(endPage)) {
            setStatus('error');
            setMessage('End page must be greater than or equal to start page.');
            return;
        }

        if (mcqCount < 1 || mcqCount > 15) {
            setStatus('error');
            setMessage('MCQ count must be between 1 and 15.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('mcqCount', mcqCount);
        if (chapterName) formData.append('chapterName', chapterName);
        if (startPage) formData.append('startPage', startPage);
        if (endPage) formData.append('endPage', endPage);

        try {
            setStatus('uploading');
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:5000/api/material/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });

            setStatus('processing');
            setPollingMaterialId(res.data.material._id);
            setFile(null); // Clear file to prevent duplicate uploads
            
            // Immediately notify parent so the table shows the pending item
            if (onUploadSuccess) onUploadSuccess();
            
        } catch (error) {
            setStatus('error');
            setMessage(error.response?.data?.message || 'Upload failed');
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Upload & Generate MCQs
            </h3>
            
            <div className="mt-2 text-sm text-gray-500 mb-4">
                Supported formats: PDF, DOCX, PPTX, TXT. Max size: 10MB.
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <input
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                        className="flex-1 w-full text-sm text-gray-500
                            file:mr-4 file:py-2.5 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-indigo-50 file:text-primary
                            hover:file:bg-indigo-100"
                    />
                    
                    <div className="flex-1">
                        <input
                            type="text"
                            value={chapterName}
                            onChange={(e) => setChapterName(e.target.value)}
                            className="w-full p-2.5 h-full border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-sm shadow-sm"
                            placeholder="Optional Module/Chapter Name (e.g. Agile)"
                        />
                    </div>
                </div>
                
                <div className="flex flex-col mb-2">
                    <label className="flex justify-between text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                        <span>Number of Questions</span>
                        <span className="text-primary font-bold">{mcqCount}</span>
                    </label>
                    <input 
                        type="range" 
                        min="1" 
                        max="15" 
                        value={mcqCount} 
                        onChange={(e) => setMcqCount(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>1</span>
                        <span>15</span>
                    </div>
                </div>
                
                <div className="flex items-end gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
                    <div className="flex-1 w-full sm:w-auto">
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Start Page (Optional)</label>
                        <input
                            type="number"
                            min="1"
                            value={startPage}
                            onChange={(e) => setStartPage(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-sm shadow-sm"
                            placeholder="e.g. 10"
                        />
                    </div>
                    <div className="flex-1 w-full sm:w-auto">
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">End Page (Optional)</label>
                        <input
                            type="number"
                            min="1"
                            value={endPage}
                            onChange={(e) => setEndPage(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-sm shadow-sm"
                            placeholder="e.g. 25"
                        />
                    </div>
                    <button
                        onClick={handleUpload}
                        disabled={!file || status === 'uploading' || status === 'processing'}
                        className="w-full sm:w-auto shrink-0 px-6 py-2.5 bg-primary text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                        {(status === 'uploading' || status === 'processing') && <Loader className="w-4 h-4 animate-spin" />}
                        Generate MCQs
                    </button>
                </div>
            </div>

            {status === 'uploading' && (
                <div className="mt-5 p-3 bg-blue-50 text-blue-700 rounded-lg flex items-center gap-3 text-sm font-medium border border-blue-100">
                    <Loader className="w-5 h-5 animate-spin" />
                    Uploading document securely...
                </div>
            )}
            
            {status === 'processing' && (
                <div className="mt-5 p-3 bg-indigo-50 text-indigo-700 rounded-lg flex items-center gap-3 text-sm font-medium border border-indigo-100">
                    <Loader className="w-5 h-5 animate-spin text-primary" />
                    <div className="flex flex-col">
                        <span>
                            {chapterName ? `Analyzing ${chapterName} ` : "Analyzing document "}
                            {startPage && endPage ? `(Pages ${startPage} - ${endPage})...` : "..."}
                        </span>
                        <span className="text-xs font-normal opacity-80 mt-0.5">Please wait, AI is generating high-quality MCQs.</span>
                    </div>
                </div>
            )}

            {status === 'success' && (
                <div className="mt-5 p-3 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 text-sm font-medium border border-green-100">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    {message}
                </div>
            )}
            
            {status === 'error' && (
                <div className="mt-5 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm font-medium border border-red-100">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    {message}
                </div>
            )}
        </div>
    );
};

export default MaterialUpload;
