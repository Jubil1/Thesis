'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import TimeDisplay from '@/components/TimeDisplay';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import ActionLink from './components/ActionLink';
import styles from './page.module.css';

export default function HomePage() {
    const [content, setContent] = useState(null);

    useEffect(() => {
        fetch('/api/admin/homepage')
            .then((res) => res.ok ? res.json() : null)
            .then((data) => setContent(data))
            .catch(() => { });
    }, []);

    // Fallback while loading
    if (!content) {
        return (
            <section id="home" className={styles.homeSection}>
                <TimeDisplay />
                <div className={styles.welcomeSection}>
                    <div className={styles.welcomeText}>Welcome to</div>
                    <h1 className={styles.mainTitle}>
                        <span className={styles.titleMy}>My</span>
                        <span className={styles.titleTibanga}>Tibanga</span>
                        <span className={styles.titlePortal}>Portal</span>
                    </h1>
                    <p className={styles.subtitle}>Loading…</p>
                </div>
            </section>
        );
    }

    // Parse bold markdown in newHereText (e.g. **New Here?**)
    const renderNewHere = (text) => {
        const parts = text.split(/\*\*(.*?)\*\*/);
        return parts.map((part, i) =>
            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
        );
    };

    return (
        <>
            {/* Home Section */}
            <section id="home" className={styles.homeSection}>
                <TimeDisplay />

                {/* Welcome */}
                <div className={styles.welcomeSection}>
                    <div className={styles.welcomeText}>Welcome to</div>
                    <h1 className={styles.mainTitle}>
                        <span className={styles.titleMy}>My</span>
                        <span className={styles.titleTibanga}>Tibanga</span>
                        <span className={styles.titlePortal}>Portal</span>
                    </h1>
                    <p className={styles.subtitle}>
                        {content.welcome.subtitle}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className={styles.actionSection}>
                    <div className={styles.actionContainer}>
                        <div className={styles.actionItem}>
                            <ActionLink />
                        </div>
                        <div className={styles.actionItem}>
                            <p className={styles.newUserText}>
                                {renderNewHere(content.welcome.newHereText)}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Announcement Banner */}
            <AnnouncementBanner />

            {/* About Section */}
            <section id="about" className={styles.contentSection}>
                <h2>{content.about.heading}</h2>
                <p>{content.about.description}</p>
                <div className={styles.servicesGrid}>
                    {content.about.cards.map((card, i) => (
                        <div key={i} className={styles.serviceCard}>
                            <h3>{card.title}</h3>
                            <p>{card.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className={styles.contentSection}>
                <h2>{content.services.heading}</h2>
                <p>{content.services.description}</p>
                <div className={styles.servicesGrid}>
                    {content.services.cards.map((card, i) => (
                        <div key={i} className={styles.serviceCard}>
                            <h3>{card.title}</h3>
                            <p>{card.description}</p>
                        </div>
                    ))}
                </div>
            </section>
        </>
    );
}
