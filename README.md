# Testcontainer Checker

A powerful, developer-friendly dashboard for inspecting and interacting with **Testcontainers** (Postgres, Kafka, and Schema Registry) in real-time.

## Features

### 🚀 Kafka Observability
- **Topic Browser:** Instantly list and search through Kafka topics.
- **Message Consumer:** Consume and view the latest messages from any topic.
- **Automated Avro Decoding:** Automatically detects Schema Registry containers and decodes Avro messages into human-readable JSON.
- **Deep Linking:** Jump from a decoded message directly to its schema in the Schema Registry.
- **Compression Support:** Built-in support for **Snappy** compression.

### 🐘 Postgres Inspector
- **Schema Browser:** Explore tables and their column structures.
- **Data Viewer:** Query and view the latest 100 rows from any table.
- **Fast Feedback:** 5s connection timeouts ensure you never wait on a hung container.

### 📜 Schema Registry
- **Subject Management:** List all subjects and their versions.
- **Schema Viewer:** View raw schemas (JSON, Protobuf, etc.) with syntax highlighting compatibility.

## Configuration

The application uses environment variables to handle various container authentication methods. These default to standard Testcontainer settings but can be overridden.

| Variable | Description | Default |
| :--- | :--- | :--- |
| `KAFKA_SASL_MECHANISM` | Kafka SASL mechanism | `plain` |
| `KAFKA_SASL_USERNAME` | Kafka SASL username | `kafkaclient` |
| `KAFKA_SASL_PASSWORD` | Kafka SASL password | `kafkaclientpwd` |
| `POSTGRES_USER` | Postgres username | `test` |
| `POSTGRES_PASSWORD` | Postgres password | `test` |
| `POSTGRES_DB` | Postgres database name | `test` |

## Getting Started

### Prerequisites
- Node.js (v18+)
- Docker (running Testcontainers)

### Installation
```bash
npm install
```

### Running the Dashboard
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Vanilla CSS (Modern Dark Mode)
- **Core Libraries:** `kafkajs`, `pg`, `@kafkajs/confluent-schema-registry`
