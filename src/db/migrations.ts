import { Knex } from "knex";

/**
 * Run migrations (CREATE tables)
 */
export async function up(knex: Knex): Promise<void> {
  // Fault Tickets
  await knex.schema.createTable("fault_tickets", (table: Knex.CreateTableBuilder) => {
    table.string("id").primary();
    table.string("station_id");
    table.string("reported_by");
    table.enu("fault_level", ["low", "medium", "high", "critical"]);
    table.text("description");
    table.enu("status", ["open", "in_progress", "resolved", "closed"]);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  // Deliveries
  await knex.schema.createTable("deliveries", (table: Knex.CreateTableBuilder) => {
    table.string("id").primary();
    table.string("battery_id");
    table.string("from_shop_id");
    table.string("to_station_id");
    table.string("assigned_driver_id");
    table.enu("status", [
      "pending",
      "accepted",
      "in_transit",
      "delivered",
      "cancelled",
    ]);
    table.timestamp("requested_at");
    table.timestamp("accepted_at");
    table.timestamp("delivered_at");
  });

  // Notifications
  await knex.schema.createTable("notifications", (table: Knex.CreateTableBuilder) => {
    table.string("id").primary();
    table.string("user_id");
    table.enu("type", ["ticket", "delivery", "queue", "system"]);
    table.text("message");
    table.boolean("read").defaultTo(false);
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });

  // QR Queue
  await knex.schema.createTable("qr_queue", (table: Knex.CreateTableBuilder) => {
    table.string("id").primary();
    table.string("station_id");
    table.string("user_id");
    table.string("qr_code");
    table.enu("status", ["waiting", "verified", "swapped", "cancelled"]);
    table.timestamp("joined_at").defaultTo(knex.fn.now());
    table.timestamp("verified_at");
    table.timestamp("swapped_at");
  });

  // Drivers
  await knex.schema.createTable("drivers", (table: Knex.CreateTableBuilder) => {
    table.string("id").primary();
    table.string("name");
    table.string("phone");
    table.string("vehicle_id");
    table.boolean("active").defaultTo(true);
    table.timestamp("registered_at").defaultTo(knex.fn.now());
  });
}

/**
 * Rollback migrations (DROP tables)
 */
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("drivers");
  await knex.schema.dropTableIfExists("qr_queue");
  await knex.schema.dropTableIfExists("notifications");
  await knex.schema.dropTableIfExists("deliveries");
  await knex.schema.dropTableIfExists("fault_tickets");
}

import { getDb, TABLES } from './client';
import { createLogger } from '../utils/logger';

const logger = createLogger('migrations');

/**
 * Run all database migrations
 */
export async function runMigrations(): Promise<void> {
  const db = getDb();

  logger.info('Starting database migrations');

  try {
    // Create stations table
    if (!(await db.schema.hasTable(TABLES.stations))) {
      await db.schema.createTable(TABLES.stations, (table) => {
        table.string('id').primary();
        table.string('name').notNullable();
        table.string('address').notNullable();
        table.decimal('latitude', 10, 7).notNullable();
        table.decimal('longitude', 10, 7).notNullable();
        table.integer('total_chargers').notNullable();
        table.specificType('charger_types', 'text[]');
        table.decimal('max_capacity').notNullable();
        table.string('operating_hours');
        table.specificType('amenities', 'text[]');
        table.string('region');
        table.string('grid_id');
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
        
        table.index(['latitude', 'longitude']);
        table.index('region');
        table.index('grid_id');
      });
      logger.info('Created stations table');
    }

    // Create station_history table
    if (!(await db.schema.hasTable(TABLES.stationHistory))) {
      await db.schema.createTable(TABLES.stationHistory, (table) => {
        table.bigIncrements('id').primary();
        table.string('station_id').notNullable();
        table.jsonb('telemetry').notNullable();
        table.jsonb('features');
        table.decimal('score');
        table.timestamp('created_at').defaultTo(db.fn.now());
        
        table.foreign('station_id').references('id').inTable(TABLES.stations);
        table.index('station_id');
        table.index('created_at');
      });
      logger.info('Created station_history table');
    }

    // Create users table
    if (!(await db.schema.hasTable(TABLES.users))) {
      await db.schema.createTable(TABLES.users, (table) => {
        table.string('id').primary();
        table.string('email').unique();
        table.string('name');
        table.string('vehicle_type');
        table.specificType('preferred_stations', 'text[]');
        table.jsonb('preferences');
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
        
        table.index('email');
      });
      logger.info('Created users table');
    }

    // Create user_requests table
    if (!(await db.schema.hasTable(TABLES.userRequests))) {
      await db.schema.createTable(TABLES.userRequests, (table) => {
        table.bigIncrements('id').primary();
        table.string('user_id').notNullable();
        table.string('session_id').notNullable();
        table.jsonb('request').notNullable();
        table.jsonb('response');
        table.integer('processing_time');
        table.string('status').defaultTo('pending');
        table.timestamp('created_at').defaultTo(db.fn.now());
        
        table.foreign('user_id').references('id').inTable(TABLES.users);
        table.index('user_id');
        table.index('session_id');
        table.index('created_at');
        table.index('status');
      });
      logger.info('Created user_requests table');
    }

    // Create recommendation_logs table
    if (!(await db.schema.hasTable(TABLES.recommendationLogs))) {
      await db.schema.createTable(TABLES.recommendationLogs, (table) => {
        table.bigIncrements('id').primary();
        table.string('request_id').notNullable().unique();
        table.string('user_id').notNullable();
        table.specificType('station_ids', 'text[]').notNullable();
        table.string('selected_station_id');
        table.integer('feedback');
        table.jsonb('metadata');
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('selected_at');
        
        table.foreign('user_id').references('id').inTable(TABLES.users);
        table.index('user_id');
        table.index('request_id');
        table.index('created_at');
      });
      logger.info('Created recommendation_logs table');
    }

    // Create system_events table
    if (!(await db.schema.hasTable(TABLES.systemEvents))) {
      await db.schema.createTable(TABLES.systemEvents, (table) => {
        table.bigIncrements('id').primary();
        table.string('event_type').notNullable();
        table.string('severity').notNullable();
        table.text('message').notNullable();
        table.jsonb('metadata');
        table.string('source_service');
        table.timestamp('created_at').defaultTo(db.fn.now());
        
        table.index('event_type');
        table.index('severity');
        table.index('created_at');
        table.index('source_service');
      });
      logger.info('Created system_events table');
    }

    logger.info('All migrations completed successfully');
  } catch (error) {
    logger.error('Migration failed', { error });
    throw error;
  }
}

/**
 * Drop all tables (use with caution!)
 */
export async function dropAllTables(): Promise<void> {
  const db = getDb();

  logger.warn('Dropping all tables');

  const tables = [
    TABLES.recommendationLogs,
    TABLES.userRequests,
    TABLES.stationHistory,
    TABLES.users,
    TABLES.systemEvents,
    TABLES.stations,
  ];

  for (const table of tables) {
    if (await db.schema.hasTable(table)) {
      await db.schema.dropTable(table);
      logger.info(`Dropped table: ${table}`);
    }
  }
}

// Run if executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      logger.info('Migrations completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migrations failed', { error });
      process.exit(1);
    });
}
