import React, { useEffect, Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import useAuthStore from './store/authStore.js'
import useUIStore from './store/uiStore.js'
import { authAPI } from './api/auth.js'
import LoginModal from './components/ui/LoginModal.jsx'

// Helper component for loading state
function PageLoader() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold tracking-wide text-[#7C3AED]" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Loading Zenius AI...
        </p>
      </div>
    </div>
  )
}

// Lazy loaded page components
// Public pages
const Home = lazy(() => import('./pages/public/Home.jsx'))
const Browse = lazy(() => import('./pages/public/Browse.jsx'))
const CourseDetail = lazy(() => import('./pages/public/CourseDetail.jsx'))
const NotFound = lazy(() => import('./pages/public/NotFound.jsx'))

// Legal pages
const PrivacyPolicy        = lazy(() => import('./pages/legal/PrivacyPolicy.jsx'))
const Terms                = lazy(() => import('./pages/legal/Terms.jsx'))
const CookiePolicy         = lazy(() => import('./pages/legal/CookiePolicy.jsx'))
const RefundPolicy         = lazy(() => import('./pages/legal/RefundPolicy.jsx'))
const Disclaimer           = lazy(() => import('./pages/legal/Disclaimer.jsx'))
const AcceptableUse        = lazy(() => import('./pages/legal/AcceptableUse.jsx'))
const CommunityGuidelines  = lazy(() => import('./pages/legal/CommunityGuidelines.jsx'))
const Grievance            = lazy(() => import('./pages/legal/Grievance.jsx'))
const CopyrightPage        = lazy(() => import('./pages/legal/Copyright.jsx'))

// Auth pages
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword.jsx'))
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword.jsx'))

// Student pages
const StudentDashboard = lazy(() => import('./pages/student/Dashboard.jsx'))
const CourseFeaturePage = lazy(() => import('./pages/student/CourseFeaturePage.jsx'))
const MyLearning = lazy(() => import('./pages/student/MyLearning.jsx'))
const CoursePlayer = lazy(() => import('./pages/student/CoursePlayer.jsx'))
const Certificate = lazy(() => import('./pages/student/Certificate.jsx'))
const BecomeInstructor = lazy(() => import('./pages/student/BecomeInstructor.jsx'))
const Profile = lazy(() => import('./pages/student/Profile.jsx'))
const LiveRoom = lazy(() => import('./pages/student/LiveRoom.jsx'))
const StudentLiveLectures = lazy(() => import('./pages/student/LiveLectures.jsx'))
const Contact = lazy(() => import('./pages/student/Contact.jsx'))

// Quiz pages
const TakeQuiz = lazy(() => import('./pages/quizzes/TakeQuiz.jsx'))
const QuizResult = lazy(() => import('./pages/quizzes/QuizResult.jsx'))
const CreateQuiz = lazy(() => import('./pages/quizzes/CreateQuiz.jsx'))
const ManageQuizzes = lazy(() => import('./pages/quizzes/ManageQuizzes.jsx'))
const ManageMCQs = lazy(() => import('./pages/quizzes/ManageMCQs.jsx'))
const TeacherResults = lazy(() => import('./pages/quizzes/TeacherResults.jsx'))

// Shared pages
const Notifications = lazy(() => import('./pages/Notifications.jsx'))

// Instructor pages
const InstructorDashboard = lazy(() => import('./pages/instructor/Dashboard.jsx'))
const InstructorCourses = lazy(() => import('./pages/instructor/Courses.jsx'))
const CourseBuilder = lazy(() => import('./pages/instructor/CourseBuilder.jsx'))
const InstructorLiveLectures = lazy(() => import('./pages/instructor/LiveLectures.jsx'))
const UploadNotes = lazy(() => import('./pages/instructor/UploadNotes.jsx'))

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard.jsx'))
const AdminRequests = lazy(() => import('./pages/admin/InstructorRequests.jsx'))
const AdminUsers = lazy(() => import('./pages/admin/Users.jsx'))
const AdminCourses = lazy(() => import('./pages/admin/Courses.jsx'))
const AdminInstructors = lazy(() => import('./pages/admin/Instructors.jsx'))
const AdminInstructorManage = lazy(() => import('./pages/admin/InstructorManage.jsx'))
const AdminLiveLectures = lazy(() => import('./pages/admin/LiveLectures.jsx'))
const AdminTestimonials = lazy(() => import('./pages/admin/Testimonials.jsx'))
const AdminSupport = lazy(() => import('./pages/admin/Support.jsx'))


function AuthRedirect({ tab }) {
  const { openAuthModal } = useUIStore()
  useEffect(() => { openAuthModal(tab) }, [tab, openAuthModal])
  return <Navigate to="/" replace />
}

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuthStore()
  const { openAuthModal } = useUIStore()
  
  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal('login', 'Please log in to access this page')
    }
  }, [isAuthenticated, openAuthModal])

  if (!isAuthenticated) return <Navigate to="/" replace />
  return children
}

function RequireRole({ children, role }) {
  const { user } = useAuthStore()
  const { openAuthModal } = useUIStore()

  useEffect(() => {
    if (!user) {
      openAuthModal('login', 'Please log in to access this page')
    }
  }, [user, openAuthModal])

  if (!user) return <Navigate to="/" replace />
  if (role === 'admin'      && user.role !== 'admin')      return <Navigate to="/dashboard" replace />
  // Admins can access instructor pages too
  if (role === 'instructor' && user.role !== 'admin' && (user.role !== 'instructor' || !user.isApprovedInstructor)) {
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
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/"             element={<Home />} />
        <Route path="/browse"       element={<Browse />} />
        <Route path="/course/:slug" element={<CourseDetail />} />

        {/* Legal — canonical paths */}
        <Route path="/legal/privacy"       element={<PrivacyPolicy />} />
        <Route path="/legal/terms"         element={<Terms />} />
        <Route path="/legal/cookies"       element={<CookiePolicy />} />
        <Route path="/legal/refunds"       element={<RefundPolicy />} />
        <Route path="/legal/disclaimer"    element={<Disclaimer />} />
        <Route path="/legal/acceptable-use" element={<AcceptableUse />} />
        <Route path="/legal/community"     element={<CommunityGuidelines />} />
        <Route path="/legal/grievance"     element={<Grievance />} />
        <Route path="/legal/copyright"     element={<CopyrightPage />} />

        {/* Legal — clean/friendly URL aliases */}
        <Route path="/privacy-policy"       element={<PrivacyPolicy />} />
        <Route path="/terms-and-conditions" element={<Terms />} />
        <Route path="/cookie-policy"        element={<CookiePolicy />} />
        <Route path="/refund-policy"        element={<RefundPolicy />} />
        <Route path="/disclaimer"           element={<Disclaimer />} />
        <Route path="/acceptable-use"       element={<AcceptableUse />} />
        <Route path="/community-guidelines" element={<CommunityGuidelines />} />
        <Route path="/grievance"            element={<Grievance />} />
        <Route path="/copyright"            element={<CopyrightPage />} />

        {/* Auth */}
        <Route path="/login"              element={<AuthRedirect tab="login" />} />
        <Route path="/register"           element={<AuthRedirect tab="register" />} />
        <Route path="/forgot-password"    element={<ForgotPassword />} />
        <Route path="/reset-password"    element={<ResetPassword />} />

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
        <Route path="/contact"              element={<RequireAuth><Contact /></RequireAuth>} />


        <Route path="/quizzes/:quizId/take"   element={<RequireAuth><TakeQuiz /></RequireAuth>} />
        <Route path="/student/results/:resultId" element={<RequireAuth><QuizResult /></RequireAuth>} />

        {/* Instructor */}
        <Route path="/instructor/dashboard" element={<RequireAuth><RequireRole role="instructor"><InstructorDashboard /></RequireRole></RequireAuth>} />
        <Route path="/instructor/courses"   element={<RequireAuth><RequireRole role="instructor"><InstructorCourses /></RequireRole></RequireAuth>} />
        <Route path="/instructor/courses/new"   element={<RequireAuth><RequireRole role="instructor"><CourseBuilder /></RequireRole></RequireAuth>} />
        <Route path="/instructor/courses/:id/edit"    element={<RequireAuth><RequireRole role="instructor"><CourseBuilder /></RequireRole></RequireAuth>} />
        <Route path="/instructor/courses/:id/notes"   element={<RequireAuth><RequireRole role="instructor"><UploadNotes /></RequireRole></RequireAuth>} />
        <Route path="/instructor/live-lectures"       element={<RequireAuth><RequireRole role="instructor"><InstructorLiveLectures /></RequireRole></RequireAuth>} />
        <Route path="/instructor/quizzes"             element={<RequireAuth><RequireRole role="instructor"><ManageQuizzes /></RequireRole></RequireAuth>} />
        <Route path="/instructor/quizzes/create"      element={<RequireAuth><RequireRole role="instructor"><CreateQuiz /></RequireRole></RequireAuth>} />
        <Route path="/instructor/quizzes/:quizId/mcqs" element={<RequireAuth><RequireRole role="instructor"><ManageMCQs /></RequireRole></RequireAuth>} />
        <Route path="/instructor/quizzes/results"     element={<RequireAuth><RequireRole role="instructor"><TeacherResults /></RequireRole></RequireAuth>} />

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
        <Route path="/admin/testimonials"             element={<RequireAuth><RequireRole role="admin"><AdminTestimonials /></RequireRole></RequireAuth>} />
        <Route path="/admin/support"                  element={<RequireAuth><RequireRole role="admin"><AdminSupport /></RequireRole></RequireAuth>} />

        {/* Fallback (404 Page) */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
    </>
  )
}
