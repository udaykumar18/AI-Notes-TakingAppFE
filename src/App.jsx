import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./Components/Auth/Login";
import Register from "./Components/Auth/Register";
import Dashboard from "./Components/Dashboard/Dashboard";
import ProtectedRoute from "./Components/Auth/ProtectedRoute";

import { ThemeProvider } from "./context/ThemeContext";

import { ToastContainer } from "react-toastify";

export default function App() {
  const token = localStorage.getItem("token");

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <Router>
        <Routes>
          <Route
            path="/login"
            element={token ? <Navigate to="/dashboard" replace /> : <Login />}
          />
          <Route
            path="/register"
            element={
              token ? <Navigate to="/dashboard" replace /> : <Register />
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <ThemeProvider>
                  <Dashboard />
                </ThemeProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={<Navigate to={token ? "/dashboard" : "/login"} replace />}
          />
        </Routes>
      </Router>
    </>
  );
}
