'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './AnnouncementBanner.module.css';

const DEFAULT_ANNOUNCEMENTS = [
    "Liquor Ban will be implemented starting June 25, 2025. By 1AM-6PM. Please comply with local regulations.",
    "Barangay Assembly meeting scheduled for July 15, 2025 at 2:00 PM at the Community Hall.",
    "Community Clean-up Drive every Saturday. Join us for a cleaner and healthier barangay.",
    "New health protocols effective immediately. Please follow safety guidelines for everyone's protection.",
    "Barangay ID renewal deadline extended until August 31, 2025. Visit the office during business hours.",
];

export default function AnnouncementBanner({ announcements = DEFAULT_ANNOUNCEMENTS }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const next = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, [announcements.length]);

    const prev = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
    }, [announcements.length]);

    // Auto-rotate every 5 seconds
    useEffect(() => {
        if (isPaused) return;
        const interval = setInterval(next, 5000);
        return () => clearInterval(interval);
    }, [isPaused, next]);

    return (
        <section
            className={styles.banner}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            aria-label="Announcements"
        >
            <div className={styles.left}>
                <h2>Announcements</h2>
            </div>
            <div className={styles.right}>
                <p className={styles.text} role="marquee" aria-live="polite">
                    {announcements[currentIndex]}
                </p>
                <div className={styles.controls}>
                    <button
                        className={styles.btn}
                        onClick={prev}
                        aria-label="Previous announcement"
                    >
                        ‹
                    </button>
                    <button
                        className={styles.btn}
                        onClick={next}
                        aria-label="Next announcement"
                    >
                        ›
                    </button>
                </div>
            </div>
        </section>
    );
}
