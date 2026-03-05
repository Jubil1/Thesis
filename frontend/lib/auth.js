import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'mytibangaportal-secret-key-change-in-production'
);

const COOKIE_NAME = 'session';
const USERS_PATH = join(process.cwd(), 'data', 'users.json');

// Load users from JSON file
function getUsers() {
    const data = readFileSync(USERS_PATH, 'utf-8');
    return JSON.parse(data);
}

// Save users back to JSON file
function saveUsers(users) {
    writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
}

// Verify a password — auto-hashes plaintext passwords on first check
export async function verifyPassword(plain, storedPassword, user) {
    // If stored password doesn't look like a bcrypt hash, it's plaintext
    if (!storedPassword.startsWith('$2')) {
        if (plain === storedPassword) {
            // Hash it and save for future logins
            const hashed = await bcrypt.hash(plain, 10);
            const users = getUsers();
            const idx = users.findIndex((u) => u.id === user.id);
            if (idx !== -1) {
                users[idx].password = hashed;
                saveUsers(users);
            }
            return true;
        }
        return false;
    }
    return bcrypt.compare(plain, storedPassword);
}

// Find a user by email
export function findUserByEmail(email) {
    const users = getUsers();
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

// Find a user by username
export function findUserByUsername(username) {
    const users = getUsers();
    return users.find((u) => u.username && u.username.toLowerCase() === username.toLowerCase());
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
