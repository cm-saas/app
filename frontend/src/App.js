import "@/App.css";
import "./dashboard.css";
import "./enterprise.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import { ToastProvider } from "./components/ToastProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import DemoRequest from "./pages/DemoRequest";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardEnterprise from "./pages/DashboardEnterprise";
import Orders from "./pages/Orders";
import Capacity from "./pages/Capacity";
import Risks from "./pages/Risks";
import Parts from "./pages/Parts";
import Production from "./pages/Production";

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AuthProvider>
          <DataProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/demo" element={<DemoRequest />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes - Nested under /app */}
              <Route path="/app/*" element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }>
                <Route index element={<DashboardEnterprise />} />
                <Route path="orders" element={<Orders />} />
                <Route path="capacity" element={<Capacity />} />
                <Route path="parts" element={<Parts />} />
                <Route path="risks" element={<Risks />} />
              </Route>
              
              {/* Legacy redirect - /dashboard → /app */}
              <Route path="/dashboard" element={<Navigate to="/app" replace />} />
              
              {/* Catch all - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </DataProvider>
        </AuthProvider>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
