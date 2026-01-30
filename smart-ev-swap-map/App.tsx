
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Polyline, 
  useMap 
} from 'react-leaflet';
import L from 'leaflet';
import { 
  ScenarioId, 
  SimulationState, 
  LogEntry, 
  LatLng, 
  SwapStation 
} from './types';
import { 
  INITIAL_CENTER, 
  SWAP_STATIONS, 
  START_POINT 
} from './constants';
import { getRoute } from './services/routingService';
import { getEventNarration } from './services/geminiService';
import SimulationControls from './components/SimulationControls';
import EventLog from './components/EventLog';
import { Navigation, Fuel, Moon, Sun, Cpu, Play, Pause, RotateCw } from 'lucide-react';

type Theme = 'modern' | 'tactical';

const carIcon = (theme: Theme) => L.divIcon({
  html: `
    <div class="relative w-14 h-14 flex items-center justify-center ${theme === 'tactical' ? 'bg-[#0A84FF]' : 'bg-[#007AFF]'} rounded-full shadow-[0_0_25px_rgba(10,132,255,0.6)] border-2 border-white/90 backdrop-blur-xl group transition-all duration-700">
      <div class="absolute inset-0 bg-white/10 rounded-full animate-ping opacity-20"></div>
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
    </div>
  `,
  className: '',
  iconSize: [56, 56],
  iconAnchor: [28, 28],
});

const stationIcon = (status: string, theme: Theme) => {
  let bgColor = theme === 'tactical' ? 'bg-[#2C2C2E]/95 border-white/20' : 'bg-white/80 border-white shadow-lg';
  let iconColor = theme === 'tactical' ? '#0A84FF' : '#007AFF';
  let pulseClass = '';
  
  if (status === 'busy') {
    bgColor = theme === 'tactical' ? 'bg-[#FF9F0A]/20 border-[#FF9F0A]/50' : 'bg-amber-50/70 border-amber-300 shadow-md';
    iconColor = '#FF9F0A';
  } else if (status === 'fault') {
    bgColor = theme === 'tactical' ? 'bg-[#FF453A]/20 border-[#FF453A]/50' : 'bg-rose-50/70 border-rose-300 shadow-md';
    iconColor = '#FF453A';
    pulseClass = 'marker-pulse-red';
  }

  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center w-11 h-11 ${bgColor} ${pulseClass} border rounded-full group transition-all duration-500 backdrop-blur-xl">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2v3"/><path d="m19 11-3-3"/><path d="M13 22v-3"/><path d="m5 11 3-3"/><path d="M5 18H3c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v11c0 1.1-.9 2-2 2h-2"/><path d="M9 12c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2Z"/><path d="M12 18H6a2 2 0 0 1-2-2V6c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v10a2 2 0 0 1-2 2h-2"/></svg>
      </div>
    `,
    className: '',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
};

const MapUpdater: React.FC<{ center: LatLng }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.panTo(center, { animate: true, duration: 0.15 });
  }, [center, map]);
  return null;
};

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('tactical');
  const [state, setState] = useState<SimulationState & { isPaused: boolean; currentStep: number }>({
    currentScenario: null,
    carPosition: START_POINT,
    targetStationId: null,
    route: [],
    isSimulating: false,
    isPaused: false,
    currentStep: 0,
    logs: [],
    progress: 0,
  });

  const [stations, setStations] = useState<SwapStation[]>(SWAP_STATIONS);
  const simTimerRef = useRef<number | null>(null);

  const toggleTheme = () => {
    setTheme(prev => prev === 'tactical' ? 'modern' : 'tactical');
  };

  const addLog = useCallback(async (message: string, type: LogEntry['type'] = 'info', useAi: boolean = false) => {
    let narration = undefined;
    if (useAi) {
      const contextStr = "High-end Autonomous EV dashboard. Informative and smooth.";
      narration = await getEventNarration(message, contextStr);
    }

    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      message,
      type,
      aiNarration: narration,
    };
    setState(prev => ({ ...prev, logs: [...prev.logs, newLog] }));
  }, []);

  const handleReset = useCallback(() => {
    if (simTimerRef.current) clearInterval(simTimerRef.current);
    setState(prev => ({
      ...prev,
      currentScenario: null,
      carPosition: START_POINT,
      targetStationId: null,
      route: [],
      isSimulating: false,
      isPaused: false,
      currentStep: 0,
      logs: [],
      progress: 0,
    }));
    setStations(SWAP_STATIONS);
  }, []);

  const runSimulationStep = useCallback((route: LatLng[], scenario: ScenarioId, startIndex: number = 0) => {
    let step = startIndex;
    const totalSteps = route.length;
    if (simTimerRef.current) clearInterval(simTimerRef.current);

    simTimerRef.current = window.setInterval(async () => {
      if (step >= totalSteps - 1) {
        if (simTimerRef.current) clearInterval(simTimerRef.current);
        setState(prev => ({ ...prev, isSimulating: false, progress: 100, carPosition: route[totalSteps - 1], currentStep: step }));
        addLog("ARRIVAL: Final destination reached. Locking safety protocols and initiating rapid swap.", "success", true);
        return;
      }

      const currentPos = route[step];
      const progressPercent = (step / totalSteps) * 100;

      setState(prev => ({ 
        ...prev, 
        carPosition: currentPos,
        progress: progressPercent,
        currentStep: step
      }));

      // Trigger Rerouting
      if (scenario === ScenarioId.STATION_CONGESTION && step === Math.floor(totalSteps * 0.4)) {
        clearInterval(simTimerRef.current!);
        addLog("ADVISORY: Hub overcrowding detected. Re-routing to secondary optimal station...", "warning", true);
        const nextStation = stations[1]; 
        const newRouteData = await getRoute(currentPos, nextStation.location);
        setState(prev => ({ ...prev, targetStationId: nextStation.id, route: newRouteData.coordinates }));
        runSimulationStep(newRouteData.coordinates, scenario, 0);
        return;
      }

      if (scenario === ScenarioId.STATION_FAULT && step === Math.floor(totalSteps * 0.6)) {
        clearInterval(simTimerRef.current!);
        addLog("ALERT: Destination offline due to sudden power surge. Diverting to backup terminal...", "error", true);
        setStations(prev => prev.map(s => s.id === 'sta-1' ? { ...s, status: 'fault' } : s));
        const fallback = stations[2];
        const newRouteData = await getRoute(currentPos, fallback.location);
        setState(prev => ({ ...prev, targetStationId: fallback.id, route: newRouteData.coordinates }));
        runSimulationStep(newRouteData.coordinates, scenario, 0);
        return;
      }

      step++;
    }, 150);
  }, [addLog, stations]);

  const togglePause = () => {
    if (state.isPaused) {
      setState(prev => ({ ...prev, isPaused: false, isSimulating: true }));
      runSimulationStep(state.route, state.currentScenario!, state.currentStep);
    } else {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
      setState(prev => ({ ...prev, isPaused: true, isSimulating: false }));
      addLog("System Paused. Current position maintained.", "info");
    }
  };

  const restartScenario = () => {
    if (state.currentScenario) {
      startScenario(state.currentScenario);
    }
  };

  const startScenario = async (id: ScenarioId) => {
    handleReset();
    const target = stations[0];
    addLog(`INITIALIZING: Autonomous Profile [${id}] active. Calculating optimal trajectory...`, "info", true);
    const routeData = await getRoute(START_POINT, target.location);
    setState(prev => ({
      ...prev,
      currentScenario: id,
      isSimulating: true,
      isPaused: false,
      targetStationId: target.id,
      route: routeData.coordinates,
      carPosition: START_POINT,
      currentStep: 0,
    }));
    runSimulationStep(routeData.coordinates, id);
  };

  return (
    <div className={`fixed inset-0 w-screen h-screen transition-all duration-700 ${theme === 'tactical' ? 'bg-[#1c1c1e] theme-tactical' : 'bg-[#F2F2F7] theme-modern'}`}>
      
      {/* HUD HEADER */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
        <div className={`
          frosted-glass px-12 py-6 rounded-full flex items-center gap-12 transition-all duration-700 pointer-events-auto
          ${theme === 'modern' ? 'text-slate-900 border-white shadow-xl' : 'text-white border-white/10'}
        `}>
          <div className="flex items-center gap-4">
            <button 
              onClick={togglePause}
              disabled={!state.isSimulating && !state.isPaused}
              className={`p-4 rounded-full border transition-all duration-300 disabled:opacity-20 ${theme === 'modern' ? 'bg-white border-slate-200 text-blue-600' : 'bg-white/5 border-white/10 text-blue-400'}`}
              title={state.isPaused ? "Resume" : "Pause"}
            >
              {state.isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
            </button>
            <button 
              onClick={restartScenario}
              disabled={!state.currentScenario}
              className={`p-4 rounded-full border transition-all duration-300 disabled:opacity-20 ${theme === 'modern' ? 'bg-white border-slate-200 text-slate-600' : 'bg-white/5 border-white/10 text-slate-400'}`}
              title="Restart Scenario"
            >
              <RotateCw className="w-5 h-5" />
            </button>
          </div>

          <div className={`flex items-center gap-5 border-x ${theme === 'modern' ? 'border-blue-100' : 'border-white/10'} px-12`}>
            <div className={`p-4 rounded-full ${theme === 'tactical' ? 'bg-[#0A84FF] shadow-[0_0_15px_#0A84FF]' : 'bg-[#007AFF] shadow-lg shadow-blue-200'} text-white`}>
              <Navigation className="w-6 h-6 animate-pulse" strokeWidth={3} />
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${theme === 'modern' ? 'text-blue-600/60' : 'opacity-40'}`}>System Node</p>
              <p className="text-lg font-bold tracking-tight">OS-X NAVIGATOR</p>
            </div>
          </div>
          
          <div className="flex items-center gap-10">
            <button 
              onClick={toggleTheme}
              className={`p-4 rounded-full border transition-all duration-500 hover:scale-110 active:scale-95 ${theme === 'tactical' ? 'bg-white/5 text-[#FFD60A] border-white/5' : 'bg-white/80 text-blue-500 border-white shadow-sm'}`}
              title="Toggle Theme"
            >
              {theme === 'tactical' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <MapContainer center={INITIAL_CENTER} zoom={13} className="absolute inset-0 w-full h-full" zoomControl={false}>
        <TileLayer
          url={theme === 'tactical' 
            ? "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png" 
            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
          attribution='&copy; OpenStreetMap'
        />
        <MapUpdater center={state.carPosition} />
        {stations.map((station) => (
          <Marker key={station.id} position={station.location} icon={stationIcon(station.status, theme)}>
            <Popup>
              <div className="font-bold text-sm text-slate-800 tracking-tight">{station.name}</div>
            </Popup>
          </Marker>
        ))}
        <Marker position={state.carPosition} icon={carIcon(theme)} />
        {state.route.length > 0 && (
          <Polyline 
            positions={state.route} 
            pathOptions={{ 
              color: theme === 'tactical' ? '#0A84FF' : '#007AFF', 
              weight: 8, 
              opacity: 0.8,
            }} 
          />
        )}
      </MapContainer>

      <SimulationControls 
        onStartScenario={startScenario} 
        onReset={handleReset} 
        activeScenario={state.currentScenario}
        isSimulating={state.isSimulating}
        theme={theme}
      />
      
      <EventLog logs={state.logs} theme={theme} isSimulating={state.isSimulating} />

      <div className="absolute bottom-12 right-12 z-[1000] w-96">
        <div className={`
          frosted-glass p-8 rounded-[3rem] transition-all duration-700 border
          ${theme === 'modern' ? 'text-slate-900 border-white shadow-xl' : 'text-white border-white/10'}
        `}>
          <div className="flex items-center gap-6">
             <div className={`w-16 h-16 rounded-full flex items-center justify-center ${theme === 'tactical' ? 'bg-white/5 text-[#0A84FF]' : 'bg-blue-50 text-[#007AFF] shadow-inner shadow-blue-100/50'}`}>
                <Fuel className="w-8 h-8" strokeWidth={3} />
             </div>
             <div className="flex-1 overflow-hidden">
                <p className={`text-[11px] font-black uppercase tracking-[0.4em] ${theme === 'modern' ? 'text-blue-600/50' : 'opacity-40'} mb-1`}>DESTINATION</p>
                <p className="text-base font-bold truncate uppercase tracking-tight">
                  {state.targetStationId ? stations.find(s => s.id === state.targetStationId)?.name : 'IDLE - STANDBY'}
                </p>
                <div className={`w-full h-2.5 rounded-full mt-4 ${theme === 'modern' ? 'bg-blue-100/30 ring-1 ring-white' : 'bg-black/40 ring-1 ring-white/5'} overflow-hidden`}>
                  <div className={`h-full rounded-full transition-all duration-1000 ${theme === 'tactical' ? 'bg-[#0A84FF] shadow-[0_0_10px_#0A84FF]' : 'bg-[#007AFF] shadow-[0_0_15px_rgba(0,122,255,0.4)]'}`} style={{ width: `${state.progress}%` }} />
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
