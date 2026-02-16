import { NextRequest, NextResponse } from 'next/server';
import { getTables, getTableData } from '@/../lib/postgres';
import { listTestcontainers } from '@/../lib/docker';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const table = searchParams.get('table');

    try {
        console.log(`[Database API] Fetching details for container ${id}, table: ${table || 'none'}`);
        const containers = await listTestcontainers();
        const container = containers.find(c => c.id === id);
        if (!container) return NextResponse.json({ error: 'Container not found' }, { status: 404 });

        const port = container.ports['5432'];
        if (!port) return NextResponse.json({ error: 'Postgres port not found' }, { status: 400 });

        if (table) {
            const data = await getTableData('localhost', port, table);
            return NextResponse.json(data);
        } else {
            const tables = await getTables('localhost', port);
            return NextResponse.json(tables);
        }
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
