import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/auth'
import LoginPage from './pages/LoginPage'
import EmployeeDashboard from './pages/EmployeeDashboard'
import NominasDashboard from './pages/NominasDashboard'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  const { user, isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {user?.type === 'employee' && (
          <>
            <Route path="/employee" element={<EmployeeDashboard />} />
            <Route path="*" element={<Navigate to="/employee" replace />} />
          </>
        )}
        
        {user?.type === 'user' && user?.role === 'NOMINAS' && (
          <>
            <Route path="/nominas" element={<NominasDashboard />} />
            <Route path="*" element={<Navigate to="/nominas" replace />} />
          </>
        )}
        
        {user?.type === 'user' && user?.role === 'ADMIN' && (
          <>
            <Route path="/nominas" element={<NominasDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<Navigate to="/nominas" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  )
}

export default App
