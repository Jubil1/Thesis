import Link from 'next/link';
import TimeDisplay from '@/components/TimeDisplay';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import ActionLink from './components/ActionLink';
import styles from './page.module.css';

export const metadata = {
    title: 'MyTibangaPortal - Barangay Tibanga, Iligan City',
    description: 'The Official Website of Barangay Tibanga, Iligan City. Access barangay services, request documents, and stay updated.',
};

export default function HomePage() {
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
                        The Official Website of Barangay Tibanga, Iligan City
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
                                <strong>New Here?</strong> Go to our Barangay Office and have yourself registered
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Announcement Banner */}
            <AnnouncementBanner />

            {/* About Section */}
            <section id="about" className={styles.contentSection}>
                <h2>About Barangay Tibanga</h2>
                <p>
                    Barangay Tibanga is a progressive community in Iligan City, committed to serving
                    our residents with excellence and transparency. We strive to provide accessible
                    services and maintain open communication with all community members.
                </p>
                <div className={styles.servicesGrid}>
                    <div className={styles.serviceCard}>
                        <h3>Community Services</h3>
                        <p>We offer various community programs and services to enhance the quality of life for all residents.</p>
                    </div>
                    <div className={styles.serviceCard}>
                        <h3>Local Government</h3>
                        <p>Transparent and accountable local governance dedicated to serving the people of Tibanga.</p>
                    </div>
                    <div className={styles.serviceCard}>
                        <h3>Public Safety</h3>
                        <p>Maintaining peace and order through community cooperation and effective safety measures.</p>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className={styles.contentSection}>
                <h2>Our Services</h2>
                <p>
                    We provide various document and administrative services to make government
                    processes more accessible to our community.
                </p>
                <div className={styles.servicesGrid}>
                    <div className={styles.serviceCard}>
                        <h3>Document Requests</h3>
                        <p>Barangay clearance, certificates of residency, indigency certificates, and other official documents.</p>
                    </div>
                    <div className={styles.serviceCard}>
                        <h3>Business Permits</h3>
                        <p>Assistance with barangay business permit applications and renewals for local entrepreneurs.</p>
                    </div>
                    <div className={styles.serviceCard}>
                        <h3>Community Records</h3>
                        <p>Maintenance of resident records, birth registrations, and other vital community documentation.</p>
                    </div>
                    <div className={styles.serviceCard}>
                        <h3>Mediation Services</h3>
                        <p>Peaceful resolution of community disputes through our mediation and conflict resolution programs.</p>
                    </div>
                </div>
            </section>
        </>
    );
}
