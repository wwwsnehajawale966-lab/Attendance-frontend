import React from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    Users,
    CalendarCheck,
    Clock,
    UserMinus,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Settings,
    X,
    Save,
    Shield,
    MapPin,
    Search
} from 'lucide-react';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [downloadingReport, setDownloadingReport] = React.useState(false);

    // Dynamic QR Code States
    const [dynamicQr, setDynamicQr] = React.useState(null);
    const [countdown, setCountdown] = React.useState(120); // 120 seconds = 2 minutes
    const [loadingQr, setLoadingQr] = React.useState(false);

    const fetchDynamicQrToken = async () => {
        setLoadingQr(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:5000/api/attendance/qr-token', {
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                const data = await res.json();
                setDynamicQr(data);
                
                // Calculate remaining seconds based on expires_at
                const expiresAt = new Date(data.expires_at);
                const diffSeconds = Math.max(0, Math.floor((expiresAt - new Date()) / 1000));
                setCountdown(diffSeconds > 0 ? diffSeconds : 120);
            } else {
                console.error('Failed to fetch dynamic QR token');
            }
        } catch (err) {
            console.error('Error fetching dynamic QR token:', err);
        } finally {
            setLoadingQr(false);
        }
    };

    React.useEffect(() => {
        fetchDynamicQrToken();
    }, []);

    React.useEffect(() => {
        if (countdown <= 0) {
            fetchDynamicQrToken();
            return;
        }

        const interval = setInterval(() => {
            setCountdown(prev => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [countdown]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const progressPercent = (countdown / 120) * 100;

    const handleDownloadReport = async () => {
        setDownloadingReport(true);
        const token = localStorage.getItem('token');
        try {
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const d = String(now.getDate()).padStart(2, '0');
            const todayStr = `${y}-${m}-${d}`;

            // Fetch Today's Reports
            const res = await fetch(`http://localhost:5000/api/admin/report?startDate=${todayStr}&endDate=${todayStr}`, {
                headers: { 'x-auth-token': token }
            });
            
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                alert(`Error fetching report: ${errData.message || 'Server error (' + res.status + ')'}`);
                return;
            }

            const reports = await res.json();

            if (!Array.isArray(reports)) {
                alert("Received invalid data format from server.");
                return;
            }

            if (reports.length === 0) {
                alert("No attendance records found for today to export.");
                return;
            }

            // Export to PDF using jsPDF
            const doc = new jsPDF('landscape');
            
            doc.setFontSize(18);
            doc.text("Attendance Management System - Today's Report", 14, 20);
            
            doc.setFontSize(10);
            doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 14, 28);
            
            const tableHeaders = [
                "Employee Name",
                "Employee ID",
                "Department",
                "Date",
                "Check-In",
                "Check-Out",
                "Working Hours",
                "Status",
                "Method",
                "Late/Early Status",
                "Extra Working Time"
            ];
            
            const tableRows = reports.map(item => {
                const checkInTime = item.check_in ? new Date(item.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '--';
                const checkOutTime = item.check_out ? new Date(item.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '--';
                const dateStr = new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                
                return [
                    item.name,
                    item.employee_id || 'N/A',
                    item.department || 'General',
                    dateStr,
                    checkInTime,
                    checkOutTime,
                    item.working_hours || '--',
                    item.status,
                    item.attendance_method || 'TOGGLE',
                    item.late_early_status || 'N/A',
                    item.extra_working_time || 'N/A'
                ];
            });
            
            autoTable(doc, {
                head: [tableHeaders],
                body: tableRows,
                startY: 35,
                theme: 'striped',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [79, 70, 229] }
            });
            
            doc.save(`today_attendance_report_${todayStr}.pdf`);
        } catch (err) {
            console.error('Error generating report:', err);
            alert(`Failed to generate report PDF: ${err.message}`);
        } finally {
            setDownloadingReport(false);
        }
    };


    const [statsData, setStatsData] = React.useState({
        totalEmployees: 0,
        presentToday: 0,
        onLeave: 0,
        lateToday: 0,
        weeklyTrend: [
            { day: 'Mon', val: 0 },
            { day: 'Tue', val: 0 },
            { day: 'Wed', val: 0 },
            { day: 'Thu', val: 0 },
            { day: 'Fri', val: 0 },
            { day: 'Sat', val: 0 },
            { day: 'Sun', val: 0 }
        ]
    });
    const [isLoading, setIsLoading] = React.useState(true);

    // Today's Present Modal States
    const [showPresentModal, setShowPresentModal] = React.useState(false);
    const [presentEmployees, setPresentEmployees] = React.useState([]);
    const [loadingPresent, setLoadingPresent] = React.useState(false);
    const [presentSearchQuery, setPresentSearchQuery] = React.useState('');

    const fetchPresentEmployees = async () => {
        setLoadingPresent(true);
        const token = localStorage.getItem('token');
        try {
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const d = String(now.getDate()).padStart(2, '0');
            const todayStr = `${y}-${m}-${d}`;

            const res = await fetch(`http://localhost:5000/api/admin/report?startDate=${todayStr}&endDate=${todayStr}`, {
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();
            
            const presentList = data.filter(item => {
                const status = (item.status || '').toLowerCase();
                return status === 'present' || status === 'late';
            });
            
            setPresentEmployees(presentList);
            setShowPresentModal(true);
        } catch (err) {
            console.error('Error fetching today\'s present employees:', err);
        } finally {
            setLoadingPresent(false);
        }
    };

    // Today's Leaves Modal States
    const [showLeavesModal, setShowLeavesModal] = React.useState(false);
    const [leavesEmployees, setLeavesEmployees] = React.useState([]);
    const [loadingLeaves, setLoadingLeaves] = React.useState(false);
    const [leavesSearchQuery, setLeavesSearchQuery] = React.useState('');

    const fetchLeavesEmployees = async () => {
        setLoadingLeaves(true);
        const token = localStorage.getItem('token');
        try {
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const d = String(now.getDate()).padStart(2, '0');
            const todayStr = `${y}-${m}-${d}`;

            // Fetch All Employees
            const empRes = await fetch('http://localhost:5000/api/admin/employees', {
                headers: { 'x-auth-token': token }
            });
            const allEmployees = await empRes.json();

            // Fetch Today's Attendance Logs
            const reportRes = await fetch(`http://localhost:5000/api/admin/report?startDate=${todayStr}&endDate=${todayStr}`, {
                headers: { 'x-auth-token': token }
            });
            const todayReports = await reportRes.json();

            // Create set of checked-in user IDs
            const presentUserIds = new Set(
                todayReports
                    .filter(item => {
                        const status = (item.status || '').toLowerCase();
                        return status === 'present' || status === 'late';
                    })
                    .map(item => item.user_id)
            );

            // Filter allEmployees for those who are NOT in presentUserIds
            const onLeaveEmployees = allEmployees.filter(emp => !presentUserIds.has(emp.id));

            setLeavesEmployees(onLeaveEmployees);
            setShowLeavesModal(true);
        } catch (err) {
            console.error('Error fetching today\'s leaves:', err);
        } finally {
            setLoadingLeaves(false);
        }
    };

    // Settings Modal States
    const [isSettingsOpen, setSettingsOpen] = React.useState(false);
    const [isAnalyticsOpen, setAnalyticsOpen] = React.useState(false);
    const [settingsForm, setSettingsForm] = React.useState(() => {
        const saved = localStorage.getItem('system_settings');
        return saved ? JSON.parse(saved) : {
            lateTime: '09:30',
            autoCheckIn: true,
            ipRestriction: false,
            allowedIp: '192.168.1.1',
            workingHoursRequired: '8',
        };
    });
    const [settingsSaving, setSettingsSaving] = React.useState(false);
    const [settingsSuccess, setSettingsSuccess] = React.useState(false);

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

    React.useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            try {
                // Fetch Stats
                const statsRes = await fetch('http://localhost:5000/api/admin/stats', {
                    headers: { 'x-auth-token': token }
                });
                const statsJson = await statsRes.json();

                setStatsData(statsJson);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const stats = [
        {
            title: 'Total Employees',
            value: statsData.totalEmployees,
            change: '+12%',
            isPositive: true,
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-50'
        },
        {
            title: 'Today Present',
            value: statsData.presentToday,
            change: '+5%',
            isPositive: true,
            icon: CalendarCheck,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50'
        },
        {
            title: 'On Leave',
            value: statsData.onLeave,
            change: '-2%',
            isPositive: false,
            icon: UserMinus,
            color: 'text-rose-600',
            bg: 'bg-rose-50'
        },
        {
            title: 'Late Arrivals',
            value: statsData.lateToday,
            change: '+1%',
            isPositive: false,
            icon: Clock,
            color: 'text-amber-600',
            bg: 'bg-amber-50'
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">System Overview</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Good morning, Admin. Here's what's happening today.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-slate-100">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`} alt="User" />
                            </div>
                        ))}
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-500">
                            +120
                        </div>
                    </div>
                    <button 
                        onClick={handleDownloadReport}
                        disabled={downloadingReport}
                        className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-2 disabled:opacity-75"
                    >
                        {downloadingReport ? (
                            <>
                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Generating...
                            </>
                        ) : (
                            "Download Report"
                        )}
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="glass-card p-6 border-slate-100 hover:border-indigo-100 transition-all duration-300 group cursor-pointer hover:shadow-xl hover:shadow-indigo-50/50">
                        {isLoading ? (
                            <div className="animate-pulse space-y-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-2xl"></div>
                                <div className="space-y-2">
                                    <div className="h-2 w-16 bg-slate-100 rounded"></div>
                                    <div className="h-6 w-10 bg-slate-200 rounded"></div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} transition-colors group-hover:bg-indigo-600 group-hover:text-white duration-300`}>
                                        <stat.icon size={22} />
                                    </div>
                                    <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full ${stat.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                        {stat.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                        {stat.change}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">{stat.title}</h3>
                                    <p className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-[11px] font-medium text-slate-400">
                                    <span>View details</span>
                                    <TrendingUp size={14} />
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Recent Activity & Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Colorful Analytics Graph & Insights (lg:col-span-2) */}
                <div className="lg:col-span-2 glass-card p-8 border-slate-100 bg-white flex flex-col justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Attendance Analytics Trend</h3>
                            <p className="text-slate-500 text-xs font-medium">Daily presence percentage and pattern analysis for the last 7 days.</p>
                        </div>
                        <div className="flex items-center gap-3 text-[9px] font-bold text-slate-400 shrink-0">
                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-md bg-gradient-to-r from-emerald-400 to-teal-500"></div><span>Optimal (&gt;=80%)</span></div>
                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-md bg-gradient-to-r from-indigo-400 to-blue-500"></div><span>Moderate</span></div>
                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-md bg-gradient-to-r from-rose-400 to-pink-500"></div><span>Action Needed</span></div>
                        </div>
                    </div>

                    {/* Colorful Graph */}
                    <div className="h-64 flex items-end justify-between gap-3 px-2 mb-8 bg-slate-50/50 border border-slate-100 rounded-3xl p-6 relative">
                        {(statsData.weeklyTrend || []).map((d, i) => {
                            let barColorClass = "from-indigo-400 to-blue-500";
                            let labelColor = "text-indigo-600 bg-indigo-50";

                            if (d.val >= 80) {
                                barColorClass = "from-emerald-400 to-teal-500";
                                labelColor = "text-emerald-600 bg-emerald-50";
                            } else if (d.val < 50) {
                                barColorClass = "from-rose-400 to-pink-500";
                                labelColor = "text-rose-600 bg-rose-50";
                            }

                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-3 group h-full justify-end">
                                    <div className="w-full relative flex items-end justify-center h-40">
                                        <div className="w-full bg-slate-100/70 rounded-t-xl h-full absolute top-0 left-0"></div>
                                        
                                        {/* Animated Active Bar */}
                                        <div
                                            style={{ height: `${d.val}%` }}
                                            className={`w-full bg-gradient-to-t ${barColorClass} rounded-t-xl transition-all duration-1000 group-hover:brightness-110 relative z-10 shadow-md`}
                                        >
                                            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded transition-opacity whitespace-nowrap z-20">
                                                {d.val}%
                                            </div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-white absolute top-1.5 left-1/2 -translate-x-1/2 opacity-70"></div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${labelColor}`}>{d.val}%</span>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{d.day}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Key Metrics row */}
                    {(() => {
                        const activeDays = (statsData.weeklyTrend || []).filter(d => d.day !== 'Sat' && d.day !== 'Sun');
                        const totalVal = activeDays.reduce((acc, curr) => acc + curr.val, 0);
                        const avgAttendance = activeDays.length > 0 ? Math.round(totalVal / activeDays.length) : 0;

                        let peakDay = { day: 'N/A', val: 0 };
                        let lowestDay = { day: 'N/A', val: 100 };
                        
                        activeDays.forEach(d => {
                            if (d.val > peakDay.val) peakDay = d;
                            if (d.val < lowestDay.val) lowestDay = d;
                        });

                        let statusMsg = "Stable & Optimal";
                        let descMsg = "Attendance remains robust throughout the week, showing excellent employee compliance and operational consistency.";
                        let statusBg = "bg-emerald-50 text-emerald-600 border-emerald-100";

                        if (avgAttendance < 50) {
                            statusMsg = "Critical Intervention Required";
                            descMsg = "Attendance rates are significantly below target guidelines. Immediate managerial review is recommended.";
                            statusBg = "bg-rose-50 text-rose-600 border-rose-100";
                        } else if (avgAttendance < 80) {
                            statusMsg = "Action Recommended";
                            descMsg = "Overall attendance is stable but shows regular minor drops on midweek periods. Review daily work logs.";
                            statusBg = "bg-amber-50 text-amber-600 border-amber-100";
                        }

                        return (
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">Average Weekday</span>
                                        <span className="text-xl font-black text-slate-800 leading-none">{avgAttendance}%</span>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">Peak Day</span>
                                        <span className="text-xl font-black text-emerald-600 leading-none">{peakDay.day} ({peakDay.val}%)</span>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">Lowest Day</span>
                                        <span className="text-xl font-black text-rose-600 leading-none">{lowestDay.day} ({lowestDay.val}%)</span>
                                    </div>
                                </div>
                                <div className={`p-4 rounded-2xl border ${statusBg} text-left`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-2.5 h-2.5 rounded-full bg-current animate-pulse"></div>
                                        <span className="text-xs font-black uppercase tracking-wider leading-none">{statusMsg}</span>
                                    </div>
                                    <p className="text-[11px] font-medium leading-relaxed opacity-90">{descMsg}</p>
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* Right Column containing both Quick Actions and QR Code */}
                <div className="space-y-8 flex flex-col">
                    {/* Quick Actions Card */}
                    <div className="glass-card p-8 border-slate-100 h-fit">
                        <h3 className="text-lg font-bold text-slate-800 mb-6">Quick Actions</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {[
                                { label: "Today's Present", color: 'bg-emerald-50 text-emerald-600', path: 'present' },
                                { label: 'Add User', color: 'bg-indigo-50 text-indigo-600', path: '/admin/add-employee' },
                                { label: "Today's Leaves", color: 'bg-rose-50 text-rose-600', path: 'leaves' },
                                { label: 'Reports', color: 'bg-emerald-50 text-emerald-600', path: '/admin/attendance' },
                                { label: 'Settings', color: 'bg-slate-50 text-slate-600', path: '/admin' },
                            ].map((action, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        if (action.label === "Today's Present") {
                                            fetchPresentEmployees();
                                        } else if (action.label === "Today's Leaves") {
                                            fetchLeavesEmployees();
                                        } else if (action.label === 'Settings') {
                                            setSettingsOpen(true);
                                        } else {
                                            navigate(action.path);
                                        }
                                    }}
                                    disabled={
                                        (action.label === "Today's Present" && loadingPresent) ||
                                        (action.label === "Today's Leaves" && loadingLeaves)
                                    }
                                    className={`p-4 rounded-2xl ${action.color} flex items-center justify-between hover:scale-105 transition-all duration-300 shadow-sm shadow-black/5 w-full border-0 cursor-pointer focus:outline-none disabled:opacity-70`}
                                >
                                    <span className="text-[11px] font-black uppercase tracking-widest">
                                        {action.label === "Today's Present" && loadingPresent ? (
                                            <span className="flex items-center gap-2">
                                                <span className="w-3.5 h-3.5 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin"></span>
                                                Loading...
                                            </span>
                                        ) : action.label === "Today's Leaves" && loadingLeaves ? (
                                            <span className="flex items-center gap-2">
                                                <span className="w-3.5 h-3.5 border-2 border-rose-600/30 border-t-rose-600 rounded-full animate-spin"></span>
                                                Loading...
                                            </span>
                                        ) : action.label}
                                    </span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-current opacity-40"></div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dynamic QR Check-In Card */}
                    <div className="glass-card p-8 border-slate-100 h-fit bg-white flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 ring-4 ring-indigo-50/50">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-qr-code"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v-3"/><path d="M12 7v3"/><path d="M12 12v3"/><path d="M16 12h-4"/><path d="M21 12h-1"/><path d="M12 3h.01"/><path d="M12 16h.01"/><path d="M16 16h.01"/><path d="M16 7h.01"/><path d="M21 7h.01"/></svg>
                        </div>
                        <h3 className="text-base font-bold text-slate-800 mb-1">Dynamic QR Check-In</h3>
                        <p className="text-slate-400 text-xs font-semibold max-w-[220px] mb-6 font-sans">Scan this QR code with your phone camera or custom app to check in instantly.</p>
                        
                        {/* QR Code Wrapper with subtle glowing ring */}
                        <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-md shadow-indigo-100/50 mb-6 hover:shadow-lg hover:shadow-indigo-100 transition-all duration-300 relative group overflow-hidden">
                            {loadingQr && (
                                <div className="absolute inset-0 bg-white/75 backdrop-blur-sm flex items-center justify-center z-10">
                                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                            <img 
                                src={dynamicQr ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(dynamicQr.qrUrl)}` : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent('http://localhost:5173/employee?qr=true')}`} 
                                alt="Attendance QR Code"
                                className="w-48 h-48 block rounded-2xl select-none"
                            />
                        </div>
                        
                        {/* Countdown Timer Progress Bar */}
                        <div className="w-full space-y-2 mb-6">
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                    className="bg-indigo-600 h-full transition-all duration-1000 ease-linear rounded-full" 
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <span>Refreshing in {formatTime(countdown)}</span>
                                <button 
                                    type="button"
                                    onClick={fetchDynamicQrToken} 
                                    disabled={loadingQr}
                                    className="text-indigo-600 hover:text-indigo-700 bg-transparent border-0 cursor-pointer font-black uppercase tracking-wider text-[10px]"
                                >
                                    Refresh
                                </button>
                            </div>
                        </div>
                        
                        <a 
                            href={dynamicQr ? `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(dynamicQr.qrUrl)}` : '#'}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn-primary py-2.5 px-6 text-xs font-bold w-full uppercase tracking-wider flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-printer"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
                            Print QR Code
                        </a>
                    </div>
                </div>
            </div>



        {/* Settings Modal */}
            {isSettingsOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden transform transition-all duration-300 animate-in zoom-in-95">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl animate-pulse">
                                    <Settings size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">System Settings</h3>
                                    <p className="text-slate-500 text-[10px] font-bold">Configure attendance guidelines.</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSettingsOpen(false)}
                                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all"
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
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Late Arrival Threshold</label>
                                    <div className="relative group">
                                        <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                                        <input
                                            type="time"
                                            value={settingsForm.lateTime}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, lateTime: e.target.value })}
                                            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-slate-50/50 text-xs font-bold text-slate-700"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Minimum Daily Hours</label>
                                    <div className="relative group">
                                        <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                                        <input
                                            type="number"
                                            min="1"
                                            max="24"
                                            value={settingsForm.workingHoursRequired}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, workingHoursRequired: e.target.value })}
                                            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-slate-50/50 text-xs font-bold text-slate-700"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="pt-2 flex items-center justify-between">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-800">Auto Check-in on Login</label>
                                        <p className="text-slate-400 text-[10px]">Automatically mark presence upon logging in.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSettingsForm({ ...settingsForm, autoCheckIn: !settingsForm.autoCheckIn })}
                                        className={`w-11 h-6 rounded-full transition-all duration-300 relative focus:outline-none ${
                                            settingsForm.autoCheckIn ? 'bg-indigo-600' : 'bg-slate-200'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all duration-300 ${
                                            settingsForm.autoCheckIn ? 'left-5.5' : 'left-0.5'
                                        }`} />
                                    </button>
                                </div>

                                <div className="border-t border-slate-50 pt-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-800">IP Restrict Check-In</label>
                                            <p className="text-slate-400 text-[10px]">Only allow check-in from company WiFi.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSettingsForm({ ...settingsForm, ipRestriction: !settingsForm.ipRestriction })}
                                            className={`w-11 h-6 rounded-full transition-all duration-300 relative focus:outline-none ${
                                                settingsForm.ipRestriction ? 'bg-indigo-600' : 'bg-slate-200'
                                            }`}
                                        >
                                            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all duration-300 ${
                                                settingsForm.ipRestriction ? 'left-5.5' : 'left-0.5'
                                            }`} />
                                        </button>
                                    </div>

                                    {settingsForm.ipRestriction && (
                                        <div className="space-y-1 animate-in slide-in-from-top duration-300">
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Allowed IP Address</label>
                                            <input
                                                type="text"
                                                value={settingsForm.allowedIp}
                                                onChange={(e) => setSettingsForm({ ...settingsForm, allowedIp: e.target.value })}
                                                placeholder="192.168.1.1"
                                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-slate-50/50 text-xs font-bold text-slate-700"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-50">
                                <button
                                    type="button"
                                    onClick={() => setSettingsOpen(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs transition-all uppercase tracking-wider"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={settingsSaving}
                                    className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 font-bold text-xs transition-all flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-75"
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

            {/* End of Settings Modal */}

            {/* Today's Present Employees Modal */}
            {showPresentModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-100 overflow-hidden transform transition-all duration-300 animate-in zoom-in-95 flex flex-col max-h-[85vh]">
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                                    <CalendarCheck size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Today's Present Employees</h3>
                                    <p className="text-slate-500 text-[10px] font-bold">
                                        Showing {presentEmployees.filter(item => 
                                            (item.name || '').toLowerCase().includes(presentSearchQuery.toLowerCase()) ||
                                            (item.department || '').toLowerCase().includes(presentSearchQuery.toLowerCase()) ||
                                            (item.employee_id || '').toLowerCase().includes(presentSearchQuery.toLowerCase())
                                        ).length} of {presentEmployees.length} employees checked in today.
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => {
                                    setShowPresentModal(false);
                                    setPresentSearchQuery('');
                                }}
                                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Search and Filters */}
                        <div className="p-4 border-b border-slate-50 bg-white">
                            <div className="relative group">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search by name, department, or employee ID..."
                                    value={presentSearchQuery}
                                    onChange={(e) => setPresentSearchQuery(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-slate-50/50 text-xs font-bold text-slate-700 placeholder:text-slate-400"
                                />
                                {presentSearchQuery && (
                                    <button
                                        onClick={() => setPresentSearchQuery('')}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            {(() => {
                                const filtered = presentEmployees.filter(item => 
                                    (item.name || '').toLowerCase().includes(presentSearchQuery.toLowerCase()) ||
                                    (item.department || '').toLowerCase().includes(presentSearchQuery.toLowerCase()) ||
                                    (item.employee_id || '').toLowerCase().includes(presentSearchQuery.toLowerCase())
                                );

                                if (filtered.length > 0) {
                                    return (
                                        <div className="space-y-3">
                                            {filtered.map((item, i) => (
                                                <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-slate-50/50 transition-all duration-300">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shrink-0">
                                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.name}`} alt={item.name} />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-black text-slate-900 leading-none mb-1.5">{item.name}</h4>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="text-[9px] text-indigo-600 font-black bg-indigo-50 px-1.5 py-0.5 rounded-md uppercase tracking-wider">{item.employee_id || 'No ID'}</span>
                                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{item.department || 'General'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <div className="flex items-center gap-1 justify-end mb-1">
                                                                <Clock size={12} className="text-slate-400" />
                                                                <span className="text-[11px] font-black text-slate-900 leading-none">
                                                                    {item.check_in ? new Date(item.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--'}
                                                                </span>
                                                            </div>
                                                            <span className={`inline-block text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                                                (item.status || '').toLowerCase() === 'late'
                                                                    ? 'bg-amber-50 text-amber-600 border-amber-200'
                                                                    : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                            }`}>
                                                                {item.status}
                                                            </span>
                                                        </div>
                                                        
                                                        <div className="shrink-0">
                                                            {item.latitude && item.longitude ? (
                                                                <a
                                                                    href={`https://maps.google.com/?q=${item.latitude},${item.longitude}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100 transition-all duration-300 flex items-center justify-center hover:scale-105"
                                                                    title="View Map Location"
                                                                >
                                                                    <MapPin size={14} />
                                                                </a>
                                                            ) : (
                                                                <div 
                                                                    className="p-2.5 rounded-xl bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed flex items-center justify-center"
                                                                    title="No GPS location data recorded"
                                                                >
                                                                    <MapPin size={14} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div className="text-center py-16 px-4">
                                            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                                <Users size={28} />
                                            </div>
                                            <h3 className="text-sm font-black text-slate-800 mb-1">No present employees found</h3>
                                            <p className="text-slate-400 text-xs font-medium max-w-sm mx-auto">
                                                {presentSearchQuery 
                                                    ? `No match found for "${presentSearchQuery}". Try another search term.`
                                                    : "Nobody has checked in present or late so far today."
                                                }
                                            </p>
                                        </div>
                                    );
                                }
                            })()}
                        </div>
                        
                        {/* Footer */}
                        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => {
                                    setShowPresentModal(false);
                                    setPresentSearchQuery('');
                                }}
                                className="py-2.5 px-6 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs transition-all uppercase tracking-wider"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Today's Leaves / Absentees Modal */}
            {showLeavesModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-100 overflow-hidden transform transition-all duration-300 animate-in zoom-in-95 flex flex-col max-h-[85vh]">
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                                    <Clock size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Today's Leaves / Absentees</h3>
                                    <p className="text-slate-500 text-[10px] font-bold">
                                        Showing {leavesEmployees.filter(item => 
                                            (item.name || '').toLowerCase().includes(leavesSearchQuery.toLowerCase()) ||
                                            (item.department || '').toLowerCase().includes(leavesSearchQuery.toLowerCase()) ||
                                            (item.employee_id || '').toLowerCase().includes(leavesSearchQuery.toLowerCase())
                                        ).length} of {leavesEmployees.length} employees on leave today.
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => {
                                    setShowLeavesModal(false);
                                    setLeavesSearchQuery('');
                                }}
                                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Search and Filters */}
                        <div className="p-4 border-b border-slate-50 bg-white">
                            <div className="relative group">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search by name, department, or employee ID..."
                                    value={leavesSearchQuery}
                                    onChange={(e) => setLeavesSearchQuery(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-slate-50/50 text-xs font-bold text-slate-700 placeholder:text-slate-400"
                                />
                                {leavesSearchQuery && (
                                    <button
                                        onClick={() => setLeavesSearchQuery('')}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            {(() => {
                                const filtered = leavesEmployees.filter(item => 
                                    (item.name || '').toLowerCase().includes(leavesSearchQuery.toLowerCase()) ||
                                    (item.department || '').toLowerCase().includes(leavesSearchQuery.toLowerCase()) ||
                                    (item.employee_id || '').toLowerCase().includes(leavesSearchQuery.toLowerCase())
                                );

                                if (filtered.length > 0) {
                                    return (
                                        <div className="space-y-3">
                                            {filtered.map((item, i) => (
                                                <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-rose-100 hover:bg-slate-50/50 transition-all duration-300">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shrink-0">
                                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.name}`} alt={item.name} />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-black text-slate-900 leading-none mb-1.5">{item.name}</h4>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="text-[9px] text-indigo-600 font-black bg-indigo-50 px-1.5 py-0.5 rounded-md uppercase tracking-wider">{item.employee_id || 'No ID'}</span>
                                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{item.department || 'General'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-4">
                                                        <span className="inline-block text-[8px] font-black uppercase tracking-wider px-3 py-1 rounded-full border bg-rose-50 text-rose-600 border-rose-200 shadow-sm font-sans">
                                                            On Leave / Absent
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div className="text-center py-16 px-4">
                                            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                                                <Users size={28} />
                                            </div>
                                            <h3 className="text-sm font-black text-slate-800 mb-1">Excellent! No leaves today</h3>
                                            <p className="text-slate-400 text-xs font-medium max-w-sm mx-auto font-sans">
                                                {leavesSearchQuery 
                                                    ? `No match found for "${leavesSearchQuery}". Try another search term.`
                                                    : "Everyone is present! 100% employee check-in rate achieved today."
                                                }
                                            </p>
                                        </div>
                                    );
                                }
                            })()}
                        </div>
                        
                        {/* Footer */}
                        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => {
                                    setShowLeavesModal(false);
                                    setLeavesSearchQuery('');
                                }}
                                className="py-2.5 px-6 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs transition-all uppercase tracking-wider"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
