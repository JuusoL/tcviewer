'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Container {
  id: string;
  name: string;
  image: string;
  status: string;
  ports: { [key: string]: number };
  type: string;
}

export default function Home() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/containers')
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setContainers(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'postgres': return '🐘';
      case 'kafka': return '🚀';
      case 'schema-registry': return '📜';
      default: return '📦';
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Testcontainer Checker</h1>
        <p className="subtitle">Real-time inspection of your running test infrastructure</p>
      </header>

      {loading && <div className="loading">Searching for active containers...</div>}
      {error && <div className="error" style={{ color: 'var(--error-color)', textAlign: 'center' }}>Error: {error}</div>}

      {!loading && !error && containers.length === 0 && (
        <div className="loading">No active Testcontainers found. Make sure your tests are running!</div>
      )}

      <div className="grid">
        {containers.map(container => (
          <Link key={container.id} href={`/container/${container.id}?type=${container.type}`} className="card">
            <div className="type-icon">{getTypeIcon(container.type)}</div>
            <span className="status-badge status-up">RUNNING</span>
            <h2>{container.name}</h2>
            <div className="info-item">Image: <span>{container.image}</span></div>
            <div className="info-item">Type: <span>{container.type}</span></div>
            <div className="info-item" style={{ marginTop: '1rem' }}>
              Ports: {Object.entries(container.ports).map(([priv, pub]) => (
                <span key={priv} style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '4px', marginRight: '4px' }}>
                  {priv} → {pub}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
