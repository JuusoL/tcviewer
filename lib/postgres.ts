import { Client } from 'pg';

export interface TableInfo {
    name: string;
    columns: { name: string; type: string }[];
}

export async function getTables(host: string, port: number): Promise<TableInfo[]> {
    const client = new Client({
        host,
        port,
        user: process.env.POSTGRES_USER || 'test',
        password: process.env.POSTGRES_PASSWORD || 'test',
        database: process.env.POSTGRES_DB || 'test',
        connectionTimeoutMillis: 5000
    });

    try {
        await client.connect();
        const res = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `);

        const tables: { [key: string]: TableInfo } = {};
        res.rows.forEach(row => {
            if (!tables[row.table_name]) {
                tables[row.table_name] = { name: row.table_name, columns: [] };
            }
            tables[row.table_name].columns.push({ name: row.column_name, type: row.data_type });
        });

        return Object.values(tables);
    } catch (err) {
        console.error('Error fetching tables:', err);
        throw err;
    } finally {
        await client.end();
    }
}

export async function getTableData(host: string, port: number, tableName: string) {
    const client = new Client({
        host,
        port,
        user: process.env.POSTGRES_USER || 'test',
        password: process.env.POSTGRES_PASSWORD || 'test',
        database: process.env.POSTGRES_DB || 'test',
        connectionTimeoutMillis: 5000
    });

    try {
        await client.connect();
        const res = await client.query(`SELECT * FROM ${tableName} LIMIT 100`);
        return res.rows;
    } catch (err) {
        console.error(`Error fetching data from ${tableName}:`, err);
        throw err;
    } finally {
        await client.end();
    }
}
