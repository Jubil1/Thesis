'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TimeDisplay from '@/components/TimeDisplay';
import styles from './page.module.css';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState(null);

    const validateUsername = (value) => {
        if (!value) return 'Username is required';
        return '';
    };

    const validatePassword = (value) => {
        if (!value) return 'Password is required';
        return '';
    };

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 5000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const usernameErr = validateUsername(username);
        const passwordErr = validatePassword(password);
        setUsernameError(usernameErr);
        setPasswordError(passwordErr);

        if (usernameErr || passwordErr) return;

        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                showNotification('Login successful! Redirecting...', 'success');
                const redirectTo = data.user?.role === 'admin' ? '/admin-dashboard' : '/document-request';
                setTimeout(() => router.push(redirectTo), 1500);
            } else {
                throw new Error(data.message || 'Invalid username or password');
            }
        } catch (error) {
            showNotification(error.message, 'error');
            setPassword('');
            setPasswordError('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = (e) => {
        e.preventDefault();
        showNotification(
            'Please contact the Barangay Office for password reset assistance.',
            'info'
        );
    };

    return (
        <>
            <TimeDisplay />

            {/* Login Form */}
            <section className={styles.loginSection}>
                <div className={styles.loginContainer}>
                    <div className={styles.loginCard}>
                        <h2 className={styles.loginTitle}>Log In To Your Account</h2>

                        <form className={styles.loginForm} onSubmit={handleSubmit} suppressHydrationWarning>
                            <div className={styles.formGroup}>
                                <input
                                    type="text"
                                    id="username"
                                    placeholder="Username"
                                    className={`${styles.formInput} ${usernameError ? styles.error : username ? styles.success : ''}`}
                                    value={username}
                                    onChange={(e) => { setUsername(e.target.value); setUsernameError(''); }}
                                    onBlur={() => setUsernameError(validateUsername(username))}
                                    required
                                />
                                {usernameError && <div className={styles.errorMessage}>{usernameError}</div>}
                            </div>

                            <div className={styles.formGroup}>
                                <input
                                    type="password"
                                    id="password"
                                    placeholder="Enter Password"
                                    className={`${styles.formInput} ${passwordError ? styles.error : password ? styles.success : ''}`}
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                                    onBlur={() => setPasswordError(validatePassword(password))}
                                    required
                                />
                                {passwordError && <div className={styles.errorMessage}>{passwordError}</div>}
                            </div>

                            <div className={styles.forgotPassword}>
                                <a href="#" className={styles.forgotLink} onClick={handleForgotPassword}>
                                    Forgot your password?
                                </a>
                            </div>

                            <button type="submit" className={styles.loginSubmitBtn} disabled={isLoading}>
                                {isLoading ? 'LOGGING IN...' : 'LOGIN'}
                            </button>

                            <div className={styles.registerPrompt}>
                                <p className={styles.registerText}>Don&apos;t have an account?</p>
                                <p className={styles.registerLink}>
                                    Go to our Barangay Office to have yourself registered
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </section>

            {/* Background Circles */}
            <div className={styles.backgroundElements}>
                <div className={`${styles.bgCircle} ${styles.bgCircle1}`}></div>
                <div className={`${styles.bgCircle} ${styles.bgCircle2}`}></div>
                <div className={`${styles.bgCircle} ${styles.bgCircle3}`}></div>
            </div>

            {/* Loading Overlay */}
            {isLoading && (
                <div className={`${styles.loadingOverlay} ${styles.show}`}>
                    <div className={styles.loadingSpinner}></div>
                    <p className={styles.loadingText}>Logging in...</p>
                </div>
            )}

            {/* Notification Toast */}
            {notification && (
                <div className={`${styles.notification} ${styles[`notification${notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}`]} ${styles.notificationShow}`}>
                    <div className={styles.notificationContent}>
                        <span className={styles.notificationMessage}>{notification.message}</span>
                        <button className={styles.notificationClose} onClick={() => setNotification(null)}>
                            &times;
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
