'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import styles from '../../add/page.module.css';

export default function EditResidentPage() {
    const router = useRouter();
    const params = useParams();
    const residentId = params.id;

    const [form, setForm] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/admin/residents/${residentId}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.resident) {
                    const r = data.resident;
                    setForm({
                        firstName: r.firstName || '',
                        middleName: r.middleName || '',
                        lastName: r.lastName || '',
                        suffix: r.suffix || '',
                        sex: r.sex || '',
                        civilStatus: r.civilStatus || '',
                        birthdate: r.birthdate || '',
                        birthplace: r.birthplace || '',
                        religion: r.religion || '',
                        citizenship: r.citizenship || '',
                        purok: r.purok || '',
                        barangay: r.barangay || 'Tibanga',
                        city: r.city || 'Iligan City',
                        mobileNumber: r.mobileNumber || '',
                        email: r.email || '',
                        mothersMaidenName: r.mothersMaidenName || '',
                        fathersName: r.fathersName || '',
                        spousesName: r.spousesName || '',
                        children: r.children?.length > 0 ? r.children : (r.childsName ? [r.childsName] : ['']),
                        username: r.username || '',
                        password: r.password || '1234',
                    });
                }
                setLoading(false);
            })
            .catch(() => {
                alert('Failed to load resident data.');
                setLoading(false);
            });
    }, [residentId]);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleChildChange = (index, value) => {
        setForm((prev) => {
            const children = [...prev.children];
            children[index] = value;
            return { ...prev, children };
        });
    };

    const addChild = () => {
        setForm((prev) => ({ ...prev, children: [...prev.children, ''] }));
    };

    const removeChild = (index) => {
        setForm((prev) => ({
            ...prev,
            children: prev.children.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch(`/api/admin/residents/${residentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (data.success) {
                alert('Resident updated successfully!');
                router.push('/resident-records');
            } else {
                alert('Error: ' + (data.error || 'Failed to update'));
            }
        } catch (err) {
            alert('Error updating resident: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });

    const calculateAge = (birthdate) => {
        if (!birthdate) return '';
        const birth = new Date(birthdate);
        const now = new Date();
        let age = now.getFullYear() - birth.getFullYear();
        const monthDiff = now.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    if (loading) {
        return <div className={styles.page}><p style={{ color: '#666', textAlign: 'center', marginTop: 60 }}>Loading resident data...</p></div>;
    }

    if (!form) {
        return <div className={styles.page}><p style={{ color: '#c62828', textAlign: 'center', marginTop: 60 }}>Resident not found.</p></div>;
    }

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.pageHeader}>
                <div className={styles.headerInfo}>
                    <Link href="/resident-records" className={styles.backBtn}>←</Link>
                    <div>
                        <h1 className={styles.pageTitle}>Edit Resident</h1>
                        <p className={styles.pageSubtitle}>Editing: {form.firstName} {form.lastName} — as of {today}</p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form className={styles.formCard} onSubmit={handleSubmit}>

                {/* Resident's Information */}
                <fieldset className={styles.formSection}>
                    <legend className={styles.sectionTitle}>Resident&apos;s Information</legend>

                    <div className={styles.formRow}>
                        <input type="text" placeholder="First Name" className={styles.input}
                            value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)} required />
                    </div>
                    <div className={styles.formRow}>
                        <input type="text" placeholder="Middle Name" className={styles.input}
                            value={form.middleName} onChange={(e) => handleChange('middleName', e.target.value)} />
                    </div>
                    <div className={styles.formRow}>
                        <input type="text" placeholder="Last Name" className={styles.input}
                            value={form.lastName} onChange={(e) => handleChange('lastName', e.target.value)} required />
                    </div>
                    <div className={styles.formRowThree}>
                        <input type="text" placeholder="Suffix" className={styles.input}
                            value={form.suffix} onChange={(e) => handleChange('suffix', e.target.value)} />
                        <select className={styles.select} value={form.sex}
                            onChange={(e) => handleChange('sex', e.target.value)} required>
                            <option value="">Sex</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                        <select className={styles.select} value={form.civilStatus}
                            onChange={(e) => handleChange('civilStatus', e.target.value)} required>
                            <option value="">Civil Status</option>
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                            <option value="Widowed">Widowed</option>
                            <option value="Divorced">Divorced</option>
                        </select>
                    </div>
                    <div className={styles.formRowThree}>
                        <input
                            type={form.birthdate ? 'date' : 'text'}
                            placeholder="Date of Birth (mm/dd/yyyy)"
                            className={styles.input}
                            value={form.birthdate}
                            onFocus={(e) => { e.target.type = 'date'; }}
                            onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                            onChange={(e) => handleChange('birthdate', e.target.value)}
                            required
                        />
                        <input type="text" placeholder="Age" className={styles.input}
                            value={calculateAge(form.birthdate)} readOnly />
                        <input type="text" placeholder="Birthplace" className={styles.input}
                            value={form.birthplace} onChange={(e) => handleChange('birthplace', e.target.value)} />
                    </div>
                    <div className={styles.formRowTwo}>
                        <input type="text" placeholder="Religion" className={styles.input}
                            value={form.religion} onChange={(e) => handleChange('religion', e.target.value)} />
                        <input type="text" placeholder="Citizenship" className={styles.input}
                            value={form.citizenship} onChange={(e) => handleChange('citizenship', e.target.value)} />
                    </div>
                </fieldset>

                {/* Address */}
                <fieldset className={styles.formSection}>
                    <legend className={styles.sectionTitle}>Address</legend>
                    <div className={styles.formRowThree}>
                        <select className={styles.select} value={form.purok}
                            onChange={(e) => handleChange('purok', e.target.value)} required>
                            <option value="">Purok</option>
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={`Purok ${i + 1}`}>Purok {i + 1}</option>
                            ))}
                        </select>
                        <input type="text" placeholder="Barangay" className={styles.input}
                            value={form.barangay} onChange={(e) => handleChange('barangay', e.target.value)} />
                        <input type="text" placeholder="City" className={styles.input}
                            value={form.city} onChange={(e) => handleChange('city', e.target.value)} />
                    </div>
                </fieldset>

                {/* Contact Information */}
                <fieldset className={styles.formSection}>
                    <legend className={styles.sectionTitle}>Contact Information</legend>
                    <div className={styles.formRow}>
                        <input type="tel" placeholder="Mobile Number" className={styles.input}
                            value={form.mobileNumber} onChange={(e) => handleChange('mobileNumber', e.target.value)} />
                    </div>
                    <div className={styles.formRow}>
                        <input type="email" placeholder="Email" className={styles.input}
                            value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
                    </div>
                </fieldset>

                {/* Other Information */}
                <fieldset className={styles.formSection}>
                    <legend className={styles.sectionTitle}>Other Information</legend>
                    <div className={styles.formRow}>
                        <input type="text" placeholder="Mother's Maiden Name" className={styles.input}
                            value={form.mothersMaidenName} onChange={(e) => handleChange('mothersMaidenName', e.target.value)} />
                    </div>
                    <div className={styles.formRow}>
                        <input type="text" placeholder="Father's Name" className={styles.input}
                            value={form.fathersName} onChange={(e) => handleChange('fathersName', e.target.value)} />
                    </div>
                    <div className={styles.formRow}>
                        <input type="text" placeholder="Spouse's Name" className={styles.input}
                            value={form.spousesName} onChange={(e) => handleChange('spousesName', e.target.value)} />
                    </div>

                    {/* Dynamic Children Fields */}
                    {form.children.map((child, i) => (
                        <div key={i} className={styles.childRow}>
                            <input type="text" placeholder="Child's Name" className={styles.input}
                                value={child} onChange={(e) => handleChildChange(i, e.target.value)} />
                            {form.children.length > 1 && (
                                <button type="button" className={styles.removeChildBtn} onClick={() => removeChild(i)}>×</button>
                            )}
                        </div>
                    ))}
                    <button type="button" className={styles.addChildBtn} onClick={addChild}>
                        + Add another child
                    </button>
                </fieldset>

                {/* Account Credentials */}
                <fieldset className={styles.formSection}>
                    <legend className={styles.sectionTitle}>Account Credentials</legend>
                    <div className={styles.formRowTwo}>
                        <div className={styles.credentialField}>
                            <label className={styles.credentialLabel}>Username</label>
                            <input type="text" className={`${styles.input} ${styles.credentialInput}`}
                                value={form.username}
                                onChange={(e) => handleChange('username', e.target.value)} />
                        </div>
                        <div className={styles.credentialField}>
                            <label className={styles.credentialLabel}>Default Password</label>
                            <input type="text" className={`${styles.input} ${styles.credentialInput}`}
                                value={form.password}
                                onChange={(e) => handleChange('password', e.target.value)} />
                        </div>
                    </div>
                </fieldset>

                {/* Submit */}
                <div className={styles.formActions}>
                    <button type="submit" className={styles.confirmBtn} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}
