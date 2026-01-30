
import { LatLng, RouteResponse } from '../types';

/**
 * Fetches a route between two points using the OSRM project's public API.
 * Note: OSRM uses [lng, lat] format, Leaflet uses [lat, lng].
 */
export async function getRoute(start: LatLng, end: LatLng): Promise<RouteResponse> {
  const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code !== 'Ok') {
      throw new Error('Routing API failed');
    }

    const route = data.routes[0];
    const coordinates: LatLng[] = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
    
    return {
      coordinates,
      distance: route.distance,
      duration: route.duration,
    };
  } catch (error) {
    console.error('Error fetching route:', error);
    // Return a straight line fallback if API fails
    return {
      coordinates: [start, end],
      distance: 0,
      duration: 0
    };
  }
}

/**
 * Linearly interpolates between two coordinates for smooth animation.
 */
export function interpolate(start: LatLng, end: LatLng, fraction: number): LatLng {
  return [
    start[0] + (end[0] - start[0]) * fraction,
    start[1] + (end[1] - start[1]) * fraction,
  ];
}
