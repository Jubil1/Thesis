'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import TimeDisplay from '@/components/TimeDisplay';
import { useAuth } from '@/hooks/useAuth';
import styles from './page.module.css';

const DOCUMENTS = [
    {
        id: 'barangay-certificate',
        label: 'Barangay Certificate for Motorized Banca',
        image: '/images/Barangay Certificate for Motorized Banca.jpg',
    },
    {
        id: 'solo-parent',
        label: 'Barangay Certificate for Solo Parent',
        image: '/images/Barangay Certificate for Solo Parent.jpg',
    },
    {
        id: 'barangay-clearance',
        label: 'Barangay Clearance',
        image: '/images/Barangay Clearance.jpg',
    },
    {
        id: 'indigency',
        label: 'Certificate of Indigency',
        image: '/images/Certificate of Indigency.jpg',
    },
    {
        id: 'residency',
        label: 'Certificate of Residency',
        image: '/images/Certificate of Residency.jpg',
    },
];

export default function DocumentRequestPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [selected, setSelected] = useState({});
    const [quantities, setQuantities] = useState({});
    const [previewIndex, setPreviewIndex] = useState(0);
    const [modalImage, setModalImage] = useState(null);

    const selectedDocs = DOCUMENTS.filter((doc) => selected[doc.id]);

    const handleToggle = (docId) => {
        setSelected((prev) => {
            const next = { ...prev, [docId]: !prev[docId] };
            // Reset preview index if needed
            const newSelected = DOCUMENTS.filter((d) => next[d.id]);
            if (previewIndex >= newSelected.length) {
                setPreviewIndex(Math.max(0, newSelected.length - 1));
            }
            return next;
        });
        if (!quantities[docId]) {
            setQuantities((prev) => ({ ...prev, [docId]: 1 }));
        }
    };

    const handleQuantityChange = (docId, value) => {
        const qty = Math.min(10, Math.max(1, parseInt(value) || 1));
        setQuantities((prev) => ({ ...prev, [docId]: qty }));
    };

    const handleConfirm = () => {
        if (selectedDocs.length === 0) {
            alert('Please select at least one document type.');
            return;
        }

        const requestedDocs = selectedDocs.map((doc) => ({
            name: doc.label,
            quantity: quantities[doc.id] || 1,
        }));

        localStorage.setItem('requestedDocuments', JSON.stringify(requestedDocs));
        router.push('/payment');
    };

    const handlePreviewClick = () => {
        if (selectedDocs.length === 0) return;
        const current = selectedDocs[previewIndex];
        if (current) {
            setModalImage(current);
        }
    };

    return (
        <>
            {/* Time Display */}
            <TimeDisplay />

            {/* Greeting */}
            <div className={styles.greetingSection}>
                <h2 className={styles.greeting}>
                    <strong>Hello {user?.name || 'Guest'}!</strong>
                </h2>
            </div>

            {/* Request Form */}
            <section className={styles.contentSection}>
                {/* Left Panel */}
                <div className={styles.leftPanel}>
                    <h2 className={styles.sectionTitle}>Select the document you&apos;d like to request</h2>
                    <p className={styles.sectionSubtitle}>Choose the documents below:</p>

                    <div className={styles.documentOptions}>
                        {DOCUMENTS.map((doc) => (
                            <label
                                key={doc.id}
                                className={styles.documentItem}
                                onClick={(e) => {
                                    // Prevent double-toggle from label+checkbox
                                    if (e.target.type !== 'checkbox') {
                                        e.preventDefault();
                                        handleToggle(doc.id);
                                    }
                                }}
                            >
                                <span className={styles.docCheckboxLabel}>
                                    <input
                                        type="checkbox"
                                        className={styles.realCheckbox}
                                        checked={!!selected[doc.id]}
                                        onChange={() => handleToggle(doc.id)}
                                        aria-label={doc.label}
                                    />
                                    <span className={styles.documentLabel}>{doc.label}</span>
                                </span>
                                <input
                                    type="number"
                                    className={styles.docQuantity}
                                    min="1"
                                    max="10"
                                    value={quantities[doc.id] || 1}
                                    onChange={(e) => handleQuantityChange(doc.id, e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    disabled={!selected[doc.id]}
                                    aria-label="Quantity"
                                />
                            </label>
                        ))}
                    </div>

                    <button
                        className={styles.confirmBtn}
                        onClick={handleConfirm}
                        aria-label="Confirm your document request"
                    >
                        Confirm
                    </button>
                </div>

                {/* Right Panel — Preview */}
                <div className={styles.rightPanel}>
                    <div
                        className={styles.previewContainer}
                        onClick={handlePreviewClick}
                        tabIndex={0}
                        role="region"
                        aria-label="Document Preview"
                    >
                        <div className={styles.previewContent}>
                            {selectedDocs.length === 0 ? (
                                <div className={styles.previewPlaceholder}>
                                    Select a document to preview
                                </div>
                            ) : (
                                selectedDocs.map((doc, index) => (
                                    <div
                                        key={doc.id}
                                        className={`${styles.documentPreview} ${index === previewIndex ? styles.active : ''}`}
                                    >
                                        <Image
                                            src={doc.image}
                                            alt={doc.label}
                                            width={400}
                                            height={560}
                                            className={styles.documentImage}
                                            style={{ width: '100%', height: 'auto' }}
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Pagination Dots */}
                    {selectedDocs.length > 0 && (
                        <div className={styles.pageIndicator}>
                            {selectedDocs.map((doc, index) => (
                                <button
                                    key={doc.id}
                                    className={`${styles.indicatorDot} ${index === previewIndex ? styles.activeDot : ''}`}
                                    onClick={() => setPreviewIndex(index)}
                                    aria-label={`Preview page ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Modal */}
            {modalImage && (
                <div
                    className={styles.modal}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setModalImage(null);
                    }}
                    role="dialog"
                    aria-modal="true"
                >
                    <div className={styles.modalContent}>
                        <button
                            className={styles.closeModal}
                            onClick={() => setModalImage(null)}
                            aria-label="Close document preview"
                        >
                            &times;
                        </button>
                        <Image
                            src={modalImage.image}
                            alt={modalImage.label}
                            width={800}
                            height={1120}
                            style={{ width: '100%', height: 'auto', maxHeight: '80vh', objectFit: 'contain' }}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
