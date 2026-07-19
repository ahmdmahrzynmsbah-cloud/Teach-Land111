/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import CourseDetails from './components/CourseDetails';
import ExamPage from './components/ExamPage';
import PageTransition from './components/PageTransition';
import { PlatformSettingsProvider } from './context/PlatformSettingsContext';

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
        <Route path="/course/:id" element={<PageTransition><CourseDetails /></PageTransition>} />
        <Route path="/exam/:examId" element={<PageTransition><ExamPage /></PageTransition>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <PlatformSettingsProvider>
      <Router>
        <AnimatedRoutes />
      </Router>
    </PlatformSettingsProvider>
  );
}
