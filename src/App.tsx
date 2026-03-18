/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import PublicEventPage from './pages/PublicEventPage';
import StudentDashboard from './pages/StudentDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import HeadCoordinatorDashboard from './pages/HeadCoordinatorDashboard';
import EventCoordinatorDashboard from './pages/EventCoordinatorDashboard';
import EvaluatorDashboard from './pages/EvaluatorDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/event/:id" element={<PublicEventPage />} />

        {/* Dashboard Routes */}
        <Route path="/dashboard/student" element={<StudentDashboard />} />
        <Route path="/dashboard/superadmin" element={<SuperAdminDashboard />} />
        <Route path="/dashboard/headcoordinator" element={<HeadCoordinatorDashboard />} />
        <Route path="/dashboard/eventcoordinator" element={<EventCoordinatorDashboard />} />
        <Route path="/dashboard/evaluator" element={<EvaluatorDashboard />} />
        <Route path="/dashboard/volunteer" element={<VolunteerDashboard />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
