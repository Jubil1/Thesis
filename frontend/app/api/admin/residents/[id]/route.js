import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const RESIDENTS_FILE = path.join(process.cwd(), 'data', 'residents.json');

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

// GET — return a single resident
export async function GET(request, { params }) {
    const { id } = await params;
    const residents = readResidents();
    const resident = residents.find((r) => r.id === parseInt(id));

    if (!resident) {
        return NextResponse.json({ error: 'Resident not found' }, { status: 404 });
    }

    return NextResponse.json({ resident });
}

// PUT — update a resident
export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const residents = readResidents();
        const index = residents.findIndex((r) => r.id === parseInt(id));

        if (index === -1) {
            return NextResponse.json({ error: 'Resident not found' }, { status: 404 });
        }

        residents[index] = { ...residents[index], ...body, id: parseInt(id) };
        writeResidents(residents);

        return NextResponse.json({ success: true, resident: residents[index] });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE — remove a resident
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const residents = readResidents();
        const filtered = residents.filter((r) => r.id !== parseInt(id));

        if (filtered.length === residents.length) {
            return NextResponse.json({ error: 'Resident not found' }, { status: 404 });
        }

        writeResidents(filtered);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
