const TIMEOUT_MS = 5000;

async function fetchWithTimeout(url: string, options: RequestInit = {}) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (err) {
        clearTimeout(id);
        throw err;
    }
}

export async function getSchemaRegistrySubjects(host: string, port: number) {
    try {
        const response = await fetchWithTimeout(`http://${host}:${port}/subjects`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (err) {
        console.error('Error fetching Schema Registry subjects:', err);
        throw err;
    }
}

export async function getSchemaVersions(host: string, port: number, subject: string) {
    try {
        const response = await fetchWithTimeout(`http://${host}:${port}/subjects/${subject}/versions`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (err) {
        console.error(`Error fetching versions for ${subject}:`, err);
        throw err;
    }
}

export async function getSchema(host: string, port: number, subject: string, version: number | string = 'latest') {
    try {
        const response = await fetchWithTimeout(`http://${host}:${port}/subjects/${subject}/versions/${version}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (err) {
        console.error(`Error fetching schema for ${subject} version ${version}:`, err);
        throw err;
    }
}
export async function getSchemaById(host: string, port: number, id: number) {
    try {
        const response = await fetchWithTimeout(`http://${host}:${port}/schemas/ids/${id}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (err) {
        console.error(`Error fetching schema by ID ${id}:`, err);
        throw err;
    }
}
