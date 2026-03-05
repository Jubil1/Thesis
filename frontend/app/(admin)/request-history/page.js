'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Portal from '@/app/components/Portal';
import styles from './page.module.css';

const STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending', color: '#ff9800' },
    { value: 'approved', label: 'For Approval', color: '#2196f3' },
    { value: 'for_release', label: 'For Release', color: '#4caf50' },
    { value: 'completed', label: 'Done', color: '#0147AE' },
    { value: 'rejected', label: 'Rejected', color: '#f44336' },
];

export default function RequestHistoryPage() {
    const [requests, setRequests] = useState([]);
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

    const fetchRequests = () => {
        fetch('/api/admin/requests')
            .then((res) => res.json())
            .then((data) => setRequests(data.requests || []))
            .catch(() => setRequests([]));
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const filtered = requests
        .filter((r) => statusFilter === 'all' || r.status === statusFilter)
        .filter((r) => {
            if (!search) return true;
            const term = search.toLowerCase();
            const docsMatch = r.documents?.some((d) => d.name.toLowerCase().includes(term));
            return (
                r.residentName?.toLowerCase().includes(term) ||
                r.requestNo?.includes(search) ||
                docsMatch
            );
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    const getStatusInfo = (status) => {
        return STATUS_OPTIONS.find((s) => s.value === status) || { label: status, color: '#999' };
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
        });
    };

    // Get a summary of documents for display in the table row
    const getDocSummary = (req) => {
        if (!req.documents || req.documents.length === 0) {
            // Backward compat with old single-document format
            return req.document || '—';
        }
        if (req.documents.length === 1) {
            const d = req.documents[0];
            return `${d.name} x${d.quantity}`;
        }
        return `${req.documents.length} documents`;
    };

    const handleStatusChange = async (id, newStatus) => {
        setUpdatingId(id);
        try {
            const body = { id, status: newStatus };
            if (newStatus === 'rejected') {
                const reason = prompt('Enter reason for rejection (optional):');
                if (reason) body.rejectionReason = reason;
            }

            const res = await fetch('/api/admin/requests', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.success) {
                fetchRequests();
                if (selectedRequest?.id === id) {
                    setSelectedRequest({ ...selectedRequest, status: newStatus });
                }
            }
        } catch {
            alert('Failed to update status');
        } finally {
            setUpdatingId(null);
        }
    };

    // Count by status
    const counts = {
        all: requests.length,
        pending: requests.filter((r) => r.status === 'pending').length,
        approved: requests.filter((r) => r.status === 'approved').length,
        for_release: requests.filter((r) => r.status === 'for_release').length,
        completed: requests.filter((r) => r.status === 'completed').length,
        rejected: requests.filter((r) => r.status === 'rejected').length,
    };

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.pageHeader}>
                <div className={styles.headerInfo}>
                    <Link href="/admin-dashboard" className={styles.backBtn}>←</Link>
                    <div>
                        <h1 className={styles.pageTitle}>Request History</h1>
                        <p className={styles.pageSubtitle}>History of document requests</p>
                    </div>
                </div>
            </div>

            {/* Status Tabs */}
            <div className={styles.statusTabs}>
                <button
                    className={`${styles.statusTab} ${statusFilter === 'all' ? styles.activeTab : ''}`}
                    onClick={() => setStatusFilter('all')}
                >
                    All ({counts.all})
                </button>
                {STATUS_OPTIONS.map((s) => (
                    <button
                        key={s.value}
                        className={`${styles.statusTab} ${statusFilter === s.value ? styles.activeTab : ''}`}
                        onClick={() => setStatusFilter(s.value)}
                        style={statusFilter === s.value ? { borderColor: s.color, color: s.color } : {}}
                    >
                        {s.label} ({counts[s.value] || 0})
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className={styles.filterBar}>
                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search by name, document, or request number..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className={styles.tableSection}>
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Request</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className={styles.emptyRow}>No requests found.</td>
                                </tr>
                            ) : (
                                filtered.map((req) => {
                                    const statusInfo = getStatusInfo(req.status);
                                    return (
                                        <tr key={req.id}>
                                            <td className={styles.nameCell}>{req.residentName}</td>
                                            <td>{getDocSummary(req)}</td>
                                            <td className={styles.dateCell}>{formatDate(req.date)}</td>
                                            <td>
                                                <span
                                                    className={styles.statusBadge}
                                                    style={{ background: statusInfo.color }}
                                                >
                                                    {statusInfo.label}
                                                </span>
                                            </td>
                                            <td className={styles.actionCell}>
                                                <button
                                                    className={styles.viewBtn}
                                                    onClick={() => setSelectedRequest(req)}
                                                >
                                                    View
                                                </button>
                                                {req.status === 'pending' && (
                                                    <>
                                                        <button
                                                            className={styles.approveBtn}
                                                            onClick={() => handleStatusChange(req.id, 'approved')}
                                                            disabled={updatingId === req.id}
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            className={styles.rejectBtn}
                                                            onClick={() => handleStatusChange(req.id, 'rejected')}
                                                            disabled={updatingId === req.id}
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                {req.status === 'approved' && (
                                                    <button
                                                        className={styles.releaseBtn}
                                                        onClick={() => handleStatusChange(req.id, 'for_release')}
                                                        disabled={updatingId === req.id}
                                                    >
                                                        Release
                                                    </button>
                                                )}
                                                {req.status === 'for_release' && (
                                                    <button
                                                        className={styles.completeBtn}
                                                        onClick={() => handleStatusChange(req.id, 'completed')}
                                                        disabled={updatingId === req.id}
                                                    >
                                                        Complete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Modal */}
            {selectedRequest && (
                <Portal onClose={() => setSelectedRequest(null)}>
                    <div className={styles.modalOverlay} onClick={() => setSelectedRequest(null)}>
                        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalBody}>
                                <button className={styles.modalClose} onClick={() => setSelectedRequest(null)}>×</button>
                                <h2 className={styles.modalTitle}>Request Details</h2>

                                {/* Basic Info */}
                                <div className={styles.modalGrid}>
                                    <div className={styles.modalField}>
                                        <span className={styles.modalLabel}>Request No.</span>
                                        <span className={styles.modalValue}>{selectedRequest.requestNo}</span>
                                    </div>
                                    <div className={styles.modalField}>
                                        <span className={styles.modalLabel}>Resident Name</span>
                                        <span className={styles.modalValue}>{selectedRequest.residentName}</span>
                                    </div>
                                    <div className={styles.modalField}>
                                        <span className={styles.modalLabel}>Date</span>
                                        <span className={styles.modalValue}>{formatDate(selectedRequest.date)}</span>
                                    </div>
                                    <div className={styles.modalField}>
                                        <span className={styles.modalLabel}>Payment Method</span>
                                        <span className={styles.modalValue}>{selectedRequest.paymentMethod === 'online' ? 'Online' : 'Cash'}</span>
                                    </div>
                                    {selectedRequest.referenceNo && (
                                        <div className={styles.modalField}>
                                            <span className={styles.modalLabel}>Reference No.</span>
                                            <span className={styles.modalValue}>{selectedRequest.referenceNo}</span>
                                        </div>
                                    )}
                                    <div className={styles.modalField}>
                                        <span className={styles.modalLabel}>Status</span>
                                        <span
                                            className={styles.statusBadge}
                                            style={{ background: getStatusInfo(selectedRequest.status).color }}
                                        >
                                            {getStatusInfo(selectedRequest.status).label}
                                        </span>
                                    </div>
                                </div>

                                {/* Documents Ordered */}
                                <div className={styles.docListSection}>
                                    <h3 className={styles.docListTitle}>Documents Ordered</h3>
                                    <div className={styles.docList}>
                                        {(selectedRequest.documents || []).map((doc, i) => (
                                            <div key={i} className={styles.docListItem}>
                                                <span className={styles.docListName}>{doc.name}</span>
                                                <span className={styles.docListQty}>x{doc.quantity}</span>
                                                <span className={styles.docListPrice}>₱ {(doc.total || 0).toFixed(2)}</span>
                                            </div>
                                        ))}
                                        {/* Backward compat for old format */}
                                        {!selectedRequest.documents && selectedRequest.document && (
                                            <div className={styles.docListItem}>
                                                <span className={styles.docListName}>{selectedRequest.document}</span>
                                                <span className={styles.docListQty}>x{selectedRequest.quantity || 1}</span>
                                                <span className={styles.docListPrice}>₱ {(selectedRequest.amount || 0).toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.docListTotal}>
                                        <span>Total:</span>
                                        <span>₱ {(selectedRequest.totalAmount || selectedRequest.amount || 0).toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Rejection Reason */}
                                {selectedRequest.rejectionReason && (
                                    <div className={styles.rejectionBox}>
                                        <strong>Rejection Reason:</strong> {selectedRequest.rejectionReason}
                                    </div>
                                )}

                                {/* Status Action Buttons */}
                                <div className={styles.modalActions}>
                                    {selectedRequest.status === 'pending' && (
                                        <>
                                            <button className={styles.approveBtn} onClick={() => { handleStatusChange(selectedRequest.id, 'approved'); setSelectedRequest(null); }}>Approve</button>
                                            <button className={styles.rejectBtn} onClick={() => { handleStatusChange(selectedRequest.id, 'rejected'); setSelectedRequest(null); }}>Reject</button>
                                        </>
                                    )}
                                    {selectedRequest.status === 'approved' && (
                                        <button className={styles.releaseBtn} onClick={() => { handleStatusChange(selectedRequest.id, 'for_release'); setSelectedRequest(null); }}>Mark for Release</button>
                                    )}
                                    {selectedRequest.status === 'for_release' && (
                                        <button className={styles.completeBtn} onClick={() => { handleStatusChange(selectedRequest.id, 'completed'); setSelectedRequest(null); }}>Mark as Complete</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </Portal>
            )}
        </div>
    );
}
