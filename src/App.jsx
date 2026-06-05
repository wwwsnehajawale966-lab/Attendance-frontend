import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import EmployeeLayout from './layouts/EmployeeLayout';
import Login from './pages/auth/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import AddEmployee from './pages/admin/AddEmployee';
import ManageUsers from './pages/admin/ManageUsers';
import ManageAttendance from './pages/admin/ManageAttendance';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeHistory from './pages/employee/EmployeeHistory';
import Register from './pages/auth/Register';

function App() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="attendance" element={<ManageAttendance />} />
                    <Route path="users" element={<ManageUsers />} />
                    <Route path="add-employee" element={<AddEmployee />} />
                </Route>

                {/* Employee Routes */}
                <Route path="/employee" element={<EmployeeLayout />}>
                    <Route index element={<EmployeeDashboard />} />
                    <Route path="history" element={<EmployeeHistory />} />
                </Route>

                <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
