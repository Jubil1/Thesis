import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'mytibangaportal-secret-key-change-in-production'
);

const COOKIE_NAME = 'session';

// Verify a password — auto-hashes plaintext passwords on first check
export async function verifyPassword(plain, storedPassword, user) {
    // If stored password doesn't look like a bcrypt hash, it's plaintext
    if (!storedPassword.startsWith('$2')) {
        if (plain === storedPassword) {
            // Hash it and save for future logins
            const hashed = await bcrypt.hash(plain, 10);
            await query('UPDATE users SET password = $1 WHERE id = $2', [hashed, user.id]);
            return true;
        }
        return false;
    }
    return bcrypt.compare(plain, storedPassword);
}

// Find a user by email
export async function findUserByEmail(email) {
    const { rows } = await query(
        'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
        [email]
    );
    return rows[0] || null;
}

// Find a user by username
export async function findUserByUsername(username) {
    const { rows } = await query(
        'SELECT * FROM users WHERE LOWER(username) = LOWER($1)',
        [username]
    );
    // Convert DB snake_case to camelCase for compatibility
    const u = rows[0];
    if (!u) return null;
    return {
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        password: u.password,
        role: u.role,
        superAdmin: u.super_admin,
        permissions: u.permissions || [],
    };
}

// Create a session JWT and set it as an HTTP-only cookie
export async function createSession(user) {
    const token = await new SignJWT({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('24h')
        .sign(JWT_SECRET);

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
    });

    return token;
}

// Get the current session user from the cookie
export async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload;
    } catch {
        return null;
    }
}

// Clear the session cookie
export async function clearSession() {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
    });
}

// Verify a JWT token string (used by middleware, no cookies() access)
export async function verifyToken(token) {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload;
    } catch {
        return null;
    }
}
