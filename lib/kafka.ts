import { Kafka, CompressionCodecs, CompressionTypes } from 'kafkajs';
const SnappyCodec = require('kafkajs-snappy');
CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec;

export async function getKafkaMetadata(brokers: string[]) {
    const kafka = new Kafka({
        clientId: 'testcontainer-checker',
        brokers: brokers.map(b => b.replace('localhost', '127.0.0.1')),
        connectionTimeout: 5000,
        retry: {
            initialRetryTime: 100,
            retries: 3
        },
        sasl: {
            mechanism: (process.env.KAFKA_SASL_MECHANISM || 'plain') as any,
            username: process.env.KAFKA_SASL_USERNAME || 'kafkaclient',
            password: process.env.KAFKA_SASL_PASSWORD || 'kafkaclientpwd'
        }
    });

    const admin = kafka.admin();
    try {
        await admin.connect();
        const topics = await admin.listTopics();
        const metadata = await admin.fetchTopicMetadata({ topics });
        return metadata.topics.map(t => ({
            ...t,
            topic: t.name
        }));
    } catch (err) {
        console.error('Error fetching Kafka metadata:', err);
        throw err;
    } finally {
        await admin.disconnect();
    }
}

import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';

export async function consumeMessages(brokers: string[], topic: string, limit: number = 20, schemaRegistryUrl?: string) {
    const registry = schemaRegistryUrl ? new SchemaRegistry({ host: schemaRegistryUrl }) : null;
    const kafka = new Kafka({
        clientId: 'testcontainer-checker',
        brokers: brokers.map(b => b.replace('localhost', '127.0.0.1')),
        connectionTimeout: 5000,
        retry: {
            initialRetryTime: 100,
            retries: 3
        },
        sasl: {
            mechanism: (process.env.KAFKA_SASL_MECHANISM || 'plain') as any,
            username: process.env.KAFKA_SASL_USERNAME || 'kafkaclient',
            password: process.env.KAFKA_SASL_PASSWORD || 'kafkaclientpwd'
        }
    });

    const consumer = kafka.consumer({ groupId: `testcontainer-checker-${Date.now()}` });
    const messages: any[] = [];

    try {
        await consumer.connect();
        await consumer.subscribe({ topic, fromBeginning: true });

        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
                resolve();
            }, 5000);

            consumer.run({
                eachMessage: async ({ message }) => {
                    console.log(`[Kafka Consumer] Received message on topic ${topic}, offset: ${message.offset}`);

                    let value = message.value?.toString();
                    let isDecoded = false;
                    let schemaId = null;

                    if (message.value && message.value.length >= 5 && message.value.readInt8(0) === 0) {
                        schemaId = message.value.readInt32BE(1);
                    }

                    if (registry && message.value) {
                        try {
                            value = await registry.decode(message.value);
                            isDecoded = true;
                        } catch (e) {
                            console.warn(`[Kafka Consumer] Failed to decode message at offset ${message.offset} using Schema Registry:`, e);
                            value = message.value.toString();
                        }
                    }

                    messages.push({
                        key: message.key?.toString(),
                        value,
                        isDecoded,
                        schemaId,
                        offset: message.offset,
                        timestamp: message.timestamp
                    });

                    if (messages.length >= limit) {
                        clearTimeout(timeout);
                        resolve();
                    }
                }
            }).catch(reject);
        });

        return messages;
    } catch (err) {
        console.error(`Error consuming from ${topic}:`, err);
        throw err;
    } finally {
        await consumer.disconnect();
    }
}
