import { z } from 'zod';

// Geo Location Schema
export const geoLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// Station Telemetry Schema
export const stationTelemetrySchema = z.object({
  stationId: z.string().min(1),
  queueLength: z.number().min(0),
  avgServiceTime: z.number().min(0),
  availableChargers: z.number().min(0),
  totalChargers: z.number().min(1),
  faultRate: z.number().min(0).max(1),
  availablePower: z.number().min(0),
  maxCapacity: z.number().min(1),
  timestamp: z.number().positive(),
});

// Station Health Schema
export const stationHealthSchema = z.object({
  stationId: z.string().min(1),
  status: z.enum(['operational', 'degraded', 'offline', 'maintenance']),
  lastMaintenanceDate: z.string(),
  uptimePercentage: z.number().min(0).max(100),
  activeAlerts: z.array(z.object({
    id: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    message: z.string(),
    createdAt: z.string(),
  })),
  healthScore: z.number().min(0).max(100),
  timestamp: z.number().positive(),
});

// Grid Status Schema
export const gridStatusSchema = z.object({
  gridId: z.string().min(1),
  region: z.string(),
  currentLoad: z.number().min(0),
  maxCapacity: z.number().min(1),
  loadPercentage: z.number().min(0).max(100),
  peakHours: z.boolean(),
  pricePerKwh: z.number().min(0),
  timestamp: z.number().positive(),
});

// User Context Schema
export const userContextSchema = z.object({
  userId: z.string().min(1),
  sessionId: z.string().min(1),
  currentLocation: geoLocationSchema,
  vehicleType: z.string(),
  batteryLevel: z.number().min(0).max(100),
  preferredChargerType: z.enum(['fast', 'standard', 'any']),
  maxWaitTime: z.number().min(0),
  maxDistance: z.number().min(0),
  timestamp: z.number().positive(),
});

// Recommendation Request Schema
export const recommendationRequestSchema = z.object({
  userId: z.string().min(1),
  location: geoLocationSchema,
  vehicleType: z.string().optional(),
  batteryLevel: z.number().min(0).max(100).optional(),
  preferredChargerType: z.enum(['fast', 'standard', 'any']).optional(),
  maxWaitTime: z.number().min(0).optional(),
  maxDistance: z.number().min(0).optional(),
  limit: z.number().min(1).max(20).optional().default(5),
});

// Station Ingest Schema
export const stationIngestSchema = z.object({
  stationId: z.string().min(1),
  queueLength: z.number().min(0).optional(),
  avgServiceTime: z.number().min(0).optional(),
  availableChargers: z.number().min(0).optional(),
  totalChargers: z.number().min(1).optional(),
  faultRate: z.number().min(0).max(1).optional(),
  availablePower: z.number().min(0).optional(),
  maxCapacity: z.number().min(1).optional(),
});

// Validation helper
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: Array<{ path: string; message: string }> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return {
    success: false,
    errors: result.error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message,
    })),
  };
}
