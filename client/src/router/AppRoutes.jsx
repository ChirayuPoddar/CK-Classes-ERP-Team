import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { PublicLayout } from '@/layouts/PublicLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { ProtectedRoute } from '@/router/ProtectedRoute'
import { RoleRoute } from '@/router/RoleRoute'

// Pages imports
import Home from '@/pages/public/Home'
import Login from '@/pages/auth/Login'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'
import Activate from '@/pages/auth/Activate'
import Unauthorized from '@/pages/public/Unauthorized'
import Forbidden from '@/pages/public/Forbidden'
import DashboardRedirect from '@/pages/DashboardRedirect'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import Students from '@/pages/admin/Students'
import Teachers from '@/pages/admin/Teachers'
import Subjects from '@/pages/admin/Subjects'
import TeacherDashboard from '@/pages/teacher/TeacherDashboard'
import StudentDashboard from '@/pages/student/StudentDashboard'
import Timetable from '@/pages/admin/Timetable'
import Attendance from '@/pages/admin/Attendance'
import AttendanceHistory from '@/pages/admin/AttendanceHistory'
import AttendanceAnalytics from '@/pages/admin/AttendanceAnalytics'
import FeeManagement from '@/pages/admin/FeeManagement'
import Homework from '@/pages/admin/Homework'
import Exams from '@/pages/admin/Exams'
import Announcements from '@/pages/admin/Announcements'
import Resources from '@/pages/admin/Resources'
import Users from '@/pages/admin/Users'

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
      </Route>
 
      {/* Auth Pages */}
      <Route element={<AuthLayout />}>
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/reset-password/:token" element={<ResetPassword />} />
        <Route path="/auth/activate" element={<Activate />} />
      </Route>
 
      {/* Access Error fallbacks */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/forbidden" element={<Forbidden />} />
 
      {/* Portal Redirection hub */}
      <Route path="/dashboard" element={<DashboardRedirect />} />
 
      {/* Admin Panel */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['admin']}>
              <DashboardLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="teachers" element={<Teachers />} />
        <Route path="subjects" element={<Subjects />} />
        <Route path="timetable" element={<Timetable />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="attendance/history" element={<AttendanceHistory />} />
        <Route path="attendance/analytics" element={<AttendanceAnalytics />} />
        <Route path="homework" element={<Homework />} />
        <Route path="exams" element={<Exams />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="resources" element={<Resources />} />
        <Route path="users" element={<Users />} />
        <Route path="fees" element={<FeeManagement />} />
        <Route path="reports" element={<AdminDashboard />} />
        <Route path="settings" element={<AdminDashboard />} />
      </Route>
 
      {/* Teacher Panel */}
      <Route 
        path="/teacher" 
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['teacher']}>
              <DashboardLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<TeacherDashboard />} />
        <Route path="timetable" element={<Timetable />} />
        <Route path="attendance" element={<TeacherDashboard />} />
        <Route path="homework" element={<Homework />} />
        <Route path="exams" element={<Exams />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="resources" element={<Resources />} />
        <Route path="settings" element={<TeacherDashboard />} />
      </Route>
 
      {/* Student & Parent Panel */}
      <Route 
        path="/student" 
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['student', 'parent']}>
              <DashboardLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="timetable" element={<Timetable />} />
        <Route path="attendance" element={<StudentDashboard />} />
        <Route path="homework" element={<Homework />} />
        <Route path="exams" element={<Exams />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="resources" element={<Resources />} />
        <Route path="fees" element={<StudentDashboard />} />
        <Route path="settings" element={<StudentDashboard />} />
      </Route>

      {/* Wildcard Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
