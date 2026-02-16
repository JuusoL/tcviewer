import { NextRequest, NextResponse } from 'next/server';
import { getSchemaRegistrySubjects, getSchemaVersions, getSchema, getSchemaById } from '@/../lib/schema-registry';
import { listTestcontainers } from '@/../lib/docker';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get('subject');
    const version = searchParams.get('version');
    const schemaId = searchParams.get('schemaId');

    try {
        console.log(`[Schema Registry API] Fetching details for container ${id}, subject: ${subject || 'none'}, version: ${version || 'none'}, schemaId: ${schemaId || 'none'}`);
        const containers = await listTestcontainers();
        const container = containers.find(c => c.id === id);
        if (!container) return NextResponse.json({ error: 'Container not found' }, { status: 404 });

        const port = container.ports['8081'] || container.ports['8084'] || Object.values(container.ports)[0];
        if (!port) return NextResponse.json({ error: 'Schema Registry port not found' }, { status: 400 });

        if (schemaId) {
            console.log(`[Schema Registry API] Calling getSchemaById with localhost:${port}, id: ${schemaId}`);
            const schema = await getSchemaById('localhost', port, parseInt(schemaId));
            console.log(`[Schema Registry API] Schema metadata keys (by ID): ${Object.keys(schema).join(', ')}`);
            return NextResponse.json(schema);
        } else if (subject) {
            const listVersions = searchParams.get('versions') === 'true';
            if (listVersions) {
                console.log(`[Schema Registry API] Calling getSchemaVersions with localhost:${port}, subject: ${subject}`);
                const versions = await getSchemaVersions('localhost', port, subject);
                return NextResponse.json(versions);
            } else {
                const v = version || 'latest';
                console.log(`[Schema Registry API] Calling getSchema with localhost:${port}, subject: ${subject}, version: ${v}`);
                const schema = await getSchema('localhost', port, subject, v);
                console.log(`[Schema Registry API] Schema metadata keys: ${Object.keys(schema).join(', ')}`);
                return NextResponse.json(schema);
            }
        } else {
            console.log(`[Schema Registry API] Calling getSchemaRegistrySubjects with localhost:${port}`);
            const subjects = await getSchemaRegistrySubjects('localhost', port);
            console.log(`[Schema Registry API] Subjects found: ${Array.isArray(subjects) ? subjects.length : 'none'}`);
            return NextResponse.json(subjects);
        }
    } catch (err: any) {
        console.error(`[Schema Registry API] Error:`, err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
