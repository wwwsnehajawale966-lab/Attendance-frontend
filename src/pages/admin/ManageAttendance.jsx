import React, { useState, useEffect } from 'react';
import { Calendar, Filter, FileText, Search, Clock, CheckCircle2, User } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const ManageAttendance = () => {
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        userId: ''
    });
    const token = localStorage.getItem('token');

    const fetchReports = async () => {
        setIsLoading(true);
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const res = await fetch(`https://attendance-backend-0jxv.onrender.com/api/admin/report?${queryParams}`, {
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();
            setReports(data);
        } catch (err) {
            console.error('Error fetching reports:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const exportCSV = () => {
        const headers = [
            "Employee Name",
            "Employee ID",
            "Department",
            "Date",
            "Check-In Time",
            "Check-Out Time",
            "Working Hours",
            "Status",
            "Method",
            "Location",
            "Late/Early Status",
            "Extra Working Time"
        ];

        const csvRows = reports.map(item => {
            const checkInTime = item.check_in ? new Date(item.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';
            const checkOutTime = item.check_out ? new Date(item.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';
            const location = item.latitude && item.longitude ? `${item.latitude}, ${item.longitude}` : 'N/A';
            const dateStr = new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            
            return [
                item.name,
                item.employee_id,
                item.department || 'N/A',
                dateStr,
                checkInTime,
                checkOutTime,
                item.working_hours || '--',
                item.status,
                item.attendance_method || 'TOGGLE',
                location,
                item.late_early_status || 'N/A',
                item.extra_working_time || 'N/A'
            ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
        });

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...csvRows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportPDF = () => {
        const doc = new jsPDF('landscape');
        
        doc.setFontSize(18);
        doc.text("Attendance Management System - Report", 14, 20);
        
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
            "Location",
            "Late/Early Status",
            "Extra Working Time"
        ];
        
        const tableRows = reports.map(item => {
            const checkInTime = item.check_in ? new Date(item.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';
            const checkOutTime = item.check_out ? new Date(item.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';
            const location = item.latitude && item.longitude ? `${item.latitude}, ${item.longitude}` : 'N/A';
            const dateStr = new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            
            return [
                item.name,
                item.employee_id,
                item.department || 'N/A',
                dateStr,
                checkInTime,
                checkOutTime,
                item.working_hours || '--',
                item.status,
                item.attendance_method || 'TOGGLE',
                location,
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
        
        doc.save(`attendance_report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const renderLateEarly = (status) => {
        if (!status || status === 'N/A') return <span className="text-slate-400 font-bold">N/A</span>;
        if (status.includes('Late')) return <span className="text-rose-600 font-bold">{status}</span>;
        if (status.includes('Early')) return <span className="text-emerald-600 font-bold">{status}</span>;
        return <span className="text-slate-700 font-medium">{status}</span>;
    };

    const renderExtraWork = (extra) => {
        if (!extra || extra === 'N/A') return <span className="text-slate-400 font-bold">N/A</span>;
        return <span className="text-teal-500 font-bold">{extra}</span>;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#1b5d55] tracking-tight">Attendance Reports</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Detailed logs of all employee movements.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button 
                        onClick={exportCSV}
                        className="px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border-0 cursor-pointer shadow-md shadow-teal-50"
                    >
                        <FileText size={16} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="glass-card p-6 bg-white border-slate-100 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <div className="p-2 bg-slate-50 text-slate-400 rounded-lg">
                        <Calendar size={16} />
                    </div>
                    <input
                        type="date"
                        name="startDate"
                        value={filters.startDate}
                        onChange={handleFilterChange}
                        className="w-full text-xs font-bold text-slate-600 bg-transparent focus:outline-none"
                    />
                    <span className="text-slate-300 mx-2">to</span>
                    <input
                        type="date"
                        name="endDate"
                        value={filters.endDate}
                        onChange={handleFilterChange}
                        className="w-full text-xs font-bold text-slate-600 bg-transparent focus:outline-none"
                    />
                </div>
                <button
                    onClick={fetchReports}
                    className="px-6 py-2.5 bg-[#154c46] text-white rounded-xl text-xs font-bold hover:bg-teal-500 transition-all flex items-center gap-2"
                >
                    <Filter size={16} />
                    Apply Filters
                </button>
            </div>

            <div className="glass-card bg-white border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-black uppercase text-slate-400 tracking-widest">
                                <th className="px-6 py-4">Employee</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Check-In</th>
                                <th className="px-6 py-4">Check-Out</th>
                                <th className="px-6 py-4">Working Hours</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Method</th>
                                <th className="px-6 py-4">Location</th>
                                <th className="px-6 py-4">Late/Early Status</th>
                                <th className="px-6 py-4 text-right">Extra Working Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse"><td colSpan="10" className="px-6 py-4"><div className="h-4 bg-slate-50 rounded w-full"></div></td></tr>
                                ))
                            ) : reports.length > 0 ? (
                                reports.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-500 font-bold overflow-hidden">
                                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.name}`} alt="avatar" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-[#154c46]">{item.name}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">{item.employee_id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-600 underline decoration-slate-200 underline-offset-4">
                                            {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-600">
                                            {item.check_in ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-[10px] uppercase font-black">
                                                    {new Date(item.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            ) : '--'}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-600">
                                            {item.check_out ? (
                                                <span className="inline-flex items-center gap-1 text-teal-500 bg-teal-50 px-2 py-1 rounded-lg text-[10px] uppercase font-black">
                                                    {new Date(item.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            ) : '--'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className="text-slate-300" />
                                                <span className="text-xs font-black text-[#154c46]">{item.working_hours || '--'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${item.status === 'Present' ? 'bg-emerald-50 text-emerald-600' :
                                                    item.status === 'Late' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                                (item.attendance_method || 'TOGGLE') === 'QR' ? 'bg-purple-50 text-purple-600' :
                                                (item.attendance_method || 'TOGGLE') === 'MANUAL' ? 'bg-amber-50 text-amber-600' :
                                                'bg-slate-100 text-slate-600'
                                            }`}>
                                                {item.attendance_method || 'TOGGLE'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-600">
                                            {item.latitude && item.longitude ? (
                                                <a 
                                                    href={`https://maps.google.com/?q=${item.latitude},${item.longitude}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-500 text-teal-500 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 border-0 cursor-pointer text-center"
                                                >
                                                    View Location
                                                </a>
                                            ) : (
                                                <span className="text-slate-400">N/A</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold">
                                            {renderLateEarly(item.late_early_status)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-xs font-bold">
                                            {renderExtraWork(item.extra_working_time)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="10" className="px-6 py-20 text-center text-slate-400 text-sm">No attendance records found for this period.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ManageAttendance;
