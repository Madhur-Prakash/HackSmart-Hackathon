import { getDb, TABLES, closeDb, checkConnection } from './client';
import { Station, StationHistoryRecord, UserRequestRecord, RecommendationLogRecord, SystemEventRecord } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('repository');

// ============================================
// Station Repository
// ============================================

export const stationRepository = {
  async findById(id: string): Promise<Station | null> {
    const db = getDb();
    const row = await db(TABLES.stations).where('id', id).first();
    return row ? mapRowToStation(row) : null;
  },

  async findAll(): Promise<Station[]> {
    const db = getDb();
    const rows = await db(TABLES.stations).select('*');
    return rows.map(mapRowToStation);
  },

  async findByRegion(region: string): Promise<Station[]> {
    const db = getDb();
    const rows = await db(TABLES.stations).where('region', region);
    return rows.map(mapRowToStation);
  },

  async findNearby(lat: number, lon: number, radiusKm: number): Promise<Station[]> {
    const db = getDb();
    // Approximate degree to km conversion (at equator)
    const degreeRadius = radiusKm / 111;
    
    const rows = await db(TABLES.stations)
      .whereBetween('latitude', [lat - degreeRadius, lat + degreeRadius])
      .whereBetween('longitude', [lon - degreeRadius, lon + degreeRadius]);
    
    return rows.map(mapRowToStation);
  },

  async upsert(station: Station): Promise<void> {
    const db = getDb();
    await db(TABLES.stations)
      .insert(stationToRow(station))
      .onConflict('id')
      .merge();
  },

  async updateChargerCount(id: string, available: number): Promise<void> {
    const db = getDb();
    await db(TABLES.stations)
      .where('id', id)
      .update({ updated_at: db.fn.now() });
  },

  async getCount(): Promise<number> {
    const db = getDb();
    const result = await db(TABLES.stations).count('id as count').first();
    return parseInt(result?.count as string || '0', 10);
  },
};

// ============================================
// Station History Repository
// ============================================

export const stationHistoryRepository = {
  async create(record: Omit<StationHistoryRecord, 'id' | 'createdAt'>): Promise<void> {
    const db = getDb();
    await db(TABLES.stationHistory).insert({
      station_id: record.stationId,
      telemetry: JSON.stringify(record.telemetry),
      features: JSON.stringify(record.features),
      score: record.score,
    });
  },

  async createBatch(records: Array<Omit<StationHistoryRecord, 'id' | 'createdAt'>>): Promise<void> {
    const db = getDb();
    const rows = records.map(r => ({
      station_id: r.stationId,
      telemetry: JSON.stringify(r.telemetry),
      features: JSON.stringify(r.features),
      score: r.score,
    }));
    await db(TABLES.stationHistory).insert(rows);
  },

  async findByStation(stationId: string, limit: number = 100): Promise<StationHistoryRecord[]> {
    const db = getDb();
    const rows = await db(TABLES.stationHistory)
      .where('station_id', stationId)
      .orderBy('created_at', 'desc')
      .limit(limit);
    
    return rows.map(mapRowToStationHistory);
  },

  async findRecent(hours: number = 24): Promise<StationHistoryRecord[]> {
    const db = getDb();
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const rows = await db(TABLES.stationHistory)
      .where('created_at', '>=', cutoff)
      .orderBy('created_at', 'desc');
    
    return rows.map(mapRowToStationHistory);
  },

  async cleanup(olderThanDays: number): Promise<number> {
    const db = getDb();
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    
    const deleted = await db(TABLES.stationHistory)
      .where('created_at', '<', cutoff)
      .delete();
    
    logger.info('Cleaned up station history', { deleted, olderThanDays });
    return deleted;
  },
};

// ============================================
// User Request Repository
// ============================================

export const userRequestRepository = {
  async create(record: {
    userId: string;
    sessionId: string;
    request: object;
    processingTime?: number;
  }): Promise<number> {
    const db = getDb();
    const [result] = await db(TABLES.userRequests)
      .insert({
        user_id: record.userId,
        session_id: record.sessionId,
        request: JSON.stringify(record.request),
        processing_time: record.processingTime,
        status: 'pending',
      })
      .returning('id');
    
    return result.id;
  },

  async updateResponse(id: number, response: object, processingTime: number): Promise<void> {
    const db = getDb();
    await db(TABLES.userRequests)
      .where('id', id)
      .update({
        response: JSON.stringify(response),
        processing_time: processingTime,
        status: 'completed',
      });
  },

  async markFailed(id: number, error: string): Promise<void> {
    const db = getDb();
    await db(TABLES.userRequests)
      .where('id', id)
      .update({
        response: JSON.stringify({ error }),
        status: 'failed',
      });
  },

  async findByUser(userId: string, limit: number = 50): Promise<UserRequestRecord[]> {
    const db = getDb();
    const rows = await db(TABLES.userRequests)
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .limit(limit);
    
    return rows.map(mapRowToUserRequest);
  },

  async getCountToday(): Promise<number> {
    const db = getDb();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const result = await db(TABLES.userRequests)
      .where('created_at', '>=', today)
      .count('id as count')
      .first();
    
    return parseInt(result?.count as string || '0', 10);
  },

  async getAverageProcessingTime(): Promise<number> {
    const db = getDb();
    const result = await db(TABLES.userRequests)
      .whereNotNull('processing_time')
      .avg('processing_time as avg')
      .first();
    
    return parseFloat(result?.avg as string || '0');
  },
};

// ============================================
// Recommendation Log Repository
// ============================================

export const recommendationLogRepository = {
  async create(record: {
    requestId: string;
    userId: string;
    stationIds: string[];
    metadata?: object;
  }): Promise<void> {
    const db = getDb();
    await db(TABLES.recommendationLogs).insert({
      request_id: record.requestId,
      user_id: record.userId,
      station_ids: record.stationIds,
      metadata: record.metadata ? JSON.stringify(record.metadata) : null,
    });
  },

  async recordSelection(requestId: string, stationId: string): Promise<void> {
    const db = getDb();
    await db(TABLES.recommendationLogs)
      .where('request_id', requestId)
      .update({
        selected_station_id: stationId,
        selected_at: db.fn.now(),
      });
  },

  async recordFeedback(requestId: string, feedback: number): Promise<void> {
    const db = getDb();
    await db(TABLES.recommendationLogs)
      .where('request_id', requestId)
      .update({ feedback });
  },

  async getTopRecommendedStations(limit: number = 10): Promise<Array<{ stationId: string; count: number }>> {
    const db = getDb();
    const rows = await db(TABLES.recommendationLogs)
      .select(db.raw('unnest(station_ids) as station_id'))
      .count('* as count')
      .groupBy(db.raw('unnest(station_ids)'))
      .orderBy('count', 'desc')
      .limit(limit);
    
    return rows.map((r: any) => ({
      stationId: r.station_id,
      count: parseInt(r.count, 10),
    }));
  },

  async getCountToday(): Promise<number> {
    const db = getDb();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const result = await db(TABLES.recommendationLogs)
      .where('created_at', '>=', today)
      .count('id as count')
      .first();
    
    return parseInt(result?.count as string || '0', 10);
  },
};

// ============================================
// System Event Repository
// ============================================

export const systemEventRepository = {
  async create(event: {
    eventType: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    metadata?: object;
    sourceService?: string;
  }): Promise<void> {
    const db = getDb();
    await db(TABLES.systemEvents).insert({
      event_type: event.eventType,
      severity: event.severity,
      message: event.message,
      metadata: event.metadata ? JSON.stringify(event.metadata) : null,
      source_service: event.sourceService,
    });
  },

  async findRecent(limit: number = 100): Promise<SystemEventRecord[]> {
    const db = getDb();
    const rows = await db(TABLES.systemEvents)
      .orderBy('created_at', 'desc')
      .limit(limit);
    
    return rows.map(mapRowToSystemEvent);
  },

  async findBySeverity(severity: string, limit: number = 100): Promise<SystemEventRecord[]> {
    const db = getDb();
    const rows = await db(TABLES.systemEvents)
      .where('severity', severity)
      .orderBy('created_at', 'desc')
      .limit(limit);
    
    return rows.map(mapRowToSystemEvent);
  },

  async getCountBySeverity(): Promise<Record<string, number>> {
    const db = getDb();
    const rows = await db(TABLES.systemEvents)
      .select('severity')
      .count('* as count')
      .groupBy('severity');
    
    const result: Record<string, number> = {};
    rows.forEach((r: any) => {
      result[r.severity] = parseInt(r.count, 10);
    });
    
    return result;
  },
};

// ============================================
// Mapping Functions
// ============================================

function mapRowToStation(row: any): Station {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    location: {
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
    },
    totalChargers: row.total_chargers,
    chargerTypes: row.charger_types || [],
    maxCapacity: parseFloat(row.max_capacity),
    operatingHours: row.operating_hours,
    amenities: row.amenities || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function stationToRow(station: Station): any {
  return {
    id: station.id,
    name: station.name,
    address: station.address,
    latitude: station.location.latitude,
    longitude: station.location.longitude,
    total_chargers: station.totalChargers,
    charger_types: station.chargerTypes,
    max_capacity: station.maxCapacity,
    operating_hours: station.operatingHours,
    amenities: station.amenities,
  };
}

function mapRowToStationHistory(row: any): StationHistoryRecord {
  return {
    id: row.id,
    stationId: row.station_id,
    telemetry: typeof row.telemetry === 'string' ? JSON.parse(row.telemetry) : row.telemetry,
    features: typeof row.features === 'string' ? JSON.parse(row.features) : row.features,
    score: parseFloat(row.score),
    createdAt: row.created_at,
  };
}

function mapRowToUserRequest(row: any): UserRequestRecord {
  return {
    id: row.id,
    userId: row.user_id,
    sessionId: row.session_id,
    request: typeof row.request === 'string' ? JSON.parse(row.request) : row.request,
    response: row.response ? (typeof row.response === 'string' ? JSON.parse(row.response) : row.response) : null,
    processingTime: row.processing_time,
    createdAt: row.created_at,
  };
}

function mapRowToSystemEvent(row: any): SystemEventRecord {
  return {
    id: row.id,
    eventType: row.event_type,
    severity: row.severity,
    message: row.message,
    metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : {},
    createdAt: row.created_at,
  };
}

export { getDb, TABLES, closeDb, checkConnection };
