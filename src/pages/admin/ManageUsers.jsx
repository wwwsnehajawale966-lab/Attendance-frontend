import React, { useState, useEffect } from 'react';
import { 
    User, 
    Mail, 
    Shield, 
    Trash2, 
    Edit, 
    Search, 
    Calendar, 
    Filter, 
    FileText, 
    Clock, 
    CheckCircle2, 
    X, 
    MapPin, 
    Download, 
    AlertCircle,
    TrendingUp,
    LogIn,
    LogOut
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const AnalyticsChart = ({ logs }) => {
    if (!logs || logs.length === 0) return null;

    // Chronological order (oldest to newest)
    const sortedLogs = logs.slice().reverse();

    // Map logs to parsed hours and calculate running attendance rate
    let runningPresents = 0;
    let runningTotal = 0;

    const data = sortedLogs.map((item) => {
        let hours = 0;
        if (item.working_hours && item.working_hours !== '--') {
            const match = item.working_hours.match(/(\d+)h\s*(\d+)m/);
            if (match) {
                hours = parseInt(match[1], 10) + parseInt(match[2], 10) / 60;
            } else {
                const hMatch = item.working_hours.match(/(\d+)h/);
                if (hMatch) hours = parseInt(hMatch[1], 10);
            }
        }

        // Running presence rate: Status 'Present' or 'Late' means they checked in.
        const isPresent = item.status === 'Present' || item.status === 'Late';
        if (isPresent) {
            runningPresents++;
        }
        runningTotal++;
        const cumulativeRate = Math.round((runningPresents / runningTotal) * 100);

        return {
            date: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            hours: parseFloat(hours.toFixed(2)),
            rate: cumulativeRate,
            status: item.status,
            dayName: item.dayName
        };
    });

    // Chart dimensions
    const width = 1000;
    const height = 300;
    const paddingLeft = 60;
    const paddingRight = 60;
    const paddingTop = 50;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Max limits for axes
    const maxHours = 12; // Standard shift is 9 hours, so 12 is perfect max
    const maxRate = 100;

    // Calculate coordinates for bars and line points
    const stepX = chartWidth / (data.length - 1 || 1);

    const points = data.map((item, index) => {
        const x = paddingLeft + index * stepX;
        // hours mapped from 0-12 to chartHeight-0
        const barHeight = (item.hours / maxHours) * chartHeight;
        const yBar = paddingTop + chartHeight - barHeight;
        
        // rate mapped from 0-100 to chartHeight-0
        const yRate = paddingTop + chartHeight - (item.rate / maxRate) * chartHeight;

        return { x, yBar, barHeight, yRate, ...item };
    });

    // Generate Path for cumulative rate line
    let linePath = '';
    if (points.length > 0) {
        linePath = `M ${points[0].x} ${points[0].yRate}`;
        for (let i = 1; i < points.length; i++) {
            linePath += ` L ${points[i].x} ${points[i].yRate}`;
        }
    }

    return (
        <div className="glass-card bg-white border-slate-100 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h4 className="text-sm font-bold text-[#1b5d55]">Attendance & Productivity Analysis</h4>
                    <p className="text-slate-500 text-xs">Daily hours worked vs cumulative attendance trend</p>
                </div>
                {/* Legend */}
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-gradient-to-t from-sky-400 to-blue-600 rounded-sm"></div>
                        <span>Hours Worked</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-0.5 bg-rose-500 relative flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 absolute"></div>
                        </div>
                        <span>Attendance Accuracy %</span>
                    </div>
                </div>
            </div>

            <div className="relative w-full overflow-x-auto">
                <svg className="w-full min-w-[800px]" height={height} viewBox={`0 0 ${width} ${height}`}>
                    <defs>
                        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#38bdf8" />
                            <stop offset="100%" stopColor="#1d4ed8" />
                        </linearGradient>
                    </defs>

                    {/* Horizontal Grid Lines */}
                    {[0, 3, 6, 9, 12].map((val, idx) => {
                        const y = paddingTop + chartHeight - (val / maxHours) * chartHeight;
                        return (
                            <g key={idx}>
                                <line 
                                    x1={paddingLeft} 
                                    y1={y} 
                                    x2={width - paddingRight} 
                                    y2={y} 
                                    stroke="#f1f5f9" 
                                    strokeWidth="1" 
                                    strokeDasharray="4 4" 
                                />
                                {/* Left Y Axis Labels */}
                                <text 
                                    x={paddingLeft - 10} 
                                    y={y + 4} 
                                    textAnchor="end" 
                                    className="text-[9px] font-black text-slate-400 font-sans"
                                >
                                    {val}h
                                </text>
                                {/* Right Y Axis Labels */}
                                <text 
                                    x={width - paddingRight + 10} 
                                    y={y + 4} 
                                    textAnchor="start" 
                                    className="text-[9px] font-black text-slate-400 font-sans"
                                >
                                    {Math.round((val / maxHours) * 100)}%
                                </text>
                            </g>
                        );
                    })}

                    {/* Bars (Hours Worked) */}
                    {points.map((pt, idx) => {
                        // Width of bar calculated dynamically based on steps
                        const barWidth = Math.max(8, Math.min(30, stepX * 0.4));
                        return (
                            <g key={idx} className="group cursor-pointer">
                                <title>{`${pt.dayName}, ${pt.date}\nHours: ${pt.hours}h\nAttendance Rate: ${pt.rate}%`}</title>
                                <rect 
                                    x={pt.x - barWidth / 2} 
                                    y={pt.yBar} 
                                    width={barWidth} 
                                    height={pt.barHeight} 
                                    fill="url(#barGrad)" 
                                    rx="3" 
                                    ry="3"
                                    className="transition-all duration-300 hover:opacity-85"
                                />
                                {/* Text value on top of bar */}
                                {pt.hours > 0 && (
                                    <text 
                                        x={pt.x} 
                                        y={pt.yBar - 6} 
                                        textAnchor="middle" 
                                        className="text-[8px] font-black text-blue-900 font-mono opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        {pt.hours}h
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* Trend Line (Cumulative Attendance) */}
                    {points.length > 1 && (
                        <path 
                            d={linePath} 
                            fill="none" 
                            stroke="#f43f5e" 
                            strokeWidth="2.5" 
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="drop-shadow-[0_2px_4px_rgba(244,63,94,0.3)]"
                        />
                    )}

                    {/* Trend Dots */}
                    {points.map((pt, idx) => (
                        <g key={idx} className="group cursor-pointer">
                            <title>{`Cumulative Attendance: ${pt.rate}%`}</title>
                            <circle 
                                cx={pt.x} 
                                cy={pt.yRate} 
                                r="4" 
                                fill="#ffffff" 
                                stroke="#f43f5e" 
                                strokeWidth="2.5" 
                                className="transition-all duration-300 hover:r-6"
                            />
                            <text
                                x={pt.x}
                                y={pt.yRate - 8}
                                textAnchor="middle"
                                className="text-[8px] font-black text-rose-600 font-mono opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                {pt.rate}%
                            </text>
                        </g>
                    ))}

                    {/* X Axis Labels */}
                    {points.map((pt, idx) => {
                        // Reduce label density if too many items
                        const showLabel = points.length < 15 || idx % Math.ceil(points.length / 10) === 0 || idx === points.length - 1;
                        if (!showLabel) return null;
                        return (
                            <text 
                                key={idx} 
                                x={pt.x} 
                                y={height - paddingBottom + 20} 
                                textAnchor="middle" 
                                className="text-[9px] font-black text-slate-400 font-sans"
                            >
                                {pt.date}
                            </text>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const token = localStorage.getItem('token');

    // Detailed Analytics Modal States
    const [isAnalyticsOpen, setAnalyticsOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });

    // Edit Employee States
    const [isEditOpen, setEditOpen] = useState(false);
    const [editEmployeeData, setEditEmployeeData] = useState({
        id: '',
        name: '',
        email: '',
        department: '',
        role: 'employee',
        phone: '',
        gender: ''
    });
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState('');

    const fetchUsers = async () => {
        try {
            const res = await fetch('https://attendance-backend-0jxv.onrender.com/api/admin/employees', {
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this employee?')) return;
        try {
            await fetch(`https://attendance-backend-0jxv.onrender.com/api/admin/employee/${id}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });
            fetchUsers();
        } catch (err) {
            console.error('Error deleting user:', err);
        }
    };

    const fetchAnalytics = async (employeeId, startStr = '', endStr = '') => {
        setAnalyticsLoading(true);
        try {
            let url = `https://attendance-backend-0jxv.onrender.com/api/admin/employee/${employeeId}/analytics`;
            const params = new URLSearchParams();
            if (startStr) params.append('startDate', startStr);
            if (endStr) params.append('endDate', endStr);
            
            const queryStr = params.toString();
            if (queryStr) url += `?${queryStr}`;

            const res = await fetch(url, {
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();
            if (res.ok) {
                setAnalyticsData(data);
                // Set default dates returned by backend if no filters applied
                if (data.logs && data.logs.length > 0) {
                    const returnedStart = data.logs[data.logs.length - 1].date;
                    const returnedEnd = data.logs[0].date;
                    setDateRange({
                        startDate: startStr || returnedStart,
                        endDate: endStr || returnedEnd
                    });
                }
            } else {
                console.error('Failed to fetch analytics:', data.message);
            }
        } catch (err) {
            console.error('Error fetching analytics:', err);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    const handleViewMore = (employee) => {
        setSelectedEmployee(employee);
        setAnalyticsData(null);
        setDateRange({ startDate: '', endDate: '' });
        if (employee.status !== 'pending') {
            fetchAnalytics(employee.id);
        }
        setAnalyticsOpen(true);
    };

    const handleApprove = async (userId) => {
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
                setAnalyticsOpen(false);
                fetchUsers();
            } else {
                alert(data.message || 'Failed to approve employee');
            }
        } catch (err) {
            console.error('Error approving employee:', err);
        }
    };

    const handleReject = async (userId) => {
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
                setAnalyticsOpen(false);
                fetchUsers();
            } else {
                alert(data.message || 'Failed to reject employee');
            }
        } catch (err) {
            console.error('Error rejecting employee:', err);
        }
    };

    const handleApplyFilters = () => {
        if (selectedEmployee) {
            fetchAnalytics(selectedEmployee.id, dateRange.startDate, dateRange.endDate);
        }
    };

    const handleEditClick = (employee) => {
        setEditEmployeeData({
            id: employee.id,
            name: employee.name || '',
            email: employee.email || '',
            department: employee.department || '',
            role: employee.role || 'employee',
            phone: employee.phone || '',
            gender: employee.gender || ''
        });
        setUpdateError('');
        setEditOpen(true);
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        setUpdateError('');
        try {
            const res = await fetch(`https://attendance-backend-0jxv.onrender.com/api/admin/employee/${editEmployeeData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(editEmployeeData)
            });
            const data = await res.json();
            if (res.ok) {
                setEditOpen(false);
                fetchUsers(); // Refresh the list
            } else {
                setUpdateError(data.message || 'Failed to update employee');
            }
        } catch (err) {
            console.error('Error updating employee:', err);
            setUpdateError('Failed to update employee. Please check network connection.');
        } finally {
            setIsUpdating(false);
        }
    };

    const exportAnalyticsCSV = () => {
        if (!analyticsData || !selectedEmployee) return;

        const emp = analyticsData.employee;
        const stats = analyticsData.summary;

        // 1. Define Headers
        const headers = [
            "Date",
            "Day Name",
            "Check-In Time",
            "Check-Out Time",
            "Working Hours",
            "Status",
            "Method",
            "Late/Early Status",
            "Extra Working Time"
        ];

        // 2. Define rows mapping the logs
        const csvRows = analyticsData.logs.map(item => {
            const checkInTime = item.check_in ? new Date(item.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';
            const checkOutTime = item.check_out ? new Date(item.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';
            
            return [
                item.date,
                item.dayName,
                checkInTime,
                checkOutTime,
                item.working_hours || '--',
                item.status,
                item.attendance_method || 'TOGGLE',
                item.late_early_status || 'N/A',
                item.extra_working_time || 'N/A'
            ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
        });

        // 3. Add metadata header to the top of the CSV for a premium report look!
        const metaRows = [
            `"Employee Name:","${emp.name}"`,
            `"Employee ID:","${emp.employee_id || 'N/A'}"`,
            `"Department:","${emp.department || 'N/A'}"`,
            `"Date Range:","${dateRange.startDate} to ${dateRange.endDate}"`,
            `"Email:","${emp.email}"`,
            `""`,
            `"SUMMARY STATISTICS"`,
            `"Present Days:","${stats.totalPresent}","Late Days:","${stats.totalLate}","Working Hours:","${stats.totalWorkingHours}"`,
            `"Absent Days:","${stats.totalAbsent}","Weekend Days:","${stats.totalWeekend}","Extra Hours:","${stats.extraWorkingHours}"`,
            `"Leave Days:","${stats.totalLeave}","Holiday Days:","${stats.totalHoliday}","Avg Daily Hours:","${stats.averageWorkingHours}"`,
            `""`,
            headers.join(',')
        ];

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [...metaRows, ...csvRows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Attendance_Analytics_${emp.employee_id || emp.name.replace(/\s+/g, '_')}_${dateRange.startDate}_${dateRange.endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderLateEarlyBadge = (status) => {
        if (!status || status === 'N/A') return <span className="text-slate-400">N/A</span>;
        if (status.includes('Late')) return <span className="text-rose-600 font-bold">{status}</span>;
        if (status.includes('Early')) return <span className="text-emerald-600 font-bold">{status}</span>;
        return <span className="text-slate-600 font-medium">{status}</span>;
    };

    const renderExtraWorkBadge = (extra) => {
        if (!extra || extra === 'N/A') return <span className="text-slate-400">N/A</span>;
        return <span className="text-teal-500 font-bold">{extra}</span>;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#1b5d55] tracking-tight">Manage Employees</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Total {users.length} registered employees.</p>
                </div>
                <div className="relative group min-w-[300px]">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400 transition-all bg-white text-sm"
                    />
                </div>
            </div>

            <div className="glass-card bg-white border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-black uppercase text-slate-400 tracking-widest">
                                <th className="px-6 py-4">Employee</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Department</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse"><td colSpan="4" className="px-6 py-4"><div className="h-4 bg-slate-50 rounded w-full"></div></td></tr>
                                ))
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-500 font-bold overflow-hidden border border-teal-50">
                                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="avatar" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-[#154c46]">{user.name}</div>
                                                    <div className="text-[11px] font-black text-teal-500 tracking-wider uppercase">{user.employee_id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-slate-500 uppercase">{user.department || 'General'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${user.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                {user.status || 'Approved'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => handleViewMore(user)}
                                                    className="px-3.5 py-2 bg-teal-50 hover:bg-teal-500 text-teal-500 hover:text-white rounded-xl text-xs font-bold tracking-wider transition-all duration-300 border-0 cursor-pointer text-center shadow-sm"
                                                >
                                                    View More
                                                </button>
                                                <button 
                                                    onClick={() => handleEditClick(user)}
                                                    className="p-2 text-slate-400 hover:text-teal-500 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all cursor-pointer"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all font-bold cursor-pointer"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-20 text-center text-slate-400 text-sm">No employees found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detailed Attendance Analytics Modal */}
            {isAnalyticsOpen && (
                <div className="fixed inset-0 bg-[#154c46]/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full border border-slate-100 overflow-hidden transform transition-all duration-300 animate-in zoom-in-95 my-8 flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-500 font-bold overflow-hidden border border-teal-50">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedEmployee?.name}`} alt="avatar" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-[#1b5d55] uppercase tracking-wider leading-none mb-1.5">{selectedEmployee?.name}</h3>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-2 flex-wrap">
                                        <span>ID: {selectedEmployee?.employee_id || 'N/A'}</span>
                                        <span className="text-slate-300">•</span>
                                        <span>Dept: {selectedEmployee?.department || 'General'}</span>
                                        <span className="text-slate-300">•</span>
                                        <span>Phone: {selectedEmployee?.phone || 'N/A'}</span>
                                        <span className="text-slate-300">•</span>
                                        <span>Gender: {selectedEmployee?.gender || 'N/A'}</span>
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setAnalyticsOpen(false)}
                                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all border-0 bg-transparent cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Scrollable Container */}
                        <div className="p-8 overflow-y-auto space-y-6 flex-1">
                            {selectedEmployee?.status === 'pending' ? (
                                <div className="text-center py-10 space-y-6">
                                    <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <AlertCircle size={40} />
                                    </div>
                                    <h4 className="text-xl font-bold text-[#1b5d55]">Account Pending Approval</h4>
                                    <p className="text-slate-500 text-sm max-w-md mx-auto">This employee has requested an account. Approve to generate their Employee ID and grant access, or reject to remove their request.</p>
                                    <div className="flex items-center justify-center gap-4 pt-4">
                                        <button 
                                            onClick={() => handleReject(selectedEmployee.id)}
                                            className="px-6 py-3 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl text-sm font-bold transition-all border-0 cursor-pointer"
                                        >
                                            Reject Request
                                        </button>
                                        <button 
                                            onClick={() => handleApprove(selectedEmployee.id)}
                                            className="px-6 py-3 bg-teal-500 text-white hover:bg-teal-600 rounded-xl text-sm font-bold transition-all border-0 cursor-pointer shadow-md shadow-teal-50"
                                        >
                                            Approve Employee
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                            {/* Date Filter & PDF Button */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-50/60 rounded-2xl border border-slate-100">
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-white border border-slate-200 text-slate-400 rounded-lg">
                                            <Calendar size={14} />
                                        </div>
                                        <input
                                            type="date"
                                            value={dateRange.startDate}
                                            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                            className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl outline-none focus:border-teal-400"
                                        />
                                        <span className="text-slate-400 text-xs font-bold">to</span>
                                        <input
                                            type="date"
                                            value={dateRange.endDate}
                                            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                            className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl outline-none focus:border-teal-400"
                                        />
                                    </div>
                                    <button
                                        onClick={handleApplyFilters}
                                        disabled={analyticsLoading}
                                        className="px-4 py-2 bg-[#154c46] hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border-0"
                                    >
                                        <Filter size={14} />
                                        Apply Filters
                                    </button>
                                </div>
                                <div>
                                    <button 
                                        onClick={exportAnalyticsCSV}
                                        disabled={!analyticsData || analyticsLoading}
                                        className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border-0 cursor-pointer shadow-md shadow-teal-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <FileText size={14} />
                                        Export CSV Report
                                    </button>
                                </div>
                            </div>

                            {/* Summary Cards */}
                            {analyticsLoading ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                    {Array(6).fill(0).map((_, i) => (
                                        <div key={i} className="animate-pulse bg-slate-50 border border-slate-100 p-4 rounded-2xl h-20"></div>
                                    ))}
                                </div>
                            ) : analyticsData ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                    {[
                                        { title: 'Present Days', value: analyticsData.summary.totalPresent, color: 'text-blue-900', bg: 'bg-teal-50/70' },
                                        { title: 'Absent Days', value: analyticsData.summary.totalAbsent, color: 'text-blue-900', bg: 'bg-teal-50/70' },
                                        { title: 'Late Days', value: analyticsData.summary.totalLate, color: 'text-blue-900', bg: 'bg-teal-50/70' },
                                        { title: 'Total Hours', value: analyticsData.summary.totalWorkingHours, color: 'text-blue-900', bg: 'bg-teal-50/70' },
                                        { title: 'Extra Hours', value: analyticsData.summary.extraWorkingHours, color: 'text-blue-900', bg: 'bg-teal-50/70' },
                                        { title: 'Average Hours', value: analyticsData.summary.averageWorkingHours, color: 'text-blue-900', bg: 'bg-teal-50/70' },
                                    ].map((stat, i) => (
                                        <div key={i} className="glass-card p-4 border-slate-100 flex flex-col justify-between bg-white hover:border-teal-200 hover:bg-teal-50/20 transition-all duration-300">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{stat.title}</span>
                                            <div className="flex items-end justify-between">
                                                <span className={`text-base font-black ${stat.color} tracking-tight leading-none`}>{stat.value}</span>
                                                <div className={`p-1 rounded-lg ${stat.bg} ${stat.color}`}>
                                                    <TrendingUp size={12} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-slate-400">No stats available.</div>
                            )}

                            {/* Analytics Chart */}
                            {analyticsData && !analyticsLoading && (
                                <AnalyticsChart logs={analyticsData.logs} />
                            )}

                            {/* Detailed Attendance Table */}
                            <div className="glass-card bg-white border-slate-100 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-[#1b5d55]">Attendance Log History</h4>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Mon - Fri working days</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[900px]">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                <th className="px-6 py-4">Date</th>
                                                <th className="px-6 py-4">Day</th>
                                                <th className="px-6 py-4">Check-In</th>
                                                <th className="px-6 py-4">Check-Out</th>
                                                <th className="px-6 py-4">Working Hours</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4">Method</th>
                                                <th className="px-6 py-4">Late/Early Info</th>
                                                <th className="px-6 py-4">Extra Work</th>
                                                <th className="px-6 py-4 text-right">Location</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {analyticsLoading ? (
                                                Array(4).fill(0).map((_, i) => (
                                                    <tr key={i} className="animate-pulse"><td colSpan="10" className="px-6 py-4"><div className="h-4 bg-slate-50 rounded w-full"></div></td></tr>
                                                ))
                                            ) : analyticsData && analyticsData.logs.length > 0 ? (
                                                analyticsData.logs.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                                        <td className="px-6 py-4 text-xs font-bold text-[#154c46]">
                                                            {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </td>
                                                        <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">
                                                            {item.dayName}
                                                        </td>
                                                        <td className="px-6 py-4 text-xs font-bold text-slate-600">
                                                            {item.check_in ? (
                                                                <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg text-[9px] uppercase font-black">
                                                                    {new Date(item.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            ) : '--'}
                                                        </td>
                                                        <td className="px-6 py-4 text-xs font-bold text-slate-600">
                                                            {item.check_out ? (
                                                                <span className="inline-flex items-center gap-1 text-teal-500 bg-teal-50 px-2 py-0.5 rounded-lg text-[9px] uppercase font-black">
                                                                    {new Date(item.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            ) : '--'}
                                                        </td>
                                                        <td className="px-6 py-4 text-xs font-black text-blue-900">
                                                            {item.working_hours}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
                                                                item.status === 'Present' ? 'bg-emerald-50 text-emerald-600' :
                                                                item.status === 'Late' ? 'bg-amber-50 text-amber-600' :
                                                                item.status === 'Absent' ? 'bg-rose-50 text-rose-600' :
                                                                item.status === 'Leave' ? 'bg-teal-50 text-teal-500' :
                                                                item.status === 'Holiday' ? 'bg-purple-50 text-purple-600' :
                                                                'bg-slate-100 text-slate-500'
                                                            }`}>
                                                                {item.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
                                                                (item.attendance_method || 'TOGGLE') === 'QR' ? 'bg-purple-50 text-purple-600' :
                                                                (item.attendance_method || 'TOGGLE') === 'MANUAL' ? 'bg-amber-50 text-amber-600' :
                                                                'bg-slate-100 text-slate-500'
                                                            }`}>
                                                                {item.attendance_method || 'TOGGLE'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-xs font-medium">
                                                            {renderLateEarlyBadge(item.late_early_status)}
                                                        </td>
                                                        <td className="px-6 py-4 text-xs font-medium">
                                                            {renderExtraWorkBadge(item.extra_working_time)}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            {item.latitude && item.longitude ? (
                                                                <a 
                                                                    href={`https://maps.google.com/?q=${item.latitude},${item.longitude}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 hover:bg-teal-500 text-teal-500 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 border-0 cursor-pointer text-center"
                                                                >
                                                                    <MapPin size={10} />
                                                                    View Map
                                                                </a>
                                                            ) : (
                                                                <span className="text-slate-400 text-xs">N/A</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="10" className="px-6 py-12 text-center text-slate-400 text-xs">No records found for the selected period.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                                </>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end shrink-0">
                            <button
                                onClick={() => setAnalyticsOpen(false)}
                                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-all uppercase tracking-wider bg-white cursor-pointer border-solid"
                            >
                                Close Reports
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Employee Modal */}
            {isEditOpen && (
                <div className="fixed inset-0 bg-[#154c46]/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-100 overflow-hidden transform transition-all duration-300 animate-in zoom-in-95 my-8 flex flex-col">
                        {/* Modal Header */}
                        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                            <div>
                                <h3 className="text-base font-black text-[#1b5d55] uppercase tracking-wider leading-none">Edit Employee</h3>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mt-1.5">Modify account information</p>
                            </div>
                            <button 
                                onClick={() => setEditOpen(false)}
                                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all border-0 bg-transparent cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleUpdateSubmit} className="p-8 space-y-6">
                            {updateError && (
                                <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                    {updateError}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Full Name */}
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={editEmployeeData.name}
                                        onChange={(e) => setEditEmployeeData({ ...editEmployeeData, name: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400 transition-all text-xs font-semibold"
                                    />
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={editEmployeeData.email}
                                        onChange={(e) => setEditEmployeeData({ ...editEmployeeData, email: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400 transition-all text-xs font-semibold"
                                    />
                                </div>

                                {/* Phone */}
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Phone Number</label>
                                    <input
                                        type="text"
                                        value={editEmployeeData.phone}
                                        onChange={(e) => setEditEmployeeData({ ...editEmployeeData, phone: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400 transition-all text-xs font-semibold"
                                        placeholder="e.g. +91 9876543210"
                                    />
                                </div>

                                {/* Gender */}
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Gender</label>
                                    <select
                                        value={editEmployeeData.gender}
                                        onChange={(e) => setEditEmployeeData({ ...editEmployeeData, gender: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400 transition-all text-xs font-semibold text-slate-700 bg-white"
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                {/* Department */}
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Department</label>
                                    <select
                                        value={editEmployeeData.department}
                                        onChange={(e) => setEditEmployeeData({ ...editEmployeeData, department: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400 transition-all text-xs font-semibold text-slate-700 bg-white"
                                    >
                                        <option value="">Select Department</option>
                                        <option value="IT">IT Department</option>
                                        <option value="HR">Human Resources</option>
                                        <option value="Finance">Finance</option>
                                        <option value="Marketing">Marketing</option>
                                    </select>
                                </div>

                                {/* Role */}
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Role</label>
                                    <select
                                        value={editEmployeeData.role}
                                        onChange={(e) => setEditEmployeeData({ ...editEmployeeData, role: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400 transition-all text-xs font-semibold text-slate-700 bg-white"
                                    >
                                        <option value="employee">Employee</option>
                                        <option value="admin">Administrator</option>
                                    </select>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setEditOpen(false)}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-all uppercase tracking-wider bg-white cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-all border-0 cursor-pointer shadow-md shadow-teal-50 disabled:opacity-50"
                                >
                                    {isUpdating ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageUsers;
