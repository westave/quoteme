import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './context/authStore';
import { auth } from './services/api';

import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import ImporterDashboard from './pages/ImporterDashboard';
import ForwarderDashboard from './pages/ForwarderDashboard';
import CreateShipment from './pages/CreateShipment';
import ShipmentDetail from './pages/ShipmentDetail';

function ProtectedRoute({ children, role }: { children: JSX.Element; role?: string }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (role && user?.role !== role) {
    return <Navigate to="/" />;
  }

  return children;
}

function App() {
  const { isAuthenticated, setUser } = useAuthStore();

  useEffect(() => {
    // Load user data if authenticated
    if (isAuthenticated) {
      auth.getMe()
        .then((response) => {
          setUser(response.data.user);
        })
        .catch(() => {
          // Token is invalid
          useAuthStore.getState().logout();
        });
    }
  }, [isAuthenticated, setUser]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Importer routes */}
          <Route
            path="/importer/dashboard"
            element={
              <ProtectedRoute role="IMPORTER">
                <ImporterDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/importer/shipments/new"
            element={
              <ProtectedRoute role="IMPORTER">
                <CreateShipment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/importer/shipments/:id"
            element={
              <ProtectedRoute role="IMPORTER">
                <ShipmentDetail />
              </ProtectedRoute>
            }
          />

          {/* Forwarder routes */}
          <Route
            path="/forwarder/dashboard"
            element={
              <ProtectedRoute role="FORWARDER">
                <ForwarderDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/forwarder/shipments/:id"
            element={
              <ProtectedRoute role="FORWARDER">
                <ShipmentDetail />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                useAuthStore.getState().user?.role === 'IMPORTER' ? (
                  <Navigate to="/importer/dashboard" />
                ) : (
                  <Navigate to="/forwarder/dashboard" />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
