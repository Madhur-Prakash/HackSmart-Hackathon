
import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { Bot, Clock, CheckCircle2 } from 'lucide-react';

interface EventLogProps {
  logs: LogEntry[];
  theme: 'modern' | 'tactical';
  isSimulating: boolean;
}

const EventLog: React.FC<EventLogProps> = ({ logs, theme, isSimulating }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isTactical = theme === 'tactical';
  const isFinished = logs.some(l => l.type === 'success' && l.message.includes('reached'));

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="absolute bottom-[200px] right-12 z-[1000] w-80 h-[480px] flex flex-col">
      <div className={`
        frosted-glass rounded-[3rem] overflow-hidden flex flex-col h-full transition-all duration-700
        ${isTactical ? 'text-white' : 'text-slate-900 border-white shadow-2xl'}
      `}>
        <div className={`px-10 py-6 border-b flex items-center justify-between ${isTactical ? 'border-white/10' : 'border-blue-100/50 bg-blue-50/20'}`}>
          <h3 className={`text-[11px] font-black uppercase tracking-[0.4em] ${isTactical ? 'opacity-60' : 'text-blue-700/50'} flex items-center gap-3`}>
            <Clock className="w-4 h-4" strokeWidth={3} />
            NODE FEED
          </h3>
          <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${
            isSimulating 
              ? (isTactical ? 'bg-[#30D158]/20 text-[#30D158] border border-[#30D158]/40 animate-pulse' : 'bg-green-100 text-green-700 border border-green-200')
              : (isFinished ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400')
          }`}>
            {isSimulating ? 'LIVE' : (isFinished ? 'STATION' : 'STANDBY')}
          </span>
        </div>
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
          {logs.length === 0 ? (
            <div className={`h-full flex items-center justify-center uppercase font-black text-[10px] text-center tracking-[0.4em] leading-relaxed px-10 ${isTactical ? 'opacity-20' : 'text-blue-900/20'}`}>
              System Offline...
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="animate-in fade-in slide-in-from-bottom-2 duration-700">
                <div className="flex gap-5">
                  <div className={`mt-2.5 w-3 h-3 rounded-full flex-shrink-0 transition-all duration-500 ${
                    log.type === 'error' ? 'bg-[#FF453A] shadow-[0_0_15px_#FF453A]' : 
                    log.type === 'warning' ? 'bg-[#FF9F0A] shadow-[0_0_15px_#FF9F0A]' : 
                    log.type === 'success' ? 'bg-[#30D158] shadow-[0_0_20px_#30D158]' : 'bg-[#0A84FF] shadow-[0_0_15px_#0A84FF]'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] leading-relaxed font-bold tracking-tight ${!isTactical ? 'text-slate-800' : ''}`}>
                      {log.message}
                    </p>
                    <span className="text-[9px] font-black opacity-30 mt-2 block">
                      {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>
                
                {log.aiNarration && (
                  <div className={`mt-6 ml-8 p-6 rounded-[2.5rem] border transition-all duration-500 ${isTactical ? 'border-white/10 bg-white/5' : 'border-white bg-blue-50/60 shadow-inner'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Bot className={`w-4 h-4 ${isTactical ? 'text-[#0A84FF]' : 'text-[#007AFF]'}`} strokeWidth={3} />
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isTactical ? 'text-[#0A84FF]' : 'text-[#007AFF]'}`}>AI ANALYST</span>
                    </div>
                    <p className={`text-[11px] font-medium leading-relaxed italic ${isTactical ? 'opacity-80' : 'text-blue-900/70'}`}>
                      "{log.aiNarration}"
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
          
          {isFinished && (
            <div className={`mt-10 p-6 rounded-[2rem] text-center animate-in zoom-in duration-1000 ${isTactical ? 'bg-[#30D158]/10 text-[#30D158]' : 'bg-green-50 text-green-700 border border-green-100 shadow-sm'}`}>
              <CheckCircle2 className="w-8 h-8 mx-auto mb-4" />
              <p className="text-xs font-black uppercase tracking-[0.2em]">Mission Complete</p>
              <p className="text-[10px] opacity-60 mt-1">Protocols successfully finalized.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventLog;
