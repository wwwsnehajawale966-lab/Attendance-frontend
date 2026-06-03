import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Shield, ArrowLeft, Phone } from 'lucide-react';

const AddEmployee = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'employee',
        department: '',
        phone: '',
        gender: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const { name, email, password, role, department, phone, gender } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const token = localStorage.getItem('token');

        try {
            const response = await fetch('http://localhost:5000/api/admin/add-employee', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to add employee');
            }

            setSuccess(true);
            setTimeout(() => {
                navigate('/admin/users'); // Or wherever the user list is
            }, 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-100"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Add New Employee</h1>
                    <p className="text-slate-500 text-sm font-medium">Create a new account for local personnel.</p>
                </div>
            </div>

            <div className="glass-card p-10 border-slate-100">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Error & Success Messages */}
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm rounded-xl font-medium flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                            Employee added successfully!
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                <input
                                    name="name"
                                    value={name}
                                    onChange={onChange}
                                    type="text"
                                    placeholder="John Doe"
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-slate-50/50 text-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                <input
                                    name="email"
                                    value={email}
                                    onChange={onChange}
                                    type="email"
                                    placeholder="john@company.com"
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-slate-50/50 text-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
                            <div className="relative group">
                                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                <input
                                    name="phone"
                                    value={phone}
                                    onChange={onChange}
                                    type="text"
                                    placeholder="e.g. +91 9876543210"
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-slate-50/50 text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Gender</label>
                            <div className="relative group">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                <select
                                    name="gender"
                                    value={gender}
                                    onChange={onChange}
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-slate-50/50 text-sm font-medium text-slate-700 appearance-none"
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Department</label>
                            <div className="relative group">
                                <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                <select
                                    name="department"
                                    value={department}
                                    onChange={onChange}
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-slate-50/50 text-sm font-medium text-slate-700 appearance-none"
                                >
                                    <option value="">Select Department</option>
                                    <option value="IT">IT Department</option>
                                    <option value="HR">Human Resources</option>
                                    <option value="Finance">Finance</option>
                                    <option value="Marketing">Marketing</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                <input
                                    name="password"
                                    value={password}
                                    onChange={onChange}
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-slate-50/50 text-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Role</label>
                            <div className="relative group">
                                <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                <select
                                    name="role"
                                    value={role}
                                    onChange={onChange}
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-slate-50/50 text-sm font-medium text-slate-700 appearance-none"
                                >
                                    <option value="employee">Employee</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={isLoading || success}
                            className="btn-primary w-full py-3.5 shadow-indigo-200/50 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                            ) : (
                                <>
                                    <span className="font-bold tracking-wide uppercase">Add Employee</span>
                                    <UserPlus size={18} />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEmployee;
