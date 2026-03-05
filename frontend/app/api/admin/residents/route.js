import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const RESIDENTS_FILE = path.join(process.cwd(), 'data', 'residents.json');
const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

function readResidents() {
    try {
        const data = fs.readFileSync(RESIDENTS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

function writeResidents(residents) {
    fs.writeFileSync(RESIDENTS_FILE, JSON.stringify(residents, null, 2));
}

function readUsers() {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// GET — return all residents
export async function GET() {
    const residents = readResidents();
    return NextResponse.json({ residents });
}

// POST — add a new resident
export async function POST(request) {
    try {
        const body = await request.json();
        const residents = readResidents();

        // Generate a unique ID
        const maxId = residents.reduce((max, r) => Math.max(max, r.id || 0), 0);
        const newResident = {
            id: maxId + 1,
            firstName: body.firstName,
            middleName: body.middleName,
            lastName: body.lastName,
            suffix: body.suffix || '',
            sex: body.sex,
            civilStatus: body.civilStatus,
            birthdate: body.birthdate,
            birthplace: body.birthplace || '',
            religion: body.religion || '',
            citizenship: body.citizenship || '',
            purok: body.purok,
            barangay: body.barangay || 'Tibanga',
            city: body.city || 'Iligan City',
            mobileNumber: body.mobileNumber || '',
            email: body.email || '',
            mothersMaidenName: body.mothersMaidenName || '',
            fathersName: body.fathersName || '',
            spousesName: body.spousesName || '',
            children: (body.children || []).filter(c => c.trim() !== ''),
            username: body.username || '',
            password: body.password || '1234',
            idPicture: body.idPicture || null,
            createdAt: new Date().toISOString(),
        };

        residents.push(newResident);
        writeResidents(residents);

        // Also create a login account in users.json
        if (newResident.username) {
            const users = readUsers();
            const alreadyExists = users.some(u => u.username === newResident.username);
            if (!alreadyExists) {
                const maxUserId = users.reduce((max, u) => Math.max(max, u.id || 0), 0);
                users.push({
                    id: maxUserId + 1,
                    name: `${newResident.firstName} ${newResident.lastName}`,
                    username: newResident.username,
                    email: newResident.email || '',
                    password: newResident.password, // plaintext — auto-hashed on first login
                    role: 'resident',
                });
                writeUsers(users);
            }
        }

        return NextResponse.json({ success: true, resident: newResident }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
