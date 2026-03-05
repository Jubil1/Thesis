'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Portal from '@/app/components/Portal';
import styles from './page.module.css';

export default function ResidentRecordsPage() {
    const router = useRouter();
    const [residents, setResidents] = useState([]);
    const [search, setSearch] = useState('');
    const [purokFilter, setPurokFilter] = useState('all');
    const [sexFilter, setSexFilter] = useState('all');
    const [civilStatusFilter, setCivilStatusFilter] = useState('all');

    // View modal state
    const [viewResident, setViewResident] = useState(null);
    // Delete confirmation state
    const [deleteResident, setDeleteResident] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchResidents = () => {
        fetch('/api/admin/residents')
            .then((res) => res.ok ? res.json() : { residents: [] })
            .then((data) => setResidents(data.residents || []))
            .catch(() => { });
    };

    useEffect(() => {
        fetchResidents();
    }, []);

    // Get unique puroks for the dropdown
    const puroks = [...new Set(residents.map((r) => r.purok))].sort();

    // Filter residents
    const filtered = residents.filter((r) => {
        const matchesSearch =
            !search ||
            `${r.firstName} ${r.middleName} ${r.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
            r.email?.toLowerCase().includes(search.toLowerCase()) ||
            r.mobileNumber?.includes(search);

        const matchesPurok = purokFilter === 'all' || r.purok === purokFilter;
        const matchesSex = sexFilter === 'all' || r.sex === sexFilter;
        const matchesCivil = civilStatusFilter === 'all' || r.civilStatus === civilStatusFilter;

        return matchesSearch && matchesPurok && matchesSex && matchesCivil;
    });

    const totalResidents = residents.length;
    const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });

    const calculateAge = (birthdate) => {
        if (!birthdate) return '—';
        const birth = new Date(birthdate);
        const now = new Date();
        let age = now.getFullYear() - birth.getFullYear();
        const monthDiff = now.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    const handleDelete = async () => {
        if (!deleteResident) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/admin/residents/${deleteResident.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                fetchResidents();
                setDeleteResident(null);
            } else {
                alert('Failed to delete resident.');
            }
        } catch {
            alert('Error deleting resident.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.pageHeader}>
                <div className={styles.headerInfo}>
                    <Link href="/admin-dashboard" className={styles.backBtn}>←</Link>
                    <div>
                        <h1 className={styles.pageTitle}>Total Residence: {totalResidents > 0 ? totalResidents : '1000'}</h1>
                        <p className={styles.pageSubtitle}>Number of recorded residence as of {today}</p>
                    </div>
                </div>
                <Link href="/resident-records/add" className={styles.addBtn}>
                    Add new resident +
                </Link>
            </div>

            {/* Filters */}
            <div className={styles.filterBar}>
                <input
                    type="text"
                    placeholder="Search by name, email, or contact..."
                    className={styles.searchInput}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select
                    className={styles.filterSelect}
                    value={purokFilter}
                    onChange={(e) => setPurokFilter(e.target.value)}
                >
                    <option value="all">All Puroks</option>
                    {puroks.map((p) => (
                        <option key={p} value={p}>{p}</option>
                    ))}
                </select>
                <select
                    className={styles.filterSelect}
                    value={sexFilter}
                    onChange={(e) => setSexFilter(e.target.value)}
                >
                    <option value="all">All Sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                </select>
                <select
                    className={styles.filterSelect}
                    value={civilStatusFilter}
                    onChange={(e) => setCivilStatusFilter(e.target.value)}
                >
                    <option value="all">All Status</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Divorced">Divorced</option>
                </select>
            </div>

            {/* Table */}
            <div className={styles.tableSection}>
                <div className={styles.tableInfo}>
                    <span className={styles.resultCount}>
                        Showing {filtered.length} of {totalResidents} residents
                    </span>
                </div>
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Sex</th>
                                <th>Civil Status</th>
                                <th>Purok</th>
                                <th>Contact</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className={styles.emptyRow}>
                                        {residents.length === 0 ? 'Loading residents...' : 'No residents match your filters'}
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((r, i) => (
                                    <tr key={r.id}>
                                        <td className={styles.rowNum}>{i + 1}</td>
                                        <td className={styles.nameCell}>
                                            {r.firstName} {r.middleName} {r.lastName} {r.suffix}
                                        </td>
                                        <td>{r.sex}</td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles[`status${r.civilStatus}`]}`}>
                                                {r.civilStatus}
                                            </span>
                                        </td>
                                        <td>{r.purok}</td>
                                        <td className={styles.contactCell}>{r.mobileNumber}</td>
                                        <td className={styles.actionCell}>
                                            <button className={styles.viewBtn} onClick={() => setViewResident(r)}>View</button>
                                            <button className={styles.editBtn} onClick={() => router.push(`/resident-records/edit/${r.id}`)}>Edit</button>
                                            <button className={styles.deleteBtn} onClick={() => setDeleteResident(r)}>Delete</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Modal */}
            {viewResident && (
                <Portal onClose={() => setViewResident(null)}>
                    <div className={styles.modalOverlay} onClick={() => setViewResident(null)}>
                        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalBody}>
                                <button className={styles.modalClose} onClick={() => setViewResident(null)}>×</button>

                                {/* Header with profile picture */}
                                <div className={styles.modalHeader}>
                                    <div className={styles.modalHeaderInfo}>
                                        <h2 className={styles.modalName}>
                                            {viewResident.firstName} {viewResident.middleName} {viewResident.lastName} {viewResident.suffix}
                                        </h2>
                                        <p className={styles.modalDate}>
                                            Registered Date: {viewResident.createdAt
                                                ? new Date(viewResident.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                                                : 'N/A'}
                                        </p>
                                        <div className={styles.modalQuickInfo}>
                                            <span>✉ {viewResident.email || '—'}</span>
                                            <span>☎ {viewResident.mobileNumber || '—'}</span>
                                            <span>⌂ {viewResident.purok}, {viewResident.barangay || 'Tibanga'}, {viewResident.city || 'Iligan City'}</span>
                                        </div>
                                    </div>
                                    <div className={styles.modalProfilePic}>
                                        {viewResident.idPicture ? (
                                            <img src={viewResident.idPicture} alt="Profile" />
                                        ) : (
                                            <div className={styles.modalProfilePlaceholder}>
                                                <span>👤</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Resident Information */}
                                <div className={styles.modalSection}>
                                    <h3 className={styles.modalSubtitle}>Resident Information</h3>
                                    <div className={styles.modalGrid}>
                                        <div className={styles.modalField}>
                                            <span className={styles.modalLabel}>First Name</span>
                                            <span className={styles.modalValue}>{viewResident.firstName}</span>
                                        </div>
                                        <div className={styles.modalField}>
                                            <span className={styles.modalLabel}>Middle Name</span>
                                            <span className={styles.modalValue}>{viewResident.middleName || '—'}</span>
                                        </div>
                                        <div className={styles.modalField}>
                                            <span className={styles.modalLabel}>Last Name</span>
                                            <span className={styles.modalValue}>{viewResident.lastName}</span>
                                        </div>
                                        <div className={styles.modalField}>
                                            <span className={styles.modalLabel}>Suffix</span>
                                            <span className={styles.modalValue}>{viewResident.suffix || 'N/A'}</span>
                                        </div>
                                        <div className={styles.modalField}>
                                            <span className={styles.modalLabel}>Sex</span>
                                            <span className={styles.modalValue}>{viewResident.sex}</span>
                                        </div>
                                        <div className={styles.modalField}>
                                            <span className={styles.modalLabel}>Age</span>
                                            <span className={styles.modalValue}>{calculateAge(viewResident.birthdate)}</span>
                                        </div>
                                        <div className={styles.modalField}>
                                            <span className={styles.modalLabel}>Civil Status</span>
                                            <span className={styles.modalValue}>{viewResident.civilStatus}</span>
                                        </div>
                                        <div className={styles.modalField}>
                                            <span className={styles.modalLabel}>Birth Date</span>
                                            <span className={styles.modalValue}>
                                                {viewResident.birthdate
                                                    ? new Date(viewResident.birthdate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                                                    : '—'}
                                            </span>
                                        </div>
                                        <div className={styles.modalField}>
                                            <span className={styles.modalLabel}>Birth Place</span>
                                            <span className={styles.modalValue}>{viewResident.birthplace || '—'}</span>
                                        </div>
                                        <div className={styles.modalField}>
                                            <span className={styles.modalLabel}>Religion</span>
                                            <span className={styles.modalValue}>{viewResident.religion || '—'}</span>
                                        </div>
                                        <div className={styles.modalField}>
                                            <span className={styles.modalLabel}>Citizenship</span>
                                            <span className={styles.modalValue}>{viewResident.citizenship || '—'}</span>
                                        </div>
                                        <div className={styles.modalField}>
                                            <span className={styles.modalLabel}>Address</span>
                                            <span className={styles.modalValue}>
                                                {viewResident.purok}, {viewResident.barangay || 'Tibanga'}, {viewResident.city || 'Iligan City'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Information */}
                                <div className={styles.modalSection}>
                                    <h3 className={styles.modalSubtitle}>Contact Information</h3>
                                    <div className={styles.modalGrid}>
                                        <div className={styles.modalField}>
                                            <span className={styles.modalLabel}>Mobile Number</span>
                                            <span className={styles.modalValue}>{viewResident.mobileNumber || '—'}</span>
                                        </div>
                                        <div className={styles.modalField}>
                                            <span className={styles.modalLabel}>Email</span>
                                            <span className={styles.modalValue}>{viewResident.email || '—'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Other Information */}
                                <div className={styles.modalSection}>
                                    <h3 className={styles.modalSubtitle}>Other Information</h3>
                                    <div className={styles.modalGrid}>
                                        <div className={styles.modalField}>
                                            <span className={styles.modalLabel}>Mother&apos;s Maiden Name</span>
                                            <span className={styles.modalValue}>{viewResident.mothersMaidenName || '—'}</span>
                                        </div>
                                        <div className={styles.modalField}>
                                            <span className={styles.modalLabel}>Father&apos;s Name</span>
                                            <span className={styles.modalValue}>{viewResident.fathersName || '—'}</span>
                                        </div>
                                        <div className={styles.modalField}>
                                            <span className={styles.modalLabel}>Spouse&apos;s Name</span>
                                            <span className={styles.modalValue}>{viewResident.spousesName || '—'}</span>
                                        </div>
                                        <div className={styles.modalField}>
                                            <span className={styles.modalLabel}>Children</span>
                                            <span className={styles.modalValue}>
                                                {viewResident.children?.length > 0
                                                    ? viewResident.children.filter(c => c).join(', ')
                                                    : viewResident.childsName || '—'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Account Credentials */}
                                {viewResident.username && (
                                    <div className={styles.modalSection}>
                                        <h3 className={styles.modalSubtitle}>Account Credentials</h3>
                                        <div className={styles.modalGrid}>
                                            <div className={styles.modalField}>
                                                <span className={styles.modalLabel}>Username</span>
                                                <span className={styles.modalValue}>{viewResident.username}</span>
                                            </div>
                                            <div className={styles.modalField}>
                                                <span className={styles.modalLabel}>Default Password</span>
                                                <span className={styles.modalValue}>{viewResident.password}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Portal>
            )}

            {/* Delete Confirmation Modal */}
            {deleteResident && (
                <Portal onClose={() => !isDeleting && setDeleteResident(null)}>
                    <div className={styles.modalOverlay} onClick={() => !isDeleting && setDeleteResident(null)}>
                        <div className={styles.deleteModal} onClick={(e) => e.stopPropagation()}>
                            <h2 className={styles.deleteTitle}>Delete Resident?</h2>
                            <p className={styles.deleteMessage}>
                                Are you sure you want to delete <strong>{deleteResident.firstName} {deleteResident.lastName}</strong>?
                                This action cannot be undone.
                            </p>
                            <div className={styles.deleteActions}>
                                <button
                                    className={styles.cancelDeleteBtn}
                                    onClick={() => setDeleteResident(null)}
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    className={styles.confirmDeleteBtn}
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </Portal>
            )}
        </div>
    );
}
