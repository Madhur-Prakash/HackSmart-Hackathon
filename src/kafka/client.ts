import { Kafka, Producer, Consumer, Admin, logLevel, CompressionTypes } from 'kafkajs';
import { config } from '../config';
import { createLogger } from '../utils/logger';

const logger = createLogger('kafka');

// Kafka client singleton
let kafkaInstance: Kafka | null = null;

/**
 * Get or create Kafka client instance
 */
export function getKafkaClient(): Kafka {
  if (!kafkaInstance) {
    kafkaInstance = new Kafka({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
      logLevel: config.env === 'development' ? logLevel.WARN : logLevel.ERROR,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
      connectionTimeout: 10000,
      requestTimeout: 30000,
    });
    
    logger.info('Kafka client initialized', { 
      brokers: config.kafka.brokers,
      clientId: config.kafka.clientId 
    });
  }
  
  return kafkaInstance;
}

/**
 * Create and connect a Kafka producer
 */
export async function createProducer(): Promise<Producer> {
  const kafka = getKafkaClient();
  const producer = kafka.producer({
    allowAutoTopicCreation: true,
    transactionTimeout: 30000,
  });
  
  await producer.connect();
  logger.info('Kafka producer connected');
  
  return producer;
}

/**
 * Create and connect a Kafka consumer
 */
export async function createConsumer(groupIdSuffix?: string): Promise<Consumer> {
  const kafka = getKafkaClient();
  const groupId = groupIdSuffix 
    ? `${config.kafka.groupId}-${groupIdSuffix}` 
    : config.kafka.groupId;
    
  const consumer = kafka.consumer({
    groupId,
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
    maxBytesPerPartition: 1048576, // 1MB
    retry: {
      initialRetryTime: 100,
      retries: 8,
    },
  });
  
  await consumer.connect();
  logger.info('Kafka consumer connected', { groupId });
  
  return consumer;
}

/**
 * Get Kafka admin client
 */
export async function getAdmin(): Promise<Admin> {
  const kafka = getKafkaClient();
  const admin = kafka.admin();
  await admin.connect();
  return admin;
}

/**
 * Kafka Topics Definition
 */
export const TOPICS = config.kafka.topics;

/**
 * Generic message producer helper
 */
export async function produceMessage<T>(
  producer: Producer,
  topic: string,
  key: string,
  value: T,
  headers?: Record<string, string>
): Promise<void> {
  try {
    await producer.send({
      topic,
      compression: CompressionTypes.GZIP,
      messages: [
        {
          key,
          value: JSON.stringify(value),
          headers: {
            ...headers,
            timestamp: Date.now().toString(),
            source: config.kafka.clientId,
          },
        },
      ],
    });
    
    logger.debug('Message produced', { topic, key });
  } catch (error) {
    logger.error('Failed to produce message', { topic, key, error });
    throw error;
  }
}

/**
 * Batch message producer helper
 */
export async function produceBatch<T>(
  producer: Producer,
  topic: string,
  messages: Array<{ key: string; value: T; headers?: Record<string, string> }>
): Promise<void> {
  try {
    await producer.send({
      topic,
      compression: CompressionTypes.GZIP,
      messages: messages.map(msg => ({
        key: msg.key,
        value: JSON.stringify(msg.value),
        headers: {
          ...msg.headers,
          timestamp: Date.now().toString(),
          source: config.kafka.clientId,
        },
      })),
    });
    
    logger.debug('Batch produced', { topic, count: messages.length });
  } catch (error) {
    logger.error('Failed to produce batch', { topic, error });
    throw error;
  }
}

/**
 * Parse Kafka message value
 */
export function parseMessage<T>(value: Buffer | string | null): T | null {
  if (!value) return null;
  
  try {
    const str = Buffer.isBuffer(value) ? value.toString('utf-8') : value;
    return JSON.parse(str) as T;
  } catch (error) {
    logger.error('Failed to parse Kafka message', { error });
    return null;
  }
}

/**
 * Graceful shutdown helper
 */
export async function disconnectKafka(
  producer?: Producer,
  consumer?: Consumer
): Promise<void> {
  const disconnectPromises: Promise<void>[] = [];
  
  if (producer) {
    disconnectPromises.push(producer.disconnect());
  }
  
  if (consumer) {
    disconnectPromises.push(consumer.disconnect());
  }
  
  await Promise.all(disconnectPromises);
  logger.info('Kafka connections closed');
}
