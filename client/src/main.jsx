import React from 'react'
import ReactDOM from 'react-dom/client'
import { createPortal } from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { ErrorBoundary } from './components/shared/ErrorBoundary.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
        {createPortal(
        <Toaster
          position="top-right"
          containerStyle={{ top: '76px', zIndex: 999999 }}
          toastOptions={{
            duration: 3500,
            style: {
              background: '#fff',
              color: '#1E1B4B',
              border: '1px solid #EDE9FE',
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 4px 24px rgba(109,40,217,0.12)',
            },
            success: { iconTheme: { primary: '#7C3AED', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
          }}
        />,
        document.body
      )}
    </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)

// Register Service Worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Zenius AI Service Worker registered on scope:', registration.scope);
      })
      .catch((error) => {
        console.error('Zenius AI Service Worker registration failed:', error);
      });
  });
}

