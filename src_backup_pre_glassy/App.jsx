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

// Helper component for dynamic dashboard redirection
const DashboardHome = ({ target = '' }) => {
  const { role, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full ambient-bg-prof">
        <div className="w-10 h-10 border-4 border-white/20 border-t-plaiz-blue rounded-full animate-spin mb-6" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Syncing Workspace...</p>
      </div>
    )
  }

  if (!role) {
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

              {/* Protected Dashboard Entry */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardHome />
                </ProtectedRoute>
              } />

              {/* Admin Routes */}
              <Route path="/admin/*" element={
                <ProtectedRoute requiredRole="admin">
                  <Routes>
                    <Route index element={<AdminDashboard />} />
                    <Route path="projects" element={<ProjectsTab />} />
                    <Route path="messages" element={<MessagesTab />} />
                    <Route path="gallery" element={<GalleryTab />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="settings" element={<SettingsTab />} />
                  </Routes>
                </ProtectedRoute>
              } />

              {/* Worker Routes */}
              <Route path="/worker/*" element={
                <ProtectedRoute requiredRole="worker">
                  <Routes>
                    <Route index element={<WorkerDashboard />} />
                    <Route path="projects" element={<ProjectsTab />} />
                    <Route path="messages" element={<MessagesTab />} />
                    <Route path="gallery" element={<GalleryTab />} />
                    <Route path="settings" element={<SettingsTab />} />
                  </Routes>
                </ProtectedRoute>
              } />

              {/* Client Creative v2 Routes */}
              <Route path="/client" element={
                <ProtectedRoute requiredRole="client">
                  <HomeV2 />
                </ProtectedRoute>
              } />

              <Route path="/client/services" element={
                <ProtectedRoute requiredRole="client">
                  <ServicesV2 />
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
