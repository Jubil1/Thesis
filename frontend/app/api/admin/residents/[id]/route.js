import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Helper to convert a DB row to camelCase
function toCamel(r) {
    return {
        id: r.id, firstName: r.first_name, middleName: r.middle_name, lastName: r.last_name,
        suffix: r.suffix, sex: r.sex, civilStatus: r.civil_status, birthdate: r.birthdate,
        birthplace: r.birthplace, religion: r.religion, citizenship: r.citizenship,
        purok: r.purok, barangay: r.barangay, city: r.city, mobileNumber: r.mobile_number,
        email: r.email, mothersMaidenName: r.mothers_maiden_name, fathersName: r.fathers_name,
        spousesName: r.spouses_name, childsName: r.childs_name, childsMother: r.childs_mother,
        children: r.children || [], username: r.username, password: r.password, idPicture: r.id_picture,
    };
}

// GET — return a single resident
export async function GET(request, { params }) {
    const { id } = await params;
    const { rows } = await query('SELECT * FROM residents WHERE id = $1', [parseInt(id)]);

    if (rows.length === 0) {
        return NextResponse.json({ error: 'Resident not found' }, { status: 404 });
    }

    return NextResponse.json({ resident: toCamel(rows[0]) });
}

// PUT — update a resident
export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Build SET clause dynamically from body keys
        // Map camelCase keys from frontend to snake_case DB columns
        const keyMap = {
            firstName: 'first_name', middleName: 'middle_name', lastName: 'last_name',
            suffix: 'suffix', sex: 'sex', civilStatus: 'civil_status', birthdate: 'birthdate',
            birthplace: 'birthplace', religion: 'religion', citizenship: 'citizenship',
            purok: 'purok', barangay: 'barangay', city: 'city', mobileNumber: 'mobile_number',
            email: 'email', mothersMaidenName: 'mothers_maiden_name', fathersName: 'fathers_name',
            spousesName: 'spouses_name', childsName: 'childs_name', childsMother: 'childs_mother',
            children: 'children', username: 'username', password: 'password', idPicture: 'id_picture',
        };

        const sets = [];
        const values = [];
        let paramIdx = 1;

        for (const [jsKey, dbCol] of Object.entries(keyMap)) {
            if (body[jsKey] !== undefined) {
                sets.push(`${dbCol} = $${paramIdx}`);
                values.push(body[jsKey]);
                paramIdx++;
            }
        }

        if (sets.length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        values.push(parseInt(id));
        const { rows, rowCount } = await query(
            `UPDATE residents SET ${sets.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
            values
        );

        if (rowCount === 0) {
            return NextResponse.json({ error: 'Resident not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, resident: toCamel(rows[0]) });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE — remove a resident
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const { rowCount } = await query('DELETE FROM residents WHERE id = $1', [parseInt(id)]);

        if (rowCount === 0) {
            return NextResponse.json({ error: 'Resident not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
