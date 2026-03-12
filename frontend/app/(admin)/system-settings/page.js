'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

const ALL_TABS = [
    { key: 'profile', label: 'Admin Profile', permission: null }, // always visible
    { key: 'fees', label: 'Document & Fees', permission: 'fees' },
    { key: 'announcements', label: 'Announcements', permission: 'announcements' },
    { key: 'puroks', label: 'Purok List', permission: 'puroks' },
    { key: 'admin-management', label: 'Admin Management', permission: 'admin-management' },
];

const AVAILABLE_PERMISSIONS = [
    { key: 'fees', label: 'Document & Fees' },
    { key: 'announcements', label: 'Announcements' },
    { key: 'puroks', label: 'Purok List' },
];

export default function SystemSettingsPage() {
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // Data
    const [profile, setProfile] = useState(null);
    const [fees, setFees] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [puroks, setPuroks] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [adminUsers, setAdminUsers] = useState([]);

    // Profile form
    const [profileForm, setProfileForm] = useState({ name: '', email: '', currentPassword: '', newPassword: '', confirmPassword: '' });

    // Announcement modal
    const [annModal, setAnnModal] = useState(null);
    const [annForm, setAnnForm] = useState({ title: '', content: '' });

    // Purok add
    const [newPurok, setNewPurok] = useState('');
    const [editPurok, setEditPurok] = useState(null);

    // Admin modal
    const [adminModal, setAdminModal] = useState(null); // null = closed, {} = add, {id,...} = edit
    const [adminForm, setAdminForm] = useState({ name: '', username: '', email: '', password: '', permissions: [] });

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            const res = await fetch('/api/admin/settings');
            if (!res.ok) throw new Error();
            const data = await res.json();
            setProfile(data.profile);
            setProfileForm({ name: data.profile?.name || '', email: data.profile?.email || '', currentPassword: '', newPassword: '', confirmPassword: '' });
            setFees(data.documentFees || []);
            setAnnouncements(data.announcements || []);
            setPuroks(data.puroks || []);
            setPermissions(data.permissions || []);
            setIsSuperAdmin(data.isSuperAdmin || false);
            setAdminUsers(data.adminUsers || []);
        } catch {
            showToast('Failed to load settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Filter tabs based on permissions
    const visibleTabs = ALL_TABS.filter((tab) => {
        if (tab.permission === null) return true; // profile always visible
        return permissions.includes(tab.permission);
    });

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const apiPatch = async (body) => {
        const res = await fetch('/api/admin/settings', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        return res.json();
    };

    // ── Profile ──
    const handleProfileSave = async () => {
        if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }
        const payload = { section: 'profile', name: profileForm.name, email: profileForm.email };
        if (profileForm.newPassword) {
            payload.currentPassword = profileForm.currentPassword;
            payload.newPassword = profileForm.newPassword;
        }
        const data = await apiPatch(payload);
        if (data.success) {
            if (data.profile) setProfile(data.profile);
            setProfileForm((p) => ({ ...p, currentPassword: '', newPassword: '', confirmPassword: '' }));
            showToast('Profile updated');
        } else {
            showToast(data.error || 'Failed to update', 'error');
        }
    };

    // ── Fees ──
    const handleFeeChange = (idx, val) => {
        setFees((prev) => prev.map((f, i) => (i === idx ? { ...f, fee: Number(val) || 0 } : f)));
    };

    const handleFeesSave = async () => {
        const data = await apiPatch({ section: 'fees', documentFees: fees });
        if (data.success) showToast('Fees updated');
        else showToast(data.error || 'Failed to update fees', 'error');
    };

    // ── Announcements ──
    const openAnnModal = (ann = null) => {
        setAnnModal(ann || {});
        setAnnForm(ann ? { title: ann.title, content: ann.content } : { title: '', content: '' });
    };

    const handleAnnSave = async () => {
        if (!annForm.title.trim()) { showToast('Title is required', 'error'); return; }
        const action = annModal.id ? 'edit' : 'add';
        const announcement = annModal.id ? { id: annModal.id, ...annForm } : { ...annForm, author: profile?.name || 'Admin' };
        const data = await apiPatch({ section: 'announcements', action, announcement });
        if (data.success) {
            setAnnouncements(data.announcements);
            setAnnModal(null);
            showToast(action === 'add' ? 'Announcement added' : 'Announcement updated');
        } else {
            showToast(data.error || 'Failed', 'error');
        }
    };

    const handleAnnDelete = async (id) => {
        if (!confirm('Delete this announcement?')) return;
        const data = await apiPatch({ section: 'announcements', action: 'delete', announcement: { id } });
        if (data.success) {
            setAnnouncements(data.announcements);
            showToast('Announcement deleted');
        }
    };

    // ── Puroks ──
    const handleAddPurok = async () => {
        if (!newPurok.trim()) return;
        const data = await apiPatch({ section: 'puroks', action: 'add', purok: newPurok.trim() });
        if (data.success) {
            setPuroks(data.puroks);
            setNewPurok('');
            showToast('Purok added');
        } else {
            showToast(data.error || 'Failed', 'error');
        }
    };

    const handleRenamePurok = async (oldName, newName) => {
        if (!newName.trim() || newName === oldName) { setEditPurok(null); return; }
        const data = await apiPatch({ section: 'puroks', action: 'rename', purok: oldName, newName: newName.trim() });
        if (data.success) {
            setPuroks(data.puroks);
            setEditPurok(null);
            showToast('Purok renamed');
        } else {
            showToast(data.error || 'Failed', 'error');
        }
    };

    const handleDeletePurok = async (name) => {
        if (!confirm(`Delete "${name}"?`)) return;
        const data = await apiPatch({ section: 'puroks', action: 'delete', purok: name });
        if (data.success) {
            setPuroks(data.puroks);
            showToast('Purok deleted');
        }
    };

    // ── Admin Management ──
    const openAdminModal = (admin = null) => {
        setAdminModal(admin || {});
        if (admin && admin.id) {
            setAdminForm({ name: admin.name, username: admin.username, email: admin.email, password: '', permissions: admin.permissions || [] });
        } else {
            setAdminForm({ name: '', username: '', email: '', password: '', permissions: [] });
        }
    };

    const toggleAdminPermission = (perm) => {
        setAdminForm((prev) => ({
            ...prev,
            permissions: prev.permissions.includes(perm)
                ? prev.permissions.filter((p) => p !== perm)
                : [...prev.permissions, perm],
        }));
    };

    const handleAdminSave = async () => {
        if (!adminForm.name.trim() || !adminForm.username.trim()) {
            showToast('Name and username are required', 'error');
            return;
        }
        if (!adminModal.id && !adminForm.password) {
            showToast('Password is required for new admin', 'error');
            return;
        }

        const action = adminModal.id ? 'edit' : 'add';
        const payload = { section: 'admin-management', action };

        if (action === 'add') {
            payload.name = adminForm.name;
            payload.username = adminForm.username;
            payload.email = adminForm.email;
            payload.password = adminForm.password;
            payload.permissions = adminForm.permissions;
        } else {
            payload.adminId = adminModal.id;
            payload.name = adminForm.name;
            payload.email = adminForm.email;
            payload.permissions = adminForm.permissions;
            if (adminForm.password) payload.password = adminForm.password;
        }

        const data = await apiPatch(payload);
        if (data.success) {
            setAdminUsers(data.adminUsers);
            setAdminModal(null);
            showToast(action === 'add' ? 'Admin added' : 'Admin updated');
        } else {
            showToast(data.error || 'Failed', 'error');
        }
    };

    const handleAdminDelete = async (id) => {
        if (!confirm('Delete this admin account?')) return;
        const data = await apiPatch({ section: 'admin-management', action: 'delete', adminId: id });
        if (data.success) {
            setAdminUsers(data.adminUsers);
            showToast('Admin deleted');
        } else {
            showToast(data.error || 'Failed', 'error');
        }
    };

    // ── Format date ──
    const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    if (loading) return <div className={styles.loadingState}>Loading settings…</div>;

    const currentTabKey = visibleTabs[activeTab]?.key;

    return (
        <div className={styles.settings}>
            {/* Tabs */}
            <div className={styles.tabs}>
                {visibleTabs.map((t, i) => (
                    <button key={t.key} className={`${styles.tab} ${activeTab === i ? styles.tabActive : ''}`} onClick={() => setActiveTab(i)}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── TAB: Profile ── */}
            {currentTabKey === 'profile' && (
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Admin Profile</h3>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Full Name</label>
                            <input className={styles.formInput} value={profileForm.name} onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Email</label>
                            <input className={styles.formInput} type="email" value={profileForm.email} onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))} />
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Username</label>
                        <input className={styles.formInput} value={profile?.username || ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                    </div>
                    <h3 className={styles.cardTitle} style={{ marginTop: 28 }}>Change Password</h3>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Current Password</label>
                        <input className={styles.formInput} type="password" value={profileForm.currentPassword} onChange={(e) => setProfileForm((p) => ({ ...p, currentPassword: e.target.value }))} />
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>New Password</label>
                            <input className={styles.formInput} type="password" value={profileForm.newPassword} onChange={(e) => setProfileForm((p) => ({ ...p, newPassword: e.target.value }))} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Confirm Password</label>
                            <input className={styles.formInput} type="password" value={profileForm.confirmPassword} onChange={(e) => setProfileForm((p) => ({ ...p, confirmPassword: e.target.value }))} />
                        </div>
                    </div>
                    <div className={styles.btnRow}>
                        <button className={styles.btnPrimary} onClick={handleProfileSave}>Save Changes</button>
                    </div>
                </div>
            )}

            {/* ── TAB: Fees ── */}
            {currentTabKey === 'fees' && (
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Document & Fees Configuration</h3>
                    <table className={styles.feesTable}>
                        <thead>
                            <tr>
                                <th>Document</th>
                                <th>Fee (₱)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fees.map((f, i) => (
                                <tr key={f.name}>
                                    <td>{f.name}</td>
                                    <td>
                                        <input className={styles.feeInput} type="number" min="0" value={f.fee} onChange={(e) => handleFeeChange(i, e.target.value)} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className={styles.btnRow}>
                        <button className={styles.btnPrimary} onClick={handleFeesSave}>Save Fees</button>
                    </div>
                </div>
            )}

            {/* ── TAB: Announcements ── */}
            {currentTabKey === 'announcements' && (
                <div className={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 className={styles.cardTitle} style={{ margin: 0 }}>Announcements</h3>
                        <button className={styles.btnPrimary} onClick={() => openAnnModal()}>+ Add</button>
                    </div>
                    {announcements.length === 0 ? (
                        <div className={styles.emptyState}>No announcements yet</div>
                    ) : (
                        announcements.map((a) => (
                            <div key={a.id} className={styles.listItem}>
                                <div className={styles.listItemContent}>
                                    <p className={styles.listItemTitle}>{a.title}</p>
                                    <span className={styles.listItemMeta}>{fmtDate(a.date)} — {a.author}</span>
                                    <p className={styles.listItemBody}>{a.content}</p>
                                </div>
                                <div className={styles.listItemActions}>
                                    <button className={styles.btnSmall} onClick={() => openAnnModal(a)}>Edit</button>
                                    <button className={styles.btnDanger} onClick={() => handleAnnDelete(a.id)}>Delete</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ── TAB: Puroks ── */}
            {currentTabKey === 'puroks' && (
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Purok List</h3>
                    {puroks.length === 0 ? (
                        <div className={styles.emptyState}>No puroks configured</div>
                    ) : (
                        puroks.map((p, i) => (
                            <div key={i} className={styles.listItem}>
                                {editPurok?.idx === i ? (
                                    <input
                                        className={styles.formInput}
                                        autoFocus
                                        value={editPurok.value}
                                        onChange={(e) => setEditPurok({ idx: i, value: e.target.value })}
                                        onBlur={() => handleRenamePurok(p, editPurok.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleRenamePurok(p, editPurok.value)}
                                        style={{ maxWidth: 240 }}
                                    />
                                ) : (
                                    <span className={styles.purokName}>{p}</span>
                                )}
                                <div className={styles.listItemActions}>
                                    <button className={styles.btnSmall} onClick={() => setEditPurok({ idx: i, value: p })}>Rename</button>
                                    <button className={styles.btnDanger} onClick={() => handleDeletePurok(p)}>Delete</button>
                                </div>
                            </div>
                        ))
                    )}
                    <div className={styles.addRow}>
                        <input
                            className={styles.formInput}
                            placeholder="New purok name…"
                            value={newPurok}
                            onChange={(e) => setNewPurok(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddPurok()}
                        />
                        <button className={styles.btnPrimary} onClick={handleAddPurok}>Add</button>
                    </div>
                </div>
            )}

            {/* ── TAB: Admin Management (super admin only) ── */}
            {currentTabKey === 'admin-management' && isSuperAdmin && (
                <div className={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 className={styles.cardTitle} style={{ margin: 0 }}>Admin Accounts</h3>
                        <button className={styles.btnPrimary} onClick={() => openAdminModal()}>+ Add Admin</button>
                    </div>

                    {adminUsers.length === 0 ? (
                        <div className={styles.emptyState}>No admin accounts</div>
                    ) : (
                        <table className={styles.adminTable}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Permissions</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {adminUsers.map((a) => (
                                    <tr key={a.id}>
                                        <td>
                                            <div className={styles.adminNameCell}>
                                                {a.name}
                                                {a.superAdmin && <span className={styles.superBadge}>Super Admin</span>}
                                            </div>
                                        </td>
                                        <td>{a.username}</td>
                                        <td>{a.email}</td>
                                        <td>
                                            {a.superAdmin ? (
                                                <span className={styles.permBadge} style={{ background: '#e8f5e9', color: '#2e7d32' }}>Full Access</span>
                                            ) : (
                                                <div className={styles.permList}>
                                                    {(a.permissions || []).length === 0 ? (
                                                        <span className={styles.permBadge} style={{ background: '#fff3e0', color: '#e65100' }}>Profile Only</span>
                                                    ) : (
                                                        (a.permissions || []).map((p) => (
                                                            <span key={p} className={styles.permBadge}>{AVAILABLE_PERMISSIONS.find((ap) => ap.key === p)?.label || p}</span>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            {!a.superAdmin && (
                                                <div className={styles.listItemActions}>
                                                    <button className={styles.btnSmall} onClick={() => openAdminModal(a)}>Edit</button>
                                                    <button className={styles.btnDanger} onClick={() => handleAdminDelete(a.id)}>Delete</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* ── Announcement Modal ── */}
            {annModal !== null && (
                <div className={styles.modalOverlay} onClick={() => setAnnModal(null)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h3 className={styles.modalTitle}>{annModal.id ? 'Edit Announcement' : 'New Announcement'}</h3>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Title</label>
                            <input className={styles.formInput} value={annForm.title} onChange={(e) => setAnnForm((p) => ({ ...p, title: e.target.value }))} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Content</label>
                            <textarea className={styles.formTextarea} value={annForm.content} onChange={(e) => setAnnForm((p) => ({ ...p, content: e.target.value }))} />
                        </div>
                        <div className={styles.btnRow}>
                            <button className={styles.btnPrimary} onClick={handleAnnSave}>{annModal.id ? 'Update' : 'Add'}</button>
                            <button className={styles.btnSecondary} onClick={() => setAnnModal(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Admin Modal ── */}
            {adminModal !== null && (
                <div className={styles.modalOverlay} onClick={() => setAdminModal(null)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h3 className={styles.modalTitle}>{adminModal.id ? 'Edit Admin' : 'Add New Admin'}</h3>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Full Name</label>
                                <input className={styles.formInput} value={adminForm.name} onChange={(e) => setAdminForm((p) => ({ ...p, name: e.target.value }))} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Username</label>
                                <input className={styles.formInput} value={adminForm.username} disabled={!!adminModal.id} style={adminModal.id ? { opacity: 0.6, cursor: 'not-allowed' } : {}} onChange={(e) => setAdminForm((p) => ({ ...p, username: e.target.value }))} />
                            </div>
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Email</label>
                                <input className={styles.formInput} type="email" value={adminForm.email} onChange={(e) => setAdminForm((p) => ({ ...p, email: e.target.value }))} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>{adminModal.id ? 'New Password (leave blank to keep)' : 'Password'}</label>
                                <input className={styles.formInput} type="password" value={adminForm.password} onChange={(e) => setAdminForm((p) => ({ ...p, password: e.target.value }))} />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Permissions</label>
                            <p className={styles.permHint}>Select which sections this admin can access. All admins can always access their own profile.</p>
                            <div className={styles.permGrid}>
                                {AVAILABLE_PERMISSIONS.map((perm) => (
                                    <label key={perm.key} className={styles.permCheckLabel}>
                                        <input
                                            type="checkbox"
                                            checked={adminForm.permissions.includes(perm.key)}
                                            onChange={() => toggleAdminPermission(perm.key)}
                                            className={styles.permCheckbox}
                                        />
                                        <span className={styles.permCheckText}>{perm.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className={styles.btnRow}>
                            <button className={styles.btnPrimary} onClick={handleAdminSave}>{adminModal.id ? 'Update' : 'Add Admin'}</button>
                            <button className={styles.btnSecondary} onClick={() => setAdminModal(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>{toast.msg}</div>}
        </div>
    );
}
