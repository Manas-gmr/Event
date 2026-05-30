import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import HostDashboard from "./pages/HostDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import VendorDashboard from "./pages/VendorDashboard";
import EventDetail from "./pages/EventDetail";
import TicketValidation from "./pages/TicketValidation";
import NotFoundPage from "./pages/NotFoundPage";
import ErrorBoundary from "./components/ErrorBoundary";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard based on user role
    const roleMap = { HOST: '/host', CLIENT: '/client', VENDOR: '/vendor' };
    return <Navigate to={roleMap[user?.role] || '/'} replace />;
  }

  return children;
};

const App = () => (
  <ErrorBoundary>
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}>
          <Routes>
            <Route path="/"        element={<LandingPage />} />
            <Route path="/login"   element={<LoginPage />} />
            <Route path="/host"    element={<ProtectedRoute allowedRoles={['HOST']}><HostDashboard /></ProtectedRoute>} />
            <Route path="/client"  element={<ProtectedRoute allowedRoles={['CLIENT']}><ClientDashboard /></ProtectedRoute>} />
            <Route path="/vendor"  element={<ProtectedRoute allowedRoles={['VENDOR']}><VendorDashboard /></ProtectedRoute>} />
            <Route path="/event/:id" element={<EventDetail />} />
            <Route path="/validate-ticket" element={<TicketValidation />} />
            <Route path="*"        element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  </ErrorBoundary>
);

export default App;
