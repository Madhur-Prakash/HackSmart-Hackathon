
export type LatLng = [number, number];

export enum ScenarioId {
  STATION_CONGESTION = 'STATION_CONGESTION',
  TRAFFIC_REROUTE = 'TRAFFIC_REROUTE',
  STATION_FAULT = 'STATION_FAULT',
}

export interface SwapStation {
  id: string;
  name: string;
  location: LatLng;
  status: 'available' | 'busy' | 'fault';
  occupancy: number; // 0-100
}

export interface SimulationState {
  currentScenario: ScenarioId | null;
  carPosition: LatLng;
  targetStationId: string | null;
  route: LatLng[];
  isSimulating: boolean;
  logs: LogEntry[];
  progress: number; // 0-100
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  aiNarration?: string;
}

export interface RouteResponse {
  coordinates: LatLng[];
  distance: number;
  duration: number;
}
