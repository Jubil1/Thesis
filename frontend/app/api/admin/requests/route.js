import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Helper: convert DB row to camelCase for frontend
function toCamel(r, docs = []) {
    return {
        id: r.id,
        requestNo: r.request_no,
        residentName: r.resident_name,
        totalAmount: parseFloat(r.total_amount),
        date: r.date,
        status: r.status,
        paymentMethod: r.payment_method,
        referenceNo: r.reference_no,
        rejectionReason: r.rejection_reason,
        documents: docs.map(d => ({
            name: d.name,
            quantity: d.quantity,
            unitPrice: parseFloat(d.unit_price),
            total: parseFloat(d.total),
        })),
    };
}

// GET — list all requests
export async function GET() {
    const { rows: requests } = await query('SELECT * FROM requests ORDER BY id DESC');
    // Fetch documents for each request
    const result = [];
    for (const r of requests) {
        const { rows: docs } = await query('SELECT * FROM request_documents WHERE request_id = $1', [r.id]);
        result.push(toCamel(r, docs));
    }
    return NextResponse.json({ requests: result });
}

// POST — create a new request (from resident side)
export async function POST(request) {
    try {
        const body = await request.json();
        const { residentName, documents, paymentMethod, referenceNo, requestNo } = body;

        if (!documents || documents.length === 0) {
            return NextResponse.json({ error: 'No documents provided' }, { status: 400 });
        }

        const now = new Date().toISOString();
        const totalAmount = documents.reduce((sum, doc) => sum + (doc.total || 0), 0);
        const id = Date.now();

        // Insert request
        const { rows } = await query(
            `INSERT INTO requests (id, request_no, resident_name, total_amount, date, status, payment_method, reference_no)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [id, requestNo || String(id), residentName || 'Unknown', totalAmount, now, 'pending', paymentMethod || 'cash', referenceNo || '']
        );

        // Insert documents
        const docRows = [];
        for (const doc of documents) {
            const { rows: dRows } = await query(
                'INSERT INTO request_documents (request_id, name, quantity, unit_price, total) VALUES ($1,$2,$3,$4,$5) RETURNING *',
                [id, doc.name, doc.qty || doc.quantity || 1, doc.unitPrice || 0, doc.total || 0]
            );
            docRows.push(dRows[0]);
        }

        return NextResponse.json({ success: true, request: toCamel(rows[0], docRows) });
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

        let result;
        if (rejectionReason) {
            result = await query(
                'UPDATE requests SET status = $1, rejection_reason = $2 WHERE id = $3 RETURNING *',
                [status, rejectionReason, id]
            );
        } else {
            result = await query(
                'UPDATE requests SET status = $1 WHERE id = $2 RETURNING *',
                [status, id]
            );
        }

        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        const { rows: docs } = await query('SELECT * FROM request_documents WHERE request_id = $1', [id]);
        return NextResponse.json({ success: true, request: toCamel(result.rows[0], docs) });
    } catch (err) {
        return NextResponse.json({ error: 'Update failed: ' + err.message }, { status: 500 });
    }
}
