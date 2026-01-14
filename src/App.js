import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import FacePunch from "./components/FacePunch/FacePunch.client.jsx";

import Sidebar from "./components/Sidebar/Sidebar";

import { useAuth } from "./context/AuthProvider.client";

const App = () => {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/FacePunch" element={<FacePunch />} />

        {user && user.roleId !== 7 && (
          <Route
            path="/"
            element={
              <div style={{ display: "flex" }}>
                <Sidebar />
                <Dashboard />
              </div>
            }
          />
        )}

        {user && user.roleId !== 7 && (
          <Route path="/dashboard" element={<Dashboard />} />
        )}

        <Route
          path="*"
          element={
            user ? (
              user.roleId === 7 ? (
                <Navigate to="/FacePunch" replace />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
