import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Clock,
    Calendar,
    LogIn,
    LogOut,
    CheckCircle2,
    AlertCircle,
    Timer,
    History as HistoryIcon,
    X,
    ShieldCheck,
    Info,
    CalendarOff,
    Sparkles,
    Phone,
    User
} from 'lucide-react';

const EmployeeDashboard = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [workingHours, setWorkingHours] = useState('00:00:00');

    // Geolocation States
    const [coords, setCoords] = useState({ latitude: null, longitude: null });
    const [locationError, setLocationError] = useState('');

    // Leaves States
    const [showLeavesModal, setShowLeavesModal] = useState(false);
    const [leaves, setLeaves] = useState([]);
    const [isLoadingLeaves, setIsLoadingLeaves] = useState(false);

    // Profile States
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);

    // Self Profile Edit & Delete States
    const [isEditingSelf, setIsEditingSelf] = useState(false);
    const [selfEditData, setSelfEditData] = useState({ name: '', email: '', phone: '', gender: '' });
    const [selfUpdateError, setSelfUpdateError] = useState('');
    const [isSelfUpdating, setIsSelfUpdating] = useState(false);
    const [isSelfDeleting, setIsSelfDeleting] = useState(false);

    // QR States
    const [qrModal, setQrModal] = useState({ isOpen: false, type: '', message: '' });

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

    const fetchStatus = async () => {
        try {
            const res = await fetch('https://attendance-backend-0jxv.onrender.com/api/attendance/today', {
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();
            setStatus(data);
        } catch (err) {
            console.error('Error fetching status:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        fetchProfile(false);
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        let interval;
        if (status?.check_in && !status?.check_out) {
            interval = setInterval(() => {
                const checkInTime = new Date(status.check_in);
                const now = new Date();
                const diff = now - checkInTime;

                const hours = Math.floor(diff / 3600000);
                const minutes = Math.floor((diff % 3600000) / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);

                setWorkingHours(
                    `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
                );
            }, 1000);
        } else if (status?.check_in && status?.check_out) {
            const checkInTime = new Date(status.check_in);
            const checkOutTime = new Date(status.check_out);
            const diff = checkOutTime - checkInTime;

            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);

            setWorkingHours(
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
            );
        } else {
            setWorkingHours('00:00:00');
        }
        return () => clearInterval(interval);
    }, [status]);

    const handleAction = async (action, credentials = null) => {
        setIsLoading(true);
        try {
            const fetchOptions = {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-auth-token': token 
                }
            };
            if (credentials) {
                fetchOptions.body = JSON.stringify(credentials);
            }

            const res = await fetch(`https://attendance-backend-0jxv.onrender.com/api/attendance/${action}`, fetchOptions);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || `Failed to perform ${action}`);
            }

            await fetchStatus();
            return true;
        } catch (err) {
            console.error(`Error during ${action}:`, err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const fetchLeaves = async () => {
        setIsLoadingLeaves(true);
        try {
            const res = await fetch('https://attendance-backend-0jxv.onrender.com/api/attendance/leaves', {
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                const data = await res.json();
                setLeaves(data);
                setShowLeavesModal(true);
            } else {
                console.error('Failed to fetch leaves');
            }
        } catch (err) {
            console.error('Error fetching leaves:', err);
        } finally {
            setIsLoadingLeaves(false);
        }
    };

    const fetchProfile = async (openModal = false) => {
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
                if (openModal) {
                    setShowProfileModal(true);
                }
            } else {
                console.error('Failed to fetch profile');
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setIsLoadingProfile(false);
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

    const handleOnDutyClick = () => {
        setLocationError('');

        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by your browser.');
            return;
        }

        setIsLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setCoords({
                    latitude: lat,
                    longitude: lng
                });
                
                try {
                    await handleAction('check-in', {
                        latitude: lat,
                        longitude: lng
                    });
                } catch (err) {
                    setLocationError(err.message || 'Failed to mark attendance.');
                } finally {
                    setIsLoading(false);
                }
            },
            (error) => {
                console.error('Error fetching location:', error);
                setIsLoading(false);
                let errMsg = 'Location access is required to mark attendance. Please enable location services in your browser.';
                if (error.code === error.PERMISSION_DENIED) {
                    errMsg = 'Location permission was denied. You must allow location access to check in.';
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    errMsg = 'Location information is unavailable. Please try again.';
                } else if (error.code === error.TIMEOUT) {
                    errMsg = 'Location request timed out. Please try again.';
                }
                setLocationError(errMsg);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    const executeQrCheckIn = async (scannedToken) => {
        console.log('--- executeQrCheckIn started ---', { scannedToken });
        setIsLoading(true);
        setLocationError('');
        
        try {
            if (!scannedToken) {
                throw new Error('QR code token is missing.');
            }

            // Get geolocation
            if (!navigator.geolocation) {
                throw new Error('Geolocation is not supported by your browser.');
            }

            console.log('--- Querying geolocation ---');
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    console.log('--- Geolocation coordinates ---', { lat, lng });
                    setCoords({ latitude: lat, longitude: lng });

                    try {
                        console.log('--- Making scan-qr backend API request ---');
                        const fetchOptions = {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'x-auth-token': token 
                            },
                            body: JSON.stringify({
                                token: scannedToken,
                                latitude: lat,
                                longitude: lng
                            })
                        };

                        const res = await fetch('https://attendance-backend-0jxv.onrender.com/api/attendance/scan-qr', fetchOptions);
                        const data = await res.json();

                        if (!res.ok) {
                            throw new Error(data.message || 'Failed to scan QR code.');
                        }

                        // Success! Check if it was check-in or check-out
                        const isCheckOut = data.message && data.message.toLowerCase().includes('check-out');
                        setQrModal({
                            isOpen: true,
                            type: isCheckOut ? 'already_marked' : 'success',
                            message: data.message || 'Attendance successfully marked via QR Code!'
                        });
                        fetchStatus();
                    } catch (err) {
                        console.error('Error scanning QR:', err);
                        setQrModal({
                            isOpen: true,
                            type: 'error',
                            message: err.message || 'Failed to mark attendance.'
                        });
                    } finally {
                        setIsLoading(false);
                    }
                },
                (error) => {
                    console.error('Error fetching location:', error);
                    let errMsg = 'Location access is required to mark QR attendance. Please enable location services in your browser.';
                    if (error.code === error.PERMISSION_DENIED) {
                        errMsg = 'Location permission was denied. You must allow location access to check in.';
                    } else if (error.code === error.POSITION_UNAVAILABLE) {
                        errMsg = 'Location information is unavailable. Please try again.';
                    } else if (error.code === error.TIMEOUT) {
                        errMsg = 'Location request timed out. Please try again.';
                    }
                    setQrModal({
                        isOpen: true,
                        type: 'error',
                        message: errMsg
                    });
                    setIsLoading(false);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } catch (err) {
            console.error('Error during QR check-in startup:', err);
            setQrModal({
                isOpen: true,
                type: 'error',
                message: err.message || 'Failed to initiate QR check-in.'
            });
            setIsLoading(false);
        }
    };

    // QR Scan Check-In Flow Listener
    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const hasQrParam = queryParams.get('qr') === 'true';
        const urlToken = queryParams.get('token');
        const hasPendingQr = localStorage.getItem('pending_qr_checkin') === 'true';

        console.log('--- QR FLOW MOUNT DETECTED ---', { hasQrParam, hasPendingQr, token: !!token, urlToken });

        if (hasQrParam || hasPendingQr) {
            if (urlToken) {
                localStorage.setItem('pending_qr_token', urlToken);
            }

            if (token) {
                console.log('--- EXECUTING AUTOMATED QR CHECK-IN ---');
                const activeToken = urlToken || localStorage.getItem('pending_qr_token');
                
                // Authenticated: clear pending flags and clean URL
                localStorage.removeItem('pending_qr_checkin');
                localStorage.removeItem('pending_qr_token');
                if (hasQrParam) {
                    navigate('/employee', { replace: true });
                }
                
                // Trigger QR check-in logic
                executeQrCheckIn(activeToken);
            } else {
                console.log('--- REDIRECTING TO LOGIN FOR PENDING QR ---');
                // Not authenticated: store pending flag and redirect to login
                localStorage.setItem('pending_qr_checkin', 'true');
                navigate('/login');
            }
        }
    }, [token]);

    const isCheckedIn = !!status?.check_in;
    const isCheckedOut = !!status?.check_out;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div 
                    onClick={() => fetchProfile(true)} 
                    className="flex items-center gap-4 cursor-pointer group select-none"
                >
                    <div className="w-16 h-16 rounded-2xl bg-white p-1 border border-slate-100 shadow-sm relative transition-all duration-300">
                        <img 
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} 
                            alt="avatar" 
                            className="w-full h-full object-cover rounded-xl"
                        />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-[#154c46] tracking-tight flex items-center gap-1.5">
                            Hello, <span className="text-teal-500 underline decoration-teal-100 underline-offset-8 group-hover:text-teal-600 transition-colors">{user.name?.split(' ')[0]}</span>!
                        </h1>
                        <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
                            <Calendar size={16} />
                            {currentTime.toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                </div>
                <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-2 bg-teal-50 text-teal-500 rounded-xl">
                        <Clock size={20} />
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Current Time</p>
                        <p className="text-xl font-black text-[#154c46] leading-none">
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Status Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 glass-card overflow-hidden bg-white border-slate-100 relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500 opacity-50"></div>

                    <div className="p-8 relative">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-bold text-[#1b5d55]">Attendance Status</h3>
                            <div className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-2 ${isCheckedOut ? 'bg-slate-100 text-slate-500' :
                                isCheckedIn ? (status?.status === 'Late' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600') :
                                    'bg-amber-50 text-amber-600'
                                }`}>
                                <div className={`w-2 h-2 rounded-full animate-pulse ${isCheckedOut ? 'bg-slate-400' :
                                    isCheckedIn ? (status?.status === 'Late' ? 'bg-rose-500' : 'bg-emerald-500') :
                                        'bg-amber-500'
                                    }`}></div>
                                {isCheckedOut ? 'Off Duty' : isCheckedIn ? (status?.status || 'Present') : 'Not Checked In'}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-10">
                            <div className="space-y-2">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Check-In</p>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isCheckedIn ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-300'}`}>
                                        <LogIn size={18} />
                                    </div>
                                    <p className={`text-xl font-black ${isCheckedIn ? 'text-[#154c46]' : 'text-slate-300'}`}>
                                        {status?.check_in ? new Date(status.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Check-Out</p>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isCheckedOut ? 'bg-teal-50 text-teal-500' : 'bg-slate-50 text-slate-300'}`}>
                                        <LogOut size={18} />
                                    </div>
                                    <p className={`text-xl font-black ${isCheckedOut ? 'text-[#154c46]' : 'text-slate-300'}`}>
                                        {status?.check_out ? new Date(status.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2 col-span-2 md:col-span-1">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Location Verified</p>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${status?.latitude && status?.longitude ? 'bg-teal-50 text-teal-500' : 'bg-slate-50 text-slate-300'}`}>
                                        <ShieldCheck size={18} />
                                    </div>
                                    <p className={`text-sm font-bold ${status?.latitude && status?.longitude ? 'text-[#154c46]' : 'text-slate-300'}`}>
                                        {status?.latitude && status?.longitude ? 'Verified (GPS)' : 'Not Available'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {locationError && (
                            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-2xl font-bold flex items-center gap-2.5 animate-in slide-in-from-top duration-300">
                                <AlertCircle size={16} className="shrink-0" />
                                <span>{locationError}</span>
                            </div>
                        )}

                        <div className="flex flex-col items-center justify-center p-6 bg-slate-50/60 rounded-2xl border border-slate-100 w-full">
                            <div className="text-center mb-4">
                                <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest">ON DUTY Toggle Switch</p>
                                <h4 className="text-xs font-black text-slate-700 mt-1 uppercase tracking-wide">
                                    {!isCheckedIn ? "Slide to mark attendance (Check-In)" : !isCheckedOut ? "Shift Active (Slide to check out)" : "Shift completed today"}
                                </h4>
                            </div>
                            
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        if (isLoading) return;
                                        if (!isCheckedIn) {
                                            handleOnDutyClick();
                                        } else if (!isCheckedOut) {
                                            handleAction('check-out');
                                        }
                                    }}
                                    disabled={isLoading || (isCheckedIn && isCheckedOut)}
                                    className={`w-36 h-16 rounded-full relative transition-all duration-500 focus:outline-none shadow-inner border-0 cursor-pointer flex items-center justify-between px-3 ${
                                        (isCheckedIn && !isCheckedOut) 
                                            ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-500 shadow-lg shadow-emerald-100' 
                                            : 'bg-slate-200'
                                    } ${(isCheckedIn && isCheckedOut) ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
                                >
                                    {/* Sliding White Circle */}
                                    <div className={`w-12 h-12 bg-white rounded-full shadow-md transition-all duration-500 absolute top-2 ${
                                        (isCheckedIn && !isCheckedOut) ? 'left-[88px]' : 'left-2'
                                    }`} />
                                    
                                    {/* Toggle State Label inside the switch pill */}
                                    <span className={`text-[11px] font-black uppercase tracking-widest absolute transition-all duration-500 ${
                                        (isCheckedIn && !isCheckedOut) 
                                            ? 'left-4 text-white' 
                                            : 'right-4 text-slate-500'
                                    }`}>
                                        ON DUTY
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass-card bg-[#154c46] text-white p-8 relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Timer size={120} />
                    </div>

                    <div className="relative">
                        <p className="text-[11px] font-bold text-teal-300 uppercase tracking-widest mb-1">Working Hours</p>
                        <h3 className="text-4xl font-black tracking-tight font-mono">{workingHours}</h3>
                    </div>

                    <div className="relative pt-8 mt-8 border-t border-white/10">
                        <div className="flex items-center gap-3 text-teal-200 mb-4">
                            <AlertCircle size={14} />
                            <p className="text-[10px] font-bold uppercase tracking-widest">Session Insight</p>
                        </div>
                        <p className="text-white/60 text-xs leading-relaxed font-medium">
                            {isCheckedOut ? "Great job! You've completed your shift for today. Enjoy your time off." :
                                isCheckedIn ? "You are currently in your working hours. Keep up the good work!" :
                                    "Waiting for you to start your workday. Have a productive day ahead!"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Stats/Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* History Card */}
                <button 
                    onClick={() => navigate('/employee/history')}
                    className="glass-card p-6 border-slate-100 hover:border-teal-50 transition-all duration-300 group text-center flex flex-col items-center justify-center gap-3 w-full border-0 cursor-pointer focus:outline-none bg-white"
                >
                    <div className="p-3 rounded-xl bg-teal-50 text-teal-500 group-hover:bg-[#154c46] group-hover:text-white transition-colors duration-300">
                        <HistoryIcon size={20} />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 group-hover:text-[#154c46]">
                        History
                    </span>
                </button>

                {/* Leaves Card */}
                <button 
                    onClick={fetchLeaves}
                    disabled={isLoadingLeaves}
                    className="glass-card p-6 border-slate-100 hover:border-teal-50 transition-all duration-300 group text-center flex flex-col items-center justify-center gap-3 w-full border-0 cursor-pointer focus:outline-none bg-white"
                >
                    <div className="p-3 rounded-xl bg-rose-50 text-rose-600 group-hover:bg-[#154c46] group-hover:text-white transition-colors duration-300">
                        {isLoadingLeaves ? (
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <Calendar size={20} />
                        )}
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 group-hover:text-[#154c46]">
                        {isLoadingLeaves ? 'Loading...' : 'Leaves'}
                    </span>
                </button>

                {/* Profile Card */}
                <button 
                    onClick={() => fetchProfile(true)}
                    disabled={isLoadingProfile}
                    className="glass-card p-6 border-slate-100 hover:border-teal-50 transition-all duration-300 group text-center flex flex-col items-center justify-center gap-3 w-full border-0 cursor-pointer focus:outline-none bg-white"
                >
                    <div className="w-[44px] h-[44px] rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-[#154c46] group-hover:text-white transition-colors duration-300 flex items-center justify-center overflow-hidden shrink-0 p-1 border border-emerald-100/50 group-hover:border-transparent">
                        {isLoadingProfile ? (
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <img 
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} 
                                alt="avatar" 
                                className="w-full h-full object-cover rounded-lg"
                            />
                        )}
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 group-hover:text-[#154c46]">
                        {isLoadingProfile ? 'Loading...' : 'Profile'}
                    </span>
                </button>
            </div>

            {/* Premium Leaves Modal */}
            {showLeavesModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#154c46]/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white/95 rounded-3xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 relative">
                        {/* Gradient Header Banner */}
                        <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-teal-500 p-6 text-white relative">
                            <div className="absolute top-4 right-4">
                                <button 
                                    onClick={() => setShowLeavesModal(false)}
                                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-200 focus:outline-none border-0 cursor-pointer"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white/20 rounded-2xl text-white backdrop-blur-md">
                                    <Sparkles size={24} className="animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black tracking-tight leading-none">Leave Analytics</h3>
                                    <p className="text-white/80 text-xs font-semibold mt-1">Detailed summary of your time off</p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 space-y-6">
                            {/* Summary Statistic Card */}
                            <div className="bg-gradient-to-br from-rose-50 to-pink-50/30 rounded-2xl p-6 border border-rose-100 flex items-center justify-between">
                                <div className="space-y-1">
                                    <span className="text-[11px] font-bold text-rose-500 uppercase tracking-widest">Total Leaves Taken</span>
                                    <h4 className="text-4xl font-black text-[#154c46] leading-none">{leaves.length}</h4>
                                </div>
                                <div className="p-4 bg-white shadow-sm shadow-rose-100 text-rose-500 rounded-2xl border border-rose-100/50">
                                    <CalendarOff size={32} />
                                </div>
                            </div>

                            {/* Leaves History List */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Leave Logs</h4>
                                    <span className="text-[10px] font-bold text-slate-400">Showing all records</span>
                                </div>

                                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                    {leaves.length > 0 ? (
                                        leaves.map((leave, index) => (
                                            <div 
                                                key={leave.id || index}
                                                className="flex items-center justify-between p-4 bg-slate-50 hover:bg-rose-50/30 rounded-2xl border border-slate-100 hover:border-rose-100 transition-all duration-300 group"
                                            >
                                                <div className="flex items-center gap-3.5">
                                                    <div className="p-2 bg-rose-100/60 text-rose-600 rounded-xl group-hover:bg-rose-500 group-hover:text-white transition-colors duration-300">
                                                        <CalendarOff size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-700">
                                                            {new Date(leave.date).toLocaleDateString(undefined, { 
                                                                weekday: 'short', 
                                                                month: 'short', 
                                                                day: 'numeric', 
                                                                year: 'numeric' 
                                                            })}
                                                        </p>
                                                        <p className="text-[10px] font-medium text-slate-400">Approved Leave</p>
                                                    </div>
                                                </div>
                                                <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black rounded-full uppercase tracking-wider">
                                                    Leave
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                            <div className="p-3 bg-slate-100 text-slate-400 rounded-full inline-block mb-2">
                                                <Info size={20} />
                                            </div>
                                            <p className="text-xs font-bold text-slate-400">No leaves registered yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="pt-2">
                                <button
                                    onClick={() => setShowLeavesModal(false)}
                                    className="w-full py-3.5 bg-[#154c46] hover:bg-teal-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-lg shadow-teal-50/30 border-0 cursor-pointer"
                                >
                                    Close Details
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Premium Profile Modal */}
            {showProfileModal && profileData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#154c46]/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
                    <div className="bg-white/95 rounded-3xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 relative font-sans my-8">
                        {/* Elegant Pattern Banner */}
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

            {/* Premium QR Check-In Modal */}
            {qrModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#154c46]/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white/95 rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 relative">
                        {/* Header color based on type */}
                        <div className={`p-6 text-white relative text-center flex flex-col items-center justify-center ${
                            qrModal.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' :
                            qrModal.type === 'already_marked' ? 'bg-gradient-to-r from-purple-500 to-teal-500' :
                            'bg-gradient-to-r from-rose-500 to-pink-600'
                        }`}>
                            <div className="absolute top-4 right-4">
                                <button 
                                    onClick={() => setQrModal({ ...qrModal, isOpen: false })}
                                    className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-200 focus:outline-none border-0 cursor-pointer"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            
                            <div className="p-4 bg-white/20 rounded-2xl text-white backdrop-blur-md mb-3">
                                {qrModal.type === 'success' ? (
                                    <CheckCircle2 size={32} className="animate-bounce" />
                                ) : qrModal.type === 'already_marked' ? (
                                    <ShieldCheck size={32} className="animate-pulse" />
                                ) : (
                                    <AlertCircle size={32} className="animate-shake" />
                                )}
                            </div>
                            
                            <h3 className="text-lg font-black tracking-tight uppercase leading-none">
                                {qrModal.type === 'success' ? 'QR Check-in successful' :
                                 qrModal.type === 'already_marked' ? 'Already Marked' :
                                 'Check-in Failed'}
                            </h3>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 text-center space-y-6">
                            <p className="text-slate-600 text-sm font-medium leading-relaxed">
                                {qrModal.message}
                            </p>

                            <button
                                onClick={() => setQrModal({ ...qrModal, isOpen: false })}
                                className={`w-full py-3.5 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-lg border-0 cursor-pointer ${
                                    qrModal.type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' :
                                    qrModal.type === 'already_marked' ? 'bg-teal-500 hover:bg-teal-600 shadow-teal-50' :
                                    'bg-rose-600 hover:bg-rose-700 shadow-rose-100'
                                }`}
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default EmployeeDashboard;
