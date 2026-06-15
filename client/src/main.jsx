import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        containerStyle={{ top: '76px' }}
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
      />
    </BrowserRouter>
  </React.StrictMode>
)
