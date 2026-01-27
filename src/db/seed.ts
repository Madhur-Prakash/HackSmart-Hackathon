import { getDb, TABLES } from './client';
import { createLogger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('seed');

/**
 * Sample station data for seeding
 */
const sampleStations = [
  {
    id: 'ST_101',
    name: 'Downtown EV Hub',
    address: '123 Main Street, Downtown',
    latitude: 37.7749,
    longitude: -122.4194,
    total_chargers: 12,
    charger_types: ['CCS', 'CHAdeMO', 'Type2'],
    max_capacity: 500,
    operating_hours: '24/7',
    amenities: ['restroom', 'cafe', 'wifi'],
    region: 'downtown',
    grid_id: 'GRID_01',
  },
  {
    id: 'ST_102',
    name: 'Westside Charging Station',
    address: '456 West Avenue',
    latitude: 37.7849,
    longitude: -122.4294,
    total_chargers: 8,
    charger_types: ['CCS', 'Type2'],
    max_capacity: 350,
    operating_hours: '6AM-11PM',
    amenities: ['restroom', 'convenience_store'],
    region: 'westside',
    grid_id: 'GRID_02',
  },
  {
    id: 'ST_103',
    name: 'Airport Fast Charge',
    address: '789 Airport Blvd',
    latitude: 37.6213,
    longitude: -122.379,
    total_chargers: 20,
    charger_types: ['CCS', 'CHAdeMO', 'Tesla'],
    max_capacity: 800,
    operating_hours: '24/7',
    amenities: ['restroom', 'lounge', 'wifi', 'food_court'],
    region: 'airport',
    grid_id: 'GRID_03',
  },
  {
    id: 'ST_104',
    name: 'Mall Parking Chargers',
    address: '321 Shopping Center Dr',
    latitude: 37.7649,
    longitude: -122.4094,
    total_chargers: 15,
    charger_types: ['CCS', 'Type2'],
    max_capacity: 450,
    operating_hours: '8AM-10PM',
    amenities: ['restroom', 'shopping', 'food_court'],
    region: 'central',
    grid_id: 'GRID_01',
  },
  {
    id: 'ST_105',
    name: 'Highway Rest Stop',
    address: 'Highway 101, Mile 42',
    latitude: 37.5549,
    longitude: -122.2894,
    total_chargers: 10,
    charger_types: ['CCS', 'CHAdeMO'],
    max_capacity: 400,
    operating_hours: '24/7',
    amenities: ['restroom', 'gas_station', 'convenience_store'],
    region: 'highway',
    grid_id: 'GRID_04',
  },
  {
    id: 'ST_106',
    name: 'Tech Park Station',
    address: '555 Innovation Way',
    latitude: 37.3861,
    longitude: -122.0839,
    total_chargers: 25,
    charger_types: ['CCS', 'Tesla', 'Type2'],
    max_capacity: 1000,
    operating_hours: '24/7',
    amenities: ['restroom', 'wifi', 'lounge', 'workspace'],
    region: 'tech_park',
    grid_id: 'GRID_05',
  },
  {
    id: 'ST_107',
    name: 'Residential Hub North',
    address: '888 North Residential Ave',
    latitude: 37.8049,
    longitude: -122.4394,
    total_chargers: 6,
    charger_types: ['Type2'],
    max_capacity: 150,
    operating_hours: '24/7',
    amenities: ['restroom'],
    region: 'north',
    grid_id: 'GRID_02',
  },
  {
    id: 'ST_108',
    name: 'Beach Front Chargers',
    address: '999 Ocean Drive',
    latitude: 37.7549,
    longitude: -122.5094,
    total_chargers: 8,
    charger_types: ['CCS', 'Type2'],
    max_capacity: 300,
    operating_hours: '6AM-10PM',
    amenities: ['restroom', 'beach_access', 'cafe'],
    region: 'coastal',
    grid_id: 'GRID_06',
  },
];

/**
 * Sample users for seeding
 */
const sampleUsers = [
  {
    id: 'USR_001',
    email: 'john.doe@example.com',
    name: 'John Doe',
    vehicle_type: 'Tesla Model 3',
    preferred_stations: ['ST_101', 'ST_103'],
    preferences: { preferFast: true, maxWaitTime: 15 },
  },
  {
    id: 'USR_002',
    email: 'jane.smith@example.com',
    name: 'Jane Smith',
    vehicle_type: 'Chevy Bolt',
    preferred_stations: ['ST_102', 'ST_104'],
    preferences: { preferFast: false, maxWaitTime: 30 },
  },
  {
    id: 'USR_003',
    email: 'demo@example.com',
    name: 'Demo User',
    vehicle_type: 'Nissan Leaf',
    preferred_stations: [],
    preferences: {},
  },
];

/**
 * Seed the database with sample data
 */
export async function seedDatabase(): Promise<void> {
  const db = getDb();

  logger.info('Starting database seeding');

  try {
    // Seed stations
    for (const station of sampleStations) {
      const exists = await db(TABLES.stations).where('id', station.id).first();
      if (!exists) {
        await db(TABLES.stations).insert(station);
        logger.info(`Inserted station: ${station.name}`);
      }
    }

    // Seed users
    for (const user of sampleUsers) {
      const exists = await db(TABLES.users).where('id', user.id).first();
      if (!exists) {
        await db(TABLES.users).insert(user);
        logger.info(`Inserted user: ${user.name}`);
      }
    }

    // Seed some station history
    const historyRecords = sampleStations.map((station) => ({
      station_id: station.id,
      telemetry: JSON.stringify({
        stationId: station.id,
        queueLength: Math.floor(Math.random() * 5),
        avgServiceTime: 5 + Math.random() * 10,
        availableChargers: Math.floor(Math.random() * station.total_chargers),
        totalChargers: station.total_chargers,
        faultRate: Math.random() * 0.05,
        availablePower: station.max_capacity * (0.7 + Math.random() * 0.3),
        maxCapacity: station.max_capacity,
        timestamp: Math.floor(Date.now() / 1000),
      }),
      features: JSON.stringify({
        effectiveWaitTime: Math.random() * 30,
        stationReliabilityScore: 0.9 + Math.random() * 0.1,
        energyStabilityIndex: 0.8 + Math.random() * 0.2,
        chargerAvailabilityRatio: 0.5 + Math.random() * 0.5,
      }),
      score: 0.6 + Math.random() * 0.4,
    }));

    await db(TABLES.stationHistory).insert(historyRecords);
    logger.info(`Inserted ${historyRecords.length} station history records`);

    // Seed system events
    const systemEvents = [
      {
        event_type: 'system_start',
        severity: 'info',
        message: 'EV Platform backend started',
        metadata: JSON.stringify({ version: '1.0.0' }),
        source_service: 'api',
      },
      {
        event_type: 'seed_completed',
        severity: 'info',
        message: 'Database seeding completed',
        metadata: JSON.stringify({ stations: sampleStations.length, users: sampleUsers.length }),
        source_service: 'seed',
      },
    ];

    await db(TABLES.systemEvents).insert(systemEvents);
    logger.info('Inserted system events');

    logger.info('Database seeding completed successfully');
  } catch (error) {
    logger.error('Seeding failed', { error });
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      logger.info('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seeding failed', { error });
      process.exit(1);
    });
}
