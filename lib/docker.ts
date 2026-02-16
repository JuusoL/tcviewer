import Docker from 'dockerode';

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

export interface ContainerInfo {
    id: string;
    name: string;
    image: string;
    status: string;
    ports: { [key: string]: number };
    type: 'postgres' | 'kafka' | 'schema-registry' | 'unknown';
}

export async function listTestcontainers(): Promise<ContainerInfo[]> {
    const containers = await docker.listContainers();

    return containers.map(container => {
        const name = container.Names[0].replace(/^\//, '');
        const image = container.Image;
        const ports: { [key: string]: number } = {};

        container.Ports.forEach(port => {
            if (port.PublicPort) {
                ports[port.PrivatePort.toString()] = port.PublicPort;
            }
        });

        let type: ContainerInfo['type'] = 'unknown';
        if (image.includes('postgres')) type = 'postgres';
        else if (image.includes('kafka')) type = 'kafka';
        else if (image.includes('schema-registry')) type = 'schema-registry';

        return {
            id: container.Id,
            name,
            image,
            status: container.Status,
            ports,
            type
        };
    }).filter(c => c.type !== 'unknown' || c.name.includes('testcontainers'));
}
