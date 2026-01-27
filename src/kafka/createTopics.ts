import { getAdmin, TOPICS } from './client';
import { createLogger } from '../utils/logger';

const logger = createLogger('kafka-topics');

interface TopicConfig {
  topic: string;
  numPartitions: number;
  replicationFactor: number;
}

/**
 * Topic configurations for the EV platform
 */
const topicConfigs: TopicConfig[] = [
  { topic: TOPICS.stationTelemetry, numPartitions: 6, replicationFactor: 1 },
  { topic: TOPICS.stationHealth, numPartitions: 3, replicationFactor: 1 },
  { topic: TOPICS.gridStatus, numPartitions: 3, replicationFactor: 1 },
  { topic: TOPICS.userContext, numPartitions: 6, replicationFactor: 1 },
  { topic: TOPICS.stationFeatures, numPartitions: 6, replicationFactor: 1 },
  { topic: TOPICS.stationPredictions, numPartitions: 6, replicationFactor: 1 },
  { topic: TOPICS.stationScores, numPartitions: 6, replicationFactor: 1 },
  { topic: TOPICS.recommendations, numPartitions: 6, replicationFactor: 1 },
];

/**
 * Create all required Kafka topics
 */
export async function createTopics(): Promise<void> {
  const admin = await getAdmin();
  
  try {
    // Get existing topics
    const existingTopics = await admin.listTopics();
    logger.info('Existing topics', { topics: existingTopics });
    
    // Filter out already existing topics
    const topicsToCreate = topicConfigs.filter(
      tc => !existingTopics.includes(tc.topic)
    );
    
    if (topicsToCreate.length === 0) {
      logger.info('All topics already exist');
      return;
    }
    
    // Create topics
    await admin.createTopics({
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
    
    logger.info('Topics created successfully', { 
      topics: topicsToCreate.map(tc => tc.topic) 
    });
  } catch (error) {
    logger.error('Failed to create topics', { error });
    throw error;
  } finally {
    await admin.disconnect();
  }
}

/**
 * Delete all topics (for development/testing)
 */
export async function deleteTopics(): Promise<void> {
  const admin = await getAdmin();
  
  try {
    const existingTopics = await admin.listTopics();
    const topicsToDelete = topicConfigs
      .map(tc => tc.topic)
      .filter(t => existingTopics.includes(t));
    
    if (topicsToDelete.length > 0) {
      await admin.deleteTopics({
        topics: topicsToDelete,
        timeout: 30000,
      });
      
      logger.info('Topics deleted', { topics: topicsToDelete });
    }
  } catch (error) {
    logger.error('Failed to delete topics', { error });
    throw error;
  } finally {
    await admin.disconnect();
  }
}

/**
 * Get topic metadata
 */
export async function getTopicMetadata(): Promise<void> {
  const admin = await getAdmin();
  
  try {
    const topics = topicConfigs.map(tc => tc.topic);
    const metadata = await admin.fetchTopicMetadata({ topics });
    
    metadata.topics.forEach(topic => {
      logger.info('Topic metadata', {
        name: topic.name,
        partitions: topic.partitions.length,
        partitionDetails: topic.partitions.map(p => ({
          partition: p.partitionId,
          leader: p.leader,
          replicas: p.replicas,
        })),
      });
    });
  } finally {
    await admin.disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  createTopics()
    .then(() => {
      logger.info('Topic setup complete');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Topic setup failed', { error });
      process.exit(1);
    });
}
