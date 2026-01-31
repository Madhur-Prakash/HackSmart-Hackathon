

import { SwapStation, LatLng } from './types';

export interface Shop {
  id: string;
  name: string;
  location: LatLng;
  stationId: string;
}

export const INITIAL_CENTER: LatLng = [28.6139, 77.2090]; // New Delhi center

export const SWAP_STATIONS: SwapStation[] = [
  {
    id: 'sta-1',
    name: 'Connaught Place Hub',
    location: [28.6315, 77.2167],
    status: 'available',
    occupancy: 20,
  },
  {
    id: 'sta-2',
    name: 'Nehru Place Station',
    location: [28.5494, 77.2501],
    status: 'available',
    occupancy: 45,
  },
  {
    id: 'sta-3',
    name: 'Dwarka Power Grid',
    location: [28.5921, 77.0460],
    status: 'available',
    occupancy: 10,
  },
  {
    id: 'sta-4',
    name: 'Noida Eco-Link',
    location: [28.5355, 77.3910],
    status: 'available',
    occupancy: 30,
  },
];

// Shops near each station (3-4 per station, with slight offsets)
export const SHOPS = [
  // Connaught Place Hub
  { id: 'shop-1a', name: 'Cafe Coffee Day', location: [28.6320, 77.2172], stationId: 'sta-1' },
  { id: 'shop-1b', name: 'Book World', location: [28.6310, 77.2160], stationId: 'sta-1' },
  { id: 'shop-1c', name: 'Quick Bites', location: [28.6318, 77.2155], stationId: 'sta-1' },
  // Nehru Place Station
  { id: 'shop-2a', name: 'Tech Bazaar', location: [28.5499, 77.2506], stationId: 'sta-2' },
  { id: 'shop-2b', name: 'Juice Junction', location: [28.5489, 77.2496], stationId: 'sta-2' },
  { id: 'shop-2c', name: 'Veggie Delight', location: [28.5492, 77.2510], stationId: 'sta-2' },
  // Dwarka Power Grid
  { id: 'shop-3a', name: 'Dwarka Mart', location: [28.5926, 77.0465], stationId: 'sta-3' },
  { id: 'shop-3b', name: 'Snack Point', location: [28.5916, 77.0455], stationId: 'sta-3' },
  { id: 'shop-3c', name: 'Fresh Fruits', location: [28.5923, 77.0450], stationId: 'sta-3' },
  // Noida Eco-Link
  { id: 'shop-4a', name: 'Eco Cafe', location: [28.5350, 77.3915], stationId: 'sta-4' },
  { id: 'shop-4b', name: 'Noida Books', location: [28.5360, 77.3905], stationId: 'sta-4' },
  { id: 'shop-4c', name: 'Green Grocer', location: [28.5358, 77.3920], stationId: 'sta-4' },
];

export const START_POINT: LatLng = [28.6000, 77.2300]; // Starting position for car
