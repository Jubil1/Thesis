'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TimeDisplay from '@/components/TimeDisplay';
import { useAuth } from '@/hooks/useAuth';
import styles from './page.module.css';

const DOCUMENT_PRICES = {
    'Barangay Certificate for Motorized Banca': 50,
    'Barangay Certificate for Solo Parent': 60,
    'Barangay Clearance': 70,
    'Certificate of Indigency': 40,
    'Certificate of Residency': 30,
};

export default function PaymentPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [documents, setDocuments] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('online');
    const [reference, setReference] = useState('');

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('requestedDocuments') || '[]');
        setDocuments(stored);
    }, []);

    const getPrice = (doc) => {
        const name = typeof doc === 'string' ? doc : doc.name;
        const qty = typeof doc === 'string' ? 1 : (doc.quantity || 1);
        const unitPrice = DOCUMENT_PRICES[name] || 50;
        return { name, qty, unitPrice, total: unitPrice * qty };
    };

    const items = documents.map(getPrice);
    const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

    const handleCancel = () => {
        if (confirm('Are you sure you want to cancel this request?')) {
            setReference('');
            setPaymentMethod('cash');
            alert('Request cancelled successfully!');
        }
    };

    const handleSubmit = async () => {
        if (paymentMethod === 'online' && !reference.trim()) {
            alert('Please enter a reference number for online payment.');
            return;
        }

        // Generate request number
        const now = new Date();
        const requestNo = [
            String(now.getMonth() + 1).padStart(2, '0'),
            String(now.getDate()).padStart(2, '0'),
            String(now.getFullYear()).slice(-2),
            String(now.getHours()).padStart(2, '0'),
            String(now.getMinutes()).padStart(2, '0'),
            String(now.getSeconds()).padStart(2, '0'),
        ].join('');

        // Save to API
        try {
            await fetch('/api/admin/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    residentName: user?.name || 'Guest',
                    documents: items,
                    paymentMethod,
                    referenceNo: reference.trim(),
                    requestNo,
                }),
            });
        } catch {
            // Continue even if save fails
        }

        // Store payment info for summary page
        localStorage.setItem('paymentInfo', JSON.stringify({
            paymentMethod,
            referenceNo: reference.trim(),
            requestNo,
        }));

        router.push('/payment-summary');
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

            {/* Payment Card */}
            <div className={styles.requestCard}>
                <h2 className={styles.cardTitle}>Request Summary</h2>
                <p className={styles.cardSubtitle}>
                    Kindly confirm your request and mode of payment
                </p>

                {/* Item Summary */}
                <div className={styles.itemSummary}>
                    {items.length === 0 ? (
                        <div className={styles.itemRow}>
                            <span className={styles.itemName}>No documents selected</span>
                            <span className={styles.itemPrice}>₱ 0.00</span>
                        </div>
                    ) : (
                        items.map((item, i) => (
                            <div className={styles.itemRow} key={i}>
                                <span className={styles.itemName}>{item.name} x{item.qty}</span>
                                <span className={styles.itemPrice}>₱ {item.total.toFixed(2)}</span>
                            </div>
                        ))
                    )}
                    <div className={`${styles.itemRow} ${styles.totalRow}`}>
                        <span className={styles.itemName}><strong>Item Total:</strong></span>
                        <span className={styles.itemPrice}><strong>₱ {grandTotal.toFixed(2)}</strong></span>
                    </div>
                </div>

                {/* Payment Method */}
                <div className={styles.sectionTitle}>Payment Method</div>
                <div className={styles.paymentOptions}>
                    <label
                        className={`${styles.paymentOption} ${paymentMethod === 'cash' ? styles.selected : ''}`}
                        onClick={() => setPaymentMethod('cash')}
                    >
                        <input
                            type="radio"
                            name="payment"
                            value="cash"
                            checked={paymentMethod === 'cash'}
                            onChange={() => setPaymentMethod('cash')}
                        />
                        <span>Cash</span>
                    </label>
                    <label
                        className={`${styles.paymentOption} ${paymentMethod === 'online' ? styles.selected : ''}`}
                        onClick={() => setPaymentMethod('online')}
                    >
                        <input
                            type="radio"
                            name="payment"
                            value="online"
                            checked={paymentMethod === 'online'}
                            onChange={() => setPaymentMethod('online')}
                        />
                        <span>Online Payment (Acc: 0900 000 0000 - Raffy Tulfo)</span>
                    </label>
                </div>

                {/* Reference Input */}
                <input
                    type="text"
                    className={styles.referenceInput}
                    placeholder="Type in the reference number here"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                />

                {/* Buttons */}
                <div className={styles.buttonGroup}>
                    <button className={`${styles.btn} ${styles.btnCancel}`} onClick={handleCancel}>
                        Cancel Request
                    </button>
                    <button className={`${styles.btn} ${styles.btnSubmit}`} onClick={handleSubmit}>
                        Place Request
                    </button>
                </div>
            </div>
        </>
    );
}
