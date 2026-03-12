import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET — return all residents
export async function GET() {
    const { rows } = await query('SELECT * FROM residents ORDER BY id');
    // Convert snake_case to camelCase for frontend compatibility
    const residents = rows.map(r => ({
        id: r.id,
        firstName: r.first_name,
        middleName: r.middle_name,
        lastName: r.last_name,
        suffix: r.suffix,
        sex: r.sex,
        civilStatus: r.civil_status,
        birthdate: r.birthdate,
        birthplace: r.birthplace,
        religion: r.religion,
        citizenship: r.citizenship,
        purok: r.purok,
        barangay: r.barangay,
        city: r.city,
        mobileNumber: r.mobile_number,
        email: r.email,
        mothersMaidenName: r.mothers_maiden_name,
        fathersName: r.fathers_name,
        spousesName: r.spouses_name,
        childsName: r.childs_name,
        childsMother: r.childs_mother,
        children: r.children || [],
        username: r.username,
        password: r.password,
        idPicture: r.id_picture,
    }));
    return NextResponse.json({ residents });
}

// POST — add a new resident
export async function POST(request) {
    try {
        const body = await request.json();

        const { rows } = await query(
            `INSERT INTO residents (
                first_name, middle_name, last_name, suffix,
                sex, civil_status, birthdate, birthplace, religion,
                citizenship, purok, barangay, city, mobile_number,
                email, mothers_maiden_name, fathers_name, spouses_name,
                childs_name, childs_mother, children, username, password, id_picture
            ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24
            ) RETURNING *`,
            [
                body.firstName, body.middleName || '', body.lastName, body.suffix || '',
                body.sex || '', body.civilStatus || '', body.birthdate || '', body.birthplace || '', body.religion || '',
                body.citizenship || '', body.purok || '', body.barangay || 'Tibanga', body.city || 'Iligan City', body.mobileNumber || '',
                body.email || '', body.mothersMaidenName || '', body.fathersName || '', body.spousesName || '',
                body.childsName || '', body.childsMother || '',
                (body.children || []).filter(c => c.trim() !== ''),
                body.username || '', body.password || '1234', body.idPicture || '',
            ]
        );

        const r = rows[0];
        const newResident = {
            id: r.id, firstName: r.first_name, middleName: r.middle_name, lastName: r.last_name,
            suffix: r.suffix, sex: r.sex, civilStatus: r.civil_status, birthdate: r.birthdate,
            birthplace: r.birthplace, religion: r.religion, citizenship: r.citizenship,
            purok: r.purok, barangay: r.barangay, city: r.city, mobileNumber: r.mobile_number,
            email: r.email, mothersMaidenName: r.mothers_maiden_name, fathersName: r.fathers_name,
            spousesName: r.spouses_name, children: r.children || [],
            username: r.username, password: r.password, idPicture: r.id_picture,
        };

        // Also create a login account in users table
        if (newResident.username) {
            const { rows: existing } = await query('SELECT id FROM users WHERE username = $1', [newResident.username]);
            if (existing.length === 0) {
                await query(
                    'INSERT INTO users (name, username, email, password, role) VALUES ($1,$2,$3,$4,$5)',
                    [
                        `${newResident.firstName} ${newResident.lastName}`,
                        newResident.username,
                        newResident.email || '',
                        newResident.password,
                        'resident',
                    ]
                );
            }
        }

        return NextResponse.json({ success: true, resident: newResident }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
