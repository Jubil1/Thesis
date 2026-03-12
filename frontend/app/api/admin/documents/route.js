import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'documents');
const IMAGES_DIR = path.join(process.cwd(), 'public', 'images');

// Helper: convert DB row to camelCase
function toCamel(d) {
    return {
        id: d.id,
        name: d.name,
        preview: d.preview,
        file: d.file,
        dateModified: d.date_modified,
        dateUploaded: d.date_uploaded,
    };
}

// GET — list all documents
export async function GET() {
    const { rows } = await query('SELECT * FROM documents ORDER BY id DESC');
    return NextResponse.json({ documents: rows.map(toCamel) });
}

// POST — upload a new document
export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const previewImage = formData.get('preview');
        const name = formData.get('name') || file?.name || 'Untitled';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Ensure upload directory exists
        if (!fs.existsSync(UPLOAD_DIR)) {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        }

        // Save the main file
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const fileName = file.name;
        const filePath = path.join(UPLOAD_DIR, fileName);
        fs.writeFileSync(filePath, fileBuffer);

        // Save preview image if provided
        let previewPath = '';
        if (previewImage && previewImage.size > 0) {
            if (!fs.existsSync(IMAGES_DIR)) {
                fs.mkdirSync(IMAGES_DIR, { recursive: true });
            }
            const previewBuffer = Buffer.from(await previewImage.arrayBuffer());
            const previewName = previewImage.name;
            const previewFilePath = path.join(IMAGES_DIR, previewName);
            fs.writeFileSync(previewFilePath, previewBuffer);
            previewPath = `/images/${previewName}`;
        }

        const now = new Date().toISOString();
        const id = Date.now();
        const { rows } = await query(
            'INSERT INTO documents (id, name, preview, file, date_modified, date_uploaded) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
            [id, name, previewPath, `/documents/${fileName}`, now, now]
        );

        return NextResponse.json({ success: true, document: toCamel(rows[0]) });
    } catch (err) {
        return NextResponse.json({ error: 'Upload failed: ' + err.message }, { status: 500 });
    }
}

// DELETE — remove a document by id
export async function DELETE(request) {
    try {
        const { id } = await request.json();
        const { rows } = await query('SELECT * FROM documents WHERE id = $1', [id]);

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        const doc = rows[0];

        // Delete files from public/documents
        const filePath = path.join(process.cwd(), 'public', doc.file);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        if (doc.preview) {
            const previewPath = path.join(process.cwd(), 'public', doc.preview);
            if (fs.existsSync(previewPath)) {
                fs.unlinkSync(previewPath);
            }
        }

        await query('DELETE FROM documents WHERE id = $1', [id]);
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: 'Delete failed: ' + err.message }, { status: 500 });
    }
}

// PATCH — update/replace an existing document file
export async function PATCH(request) {
    try {
        const formData = await request.formData();
        const id = Number(formData.get('id'));
        const file = formData.get('file');

        if (!id || !file) {
            return NextResponse.json({ error: 'ID and file are required' }, { status: 400 });
        }

        const { rows } = await query('SELECT * FROM documents WHERE id = $1', [id]);
        if (rows.length === 0) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        const doc = rows[0];

        // Delete old file
        const oldFilePath = path.join(process.cwd(), 'public', doc.file);
        if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
        }

        // Save new file
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const fileName = file.name;
        const filePath = path.join(UPLOAD_DIR, fileName);
        fs.writeFileSync(filePath, fileBuffer);

        const now = new Date().toISOString();
        const { rows: updated } = await query(
            'UPDATE documents SET file = $1, date_modified = $2 WHERE id = $3 RETURNING *',
            [`/documents/${fileName}`, now, id]
        );

        return NextResponse.json({ success: true, document: toCamel(updated[0]) });
    } catch (err) {
        return NextResponse.json({ error: 'Update failed: ' + err.message }, { status: 500 });
    }
}
