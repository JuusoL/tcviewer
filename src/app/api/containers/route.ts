import { NextResponse } from 'next/server';
import { listTestcontainers } from '@/../lib/docker';

export async function GET() {
    try {
        const containers = await listTestcontainers();
        return NextResponse.json(containers);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
