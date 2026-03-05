'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function AddResidentPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        suffix: '',
        sex: '',
        civilStatus: '',
        birthdate: '',
        birthplace: '',
        religion: '',
        citizenship: '',
        purok: '',
        barangay: 'Tibanga',
        city: 'Iligan City',
        mobileNumber: '',
        email: '',
        mothersMaidenName: '',
        fathersName: '',
        spousesName: '',
        children: [''],
        username: '',
        password: '1234',
        idPicture: null,
    });

    const [idPreview, setIdPreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const handleChange = (field, value) => {
        setForm((prev) => {
            const updated = { ...prev, [field]: value };
            // Auto-generate username when name changes
            if (['firstName', 'middleName', 'lastName'].includes(field)) {
                const first = field === 'firstName' ? value : prev.firstName;
                const middle = field === 'middleName' ? value : prev.middleName;
                const last = field === 'lastName' ? value : prev.lastName;
                if (first && last) {
                    const firstPart = (first + (middle || '')).toLowerCase().replace(/\s+/g, '');
                    const lastPart = last.toLowerCase().trim().replace(/\s+/g, '');
                    updated.username = `${firstPart}.${lastPart}`;
                }
            }
            return updated;
        });
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

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleChange('idPicture', file);
            const reader = new FileReader();
            reader.onload = (ev) => setIdPreview(ev.target.result);
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        handleChange('idPicture', null);
        setIdPreview(null);
    };

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 400, height: 300 } });
            streamRef.current = stream;
            setCameraActive(true);
        } catch (err) {
            alert('Could not access camera. Please allow camera permission or use the upload option.');
        }
    }, []);

    // Connect stream to video element after it renders
    useEffect(() => {
        if (cameraActive && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [cameraActive]);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    }, []);

    const capturePhoto = useCallback(() => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            setIdPreview(dataUrl);
            handleChange('idPicture', dataUrl);
            stopCamera();
        }
    }, [stopCamera]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/admin/residents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (data.success) {
                alert('Resident added successfully!');
                router.push('/resident-records');
            } else {
                alert('Error: ' + (data.message || 'Failed to save'));
            }
        } catch (err) {
            alert('Error saving resident: ' + err.message);
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

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.pageHeader}>
                <div className={styles.headerInfo}>
                    <Link href="/resident-records" className={styles.backBtn}>←</Link>
                    <div>
                        <h1 className={styles.pageTitle}>Adding New Resident</h1>
                        <p className={styles.pageSubtitle}>Total Resident: 2000 as of {today}</p>
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
                            <input type="text" placeholder={`Child's Name`} className={styles.input}
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
                    <p className={styles.credentialsNote}>Auto-generated from resident name. Default password is simple for easy first login.</p>
                    <div className={styles.formRowTwo}>
                        <div className={styles.credentialField}>
                            <label className={styles.credentialLabel}>Username</label>
                            <input type="text" className={`${styles.input} ${styles.credentialInput}`}
                                value={form.username}
                                onChange={(e) => handleChange('username', e.target.value)}
                                placeholder="Auto-generated from name" readOnly />
                        </div>
                        <div className={styles.credentialField}>
                            <label className={styles.credentialLabel}>Default Password</label>
                            <input type="text" className={`${styles.input} ${styles.credentialInput}`}
                                value={form.password}
                                onChange={(e) => handleChange('password', e.target.value)} />
                        </div>
                    </div>
                    <p className={styles.credentialsHint}>⚠ Resident will be asked to change password on first login.</p>
                </fieldset>

                {/* ID Picture */}
                <fieldset className={styles.formSection}>
                    <legend className={styles.sectionTitle}>ID Picture</legend>
                    <div className={styles.uploadArea}>
                        {idPreview ? (
                            <div className={styles.uploadedImage}>
                                <img src={idPreview} alt="ID Preview" />
                                <button type="button" className={styles.removeImageBtn} onClick={removeImage}>×</button>
                            </div>
                        ) : cameraActive ? (
                            <div className={styles.cameraContainer}>
                                <video ref={videoRef} autoPlay playsInline muted className={styles.cameraVideo} />
                                <canvas ref={canvasRef} style={{ display: 'none' }} />
                                <div className={styles.cameraControls}>
                                    <button type="button" className={styles.captureBtn} onClick={capturePhoto}>📸 Capture</button>
                                    <button type="button" className={styles.cancelCameraBtn} onClick={stopCamera}>Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.pictureOptions}>
                                <button type="button" className={styles.takePictureBtn} onClick={startCamera}>
                                    <span className={styles.cameraIcon}>📷</span>
                                    <span>Take a Picture</span>
                                </button>
                                <span className={styles.orDivider}>or</span>
                                <label className={styles.uploadLabelAlt}>
                                    <input type="file" accept="image/*" className={styles.fileInput}
                                        onChange={handleImageUpload} />
                                    <span>Upload from device</span>
                                </label>
                            </div>
                        )}
                    </div>
                </fieldset>

                {/* Submit */}
                <div className={styles.formActions}>
                    <button type="submit" className={styles.confirmBtn} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Confirm'}
                    </button>
                </div>
            </form>
        </div>
    );
}
