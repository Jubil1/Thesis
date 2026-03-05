import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const requestsPath = path.join(process.cwd(), 'data', 'requests.json');
        const residentsPath = path.join(process.cwd(), 'data', 'residents.json');

        let requests = [];
        let residents = [];

        if (fs.existsSync(requestsPath)) {
            requests = JSON.parse(fs.readFileSync(requestsPath, 'utf-8'));
        }

        if (fs.existsSync(residentsPath)) {
            residents = JSON.parse(fs.readFileSync(residentsPath, 'utf-8'));
        }

        return NextResponse.json({ requests, residents });
    } catch (error) {
        return NextResponse.json({ requests: [], residents: [] }, { status: 500 });
    }
}
