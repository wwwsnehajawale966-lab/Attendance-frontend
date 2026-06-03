import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';

const EmployeeHistory = () => {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/attendance/history', {
                    headers: { 'x-auth-token': token }
                });
                const data = await res.json();
                setHistory(data);
            } catch (err) {
                console.error('Error fetching history:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, [token]);

    const formatDuration = (checkIn, checkOut) => {
        if (!checkIn || !checkOut) return '--';
        const diff = new Date(checkOut) - new Date(checkIn);
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        return `${hours}h ${minutes}m`;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Attendance History</h1>
                <p className="text-slate-500 text-sm font-medium mt-1">Your recent activity logs.</p>
            </div>

            <div className="glass-card bg-white border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-black uppercase text-slate-400 tracking-widest">
                                <th className="px-6 py-4 font-black">Date</th>
                                <th className="px-6 py-4 font-black">Check In</th>
                                <th className="px-6 py-4 font-black">Check Out</th>
                                <th className="px-6 py-4 font-black">Duration</th>
                                <th className="px-6 py-4 font-black text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-6 py-4"><div className="h-4 bg-slate-50 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : history.length > 0 ? (
                                history.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                    <Calendar size={16} />
                                                </div>
                                                <span className="text-sm font-bold text-slate-700">
                                                    {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-slate-600">
                                                {item.check_in ? new Date(item.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-slate-600">
                                                {item.check_out ? new Date(item.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Clock size={14} />
                                                <span className="text-sm font-bold text-slate-700">{formatDuration(item.check_in, item.check_out)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600">
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center">
                                        <p className="text-slate-400 text-sm font-medium">No records found yet.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default EmployeeHistory;
