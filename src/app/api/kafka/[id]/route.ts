import { NextRequest, NextResponse } from 'next/server';
import { getKafkaMetadata, consumeMessages } from '@/../lib/kafka';
import { listTestcontainers } from '@/../lib/docker';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const topic = searchParams.get('topic');

    try {
        console.log(`[Kafka API] Fetching details for container ${id}, topic: ${topic || 'none'}`);
        const containers = await listTestcontainers();
        const container = containers.find(c => c.id === id);
        if (!container) return NextResponse.json({ error: 'Container not found' }, { status: 404 });

        // Kafka advertised port is usually 9094 or 9092 in these setups. 9093 is also common with CP-Kafka.
        const port = container.ports['9094'] || container.ports['9093'] || container.ports['9092'];
        if (!port) {
            console.error('Kafka port not found. Available ports:', container.ports);
            return NextResponse.json({ error: 'Kafka port not found' }, { status: 400 });
        }

        if (topic) {
            // Try to find a schema registry container to decode messages
            let schemaRegistryUrl = undefined;
            const registryContainer = containers.find(c => c.type === 'schema-registry');
            if (registryContainer) {
                const regPort = registryContainer.ports['8081'] || registryContainer.ports['8084'] || Object.values(registryContainer.ports)[0];
                if (regPort) {
                    schemaRegistryUrl = `http://localhost:${regPort}`;
                    console.log(`[Kafka API] Found Schema Registry at ${schemaRegistryUrl}`);
                }
            }

            const messages = await consumeMessages([`localhost:${port}`], topic, 20, schemaRegistryUrl);
            return NextResponse.json({
                messages,
                schemaRegistryId: registryContainer?.id
            });
        } else {
            const metadata = await getKafkaMetadata([`localhost:${port}`]);
            return NextResponse.json(metadata);
        }
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
