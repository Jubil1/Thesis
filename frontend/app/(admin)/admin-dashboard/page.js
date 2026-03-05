'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

export default function AdminDashboardPage() {
    const [requests, setRequests] = useState([]);
    const [residents, setResidents] = useState([]);

    useEffect(() => {
        fetch('/api/admin/stats')
            .then((res) => res.ok ? res.json() : { requests: [], residents: [] })
            .then((data) => {
                setRequests(data.requests || []);
                setResidents(data.residents || []);
            })
            .catch(() => { });
    }, []);

    const pendingRequests = requests.filter((r) => r.status === 'pending');
    const approvedRequests = requests.filter((r) => r.status === 'approved' || r.status === 'completed');
    const totalResidents = residents.length;

    const handleAction = async (requestId, action) => {
        // For now, update locally
        setRequests((prev) =>
            prev.map((r) =>
                r.id === requestId ? { ...r, status: action === 'accept' ? 'approved' : 'rejected' } : r
            )
        );
    };

    // Monthly trend data (last 6 months)
    const getMonthlyTrend = () => {
        const months = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = date.toLocaleString('default', { month: 'short' });
            const year = date.getFullYear();
            const monthRequests = requests.filter((r) => {
                const rd = new Date(r.date);
                return rd.getMonth() === date.getMonth() && rd.getFullYear() === date.getFullYear();
            });
            months.push({
                label: `${monthName} ${year}`,
                shortLabel: monthName,
                total: monthRequests.length,
                approved: monthRequests.filter((r) => r.status === 'approved' || r.status === 'completed').length,
                rejected: monthRequests.filter((r) => r.status === 'rejected').length,
            });
        }
        return months;
    };

    const monthlyTrend = getMonthlyTrend();
    const maxTrend = Math.max(...monthlyTrend.map((m) => m.total), 1);

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className={styles.dashboard}>
            {/* Stat Cards */}
            <div className={styles.statCards}>
                <div className={styles.statCard}>
                    <span className={styles.statNumber}>{requests.length}</span>
                    <span className={styles.statLabel}>Total Request</span>
                </div>
                <div className={styles.statCard}>
                    <span className={`${styles.statNumber} ${styles.pendingNumber}`}>{String(pendingRequests.length).padStart(2, '0')}</span>
                    <span className={styles.statLabel}>Pending</span>
                </div>
                <div className={styles.statCard}>
                    <span className={`${styles.statNumber} ${styles.approvalNumber}`}>{approvedRequests.length}</span>
                    <span className={styles.statLabel}>Approval</span>
                </div>
                <div className={styles.statCard}>
                    <span className={`${styles.statNumber} ${styles.residentsNumber}`}>{totalResidents > 0 ? totalResidents : '400'}</span>
                    <span className={styles.statLabel}>Residents</span>
                </div>
            </div>

            {/* Pending Request Table */}
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Pending Request</h3>
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Request No.</th>
                                <th>Name</th>
                                <th>Document</th>
                                <th>Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className={styles.emptyRow}>No pending requests</td>
                                </tr>
                            ) : (
                                pendingRequests.map((req) => (
                                    <tr key={req.id}>
                                        <td className={styles.requestNo}>{req.requestNo}</td>
                                        <td>{req.residentName}</td>
                                        <td>{req.document}</td>
                                        <td>{formatDate(req.date)}</td>
                                        <td className={styles.actionCell}>
                                            <button
                                                className={styles.acceptBtn}
                                                onClick={() => handleAction(req.id, 'accept')}
                                            >
                                                Accept
                                            </button>
                                            <button
                                                className={styles.rejectBtn}
                                                onClick={() => handleAction(req.id, 'reject')}
                                            >
                                                Reject
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Monthly Request Trend */}
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Monthly Request Trend</h3>
                <div className={styles.chartContainer}>
                    <div className={styles.barChart}>
                        {monthlyTrend.map((month, i) => (
                            <div key={i} className={styles.barGroup}>
                                <div className={styles.barWrapper}>
                                    <div
                                        className={styles.bar}
                                        style={{ height: `${Math.max((month.total / maxTrend) * 100, 8)}%` }}
                                    >
                                        <span className={styles.barValue}>{month.total}</span>
                                    </div>
                                </div>
                                <span className={styles.barLabel}>{month.shortLabel}</span>
                            </div>
                        ))}
                    </div>
                    <div className={styles.chartLegend}>
                        <span className={styles.legendItem}>
                            <span className={`${styles.legendDot} ${styles.legendBlue}`}></span>
                            Total Requests
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
