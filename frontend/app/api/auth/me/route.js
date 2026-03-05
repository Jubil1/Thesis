import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
    const session = await getSession();

    if (!session) {
        return NextResponse.json(
            { authenticated: false },
            { status: 401 }
        );
    }

    return NextResponse.json({
        authenticated: true,
        user: {
            id: session.id,
            name: session.name,
            email: session.email,
            role: session.role,
        },
    });
}
