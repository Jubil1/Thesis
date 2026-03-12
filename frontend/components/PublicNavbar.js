'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './PublicNavbar.module.css';

const NAV_LINKS = [
    { href: '/', label: 'Home', section: 'home' },
    { href: '/#about', label: 'About', section: 'about' },
    { href: '/#services', label: 'Services', section: 'services' },
];

export default function PublicNavbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [activeSection, setActiveSection] = useState('home');
    const [user, setUser] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Check auth status
    useEffect(() => {
        fetch('/api/auth/me')
            .then((res) => res.ok ? res.json() : null)
            .then((data) => {
                if (data?.authenticated) setUser(data.user);
            })
            .catch(() => { });
    }, [pathname]); // Re-check when page changes

    // Track which section is in view using IntersectionObserver
    useEffect(() => {
        if (pathname !== '/') return;

        const sectionIds = NAV_LINKS.map((l) => l.section);

        const handleIntersect = (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        };

        const observer = new IntersectionObserver(handleIntersect, {
            rootMargin: '-40% 0px -55% 0px',
        });

        const observed = [];
        sectionIds.forEach((id) => {
            const el = document.getElementById(id);
            if (el) {
                observer.observe(el);
                observed.push(el);
            }
        });

        return () => {
            observed.forEach((el) => observer.unobserve(el));
        };
    }, [pathname]);

    // Listen for hash changes
    useEffect(() => {
        const handleHash = () => {
            const hash = window.location.hash.replace('#', '');
            if (hash) setActiveSection(hash);
        };
        window.addEventListener('hashchange', handleHash);
        return () => window.removeEventListener('hashchange', handleHash);
    }, []);

    const isActive = (link) => {
        if (pathname !== '/') return false;
        return activeSection === link.section;
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        setDropdownOpen(false);
        window.location.href = '/';
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className={styles.navbar} style={user?.role === 'admin' ? { top: '32px' } : undefined}>
            <div className={styles.navContainer}>
                <Link href="/" className={styles.logo}>
                    <span className={styles.logoMy}>My</span>
                    <span className={styles.logoTibanga}>Tibanga</span>
                    <span className={styles.logoPortal}>Portal</span>
                </Link>

                <nav className={styles.navMenu}>
                    <ul>
                        {NAV_LINKS.map((link) => (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className={`${styles.navLink} ${isActive(link) ? styles.active : ''}`}
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className={styles.authSection}>
                    {user ? (
                        <div className={styles.userDropdown} ref={dropdownRef}>
                            <button
                                className={styles.userNameBtn}
                                onClick={() => setDropdownOpen((prev) => !prev)}
                            >
                                {user.name}
                                <span className={`${styles.dropdownArrow} ${dropdownOpen ? styles.open : ''}`}>▾</span>
                            </button>
                            {dropdownOpen && (
                                <div className={styles.dropdownMenu}>
                                    <Link href="/profile" className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}>
                                        Update Profile
                                    </Link>
                                    <button className={styles.dropdownItem} onClick={handleLogout}>
                                        Log Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link href="/login" className={styles.loginBtn}>
                            Log In
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
