import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Login from './pages/Login';
import Register from './pages/Register';
import PrivateRoute from './utils/PrivateRoute';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminPanel from './pages/AdminPanel';
import StudentDashboard from './pages/StudentDashboard';
import TeacherLiveClasses from './pages/TeacherLiveClasses';
import CreateLiveClass from './pages/CreateLiveClass';
import LiveClassRoom from './pages/LiveClassRoom';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route path="/teacher" element={
                <PrivateRoute allowedRoles={['teacher', 'admin']}>
                  <TeacherDashboard />
                </PrivateRoute>
              } />
              
              <Route path="/admin" element={
                <PrivateRoute allowedRoles={['admin']}>
                  <AdminPanel />
                </PrivateRoute>
              } />
              
              <Route path="/student" element={
                <PrivateRoute allowedRoles={['student', 'admin']}>
                  <StudentDashboard />
                </PrivateRoute>
              } />
              
              <Route path="/teacher/live-classes" element={
                <PrivateRoute allowedRoles={['teacher', 'admin']}>
                  <TeacherLiveClasses />
                </PrivateRoute>
              } />

              <Route path="/teacher/live-classes/create" element={
                <PrivateRoute allowedRoles={['teacher', 'admin']}>
                  <CreateLiveClass />
                </PrivateRoute>
              } />

              <Route path="/live/:classId" element={
                <PrivateRoute allowedRoles={['teacher', 'student', 'admin']}>
                  <LiveClassRoom />
                </PrivateRoute>
              } />
              
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
