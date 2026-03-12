import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Check if user is a super admin
function isSuperAdmin(user) {
    return user.super_admin === true;
}

// Check if user has a specific permission
function hasPermission(user, perm) {
    if (isSuperAdmin(user)) return true;
    return Array.isArray(user.permissions) && user.permissions.includes(perm);
}

// GET — return all settings data
export async function GET() {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch current admin user
    const { rows: userRows } = await query('SELECT * FROM users WHERE id = $1', [session.id]);
    const admin = userRows[0];

    // Fetch settings
    const { rows: feeRows } = await query("SELECT value FROM settings WHERE key = 'documentFees'");
    const { rows: purokRows } = await query("SELECT value FROM settings WHERE key = 'puroks'");
    const documentFees = feeRows[0]?.value || [];
    const puroks = purokRows[0]?.value || [];

    // Fetch announcements (newest first)
    const { rows: announcements } = await query('SELECT * FROM announcements ORDER BY id DESC');
    // Convert to camelCase for frontend
    const announcementsList = announcements.map(a => ({
        id: a.id, title: a.title, content: a.content, date: a.date, dateModified: a.date_modified,
    }));

    // Determine user permissions
    const userIsSuperAdmin = admin && isSuperAdmin(admin);
    const userPermissions = userIsSuperAdmin
        ? ['fees', 'announcements', 'puroks', 'admin-management']
        : (admin?.permissions || []);

    // Build admin list for super admin
    let adminUsers = [];
    if (userIsSuperAdmin) {
        const { rows } = await query("SELECT * FROM users WHERE role = 'admin'");
        adminUsers = rows.map((u) => ({
            id: u.id,
            name: u.name,
            username: u.username,
            email: u.email,
            superAdmin: u.super_admin || false,
            permissions: u.permissions || [],
        }));
    }

    return NextResponse.json({
        profile: admin ? { id: admin.id, name: admin.name, email: admin.email, username: admin.username } : null,
        documentFees,
        puroks,
        announcements: announcementsList,
        permissions: userPermissions,
        isSuperAdmin: userIsSuperAdmin,
        adminUsers,
    });
}

// PATCH — update a specific section
export async function PATCH(request) {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rows: userRows } = await query('SELECT * FROM users WHERE id = $1', [session.id]);
    const currentUser = userRows[0];
    if (!currentUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { section } = body;

    // ── Profile ──
    if (section === 'profile') {
        const { name, email, currentPassword, newPassword } = body;

        if (name) await query('UPDATE users SET name = $1 WHERE id = $2', [name, session.id]);
        if (email !== undefined) await query('UPDATE users SET email = $1 WHERE id = $2', [email, session.id]);

        if (newPassword) {
            let valid = false;
            if (currentUser.password.startsWith('$2')) {
                valid = await bcrypt.compare(currentPassword, currentUser.password);
            } else {
                valid = currentPassword === currentUser.password;
            }
            if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
            const hashed = await bcrypt.hash(newPassword, 10);
            await query('UPDATE users SET password = $1 WHERE id = $2', [hashed, session.id]);
        }

        const { rows } = await query('SELECT id, name, email, username FROM users WHERE id = $1', [session.id]);
        return NextResponse.json({ success: true, profile: rows[0] });
    }

    // ── Document Fees ── (requires 'fees' permission)
    if (section === 'fees') {
        if (!hasPermission(currentUser, 'fees')) {
            return NextResponse.json({ error: 'No permission to edit fees' }, { status: 403 });
        }
        const { documentFees } = body;
        await query(
            "INSERT INTO settings (key, value) VALUES ('documentFees', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
            [JSON.stringify(documentFees)]
        );
        return NextResponse.json({ success: true, documentFees });
    }

    // ── Announcements ── (requires 'announcements' permission)
    if (section === 'announcements') {
        if (!hasPermission(currentUser, 'announcements')) {
            return NextResponse.json({ error: 'No permission to manage announcements' }, { status: 403 });
        }
        const { action, announcement } = body;

        if (action === 'add') {
            const now = new Date().toISOString();
            await query(
                'INSERT INTO announcements (title, content, date) VALUES ($1, $2, $3)',
                [announcement.title || '', announcement.content || '', now]
            );
            const { rows } = await query('SELECT * FROM announcements ORDER BY id DESC');
            const list = rows.map(a => ({ id: a.id, title: a.title, content: a.content, date: a.date, dateModified: a.date_modified }));
            return NextResponse.json({ success: true, announcements: list });
        }
        if (action === 'edit') {
            const now = new Date().toISOString();
            const { rowCount } = await query(
                'UPDATE announcements SET title = $1, content = $2, date_modified = $3 WHERE id = $4',
                [announcement.title, announcement.content, now, announcement.id]
            );
            if (rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
            const { rows } = await query('SELECT * FROM announcements ORDER BY id DESC');
            const list = rows.map(a => ({ id: a.id, title: a.title, content: a.content, date: a.date, dateModified: a.date_modified }));
            return NextResponse.json({ success: true, announcements: list });
        }
        if (action === 'delete') {
            await query('DELETE FROM announcements WHERE id = $1', [announcement.id]);
            const { rows } = await query('SELECT * FROM announcements ORDER BY id DESC');
            const list = rows.map(a => ({ id: a.id, title: a.title, content: a.content, date: a.date, dateModified: a.date_modified }));
            return NextResponse.json({ success: true, announcements: list });
        }
    }

    // ── Puroks ── (requires 'puroks' permission)
    if (section === 'puroks') {
        if (!hasPermission(currentUser, 'puroks')) {
            return NextResponse.json({ error: 'No permission to manage puroks' }, { status: 403 });
        }
        const { action, purok, newName } = body;

        // Fetch current puroks
        const { rows: pRows } = await query("SELECT value FROM settings WHERE key = 'puroks'");
        let puroks = pRows[0]?.value || [];

        if (action === 'add') {
            if (puroks.includes(purok)) return NextResponse.json({ error: 'Already exists' }, { status: 400 });
            puroks.push(purok);
        }
        if (action === 'rename') {
            const idx = puroks.indexOf(purok);
            if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
            puroks[idx] = newName;
        }
        if (action === 'delete') {
            puroks = puroks.filter((p) => p !== purok);
        }

        await query(
            "INSERT INTO settings (key, value) VALUES ('puroks', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
            [JSON.stringify(puroks)]
        );
        return NextResponse.json({ success: true, puroks });
    }

    // ── Admin Management ── (super admin only)
    if (section === 'admin-management') {
        if (!isSuperAdmin(currentUser)) {
            return NextResponse.json({ error: 'Only super admin can manage admins' }, { status: 403 });
        }

        const { action } = body;

        if (action === 'add') {
            const { name, username, email, password, permissions } = body;
            if (!name || !username || !password) {
                return NextResponse.json({ error: 'Name, username, and password are required' }, { status: 400 });
            }
            // Check for duplicate username
            const { rows: existing } = await query('SELECT id FROM users WHERE LOWER(username) = LOWER($1)', [username]);
            if (existing.length > 0) {
                return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            await query(
                'INSERT INTO users (name, username, email, password, role, permissions) VALUES ($1,$2,$3,$4,$5,$6)',
                [name, username, email || '', hashedPassword, 'admin', permissions || []]
            );

            const { rows } = await query("SELECT * FROM users WHERE role = 'admin'");
            const adminUsers = rows.map((u) => ({ id: u.id, name: u.name, username: u.username, email: u.email, superAdmin: u.super_admin || false, permissions: u.permissions || [] }));
            return NextResponse.json({ success: true, adminUsers });
        }

        if (action === 'edit') {
            const { adminId, name, email, permissions, password } = body;
            const { rows: targetRows } = await query("SELECT * FROM users WHERE id = $1 AND role = 'admin'", [adminId]);
            if (targetRows.length === 0) return NextResponse.json({ error: 'Admin not found' }, { status: 404 });

            if (targetRows[0].super_admin) {
                return NextResponse.json({ error: 'Cannot modify super admin' }, { status: 400 });
            }

            if (name) await query('UPDATE users SET name = $1 WHERE id = $2', [name, adminId]);
            if (email !== undefined) await query('UPDATE users SET email = $1 WHERE id = $2', [email, adminId]);
            if (permissions) await query('UPDATE users SET permissions = $1 WHERE id = $2', [permissions, adminId]);
            if (password) {
                const hashed = await bcrypt.hash(password, 10);
                await query('UPDATE users SET password = $1 WHERE id = $2', [hashed, adminId]);
            }

            const { rows } = await query("SELECT * FROM users WHERE role = 'admin'");
            const adminUsers = rows.map((u) => ({ id: u.id, name: u.name, username: u.username, email: u.email, superAdmin: u.super_admin || false, permissions: u.permissions || [] }));
            return NextResponse.json({ success: true, adminUsers });
        }

        if (action === 'delete') {
            const { adminId } = body;
            const { rows: targetRows } = await query("SELECT * FROM users WHERE id = $1 AND role = 'admin'", [adminId]);
            if (targetRows.length === 0) return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
            if (targetRows[0].super_admin) return NextResponse.json({ error: 'Cannot delete super admin' }, { status: 400 });

            await query('DELETE FROM users WHERE id = $1', [adminId]);

            const { rows } = await query("SELECT * FROM users WHERE role = 'admin'");
            const adminUsers = rows.map((u) => ({ id: u.id, name: u.name, username: u.username, email: u.email, superAdmin: u.super_admin || false, permissions: u.permissions || [] }));
            return NextResponse.json({ success: true, adminUsers });
        }
    }

    return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
}
