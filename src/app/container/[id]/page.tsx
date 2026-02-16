'use client';

import { useEffect, useState, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ContainerDetail({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise);
    const searchParams = useSearchParams();
    const type = searchParams.get('type');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [tableData, setTableData] = useState<any[]>([]);
    const [selectedSchema, setSelectedSchema] = useState<any>(null);
    const [topicSearch, setTopicSearch] = useState('');
    const [schemaRegistryId, setSchemaRegistryId] = useState<string | null>(null);
    useEffect(() => {
        let url = '';
        if (type === 'postgres') url = `/api/databases/${params.id}`;
        else if (type === 'kafka') url = `/api/kafka/${params.id}`;
        else if (type === 'schema-registry') url = `/api/schema-registry/${params.id}`;

        if (url) {
            fetch(url)
                .then(res => res.json())
                .then(data => {
                    if (data.error) setError(data.error);
                    else setData(data);
                    setLoading(false);
                })
                .catch(err => {
                    setError(err.message);
                    setLoading(false);
                });
        }
    }, [params.id, type]);

    useEffect(() => {
        const schemaIdParam = searchParams.get('schemaId');
        if (type === 'schema-registry' && schemaIdParam) {
            viewSchemaById(parseInt(schemaIdParam));
        }
    }, [type, searchParams]);

    const viewTopic = (topic: string) => {
        setSelectedTopic(topic);
        setLoading(true);
        fetch(`/api/kafka/${params.id}?topic=${topic}`)
            .then(res => res.json())
            .then(data => {
                if (data.messages) {
                    setMessages(data.messages);
                    setSchemaRegistryId(data.schemaRegistryId);
                } else {
                    setMessages(data);
                    setSchemaRegistryId(null);
                }
                setLoading(false);
            });
    };

    const viewTable = (table: string) => {
        setSelectedTable(table);
        setLoading(true);
        fetch(`/api/databases/${params.id}?table=${table}`)
            .then(res => res.json())
            .then(data => {
                setTableData(data);
                setLoading(false);
            });
    };

    const viewSchema = (subject: string) => {
        setLoading(true);
        fetch(`/api/schema-registry/${params.id}?subject=${subject}`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(schema => {
                setSelectedSchema({ subject, ...schema });
                setLoading(false);
            })
            .catch(err => {
                console.error(`[Frontend] Error fetching schema:`, err);
                setError(`Failed to fetch schema: ${err.message}`);
                setLoading(false);
            });
    };

    const viewSchemaById = (id: number) => {
        setLoading(true);
        fetch(`/api/schema-registry/${params.id}?schemaId=${id}`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(schema => {
                setSelectedSchema({ subject: `Schema ID: ${id}`, ...schema });
                setLoading(false);
            })
            .catch(err => {
                console.error(`[Frontend] Error fetching schema by ID:`, err);
                setError(`Failed to fetch schema by ID: ${err.message}`);
                setLoading(false);
            });
    };
    if (loading && !data && !selectedTopic && !selectedTable && !selectedSchema) return <div className="loading">Loading details...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="container" style={{ maxWidth: '1400px' }}>
            <div className="detail-header">
                <Link href="/" className="back-link">← Back to Dashboard</Link>
                <h1>{type?.toUpperCase()} Inspector</h1>
            </div>

            {type === 'postgres' && data && (
                <div style={{ display: 'flex', gap: '2rem' }}>
                    <div style={{ width: '250px' }}>
                        <h2 className="section-title">Tables</h2>
                        {data.map((table: any) => (
                            <div
                                key={table.name}
                                onClick={() => viewTable(table.name)}
                                style={{
                                    padding: '0.75rem',
                                    background: selectedTable === table.name ? 'rgba(99, 102, 241, 0.2)' : 'var(--card-bg)',
                                    border: '1px solid var(--card-border)',
                                    borderRadius: '0.5rem',
                                    marginBottom: '0.5rem',
                                    cursor: 'pointer'
                                }}
                            >
                                {table.name}
                            </div>
                        ))}
                    </div>
                    <div style={{ flex: 1 }}>
                        {selectedTable ? (
                            <>
                                <h2 className="section-title">Data: {selectedTable}</h2>
                                <div style={{ overflowX: 'auto' }}>
                                    {loading ? (
                                        <div className="spinner"></div>
                                    ) : (
                                        <>
                                            <table>
                                                <thead>
                                                    <tr>
                                                        {Object.keys(tableData[0] || {}).map(key => <th key={key}>{key}</th>)}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {tableData.map((row, i) => (
                                                        <tr key={i}>
                                                            {Object.values(row).map((val: any, j) => <td key={j}>{JSON.stringify(val)}</td>)}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {tableData.length === 0 && <p style={{ padding: '2rem', textAlign: 'center' }}>No data in this table.</p>}
                                        </>
                                    )}
                                </div>
                            </>
                        ) : <p className="loading">Select a table to view data</p>}
                    </div>
                </div>
            )}

            {type === 'kafka' && data && (
                <div style={{ display: 'flex', gap: '2rem' }}>
                    <div style={{ width: '250px' }}>
                        <h2 className="section-title">Topics</h2>
                        <input
                            type="text"
                            placeholder="Search topics..."
                            value={topicSearch}
                            onChange={(e) => setTopicSearch(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                marginBottom: '1rem',
                                background: 'var(--card-bg)',
                                border: '1px solid var(--card-border)',
                                borderRadius: '0.5rem',
                                color: 'var(--foreground)',
                                outline: 'none'
                            }}
                        />
                        {data
                            .filter((t: any) => t.topic.toLowerCase().includes(topicSearch.toLowerCase()))
                            .map((topic: any) => (
                                <div
                                    key={topic.topic}
                                    onClick={() => viewTopic(topic.topic)}
                                    style={{
                                        padding: '0.75rem',
                                        background: selectedTopic === topic.topic ? 'rgba(99, 102, 241, 0.2)' : 'var(--card-bg)',
                                        border: '1px solid var(--card-border)',
                                        borderRadius: '0.5rem',
                                        marginBottom: '0.5rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {topic.topic}
                                </div>
                            ))}
                    </div>
                    <div style={{ flex: 1 }}>
                        {selectedTopic ? (
                            <>
                                <h2 className="section-title">Messages: {selectedTopic}</h2>
                                {loading ? (
                                    <div className="spinner"></div>
                                ) : (
                                    <>
                                        {messages.map((msg, i) => (
                                            <div key={i} className="card" style={{ marginBottom: '1rem', cursor: 'default' }}>
                                                <div className="info-item">
                                                    Offset: <span>{msg.offset}</span> | Key: <span>{msg.key || 'null'}</span>
                                                    {msg.isDecoded && schemaRegistryId && (
                                                        <Link
                                                            href={`/container/${schemaRegistryId}?type=schema-registry${msg.schemaId ? `&schemaId=${msg.schemaId}` : ''}`}
                                                            className="status-badge status-up"
                                                            style={{ marginLeft: '10px', fontSize: '0.7rem', textDecoration: 'none' }}
                                                        >
                                                            DECODED ↗
                                                        </Link>
                                                    )}
                                                    {msg.isDecoded && !schemaRegistryId && (
                                                        <span className="status-badge status-up" style={{ marginLeft: '10px', fontSize: '0.7rem' }}>DECODED</span>
                                                    )}
                                                </div>
                                                <pre className="json-view">
                                                    {typeof msg.value === 'object' ? JSON.stringify(msg.value, null, 2) : msg.value}
                                                </pre>
                                            </div>
                                        ))}
                                        {messages.length === 0 && (
                                            <p style={{ padding: '2rem', textAlign: 'center' }}>
                                                No messages found (or still waiting for consumption timeout).
                                            </p>
                                        )}
                                    </>
                                )}
                            </>
                        ) : <p className="loading">Select a topic to consume messages</p>}
                    </div>
                </div>
            )}

            {type === 'schema-registry' && (
                <div style={{ display: 'flex', gap: '2rem' }}>
                    <div style={{ width: '300px' }}>
                        <h2 className="section-title">Subjects</h2>
                        {loading && (!data || data.length === 0) ? (
                            <div className="spinner"></div>
                        ) : data && Array.isArray(data) ? (
                            <>
                                {data.map((subject: string) => (
                                    <div
                                        key={subject}
                                        className="card"
                                        style={{
                                            cursor: 'pointer',
                                            marginBottom: '0.5rem',
                                            padding: '0.75rem',
                                            background: selectedSchema?.subject === subject ? 'rgba(99, 102, 241, 0.2)' : 'var(--card-bg)'
                                        }}
                                        onClick={() => viewSchema(subject)}
                                    >
                                        <h3 style={{ fontSize: '1rem', margin: 0 }}>{subject}</h3>
                                    </div>
                                ))}
                                {data.length === 0 && <p className="loading">No subjects found.</p>}
                            </>
                        ) : (
                            <p className="loading">Failed to load subjects.</p>
                        )}
                    </div>
                    <div style={{ flex: 1 }}>
                        {selectedSchema ? (
                            <>
                                <h2 className="section-title">Schema: {selectedSchema.subject}</h2>
                                <div className="card" style={{ cursor: 'default' }}>
                                    <div className="info-item">ID: <span>{selectedSchema.id}</span> | Version: <span>{selectedSchema.version}</span></div>
                                    <pre className="json-view">
                                        {(() => {
                                            try {
                                                return JSON.stringify(JSON.parse(selectedSchema.schema), null, 2);
                                            } catch (e) {
                                                return selectedSchema.schema;
                                            }
                                        })()}
                                    </pre>
                                </div>
                            </>
                        ) : <p className="loading">Select a subject to view schema</p>}
                    </div>
                </div>
            )}
        </div>
    );
}
