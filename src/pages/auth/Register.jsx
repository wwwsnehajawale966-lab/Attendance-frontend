import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Phone, Sparkles, Building, ChevronRight, ShieldAlert, ArrowLeft } from 'lucide-react';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        department: '',
        phone: '',
        gender: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('https://attendance-backend-0jxv.onrender.com/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    department: formData.department,
                    phone: formData.phone,
                    gender: formData.gender,
                    role: 'employee' // default registration is employee
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            setIsSuccess(true);
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6 relative overflow-hidden font-sans">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-50 rounded-full blur-3xl opacity-60"></div>
                    <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-50 rounded-full blur-3xl opacity-60"></div>
                </div>

                <div className="w-full max-w-[480px] glass-card p-10 z-10 text-center animate-in zoom-in-95 duration-300">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-100 ring-4 ring-emerald-50/50">
                        <Sparkles size={32} className="animate-pulse" />
                    </div>
                    <h1 className="text-2xl font-black text-[#154c46] tracking-tight">Request Submitted!</h1>
                    <p className="text-slate-500 mt-3 text-sm font-medium leading-relaxed">
                        Your account registration request has been successfully sent to the Admin. 
                        Once approved, you will receive an Employee ID and will be able to log in.
                    </p>
                    
                    <div className="mt-8 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 text-left text-xs font-semibold text-slate-600 space-y-2">
                        <div className="flex justify-between border-b border-emerald-100/30 pb-2">
                            <span>Name:</span>
                            <span className="text-[#154c46]">{formData.name}</span>
                        </div>
                        <div className="flex justify-between border-b border-emerald-100/30 pb-2">
                            <span>Email:</span>
                            <span className="text-[#154c46]">{formData.email}</span>
                        </div>
                        <div className="flex justify-between pb-1">
                            <span>Status:</span>
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[9px] uppercase font-bold tracking-wider">Pending Approval</span>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/login')}
                        className="btn-primary w-full py-3.5 mt-8 shadow-teal-100/50 flex items-center justify-center gap-2 cursor-pointer border-0"
                    >
                        <ArrowLeft size={16} />
                        <span className="font-bold tracking-wide">Back to Login</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6 relative overflow-hidden font-sans">
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-teal-50 rounded-full blur-3xl opacity-60"></div>
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-50 rounded-full blur-3xl opacity-60"></div>
            </div>

            <div className="w-full max-w-[500px] glass-card p-10 z-10 my-8 transition-all duration-300">
                <div className="text-center mb-8">
                    <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-teal-500 transition-colors mb-4 no-underline">
                        <ArrowLeft size={14} />
                        Back to Login
                    </Link>
                    <h1 className="text-2xl font-bold text-[#154c46] tracking-tight">Request Account</h1>
                    <p className="text-slate-500 mt-2 text-sm font-medium">Fill in your details to register as an employee</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                        <ShieldAlert className="shrink-0" size={18} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Name */}
                        <div className="space-y-1 text-left">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={16} />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="John Doe"
                                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400 transition-all bg-slate-50/50 text-xs font-bold text-slate-700"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1 text-left">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={16} />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="john@company.com"
                                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400 transition-all bg-slate-50/50 text-xs font-bold text-slate-700"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Department */}
                        <div className="space-y-1 text-left">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Department</label>
                            <div className="relative group">
                                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={16} />
                                <select
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400 transition-all bg-slate-50/50 text-xs font-bold text-slate-700"
                                    required
                                >
                                    <option value="">Select Department</option>
                                    <option value="Engineering">Engineering</option>
                                    <option value="Design">Design</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="HR">HR</option>
                                    <option value="Sales">Sales</option>
                                    <option value="General">General</option>
                                </select>
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="space-y-1 text-left">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
                            <div className="relative group">
                                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={16} />
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+91 98765 43210"
                                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400 transition-all bg-slate-50/50 text-xs font-bold text-slate-700"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Gender */}
                    <div className="space-y-1 text-left">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Gender</label>
                        <div className="relative group">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={16} />
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400 transition-all bg-slate-50/50 text-xs font-bold text-slate-700"
                                required
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Password */}
                        <div className="space-y-1 text-left">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={16} />
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400 transition-all bg-slate-50/50 text-xs font-bold text-slate-700"
                                    required
                                />
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1 text-left">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Confirm Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={16} />
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400 transition-all bg-slate-50/50 text-xs font-bold text-slate-700"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full py-3.5 mt-6 shadow-teal-100/50 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer border-0 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span className="font-bold tracking-wide">SUBMIT REQUEST</span>
                                <ChevronRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <p className="text-slate-400 text-xs font-medium">
                        Already have an account?{' '}
                        <Link to="/login" className="text-teal-500 hover:text-teal-600 font-bold hover:underline transition-all">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
