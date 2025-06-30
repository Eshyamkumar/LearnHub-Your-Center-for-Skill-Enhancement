import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CourseProvider } from './contexts/CourseContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import CreateCourse from './pages/CreateCourse';
import EditCourse from './pages/EditCourse';
import MyCourses from './pages/MyCourses';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';
import PrivateRoute from './components/auth/PrivateRoute';
import AdminRoute from './components/auth/AdminRoute';
import InstructorRoute from './components/auth/InstructorRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <CourseProvider>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:id" element={<CourseDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
              
              <Route path="/profile" element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } />
              
              <Route path="/my-courses" element={
                <PrivateRoute>
                  <MyCourses />
                </PrivateRoute>
              } />
              
              {/* Instructor Routes */}
              <Route path="/create-course" element={
                <InstructorRoute>
                  <CreateCourse />
                </InstructorRoute>
              } />
              
              <Route path="/edit-course/:id" element={
                <InstructorRoute>
                  <EditCourse />
                </InstructorRoute>
              } />
              
              {/* Admin Routes */}
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />
              
              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </CourseProvider>
    </AuthProvider>
  );
}

export default App; 