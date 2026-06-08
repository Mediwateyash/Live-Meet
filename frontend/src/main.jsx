import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import axios from 'axios';

// Axios Request Interceptor to translate local URLs to production API URL dynamically
axios.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith('http://localhost:5000')) {
    // If running in production (which serves React and API monolithically), rewrite to relative URL
    // Otherwise fallback to environment variable or localhost:5000 in dev
    const isDev = window.location.hostname === 'localhost';
    const prodApiUrl = import.meta.env.VITE_API_URL || ''; // Can be set if API is hosted separately
    config.url = config.url.replace('http://localhost:5000', isDev ? 'http://localhost:5000' : prodApiUrl);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

