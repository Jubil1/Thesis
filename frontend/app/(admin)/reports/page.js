'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

const REPORT_OPTIONS = [
    { value: 'monthlyDocs', label: 'Documents Requested per Month' },
    { value: 'ageDistribution', label: 'Age Distribution of Requestors' },
    { value: 'purokResidents', label: 'Residents per Purok' },
];

export default function ReportsPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState('monthlyDocs');

    useEffect(() => {
        fetch('/api/admin/reports')
            .then(res => res.ok ? res.json() : null)
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const formatCurrency = (amt) => `₱${(amt || 0).toLocaleString()}`;

    const summary = data?.summary || {};
    const monthlyDocs = data?.monthlyDocs || [];
    const ageDistribution = data?.ageDistribution || [];
    const purokStats = data?.purokStats || [];

    // Chart helpers
    const maxMonthly = Math.max(...monthlyDocs.map(m => m.count), 1);
    const maxAge = Math.max(...ageDistribution.map(a => a.count), 1);
    const maxPurok = Math.max(...purokStats.map(p => p.count), 1);

    const renderChart = () => {
        switch (selectedReport) {
            case 'monthlyDocs':
                return (
                    <div className={styles.chartArea}>
                        <p className={styles.chartDesc}>Number of document requests received each month over the past 12 months.</p>
                        <div className={styles.barChart}>
                            {monthlyDocs.map((m, i) => (
                                <div key={i} className={styles.barGroup}>
                                    <div className={styles.barWrapper}>
                                        <div className={styles.bar} style={{ height: `${Math.max((m.count / maxMonthly) * 100, 6)}%` }}>
                                            <span className={styles.barValue}>{m.count}</span>
                                        </div>
                                    </div>
                                    <span className={styles.barLabel}>{m.shortLabel}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'ageDistribution':
                return (
                    <div className={styles.chartArea}>
                        <p className={styles.chartDesc}>Age groups of residents who submitted document requests.</p>
                        <div className={styles.lineChartWrap}>
                            <svg className={styles.lineChart} viewBox="0 0 600 260" preserveAspectRatio="none">
                                {/* Grid lines */}
                                {[0, 25, 50, 75, 100].map(pct => (
                                    <line key={pct} x1="0" y1={220 - (pct / 100) * 200} x2="600" y2={220 - (pct / 100) * 200}
                                        stroke="#e8ecf0" strokeWidth="1" />
                                ))}
                                {/* Area fill */}
                                {ageDistribution.length > 0 && (
                                    <polygon
                                        points={
                                            ageDistribution.map((a, i) => {
                                                const x = (i / (ageDistribution.length - 1)) * 560 + 20;
                                                const y = 220 - (a.count / maxAge) * 200;
                                                return `${x},${y}`;
                                            }).join(' ') +
                                            ` 580,220 20,220`
                                        }
                                        fill="url(#areaGrad)" opacity="0.3"
                                    />
                                )}
                                {/* Line */}
                                {ageDistribution.length > 0 && (
                                    <polyline
                                        points={ageDistribution.map((a, i) => {
                                            const x = (i / (ageDistribution.length - 1)) * 560 + 20;
                                            const y = 220 - (a.count / maxAge) * 200;
                                            return `${x},${y}`;
                                        }).join(' ')}
                                        fill="none" stroke="#0147AE" strokeWidth="3" strokeLinejoin="round"
                                    />
                                )}
                                {/* Dots + labels */}
                                {ageDistribution.map((a, i) => {
                                    const x = (i / (ageDistribution.length - 1)) * 560 + 20;
                                    const y = 220 - (a.count / maxAge) * 200;
                                    return (
                                        <g key={i}>
                                            <circle cx={x} cy={y} r="5" fill="#0147AE" stroke="white" strokeWidth="2" />
                                            <text x={x} y={y - 14} textAnchor="middle" fontSize="12" fontWeight="600" fill="#333">{a.count}</text>
                                            <text x={x} y={245} textAnchor="middle" fontSize="11" fill="#888">{a.label}</text>
                                        </g>
                                    );
                                })}
                                <defs>
                                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#0147AE" />
                                        <stop offset="100%" stopColor="#0147AE" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                    </div>
                );

            case 'purokResidents':
                return (
                    <div className={styles.chartArea}>
                        <p className={styles.chartDesc}>Distribution of registered residents across each Purok in Barangay Tibanga.</p>
                        <div className={styles.horizontalBars}>
                            {purokStats.map((p, i) => (
                                <div key={i} className={styles.hBarRow}>
                                    <span className={styles.hBarLabel}>{p.name}</span>
                                    <div className={styles.hBarTrack}>
                                        <div className={styles.hBarFill} style={{ width: `${Math.max((p.count / maxPurok) * 100, 5)}%` }}>
                                        </div>
                                    </div>
                                    <span className={styles.hBarCount}>{p.count}</span>
                                </div>
                            ))}
                            {purokStats.length === 0 && <div className={styles.emptyState}>No purok data available</div>}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className={styles.reports}>
            {loading ? (
                <div className={styles.loadingState}>Loading report data...</div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className={styles.kpiCards}>
                        <div className={styles.kpiCard}>
                            <span className={styles.kpiIcon}>👥</span>
                            <span className={styles.kpiNumber}>{summary.totalResidents || 0}</span>
                            <span className={styles.kpiLabel}>Total Residents</span>
                        </div>
                        <div className={styles.kpiCard}>
                            <span className={styles.kpiIcon}>📄</span>
                            <span className={`${styles.kpiNumber} ${styles.kpiBlue}`}>{summary.totalRequests || 0}</span>
                            <span className={styles.kpiLabel}>Total Requests</span>
                        </div>
                        <div className={styles.kpiCard}>
                            <span className={styles.kpiIcon}>💰</span>
                            <span className={`${styles.kpiNumber} ${styles.kpiGreen}`}>{formatCurrency(summary.totalRevenue)}</span>
                            <span className={styles.kpiLabel}>Total Revenue</span>
                        </div>
                        <div className={styles.kpiCard}>
                            <span className={styles.kpiIcon}>✅</span>
                            <span className={`${styles.kpiNumber} ${styles.kpiOrange}`}>{summary.completionRate || 0}%</span>
                            <span className={styles.kpiLabel}>Completion Rate</span>
                        </div>
                    </div>

                    {/* Report Selector */}
                    <div className={styles.reportSelector}>
                        <label className={styles.selectorLabel}>Select Report</label>
                        <select className={styles.selectorDropdown} value={selectedReport} onChange={e => setSelectedReport(e.target.value)}>
                            {REPORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>

                    {/* Chart Container */}
                    <div className={styles.chartCard}>
                        <h3 className={styles.chartTitle}>
                            {REPORT_OPTIONS.find(o => o.value === selectedReport)?.label}
                        </h3>
                        {renderChart()}
                    </div>
                </>
            )}
        </div>
    );
}
