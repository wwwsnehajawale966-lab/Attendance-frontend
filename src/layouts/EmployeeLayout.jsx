import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, History, LogOut, Phone, User, Sparkles, Calendar, X, Bell } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const EmployeeLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [showProfileModal, setShowProfileModal] = React.useState(false);
    const [profileData, setProfileData] = React.useState(null);
    const [isLoadingProfile, setIsLoadingProfile] = React.useState(false);

    // Self Profile Edit & Delete States
    const [isEditingSelf, setIsEditingSelf] = React.useState(false);
    const [selfEditData, setSelfEditData] = React.useState({ name: '', email: '', phone: '', gender: '' });
    const [selfUpdateError, setSelfUpdateError] = React.useState('');
    const [isSelfUpdating, setIsSelfUpdating] = React.useState(false);
    const [isSelfDeleting, setIsSelfDeleting] = React.useState(false);

    // Notifications States
    const [notifications, setNotifications] = React.useState([]);
    const [showNotificationsDropdown, setShowNotificationsDropdown] = React.useState(false);
    const [unreadNotificationsCount, setUnreadNotificationsCount] = React.useState(0);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

    // Simple Protect Route Logic
    React.useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        if (queryParams.get('qr') === 'true') {
            localStorage.setItem('pending_qr_checkin', 'true');
        }

        if (!token || user.role !== 'employee') {
            navigate('/login');
        }
    }, [token, user, navigate]);

    // Fetch Notifications on Mount & Poll
    React.useEffect(() => {
        if (token && user.role === 'employee') {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 15000); // 15 seconds polling
            return () => clearInterval(interval);
        }
    }, [token]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const fetchProfile = async () => {
        setIsLoadingProfile(true);
        try {
            const res = await fetch('http://localhost:5000/api/auth/me', {
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                const data = await res.json();
                setProfileData(data);
                setSelfEditData({
                    name: data.name || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    gender: data.gender || ''
                });
                setIsEditingSelf(false);
                setSelfUpdateError('');
                setShowProfileModal(true);
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setIsLoadingProfile(false);
        }
    };

    const fetchNotifications = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/notifications', {
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                const unread = data.filter(n => !n.is_read).length;
                setUnreadNotificationsCount(unread);
            }
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    const handleNotificationRead = async (id) => {
        try {
            const res = await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                fetchNotifications();
            }
        } catch (err) {
            console.error('Error reading notification:', err);
        }
    };

    const handleMarkAllNotificationsRead = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/notifications/read-all', {
                method: 'PUT',
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                fetchNotifications();
            }
        } catch (err) {
            console.error('Error marking all notifications read:', err);
        }
    };

    const handleSelfUpdateSubmit = async (e) => {
        e.preventDefault();
        setIsSelfUpdating(true);
        setSelfUpdateError('');
        try {
            const res = await fetch('http://localhost:5000/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(selfEditData)
            });
            const data = await res.json();
            if (res.ok) {
                const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                localUser.name = data.name;
                localStorage.setItem('user', JSON.stringify(localUser));

                setProfileData(data);
                setIsEditingSelf(false);
            } else {
                setSelfUpdateError(data.message || 'Failed to update profile');
            }
        } catch (err) {
            console.error('Error updating profile:', err);
            setSelfUpdateError('Failed to update profile.');
        } finally {
            setIsSelfUpdating(false);
        }
    };

    const handleSelfDelete = async () => {
        if (!window.confirm('WARNING: Are you sure you want to permanently delete your account? This action cannot be undone.')) {
            return;
        }
        setIsSelfDeleting(true);
        try {
            const res = await fetch('http://localhost:5000/api/auth/profile', {
                method: 'DELETE',
                headers: {
                    'x-auth-token': token
                }
            });
            if (res.ok) {
                setShowProfileModal(false);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to delete profile');
            }
        } catch (err) {
            console.error('Error deleting profile:', err);
            alert('Failed to delete profile.');
        } finally {
            setIsSelfDeleting(false);
        }
    };

    const navItems = [
        { title: 'Home', icon: Home, path: '/employee' },
        { title: 'History', icon: History, path: '/employee/history' },
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
            {/* Top Mobile/Header */}
            <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-100">
                        E
                    </div>
                    <span className="ml-3 font-bold text-slate-800 tracking-tight">Attendance<span className="text-indigo-600">Pro</span></span>
                </div>
                <div className="flex items-center space-x-4">
                    {/* Bell Icon & Notifications */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all relative border-0 bg-transparent cursor-pointer"
                        >
                            <Bell size={20} />
                            {unreadNotificationsCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-white">
                                    {unreadNotificationsCount}
                                </span>
                            )}
                        </button>

                        {showNotificationsDropdown && (
                            <div className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-100 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-3 duration-300 font-sans">
                                <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Notifications</span>
                                    {unreadNotificationsCount > 0 && (
                                        <button 
                                            onClick={handleMarkAllNotificationsRead}
                                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-transparent border-0 cursor-pointer"
                                        >
                                            Mark all as read
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                                    {notifications.length > 0 ? (
                                        notifications.map((n) => (
                                            <div 
                                                key={n.id} 
                                                onClick={() => !n.is_read && handleNotificationRead(n.id)}
                                                className={`p-4 text-left cursor-pointer transition-colors ${!n.is_read ? 'bg-indigo-50/40 hover:bg-indigo-50/70' : 'hover:bg-slate-50'}`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={`text-xs font-bold ${!n.is_read ? 'text-slate-900' : 'text-slate-600'}`}>{n.title}</p>
                                                    {!n.is_read && <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full shrink-0 mt-1"></span>}
                                                </div>
                                                <p className="text-[11px] font-medium text-slate-500 mt-1 leading-relaxed text-left">{n.message}</p>
                                                <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mt-2 block text-left">
                                                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-8 text-center text-slate-400 text-xs font-bold">
                                            No notifications yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div 
                        onClick={fetchProfile}
                        className="flex items-center space-x-3 cursor-pointer group hover:opacity-85 transition-opacity border-l pl-3 border-slate-200"
                    >
                        <span className="text-sm font-semibold text-slate-600 group-hover:text-indigo-600 transition-colors hidden sm:block">{user.name}</span>
                        <div className="w-8 h-8 bg-slate-200 rounded-full overflow-hidden border border-slate-100">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name || 'User'}`} alt="Avatar" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 pb-20 md:pb-0 md:pl-64">
                {/* Desktop Sidebar */}
                <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 fixed inset-y-0 left-0 pt-16">
                    <nav className="flex-1 p-4 space-y-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center px-4 py-3 rounded-xl transition-all duration-200",
                                    location.pathname === item.path
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                <item.icon size={20} className="mr-3" />
                                <span className="font-semibold text-sm">{item.title}</span>
                            </Link>
                        ))}
                    </nav>
                    <div className="p-4 border-t border-slate-100">
                        <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-3 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200"
                        >
                            <LogOut size={20} className="mr-3" />
                            <span className="font-semibold text-sm">Logout</span>
                        </button>
                    </div>
                </aside>

                <div className="p-6 md:p-10 max-w-5xl mx-auto">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden bg-white border-t border-slate-200 fixed bottom-0 inset-x-0 h-16 flex items-center justify-around px-6 z-50">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                            "flex flex-col items-center justify-center space-y-1 transition-colors",
                            location.pathname === item.path ? "text-indigo-600" : "text-slate-400"
                        )}
                    >
                        <item.icon size={22} />
                        <span className="text-[10px] uppercase font-bold tracking-wider">{item.title}</span>
                    </Link>
                ))}
                <button
                    onClick={handleLogout}
                    className="flex flex-col items-center justify-center space-y-1 text-slate-400"
                >
                    <LogOut size={22} />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Logout</span>
                </button>
            </nav>

            {/* Premium Profile Modal */}
            {showProfileModal && profileData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
                    <div className="bg-white/95 rounded-3xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 relative font-sans my-8">
                        {/* Elegant Pattern Banner */}
                        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 p-8 text-white relative flex flex-col items-center">
                            <div className="absolute top-4 right-4">
                                <button 
                                    onClick={() => setShowProfileModal(false)}
                                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-200 focus:outline-none border-0 cursor-pointer"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            
                            {/* Avatar Preview */}
                            <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-xl shadow-emerald-900/20 mb-4 overflow-hidden relative">
                                <img 
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${isEditingSelf ? selfEditData.name : profileData.name}`} 
                                    alt="avatar" 
                                    className="w-full h-full object-cover rounded-xl" 
                                />
                            </div>
                            
                            {isEditingSelf ? (
                                <input
                                    type="text"
                                    required
                                    value={selfEditData.name}
                                    onChange={(e) => setSelfEditData({ ...selfEditData, name: e.target.value })}
                                    className="text-slate-800 text-sm font-bold text-center px-4 py-1 rounded-lg border border-slate-200 outline-none focus:border-indigo-500 bg-white"
                                />
                            ) : (
                                <h3 className="text-xl font-black tracking-tight leading-none text-center">{profileData.name}</h3>
                            )}
                            <p className="text-emerald-100 text-xs font-bold tracking-wider uppercase mt-2">{profileData.employee_id || 'N/A'}</p>
                        </div>

                        {/* Profile Info */}
                        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {/* Core Info Fields */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Access Role</span>
                                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">{profileData.role}</span>
                                </div>
                                <div className="space-y-1 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Department</span>
                                    <span className="text-xs font-black text-slate-800 tracking-wider">{profileData.department || 'General'}</span>
                                </div>
                            </div>

                            {/* Contact Details & Edit Form */}
                            <form onSubmit={handleSelfUpdateSubmit} className="space-y-6">
                                {selfUpdateError && (
                                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl font-bold flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                        {selfUpdateError}
                                    </div>
                                )}

                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    {/* Email */}
                                    <div className="flex items-center gap-3.5 p-3.5 hover:bg-slate-50 rounded-2xl transition-all duration-300 border border-transparent hover:border-slate-100">
                                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                            <Sparkles size={16} />
                                        </div>
                                        <div className="text-left flex-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">Email Address</span>
                                            {isEditingSelf ? (
                                                <input
                                                    type="email"
                                                    required
                                                    value={selfEditData.email}
                                                    onChange={(e) => setSelfEditData({ ...selfEditData, email: e.target.value })}
                                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-xs font-semibold bg-white"
                                                />
                                            ) : (
                                                <span className="text-xs font-bold text-slate-700">{profileData.email}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Phone Number */}
                                    <div className="flex items-center gap-3.5 p-3.5 hover:bg-slate-50 rounded-2xl transition-all duration-300 border border-transparent hover:border-slate-100">
                                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                            <Phone size={16} />
                                        </div>
                                        <div className="text-left flex-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">Phone Number</span>
                                            {isEditingSelf ? (
                                                <input
                                                    type="text"
                                                    value={selfEditData.phone}
                                                    onChange={(e) => setSelfEditData({ ...selfEditData, phone: e.target.value })}
                                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-xs font-semibold bg-white"
                                                    placeholder="e.g. +91 9876543210"
                                                />
                                            ) : (
                                                <span className="text-xs font-bold text-slate-700">{profileData.phone || 'N/A'}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Gender */}
                                    <div className="flex items-center gap-3.5 p-3.5 hover:bg-slate-50 rounded-2xl transition-all duration-300 border border-transparent hover:border-slate-100">
                                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                            <User size={16} />
                                        </div>
                                        <div className="text-left flex-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">Gender</span>
                                            {isEditingSelf ? (
                                                <select
                                                    value={selfEditData.gender}
                                                    onChange={(e) => setSelfEditData({ ...selfEditData, gender: e.target.value })}
                                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-xs font-semibold bg-white text-slate-700"
                                                >
                                                    <option value="">Select Gender</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            ) : (
                                                <span className="text-xs font-bold text-slate-700">{profileData.gender || 'N/A'}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Joined Date */}
                                    <div className="flex items-center gap-3.5 p-3.5 hover:bg-slate-50 rounded-2xl transition-all duration-300 border border-transparent hover:border-slate-100">
                                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                            <Calendar size={16} />
                                        </div>
                                        <div className="text-left">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">Joined Date</span>
                                            <span className="text-xs font-bold text-slate-700">
                                                {profileData.created_at ? new Date(profileData.created_at).toLocaleDateString(undefined, { 
                                                    year: 'numeric', 
                                                    month: 'long', 
                                                    day: 'numeric' 
                                                }) : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5">
                                    {isEditingSelf ? (
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsEditingSelf(false);
                                                    setSelfEditData({
                                                        name: profileData.name || '',
                                                        email: profileData.email || '',
                                                        phone: profileData.phone || '',
                                                        gender: profileData.gender || ''
                                                    });
                                                }}
                                                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-all uppercase tracking-wider bg-white cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isSelfUpdating}
                                                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all border-0 cursor-pointer shadow-md shadow-indigo-100 disabled:opacity-50"
                                            >
                                                {isSelfUpdating ? 'Saving...' : 'Save Profile'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setIsEditingSelf(true)}
                                                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all border-0 cursor-pointer shadow-md shadow-indigo-100 text-center"
                                            >
                                                Edit Profile Info
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleSelfDelete}
                                                disabled={isSelfDeleting}
                                                className="w-full py-2.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-xl text-xs font-bold transition-all border border-transparent hover:border-red-100 cursor-pointer text-center"
                                            >
                                                {isSelfDeleting ? 'Deleting...' : 'Delete Profile Account'}
                                            </button>
                                        </div>
                                    )}

                                    {!isEditingSelf && (
                                        <button
                                            type="button"
                                            onClick={() => setShowProfileModal(false)}
                                            className="w-full py-3 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-lg shadow-indigo-100/30 border-0 cursor-pointer"
                                        >
                                            Close Details
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeLayout;
