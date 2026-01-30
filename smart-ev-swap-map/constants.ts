
import { SwapStation, LatLng } from './types';

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

export const START_POINT: LatLng = [28.6000, 77.2300]; // Starting position for car
