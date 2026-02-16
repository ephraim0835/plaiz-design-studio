import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import InstallPrompt from './components/InstallPrompt'
import ThemeManager from './components/ThemeManager'
import './styles/index.css'

// Public Pages
import Landing from './pages/Landing'
import Portfolio from './pages/Portfolio'
import Login from './pages/Login'
import Register from './pages/Register'
import TermsAndConditions from './pages/TermsAndConditions'
import PrivacyPolicy from './pages/PrivacyPolicy'
import CookiePolicy from './pages/CookiePolicy'
import RequestPasswordReset from './pages/RequestPasswordReset'
import UpdatePassword from './pages/UpdatePassword'

// Dashboard Components
import AdminDashboard from './pages/dashboard/AdminDashboard'
import AdminUsers from './pages/dashboard/AdminUsers'
import WorkerDashboard from './pages/dashboard/WorkerDashboard'
import ClientDashboard from './pages/dashboard/ClientDashboard'
import ProjectsTab from './pages/dashboard/ProjectsTab'
import MessagesTab from './pages/dashboard/MessagesTab'
import GalleryTab from './pages/dashboard/GalleryTab'
import SettingsTab from './pages/dashboard/SettingsTab'
import PaymentsTab from './pages/dashboard/PaymentsTab'
import ProjectDashboard from './pages/ProjectDashboard'

// Mobile Redesign Components (Creative v2)
import HomeV2 from './pages/dashboard/mobile/HomeV2'
import ServicesV2 from './pages/dashboard/mobile/ServicesV2'
import ServiceDetailV2 from './pages/dashboard/mobile/ServiceDetailV2'
import PortfolioV2 from './pages/dashboard/mobile/PortfolioV2'
import BookingWizard from './pages/dashboard/mobile/BookingWizard'
import ProjectCreation from './components/project/ProjectCreation'
import ProfileV2 from './pages/dashboard/mobile/ProfileV2'
import PrivacySettingsV2 from './pages/dashboard/mobile/PrivacySettingsV2'
import SupportV2 from './pages/dashboard/mobile/SupportV2'

// Helper component for dynamic dashboard redirection
const DashboardHome = ({ target = '' }) => {
  const { role, isLoading, user, profileError } = useAuth()
  const [showTimeout, setShowTimeout] = React.useState(false)

  // Emergency timeout: if we have a user but no role after 5 seconds, show error
  React.useEffect(() => {
    if (user && !role && !isLoading && !profileError) {
      const timer = setTimeout(() => {
        console.warn('[DashboardHome] Role timeout - cannot determine user role')
        setShowTimeout(true)
      }, 15000)
      return () => clearTimeout(timer)
    }
  }, [user, role, isLoading, profileError])

  // Show error if profile failed to load OR timeout reached
  if ((profileError || showTimeout) && user) {
    const errorMessage = profileError
      ? `Error: ${profileError}`
      : "Connection Timeout: The server is taking too long to respond. Please check your internet connection."

    return (
      <div className="flex flex-col items-center justify-center h-screen w-full ambient-bg-prof px-6">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Profile Error</h3>
        <p className="text-gray-400 mb-6 text-center max-w-md">{errorMessage}</p>
        <div className="flex gap-4">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-plaiz-blue text-white rounded-xl font-bold hover:bg-blue-600 transition-colors"
          >
            Refresh Page
          </button>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-6 py-3 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  if (isLoading || (user && !role)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full ambient-bg-prof">
        <div className="w-10 h-10 border-4 border-white/20 border-t-plaiz-blue rounded-full animate-spin mb-6" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Syncing Workspace...</p>
      </div>
    )
  }

  if (!user || !role) {
    return <Navigate to="/login" replace />
  }

  const isSpecialist = ['graphic_designer', 'web_designer', 'worker', 'designer', 'developer', 'print_specialist', 'video_editor'].includes(role)
  const basePath = role === 'admin' ? '/admin' : isSpecialist ? '/worker' : '/client'
  const finalPath = target ? `${basePath}/${target}` : basePath

  return <Navigate to={finalPath} replace />
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="app-container" style={{ position: 'relative', minHeight: '100vh' }}>
            {/* Global Backgrounds */}
            <div className="atmospheric-bg" />
            <div className="grid-overlay" />

            <InstallPrompt />
            <ThemeManager />

            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route path="/terms" element={<TermsAndConditions />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/cookies" element={<CookiePolicy />} />

              <Route path="/forgot-password" element={<RequestPasswordReset />} />
              <Route path="/update-password" element={<UpdatePassword />} />

              {/* Protected Dashboard Entry */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardHome />
                </ProtectedRoute>
              } />

              {/* Admin Routes - Explicit Definition (No Wildcard) */}
              <Route path="/admin" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/projects" element={
                <ProtectedRoute requiredRole="admin">
                  <ProjectsTab />
                </ProtectedRoute>
              } />
              <Route path="/admin/messages" element={
                <ProtectedRoute requiredRole="admin">
                  <MessagesTab />
                </ProtectedRoute>
              } />
              <Route path="/admin/gallery" element={
                <ProtectedRoute requiredRole="admin">
                  <GalleryTab />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminUsers />
                </ProtectedRoute>
              } />
              <Route path="/admin/settings" element={
                <ProtectedRoute requiredRole="admin">
                  <SettingsTab />
                </ProtectedRoute>
              } />
              <Route path="/admin/privacy" element={
                <ProtectedRoute requiredRole="admin">
                  <PrivacySettingsV2 />
                </ProtectedRoute>
              } />
              <Route path="/admin/support" element={
                <ProtectedRoute requiredRole="admin">
                  <SupportV2 />
                </ProtectedRoute>
              } />

              {/* Worker Routes - Explicit Definition (No Wildcard) */}
              <Route path="/worker" element={
                <ProtectedRoute requiredRole="worker">
                  <WorkerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/worker/projects" element={
                <ProtectedRoute requiredRole="worker">
                  <ProjectsTab />
                </ProtectedRoute>
              } />
              <Route path="/worker/messages" element={
                <ProtectedRoute requiredRole="worker">
                  <MessagesTab />
                </ProtectedRoute>
              } />
              <Route path="/worker/gallery" element={
                <ProtectedRoute requiredRole="worker">
                  <GalleryTab />
                </ProtectedRoute>
              } />
              <Route path="/worker/settings" element={
                <ProtectedRoute requiredRole="worker">
                  <SettingsTab />
                </ProtectedRoute>
              } />
              <Route path="/worker/privacy" element={
                <ProtectedRoute requiredRole="worker">
                  <PrivacySettingsV2 />
                </ProtectedRoute>
              } />
              <Route path="/worker/support" element={
                <ProtectedRoute requiredRole="worker">
                  <SupportV2 />
                </ProtectedRoute>
              } />

              {/* Client Creative v2 Routes */}
              <Route path="/client" element={
                <ProtectedRoute requiredRole="client">
                  <ClientDashboard />
                </ProtectedRoute>
              } />

              <Route path="/client/services" element={
                <ProtectedRoute requiredRole="client">
                  <ServicesV2 />
                </ProtectedRoute>
              } />

              <Route path="/client/privacy" element={
                <ProtectedRoute requiredRole="client">
                  <PrivacySettingsV2 />
                </ProtectedRoute>
              } />

              <Route path="/client/support" element={
                <ProtectedRoute requiredRole="client">
                  <SupportV2 />
                </ProtectedRoute>
              } />

              <Route path="/client/services/:serviceId" element={
                <ProtectedRoute requiredRole="client">
                  <ServiceDetailV2 />
                </ProtectedRoute>
              } />

              <Route path="/client/gallery" element={
                <ProtectedRoute requiredRole="client">
                  <PortfolioV2 />
                </ProtectedRoute>
              } />

              <Route path="/client/request" element={
                <ProtectedRoute requiredRole="client">
                  <ProjectCreation />
                </ProtectedRoute>
              } />

              <Route path="/client/projects" element={
                <ProtectedRoute requiredRole="client">
                  <ProjectsTab />
                </ProtectedRoute>
              } />

              <Route path="/client/messages" element={
                <ProtectedRoute requiredRole="client">
                  <MessagesTab />
                </ProtectedRoute>
              } />

              <Route path="/client/payments" element={
                <ProtectedRoute requiredRole="client">
                  <PaymentsTab />
                </ProtectedRoute>
              } />

              {/* Common Account Routes */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfileV2 />
                </ProtectedRoute>
              } />


              <Route path="/projects/:projectId" element={
                <ProtectedRoute>
                  <ProjectDashboard />
                </ProtectedRoute>
              } />

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
