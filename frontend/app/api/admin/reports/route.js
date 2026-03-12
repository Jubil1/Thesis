import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        // Fetch requests with their documents
        const { rows: requests } = await query('SELECT * FROM requests');
        const { rows: reqDocs } = await query('SELECT * FROM request_documents');

        // Attach documents to their parent request
        const requestList = requests.map(r => ({
            id: r.id,
            requestNo: r.request_no,
            residentName: r.resident_name,
            totalAmount: parseFloat(r.total_amount),
            date: r.date,
            status: r.status,
            paymentMethod: r.payment_method,
            referenceNo: r.reference_no,
            rejectionReason: r.rejection_reason,
            documents: reqDocs
                .filter(d => d.request_id === r.id)
                .map(d => ({ name: d.name, quantity: d.quantity, unitPrice: parseFloat(d.unit_price), total: parseFloat(d.total) })),
        }));

        // Fetch residents
        const { rows: resRows } = await query('SELECT * FROM residents');
        const residents = resRows.map(r => ({
            firstName: r.first_name,
            lastName: r.last_name,
            birthdate: r.birthdate,
            purok: r.purok,
        }));

        // --- KPI Summary ---
        const totalResidents = residents.length;
        const totalRequests = requestList.length;
        const completedRequests = requestList.filter(r => r.status === 'completed');
        const totalRevenue = completedRequests.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
        const completionRate = totalRequests > 0
            ? Math.round((completedRequests.length / totalRequests) * 100) : 0;

        // --- Report 1: Documents Requested per Month (last 12 months) ---
        const monthlyDocs = [];
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const label = d.toLocaleString('default', { month: 'short', year: 'numeric' });
            const shortLabel = d.toLocaleString('default', { month: 'short' });
            const count = requestList.filter(r => {
                const rd = new Date(r.date);
                return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear();
            }).length;
            monthlyDocs.push({ label, shortLabel, count });
        }

        // --- Report 2: Age Distribution of Requestors ---
        const nameToAge = {};
        residents.forEach(r => {
            const fullName = `${r.firstName} ${r.lastName}`.trim();
            if (r.birthdate) {
                const birth = new Date(r.birthdate);
                let age = now.getFullYear() - birth.getFullYear();
                const m = now.getMonth() - birth.getMonth();
                if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
                nameToAge[fullName] = age;
            }
        });

        const ageBrackets = [
            { label: '0-17', min: 0, max: 17 },
            { label: '18-25', min: 18, max: 25 },
            { label: '26-35', min: 26, max: 35 },
            { label: '36-45', min: 36, max: 45 },
            { label: '46-59', min: 46, max: 59 },
            { label: '60+', min: 60, max: 200 },
        ];

        const ageDistribution = ageBrackets.map(b => {
            const count = requestList.filter(r => {
                const age = nameToAge[r.residentName];
                return age !== undefined && age >= b.min && age <= b.max;
            }).length;
            return { label: b.label, count };
        });

        // --- Report 3: Residents per Purok ---
        const purokMap = {};
        residents.forEach(r => {
            const p = r.purok || 'Unknown';
            purokMap[p] = (purokMap[p] || 0) + 1;
        });
        const purokStats = Object.entries(purokMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => {
                const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
                const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
                return numA - numB;
            });

        return NextResponse.json({
            summary: { totalResidents, totalRequests, totalRevenue, completionRate },
            monthlyDocs,
            ageDistribution,
            purokStats,
        });
    } catch (error) {
        return NextResponse.json(
            { summary: {}, monthlyDocs: [], ageDistribution: [], purokStats: [] },
            { status: 500 }
        );
    }
}
