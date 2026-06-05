import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    CalendarCheck,
    LogOut,
    Menu,
    X,
    Bell,
    Search,
    Settings,
    Calendar,
    Clock,
    Shield,
    Save,
    Phone,
    User,
    Sparkles,
    UserPlus,
    Trash2
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const AdminLayout = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);

    // Self Profile Edit & Delete States
    const [isEditingSelf, setIsEditingSelf] = useState(false);
    const [selfEditData, setSelfEditData] = useState({ name: '', email: '', phone: '', gender: '' });
    const [selfUpdateError, setSelfUpdateError] = useState('');
    const [isSelfUpdating, setIsSelfUpdating] = useState(false);
    const [isSelfDeleting, setIsSelfDeleting] = useState(false);
    const location = useLocation();

    // Notifications States
    const [notifications, setNotifications] = useState([]);
    const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

    // System Settings States
    const [settingsForm, setSettingsForm] = useState(() => {
        const saved = localStorage.getItem('system_settings');
        return saved ? JSON.parse(saved) : {
            lateTime: '09:30',
            autoCheckIn: true,
            ipRestriction: false,
            allowedIp: '192.168.1.1',
            workingHoursRequired: '8',
        };
    });
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [settingsSuccess, setSettingsSuccess] = useState(false);

    const handleSettingsSave = (e) => {
        e.preventDefault();
        setSettingsSaving(true);
        setTimeout(() => {
            localStorage.setItem('system_settings', JSON.stringify(settingsForm));
            setSettingsSaving(false);
            setSettingsSuccess(true);
            setTimeout(() => {
                setSettingsSuccess(false);
                setSettingsOpen(false);
            }, 1500);
        }, 1000);
    };

    // Simple Protect Route Logic
    React.useEffect(() => {
        if (!token || user.role !== 'admin') {
            navigate('/login');
        }
    }, [token, user, navigate]);

    // Fetch Notifications on Mount & Poll
    React.useEffect(() => {
        if (token && user.role === 'admin') {
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
            const res = await fetch('https://attendance-backend-0jxv.onrender.com/api/auth/me', {
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
            const res = await fetch('https://attendance-backend-0jxv.onrender.com/api/notifications', {
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
            const res = await fetch(`https://attendance-backend-0jxv.onrender.com/api/notifications/${id}/read`, {
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

    const handleNotificationDelete = async (id, e) => {
        if (e) e.stopPropagation();
        try {
            const res = await fetch(`https://attendance-backend-0jxv.onrender.com/api/notifications/${id}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                fetchNotifications();
            }
        } catch (err) {
            console.error('Error deleting notification:', err);
        }
    };

    const handleMarkAllNotificationsRead = async () => {
        try {
            const res = await fetch('https://attendance-backend-0jxv.onrender.com/api/notifications/read-all', {
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

    const handleApproveRequest = async (userId, notificationId) => {
        try {
            const res = await fetch(`https://attendance-backend-0jxv.onrender.com/api/admin/approve-employee/${userId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-auth-token': token 
                }
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message || 'Employee approved successfully!');
                if (notificationId) {
                    await handleNotificationRead(notificationId);
                }
                fetchNotifications();
            } else {
                alert(data.message || 'Failed to approve employee');
            }
        } catch (err) {
            console.error('Error approving employee:', err);
            alert('Error approving employee.');
        }
    };

    const handleRejectRequest = async (userId, notificationId) => {
        if (!window.confirm('Are you sure you want to reject this employee registration request? This will delete the pending account.')) {
            return;
        }
        try {
            const res = await fetch(`https://attendance-backend-0jxv.onrender.com/api/admin/reject-employee/${userId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-auth-token': token 
                }
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message || 'Request rejected and deleted.');
                if (notificationId) {
                    await handleNotificationRead(notificationId);
                }
                fetchNotifications();
            } else {
                alert(data.message || 'Failed to reject employee');
            }
        } catch (err) {
            console.error('Error rejecting employee:', err);
            alert('Error rejecting employee.');
        }
    };

    const handleSelfUpdateSubmit = async (e) => {
        e.preventDefault();
        setIsSelfUpdating(true);
        setSelfUpdateError('');
        try {
            const res = await fetch('https://attendance-backend-0jxv.onrender.com/api/auth/profile', {
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
            const res = await fetch('https://attendance-backend-0jxv.onrender.com/api/auth/profile', {
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

    const menuItems = [
        { title: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
        { title: 'All Users', icon: Users, path: '/admin/users' },
        { title: 'Reports', icon: CalendarCheck, path: '/admin/attendance' },
        { title: 'Settings', icon: Settings, action: 'settings' },
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
            {/* Sidebar */}
            <aside className={cn(
                "bg-white border-r border-slate-200 transition-all duration-300 flex flex-col fixed inset-y-0 left-0 z-50 shadow-sm",
                isSidebarOpen ? "w-64" : "w-20"
            )}>
                <div className="h-16 flex items-center px-6 border-b border-slate-100">
                    <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-teal-50 ring-2 ring-teal-50">
                        A
                    </div>
                    {isSidebarOpen && (
                        <span className="ml-3 font-bold text-[#1b5d55] tracking-tight">
                            Attendance<span className="text-teal-500">Pro</span>
                        </span>
                    )}
                </div>

                <nav className="flex-1 py-8 px-3 space-y-1">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path && !item.action;
                        if (item.action === 'settings') {
                            return (
                                <button
                                    key={item.title}
                                    onClick={() => setSettingsOpen(true)}
                                    className="flex items-center w-full px-3 py-2.5 rounded-xl transition-all duration-200 group text-slate-500 hover:bg-slate-50 hover:text-[#154c46] border-0 bg-transparent text-left cursor-pointer focus:outline-none"
                                >
                                    <item.icon size={20} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                                    {isSidebarOpen && <span className="ml-3 font-semibold text-sm">{item.title}</span>}
                                </button>
                            );
                        }
                        return (
                            <Link
                                key={item.path + item.title}
                                to={item.path}
                                className={cn(
                                    "flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group",
                                    isActive
                                        ? "bg-teal-500 text-white shadow-lg shadow-teal-50"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-[#154c46]"
                                )}
                            >
                                <item.icon size={20} className={cn(
                                    "transition-colors",
                                    isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                                )} />
                                {isSidebarOpen && <span className="ml-3 font-semibold text-sm">{item.title}</span>}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={handleLogout}
                        className={cn(
                            "flex items-center w-full px-3 py-2.5 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200 cursor-pointer border-0 bg-transparent"
                        )}>
                        <LogOut size={20} />
                        {isSidebarOpen && <span className="ml-3 font-semibold text-sm">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={cn(
                "flex-1 transition-all duration-300",
                isSidebarOpen ? "ml-64" : "ml-20"
            )}>
                {/* Header */}
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors border-0 bg-transparent cursor-pointer"
                        >
                            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <div className="hidden md:flex items-center relative group">
                            <Search className="absolute left-3 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Quick search..."
                                className="bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-teal-50 focus:bg-white transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-5">
                        <div className="relative">
                            <button 
                                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                                className="p-2 text-slate-400 hover:text-teal-500 hover:bg-teal-50 rounded-xl transition-all relative border-0 bg-transparent cursor-pointer"
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
                                        <span className="text-xs font-black text-[#1b5d55] uppercase tracking-wider">Notifications</span>
                                        {unreadNotificationsCount > 0 && (
                                            <button 
                                                onClick={handleMarkAllNotificationsRead}
                                                className="text-[10px] font-bold text-teal-500 hover:text-teal-600 bg-transparent border-0 cursor-pointer"
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
                                                    className={`p-4 text-left cursor-pointer transition-colors group relative ${!n.is_read ? 'bg-teal-50/40 hover:bg-teal-50/70' : 'hover:bg-slate-50'}`}
                                                >
                                                    <div className="flex items-start justify-between gap-2 pr-6">
                                                        <p className={`text-xs font-bold ${!n.is_read ? 'text-[#154c46]' : 'text-slate-600'}`}>{n.title}</p>
                                                        {!n.is_read && <span className="w-1.5 h-1.5 bg-teal-500 rounded-full shrink-0 mt-1"></span>}
                                                    </div>
                                                    <p className="text-[11px] font-medium text-slate-500 mt-1 leading-relaxed pr-6">{n.message}</p>
                                                    {n.title === 'New Employee Registration' && n.related_id && !n.is_read && (
                                                        <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                                                            <button
                                                                onClick={() => handleApproveRequest(n.related_id, n.id)}
                                                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-colors border-0 cursor-pointer"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectRequest(n.related_id, n.id)}
                                                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg transition-colors border-0 cursor-pointer"
                                                            >
                                                                Reject
                                                            </button>
                                                        </div>
                                                    )}
                                                    <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mt-2 block">
                                                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <button 
                                                        onClick={(e) => handleNotificationDelete(n.id, e)}
                                                        className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 md:group-hover:opacity-100 transition-all border-0 bg-transparent cursor-pointer flex md:hidden group-hover:flex md:block"
                                                        title="Delete Notification"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
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
                            className="flex items-center space-x-3 border-l pl-5 border-slate-200 cursor-pointer group hover:opacity-85 transition-opacity"
                        >
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-[#1b5d55] leading-none group-hover:text-teal-500 transition-colors">{user.name || 'Admin'}</p>
                                <p className="text-[11px] font-bold text-teal-500 uppercase tracking-widest mt-1">{user.role || 'Super Admin'}</p>
                            </div>
                            <div className="w-10 h-10 bg-teal-50 rounded-xl overflow-hidden border border-teal-50 shadow-sm">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name || 'Admin'}`} alt="Avatar" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="p-8 md:p-12 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>

            {/* Global Settings Modal */}
            {isSettingsOpen && (
                <div className="fixed inset-0 bg-[#154c46]/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden transform transition-all duration-300 animate-in zoom-in-95">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-teal-50 text-teal-500 rounded-xl animate-pulse">
                                    <Settings size={18} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-sm font-black text-[#1b5d55] uppercase tracking-wider">System Settings</h3>
                                    <p className="text-slate-500 text-[10px] font-bold">Configure attendance guidelines.</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSettingsOpen(false)}
                                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all border-0 bg-transparent cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSettingsSave} className="p-6 space-y-6">
                            {settingsSuccess && (
                                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-xl font-bold flex items-center gap-2 animate-in slide-in-from-top duration-300">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                    Settings saved successfully!
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-1 text-left">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Late Arrival Threshold</label>
                                    <div className="relative group">
                                        <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={16} />
                                        <input
                                            type="time"
                                            value={settingsForm.lateTime}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, lateTime: e.target.value })}
                                            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400 transition-all bg-slate-50/50 text-xs font-bold text-slate-700"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1 text-left">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Minimum Daily Hours</label>
                                    <div className="relative group">
                                        <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={16} />
                                        <input
                                            type="number"
                                            min="1"
                                            max="24"
                                            value={settingsForm.workingHoursRequired}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, workingHoursRequired: e.target.value })}
                                            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400 transition-all bg-slate-50/50 text-xs font-bold text-slate-700"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="pt-2 flex items-center justify-between">
                                    <div className="text-left">
                                        <label className="block text-xs font-bold text-[#1b5d55]">Auto Check-in on Login</label>
                                        <p className="text-slate-400 text-[10px]">Automatically mark presence upon logging in.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSettingsForm({ ...settingsForm, autoCheckIn: !settingsForm.autoCheckIn })}
                                        className={`w-11 h-6 rounded-full transition-all duration-300 relative focus:outline-none border-0 cursor-pointer ${
                                            settingsForm.autoCheckIn ? 'bg-teal-500' : 'bg-slate-200'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all duration-300 ${
                                            settingsForm.autoCheckIn ? 'left-5.5' : 'left-0.5'
                                        }`} />
                                    </button>
                                </div>

                                <div className="border-t border-slate-50 pt-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="text-left">
                                            <label className="block text-xs font-bold text-[#1b5d55]">IP Restrict Check-In</label>
                                            <p className="text-slate-400 text-[10px]">Only allow check-in from company WiFi.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSettingsForm({ ...settingsForm, ipRestriction: !settingsForm.ipRestriction })}
                                            className={`w-11 h-6 rounded-full transition-all duration-300 relative focus:outline-none border-0 cursor-pointer ${
                                                settingsForm.ipRestriction ? 'bg-teal-500' : 'bg-slate-200'
                                            }`}
                                        >
                                            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all duration-300 ${
                                                settingsForm.ipRestriction ? 'left-5.5' : 'left-0.5'
                                            }`} />
                                        </button>
                                    </div>

                                    {settingsForm.ipRestriction && (
                                        <div className="space-y-1 animate-in slide-in-from-top duration-300 text-left">
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Allowed IP Address</label>
                                            <input
                                                type="text"
                                                value={settingsForm.allowedIp}
                                                onChange={(e) => setSettingsForm({ ...settingsForm, allowedIp: e.target.value })}
                                                placeholder="192.168.1.1"
                                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400 transition-all bg-slate-50/50 text-xs font-bold text-slate-700"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-50">
                                <button
                                    type="button"
                                    onClick={() => setSettingsOpen(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs transition-all uppercase tracking-wider bg-white cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={settingsSaving}
                                    className="flex-1 py-2.5 bg-[#154c46] text-white rounded-xl hover:bg-teal-500 font-bold text-xs transition-all flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-75 cursor-pointer border-0"
                                >
                                    {settingsSaving ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Save size={14} />
                                            Save Rules
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Premium Profile Modal */}
            {showProfileModal && profileData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#154c46]/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
                    <div className="bg-white/95 rounded-3xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 relative font-sans my-8">
                        {/* Elegant Pattern Banner */}
                        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-teal-500 p-8 text-white relative flex flex-col items-center">
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
                                    className="text-[#1b5d55] text-sm font-bold text-center px-4 py-1 rounded-lg border border-slate-200 outline-none focus:border-teal-400 bg-white"
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
                                    <span className="text-xs font-black text-[#1b5d55] uppercase tracking-wider">{profileData.role}</span>
                                </div>
                                <div className="space-y-1 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Department</span>
                                    <span className="text-xs font-black text-[#1b5d55] tracking-wider">{profileData.department || 'General'}</span>
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
                                        <div className="p-2.5 bg-teal-50 text-teal-500 rounded-xl">
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
                                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-50 focus:border-teal-400 text-xs font-semibold bg-white"
                                                />
                                            ) : (
                                                <span className="text-xs font-bold text-slate-700">{profileData.email}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Phone Number */}
                                    <div className="flex items-center gap-3.5 p-3.5 hover:bg-slate-50 rounded-2xl transition-all duration-300 border border-transparent hover:border-slate-100">
                                        <div className="p-2.5 bg-teal-50 text-teal-500 rounded-xl">
                                            <Phone size={16} />
                                        </div>
                                        <div className="text-left flex-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">Phone Number</span>
                                            {isEditingSelf ? (
                                                <input
                                                    type="text"
                                                    value={selfEditData.phone}
                                                    onChange={(e) => setSelfEditData({ ...selfEditData, phone: e.target.value })}
                                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-50 focus:border-teal-400 text-xs font-semibold bg-white"
                                                    placeholder="e.g. +91 9876543210"
                                                />
                                            ) : (
                                                <span className="text-xs font-bold text-slate-700">{profileData.phone || 'N/A'}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Gender */}
                                    <div className="flex items-center gap-3.5 p-3.5 hover:bg-slate-50 rounded-2xl transition-all duration-300 border border-transparent hover:border-slate-100">
                                        <div className="p-2.5 bg-teal-50 text-teal-500 rounded-xl">
                                            <User size={16} />
                                        </div>
                                        <div className="text-left flex-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">Gender</span>
                                            {isEditingSelf ? (
                                                <select
                                                    value={selfEditData.gender}
                                                    onChange={(e) => setSelfEditData({ ...selfEditData, gender: e.target.value })}
                                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-50 focus:border-teal-400 text-xs font-semibold bg-white text-slate-700"
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
                                        <div className="p-2.5 bg-teal-50 text-teal-500 rounded-xl">
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
                                                className="flex-1 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-all border-0 cursor-pointer shadow-md shadow-teal-50 disabled:opacity-50"
                                            >
                                                {isSelfUpdating ? 'Saving...' : 'Save Profile'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setIsEditingSelf(true)}
                                                className="w-full py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-all border-0 cursor-pointer shadow-md shadow-teal-50 text-center"
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
                                            className="w-full py-3 bg-[#154c46] hover:bg-teal-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-lg shadow-teal-50/30 border-0 cursor-pointer"
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

export default AdminLayout;
