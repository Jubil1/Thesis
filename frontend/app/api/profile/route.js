import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');
const RESIDENTS_FILE = path.join(process.cwd(), 'data', 'residents.json');

function readJSON(filePath) {
    try { return JSON.parse(fs.readFileSync(filePath, 'utf-8')); }
    catch { return []; }
}

function writeJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// GET — get current user's profile
export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const users = readJSON(USERS_FILE);
    const user = users.find((u) => u.id === session.id);

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Also try to find the full resident record
    const residents = readJSON(RESIDENTS_FILE);
    const resident = residents.find((r) =>
        r.username === user.username ||
        r.email === user.email ||
        `${r.firstName} ${r.lastName}` === user.name
    );

    return NextResponse.json({
        user: {
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email || '',
            role: user.role,
        },
        resident: resident || null,
    });
}

// PATCH — update current user's profile
export async function PATCH(request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, mobileNumber, idPicture, currentPassword, newPassword } = body;

    const users = readJSON(USERS_FILE);
    const userIdx = users.findIndex((u) => u.id === session.id);

    if (userIdx === -1) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update basic info
    if (name) users[userIdx].name = name;
    if (email !== undefined) users[userIdx].email = email;

    // Password change
    if (newPassword) {
        const bcrypt = (await import('bcryptjs')).default;
        const user = users[userIdx];

        // Verify current password
        let valid = false;
        if (user.password.startsWith('$2')) {
            valid = await bcrypt.compare(currentPassword, user.password);
        } else {
            valid = currentPassword === user.password;
        }

        if (!valid) {
            return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
        }

        users[userIdx].password = await bcrypt.hash(newPassword, 10);
    }

    writeJSON(USERS_FILE, users);

    // Also update resident record if exists
    const residents = readJSON(RESIDENTS_FILE);
    const residentIdx = residents.findIndex((r) =>
        r.username === users[userIdx].username ||
        `${r.firstName} ${r.lastName}` === session.name
    );

    if (residentIdx !== -1) {
        if (email !== undefined) residents[residentIdx].email = email;
        if (mobileNumber !== undefined) residents[residentIdx].mobileNumber = mobileNumber;
        if (idPicture !== undefined) residents[residentIdx].idPicture = idPicture;
        writeJSON(RESIDENTS_FILE, residents);
    }

    return NextResponse.json({ success: true });
}
