import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'requests.json');

function readRequests() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

function writeRequests(requests) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(requests, null, 2));
}

// GET — list all requests
export async function GET() {
    const requests = readRequests();
    return NextResponse.json({ requests });
}

// POST — create a new request (from resident side)
export async function POST(request) {
    try {
        const body = await request.json();
        const { residentName, documents, paymentMethod, referenceNo, requestNo } = body;

        if (!documents || documents.length === 0) {
            return NextResponse.json({ error: 'No documents provided' }, { status: 400 });
        }

        const requests = readRequests();
        const now = new Date().toISOString();

        // Calculate total amount
        const totalAmount = documents.reduce((sum, doc) => sum + (doc.total || 0), 0);

        // Create ONE request entry with all documents inside
        const newRequest = {
            id: Date.now(),
            requestNo: requestNo || String(Date.now()),
            residentName: residentName || 'Unknown',
            documents: documents.map((doc) => ({
                name: doc.name,
                quantity: doc.qty || doc.quantity || 1,
                unitPrice: doc.unitPrice || 0,
                total: doc.total || 0,
            })),
            totalAmount,
            date: now,
            status: 'pending',
            paymentMethod: paymentMethod || 'cash',
            referenceNo: referenceNo || '',
        };

        requests.push(newRequest);
        writeRequests(requests);

        return NextResponse.json({ success: true, request: newRequest });
    } catch (err) {
        return NextResponse.json({ error: 'Failed to create request: ' + err.message }, { status: 500 });
    }
}

// PATCH — update request status (from admin side)
export async function PATCH(request) {
    try {
        const { id, status, rejectionReason } = await request.json();

        const validStatuses = ['pending', 'approved', 'for_release', 'completed', 'rejected'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const requests = readRequests();
        const req = requests.find((r) => r.id === id);

        if (!req) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        req.status = status;
        if (rejectionReason) req.rejectionReason = rejectionReason;

        writeRequests(requests);

        return NextResponse.json({ success: true, request: req });
    } catch (err) {
        return NextResponse.json({ error: 'Update failed: ' + err.message }, { status: 500 });
    }
}
