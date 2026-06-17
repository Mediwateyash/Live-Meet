import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import useAuthStore from './store/authStore.js'
import useUIStore from './store/uiStore.js'
import { authAPI } from './api/auth.js'
import LoginModal from './components/ui/LoginModal.jsx'

// Public pages
import Home          from './pages/public/Home.jsx'
import Browse        from './pages/public/Browse.jsx'
import CourseDetail  from './pages/public/CourseDetail.jsx'

// Auth pages
import Login          from './pages/auth/Login.jsx'
import Register       from './pages/auth/Register.jsx'
import ForgotPassword from './pages/auth/ForgotPassword.jsx'
import ResetPassword  from './pages/auth/ResetPassword.jsx'

// Student pages
import StudentDashboard   from './pages/student/Dashboard.jsx'
import CourseFeaturePage  from './pages/student/CourseFeaturePage.jsx'
import MyLearning         from './pages/student/MyLearning.jsx'
import CoursePlayer       from './pages/student/CoursePlayer.jsx'
import Certificate        from './pages/student/Certificate.jsx'
import BecomeInstructor   from './pages/student/BecomeInstructor.jsx'
import Profile            from './pages/student/Profile.jsx'
import LiveRoom           from './pages/student/LiveRoom.jsx'
import StudentLiveLectures from './pages/student/LiveLectures.jsx'

// Shared pages
import Notifications      from './pages/Notifications.jsx'

// Instructor pages
import InstructorDashboard  from './pages/instructor/Dashboard.jsx'
import InstructorCourses    from './pages/instructor/Courses.jsx'
import CourseBuilder        from './pages/instructor/CourseBuilder.jsx'
import InstructorLiveLectures from './pages/instructor/LiveLectures.jsx'

// Admin pages
import AdminDashboard        from './pages/admin/Dashboard.jsx'
import AdminRequests         from './pages/admin/InstructorRequests.jsx'
import AdminUsers            from './pages/admin/Users.jsx'
import AdminCourses          from './pages/admin/Courses.jsx'
import AdminInstructors      from './pages/admin/Instructors.jsx'
import AdminInstructorManage from './pages/admin/InstructorManage.jsx'
import AdminLiveLectures     from './pages/admin/LiveLectures.jsx'

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

function RequireRole({ children, role }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (role === 'admin'      && user.role !== 'admin')      return <Navigate to="/dashboard" replace />
  if (role === 'instructor' && (user.role !== 'instructor' || !user.isApprovedInstructor)) {
    return <Navigate to="/become-instructor" replace />
  }
  return children
}

function LiveLecturesRedirect() {
  const { user } = useAuthStore()
  if (user?.role === 'admin') return <Navigate to="/admin/live-lectures" replace />
  if (user?.role === 'instructor' && user?.isApprovedInstructor) return <Navigate to="/instructor/live-lectures" replace />
  if (user?.role === 'student') return <Navigate to="/student/live-lectures" replace />
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  const { setUser, logout, isAuthenticated } = useAuthStore()
  const { darkMode, initDarkMode, authModal, authModalTab, authModalHint, closeAuthModal } = useUIStore()

  useEffect(() => {
    initDarkMode(darkMode)
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      authAPI.me()
        .then(({ data }) => setUser(data.data))
        .catch(() => logout())
    }
  }, [])

  return (
    <>
    <LoginModal
      isOpen={authModal}
      onClose={closeAuthModal}
      defaultTab={authModalTab}
      hint={authModalHint}
    />
    <Routes>
      {/* Public */}
      <Route path="/"             element={<Home />} />
      <Route path="/browse"       element={<Browse />} />
      <Route path="/course/:slug" element={<CourseDetail />} />

      {/* Auth */}
      <Route path="/login"              element={<Login />} />
      <Route path="/register"           element={<Register />} />
      <Route path="/forgot-password"    element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Student (any authenticated) */}
      <Route path="/dashboard"    element={<RequireAuth><StudentDashboard /></RequireAuth>} />
      <Route path="/my-learning"  element={<RequireAuth><MyLearning /></RequireAuth>} />
      <Route path="/course/:slug/learn" element={<RequireAuth><CoursePlayer /></RequireAuth>} />
      <Route path="/certificate/:courseId" element={<RequireAuth><Certificate /></RequireAuth>} />
      <Route path="/become-instructor" element={<RequireAuth><BecomeInstructor /></RequireAuth>} />
      <Route path="/profile"      element={<RequireAuth><Profile /></RequireAuth>} />
      <Route path="/course/:slug/notes"    element={<RequireAuth><CourseFeaturePage feature="notes" /></RequireAuth>} />
      <Route path="/course/:slug/tests"    element={<RequireAuth><CourseFeaturePage feature="tests" /></RequireAuth>} />
      <Route path="/course/:slug/mcq"      element={<RequireAuth><CourseFeaturePage feature="mcq" /></RequireAuth>} />
      <Route path="/course/:slug/progress" element={<RequireAuth><CourseFeaturePage feature="progress" /></RequireAuth>} />
      <Route path="/course/:slug/live"     element={<RequireAuth><CourseFeaturePage feature="live" /></RequireAuth>} />
      <Route path="/live/:id"             element={<RequireAuth><LiveRoom /></RequireAuth>} />
      <Route path="/student/live-lectures" element={<RequireAuth><StudentLiveLectures /></RequireAuth>} />
      <Route path="/live-lectures"        element={<RequireAuth><LiveLecturesRedirect /></RequireAuth>} />
      <Route path="/notifications"        element={<RequireAuth><Notifications /></RequireAuth>} />

      {/* Instructor */}
      <Route path="/instructor/dashboard" element={<RequireAuth><RequireRole role="instructor"><InstructorDashboard /></RequireRole></RequireAuth>} />
      <Route path="/instructor/courses"   element={<RequireAuth><RequireRole role="instructor"><InstructorCourses /></RequireRole></RequireAuth>} />
      <Route path="/instructor/courses/new"   element={<RequireAuth><RequireRole role="instructor"><CourseBuilder /></RequireRole></RequireAuth>} />
      <Route path="/instructor/courses/:id/edit"    element={<RequireAuth><RequireRole role="instructor"><CourseBuilder /></RequireRole></RequireAuth>} />
      <Route path="/instructor/live-lectures"       element={<RequireAuth><RequireRole role="instructor"><InstructorLiveLectures /></RequireRole></RequireAuth>} />

      {/* Admin */}
      <Route path="/admin/dashboard"            element={<RequireAuth><RequireRole role="admin"><AdminDashboard /></RequireRole></RequireAuth>} />
      <Route path="/admin/instructor-requests"  element={<RequireAuth><RequireRole role="admin"><AdminRequests /></RequireRole></RequireAuth>} />
      <Route path="/admin/users"                element={<RequireAuth><RequireRole role="admin"><AdminUsers /></RequireRole></RequireAuth>} />
      <Route path="/admin/courses"              element={<RequireAuth><RequireRole role="admin"><AdminCourses /></RequireRole></RequireAuth>} />
      <Route path="/admin/instructors"          element={<RequireAuth><RequireRole role="admin"><AdminInstructors /></RequireRole></RequireAuth>} />
      <Route path="/admin/instructors/:instructorId"  element={<RequireAuth><RequireRole role="admin"><AdminInstructorManage /></RequireRole></RequireAuth>} />
      <Route path="/admin/instructors/:instructorId/courses/new" element={<RequireAuth><RequireRole role="admin"><CourseBuilder /></RequireRole></RequireAuth>} />
      <Route path="/admin/instructors/:instructorId/courses/:id/edit" element={<RequireAuth><RequireRole role="admin"><CourseBuilder /></RequireRole></RequireAuth>} />
      <Route path="/admin/live-lectures"            element={<RequireAuth><RequireRole role="admin"><AdminLiveLectures /></RequireRole></RequireAuth>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}
