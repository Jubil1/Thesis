'use client';

import { useState, useEffect, useCallback } from 'react';
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

function generateRequestNumber() {
    const now = new Date();
    const parts = [
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
        String(now.getFullYear()).slice(-2),
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0'),
        String(now.getSeconds()).padStart(2, '0'),
    ];
    return parts.join('');
}

export default function PaymentSummaryPage() {
    const { user } = useAuth();
    const [documents, setDocuments] = useState([]);
    const [requestNumber, setRequestNumber] = useState('');
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        const paymentInfo = JSON.parse(localStorage.getItem('paymentInfo') || '{}');
        setRequestNumber(paymentInfo.requestNo || generateRequestNumber());
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

    const showToast = useCallback((message) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 3000);
    }, []);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(requestNumber);
            showToast('Request number copied to clipboard!');
        } catch {
            showToast('Failed to copy request number.');
        }
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank', 'width=600,height=400');
        if (!printWindow) return;

        const serviceLines = items
            .map((item) => `<div class="details"><strong>Service:</strong> ${item.name} x${item.qty} — ₱${item.total.toFixed(2)}</div>`)
            .join('');

        const printContent = `<!DOCTYPE html>
<html><head><title>Request Number - ${requestNumber}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
  .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
  .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
  .request-number { font-size: 20px; font-weight: bold; color: #2196f3; text-align: center; padding: 10px; border: 2px solid #2196f3; border-radius: 5px; margin: 20px 0; }
  .request-info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
  .details { margin: 15px 0; }
  .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
</style></head><body>
  <div class="header"><div class="logo">MyTibangaPortal</div><h2>Request Confirmation</h2></div>
  <div class="request-number">Request Number: ${requestNumber}</div>
  <div class="request-info">
    <div class="details"><strong>Customer:</strong> ${user?.name || 'Guest'}</div>
    ${serviceLines}
    <div class="details"><strong>Total:</strong> ₱${grandTotal.toFixed(2)}</div>
    <div class="details"><strong>Date:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</div>
  </div>
  <div class="footer"><p>Please keep this receipt for your records.</p><p>© ${new Date().getFullYear()} MyTibangaPortal</p></div>
  <script>window.onload = function() { window.print(); }</script>
</body></html>`;

        printWindow.document.write(printContent);
        printWindow.document.close();
    };

    return (
        <>
            {/* Time Display */}
            <TimeDisplay />

            {/* Welcome */}
            <div className={styles.welcomeSection}>
                <h1 className={styles.welcomeTitle}>Hello {user?.name || 'Guest'}!</h1>
            </div>

            {/* Request Card */}
            <div className={styles.requestCard}>
                <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Request Placed</h2>
                    <p className={styles.cardSubtitle}>Please get your request number</p>
                </div>

                {/* Service Items */}
                {items.map((item, i) => (
                    <div className={styles.serviceItem} key={i}>
                        <div className={styles.serviceDetails}>
                            <span className={styles.serviceName}>{item.name} x{item.qty}</span>
                            <span className={styles.servicePrice}>₱ {item.total.toFixed(2)}</span>
                        </div>
                    </div>
                ))}

                {/* Totals */}
                <div className={styles.totalsSection}>
                    <div className={styles.totalLine}>
                        <span className={styles.totalLabel}>Item Total:</span>
                        <span className={styles.totalValue}>₱ {grandTotal.toFixed(2)}</span>
                    </div>
                    <div className={styles.paymentLine}>
                        <span className={styles.paymentLabel}>Paid Online:</span>
                        <span className={styles.paymentValue}>#10203040</span>
                    </div>
                </div>

                {/* Request Details */}
                <div className={styles.requestDetails}>
                    <div className={styles.detailsHeader}>Request Details</div>
                    <div className={styles.requestNumberSection}>
                        <span className={styles.requestNumberLabel}>Request Number</span>
                        <span
                            className={styles.requestNumberValue}
                            onClick={handleCopy}
                            title="Click to copy request number"
                            style={{ cursor: 'pointer' }}
                        >
                            {requestNumber}
                        </span>
                    </div>
                </div>

                {/* Print Button */}
                <button className={styles.printButton} onClick={handlePrint}>
                    Print Request Number
                </button>

                {/* Navigation Buttons */}
                <div className={styles.navButtons}>
                    <a href="/document-request" className={styles.requestAgainBtn}>
                        Request Another Document
                    </a>
                    <a href="/" className={styles.returnHomeBtn}>
                        Return Home
                    </a>
                </div>
            </div>

            {/* Toast Notification */}
            {notification && (
                <div className={styles.toast}>{notification}</div>
            )}
        </>
    );
}
