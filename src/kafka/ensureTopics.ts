import { Kafka, logLevel } from 'kafkajs';
import { config } from '../config';
import { createLogger } from '../utils/logger';

const logger = createLogger('kafka-setup');

interface TopicConfig {
  topic: string;
  numPartitions: number;
  replicationFactor: number;
}

/**
 * Topic configurations for the EV platform
 */
const topicConfigs: TopicConfig[] = [
  { topic: config.kafka.topics.stationTelemetry, numPartitions: 6, replicationFactor: 1 },
  { topic: config.kafka.topics.stationHealth, numPartitions: 3, replicationFactor: 1 },
  { topic: config.kafka.topics.gridStatus, numPartitions: 3, replicationFactor: 1 },
  { topic: config.kafka.topics.userContext, numPartitions: 6, replicationFactor: 1 },
  { topic: config.kafka.topics.stationFeatures, numPartitions: 6, replicationFactor: 1 },
  { topic: config.kafka.topics.stationPredictions, numPartitions: 6, replicationFactor: 1 },
  { topic: config.kafka.topics.stationScores, numPartitions: 6, replicationFactor: 1 },
  { topic: config.kafka.topics.recommendations, numPartitions: 6, replicationFactor: 1 },
];

/**
 * Wait for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for Kafka broker to be ready with retries
 */
async function waitForKafka(maxRetries: number = 30, retryInterval: number = 2000): Promise<Kafka> {
  const kafka = new Kafka({
    clientId: `${config.kafka.clientId}-setup`,
    brokers: config.kafka.brokers,
    logLevel: logLevel.WARN,
    retry: {
      initialRetryTime: 100,
      retries: 5,
    },
    connectionTimeout: 5000,
    requestTimeout: 10000,
  });

  const admin = kafka.admin();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`Attempting to connect to Kafka (attempt ${attempt}/${maxRetries})...`);
      await admin.connect();
      
      // Test connection by listing topics
      await admin.listTopics();
      
      logger.info('Successfully connected to Kafka broker');
      await admin.disconnect();
      return kafka;
    } catch (error) {
      logger.warn(`Kafka not ready yet (attempt ${attempt}/${maxRetries})`, {
        error: error instanceof Error ? error.message : String(error),
      });

      if (attempt < maxRetries) {
        await sleep(retryInterval);
      } else {
        throw new Error(`Failed to connect to Kafka after ${maxRetries} attempts`);
      }
    }
  }

  throw new Error('Failed to connect to Kafka');
}

/**
 * Create all required Kafka topics
 */
async function createAllTopics(kafka: Kafka): Promise<void> {
  const admin = kafka.admin();
  
  try {
    await admin.connect();
    
    // Get existing topics
    const existingTopics = await admin.listTopics();
    logger.info('Existing topics', { topics: existingTopics });
    
    // Filter out already existing topics
    const topicsToCreate = topicConfigs.filter(
      tc => !existingTopics.includes(tc.topic)
    );
    
    if (topicsToCreate.length === 0) {
      logger.info('All required topics already exist');
      return;
    }
    
    logger.info('Creating topics', { topics: topicsToCreate.map(tc => tc.topic) });
    
    // Create topics
    const created = await admin.createTopics({
      topics: topicsToCreate.map(tc => ({
        topic: tc.topic,
        numPartitions: tc.numPartitions,
        replicationFactor: tc.replicationFactor,
        configEntries: [
          { name: 'cleanup.policy', value: 'delete' },
          { name: 'retention.ms', value: '86400000' }, // 24 hours
          { name: 'segment.ms', value: '3600000' }, // 1 hour
        ],
      })),
      waitForLeaders: true,
      timeout: 30000,
    });
    
    if (created) {
      logger.info('Topics created successfully', { 
        topics: topicsToCreate.map(tc => tc.topic) 
      });
    } else {
      logger.info('Topics already exist or creation returned false');
    }
    
    // Verify all topics exist
    const finalTopics = await admin.listTopics();
    const allTopicsExist = topicConfigs.every(tc => finalTopics.includes(tc.topic));
    
    if (allTopicsExist) {
      logger.info('All required topics are ready', {
        topics: topicConfigs.map(tc => tc.topic)
      });
    } else {
      const missingTopics = topicConfigs
        .filter(tc => !finalTopics.includes(tc.topic))
        .map(tc => tc.topic);
      throw new Error(`Missing topics: ${missingTopics.join(', ')}`);
    }
  } finally {
    await admin.disconnect();
  }
}

/**
 * Main entry point - ensures Kafka is ready and topics exist
 */
async function ensureTopics(): Promise<void> {
  logger.info('Starting Kafka topic setup...');
  logger.info('Kafka brokers', { brokers: config.kafka.brokers });
  
  try {
    // Wait for Kafka to be available
    const kafka = await waitForKafka();
    
    // Create all required topics
    await createAllTopics(kafka);
    
    logger.info('Kafka topic setup complete');
  } catch (error) {
    logger.error('Kafka topic setup failed', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw error;
  }
}

// Export for programmatic use
export { ensureTopics, waitForKafka, createAllTopics };

// Run if executed directly
if (require.main === module) {
  ensureTopics()
    .then(() => {
      logger.info('Topic setup complete - services can now start');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Topic setup failed', { error });
      process.exit(1);
    });
}
