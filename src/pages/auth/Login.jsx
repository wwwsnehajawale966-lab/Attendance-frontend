import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, ShieldCheck, X } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Reset Password Modal States
    const [isResetModalOpen, setResetModalOpen] = useState(false);
    const [resetForm, setResetForm] = useState({
        email: '',
        employeeId: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [resetError, setResetError] = useState('');
    const [resetSuccess, setResetSuccess] = useState('');
    const [resetLoading, setResetLoading] = useState(false);

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        setResetLoading(true);
        setResetError('');
        setResetSuccess('');

        if (resetForm.newPassword !== resetForm.confirmPassword) {
            setResetError('Passwords do not match');
            setResetLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: resetForm.email,
                    employeeId: resetForm.employeeId,
                    newPassword: resetForm.newPassword
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to reset password');
            }

            setResetSuccess('Password reset successful! You can now log in with your new password.');
            setResetForm({ email: '', employeeId: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setResetError(err.message || 'Failed to reset password. Please check your credentials.');
        } finally {
            setResetLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Save to localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect based on role
            if (data.user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/employee');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6 relative overflow-hidden font-sans">
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-60"></div>
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-60"></div>
            </div>

            <div className="w-full max-w-[440px] glass-card p-10 z-10 transition-all duration-300">
                <div className="text-center mb-10">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-indigo-100 ring-4 ring-indigo-50">
                        <ShieldCheck size={28} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Portal Access</h1>
                    <p className="text-slate-500 mt-2 text-sm font-medium">Verify your credentials to continue</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                        <div className="relative group">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
                                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-slate-50/50 text-sm"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-slate-50/50 text-sm"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-1">
                        <label className="flex items-center group cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all" />
                            <span className="ml-2 text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors">Keep me signed in</span>
                        </label>
                        <button
                            type="button"
                            onClick={() => {
                                setResetModalOpen(true);
                                setResetError('');
                                setResetSuccess('');
                            }}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline transition-all bg-transparent border-0 cursor-pointer focus:outline-none"
                        >
                            Reset Password
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full py-3.5 shadow-indigo-200/50 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span className="font-bold tracking-wide">AUTHENTICATE</span>
                                <LogIn size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-10 pt-8 border-t border-slate-100 text-center">
                    <p className="text-slate-400 text-xs font-medium">
                        Authorized Personnel Only
                    </p>
                </div>
            </div>

            {/* Reset Password Modal */}
            {isResetModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300 font-sans">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden transform transition-all duration-300 animate-in zoom-in-95">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-bold">
                                    <ShieldCheck size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Reset Password</h3>
                                    <p className="text-slate-500 text-[10px] font-bold">Verify identity to set a new password.</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => {
                                    setResetModalOpen(false);
                                    setResetError('');
                                    setResetSuccess('');
                                }}
                                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all border-0 bg-transparent cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleResetSubmit} className="p-6 space-y-4">
                            {resetError && (
                                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl font-bold flex items-center gap-2 animate-in slide-in-from-top duration-300">
                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                    {resetError}
                                </div>
                            )}

                            {resetSuccess && (
                                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-xl font-bold flex items-center gap-2 animate-in slide-in-from-top duration-300">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                    {resetSuccess}
                                </div>
                            )}

                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Address</label>
                                    <input
                                        type="email"
                                        value={resetForm.email}
                                        onChange={(e) => setResetForm({ ...resetForm, email: e.target.value })}
                                        placeholder="name@company.com"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-slate-50/50 text-xs font-bold text-slate-700 placeholder:text-slate-300"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Employee ID</label>
                                    <input
                                        type="text"
                                        value={resetForm.employeeId}
                                        onChange={(e) => setResetForm({ ...resetForm, employeeId: e.target.value })}
                                        placeholder="EMP-2026-001"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-slate-50/50 text-xs font-bold text-slate-700 placeholder:text-slate-300"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">New Password</label>
                                    <input
                                        type="password"
                                        value={resetForm.newPassword}
                                        onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                                        placeholder="••••••••"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-slate-50/50 text-xs font-bold text-slate-700 placeholder:text-slate-300"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Confirm Password</label>
                                    <input
                                        type="password"
                                        value={resetForm.confirmPassword}
                                        onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
                                        placeholder="••••••••"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-slate-50/50 text-xs font-bold text-slate-700 placeholder:text-slate-300"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-50">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setResetModalOpen(false);
                                        setResetError('');
                                        setResetSuccess('');
                                    }}
                                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs transition-all uppercase tracking-wider border-solid bg-transparent cursor-pointer"
                                >
                                    Close
                                </button>
                                <button
                                    type="submit"
                                    disabled={resetLoading}
                                    className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 font-bold text-xs transition-all flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-75 cursor-pointer border-0"
                                >
                                    {resetLoading ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        'Reset Password'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
