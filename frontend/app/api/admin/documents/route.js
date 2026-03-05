import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'documents.json');
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'documents');
const IMAGES_DIR = path.join(process.cwd(), 'public', 'images');

function readDocuments() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

function writeDocuments(docs) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(docs, null, 2));
}

// GET — list all documents
export async function GET() {
    const documents = readDocuments();
    return NextResponse.json({ documents });
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

        // Add to documents.json
        const documents = readDocuments();
        const now = new Date().toISOString();
        const newDoc = {
            id: Date.now(),
            name: name,
            preview: previewPath,
            file: `/documents/${fileName}`,
            dateModified: now,
            dateUploaded: now,
        };
        documents.push(newDoc);
        writeDocuments(documents);

        return NextResponse.json({ success: true, document: newDoc });
    } catch (err) {
        return NextResponse.json({ error: 'Upload failed: ' + err.message }, { status: 500 });
    }
}

// DELETE — remove a document by id
export async function DELETE(request) {
    try {
        const { id } = await request.json();
        const documents = readDocuments();
        const docIndex = documents.findIndex((d) => d.id === id);

        if (docIndex === -1) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        const doc = documents[docIndex];

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

        // Remove from array
        documents.splice(docIndex, 1);
        writeDocuments(documents);

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

        const documents = readDocuments();
        const doc = documents.find((d) => d.id === id);

        if (!doc) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

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

        // Update only dateModified and file path
        doc.file = `/documents/${fileName}`;
        doc.dateModified = new Date().toISOString();

        writeDocuments(documents);

        return NextResponse.json({ success: true, document: doc });
    } catch (err) {
        return NextResponse.json({ error: 'Update failed: ' + err.message }, { status: 500 });
    }
}
