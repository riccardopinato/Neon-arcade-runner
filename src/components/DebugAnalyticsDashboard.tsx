import React, { useState, useEffect } from 'react';
import { UserState } from '../types';
import { AnalyticsService } from '../systems/AnalyticsService';
import { BalanceConfig, BalanceConfigType } from '../systems/BalanceConfig';
import { EconomyMonitor } from '../systems/EconomyMonitor';
import { SHIPS } from '../data';
import { 
  BarChart3, 
  AlertTriangle, 
  Sliders, 
  RefreshCw, 
  CheckCircle2, 
  HelpCircle, 
  Flame, 
  TrendingUp, 
  Database,
  Eye,
  Trash2
} from 'lucide-react';

interface DebugAnalyticsDashboardProps {
  userState: UserState;
  onResetProgress: () => void;
  onAddGems: () => void;
  onClose?: () => void;
}

export const DebugAnalyticsDashboard: React.FC<DebugAnalyticsDashboardProps> = ({
  userState,
  onResetProgress,
  onAddGems,
  onClose
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'economy' | 'config'>('analytics');
  
  // Real-time config editor state
  const [localConfig, setLocalConfig] = useState<BalanceConfigType>(() => JSON.parse(JSON.stringify(BalanceConfig.getConfig())));
  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors: string[] }>({ valid: true, errors: [] });
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Analytics stats
  const [stats, setStats] = useState<any>(null);
  // Economy report
  const [economyReport, setEconomyReport] = useState<any>(null);
  // Detected anomalies
  const [anomalies, setAnomalies] = useState<any[]>([]);

  const loadData = () => {
    // Analytics Service summary
    const allEvents = AnalyticsService.getLocalProvider().getEvents();
    const totalSessions = allEvents.filter(e => e.eventName === 'session_start').length;
    const runsStarted = allEvents.filter(e => e.eventName === 'run_started');
    const runsCompleted = allEvents.filter(e => e.eventName === 'run_completed');
    
    // Average run duration
    let totalDuration = 0;
    runsCompleted.forEach(e => {
      totalDuration += e.eventProperties?.run_duration || 0;
    });
    const avgDuration = runsCompleted.length > 0 ? Math.round(totalDuration / runsCompleted.length) : 0;

    // Ship usage
    const shipUsage: Record<string, number> = {};
    runsStarted.forEach(e => {
      const ship = e.eventProperties?.selected_ship || 'unknown';
      shipUsage[ship] = (shipUsage[ship] || 0) + 1;
    });

    // Death causes
    const deathCauses: Record<string, number> = {};
    runsCompleted.forEach(e => {
      const cause = e.eventProperties?.cause_of_death || 'crash';
      deathCauses[cause] = (deathCauses[cause] || 0) + 1;
    });

    // Rewarded Ads watched
    const adsWatched = allEvents.filter(e => e.eventName === 'rewarded_ad_completed' || e.eventProperties?.rewarded_revive_used);
    
    setStats({
      totalSessions,
      runsStartedCount: runsStarted.length,
      runsCompletedCount: runsCompleted.length,
      avgDuration,
      shipUsage,
      deathCauses,
      adsWatchedCount: adsWatched.length,
      rawEventsCount: allEvents.length,
      events: allEvents.slice().reverse() // Show newest first
    });

    // Economy Report
    const report = EconomyMonitor.generateReport();
    setEconomyReport(report);

    // Anomalies
    const detected = EconomyMonitor.detectAnomalies(userState);
    setAnomalies(detected);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000); // refresh every 3s
    return () => clearInterval(interval);
  }, [userState]);

  const handleConfigChange = (category: keyof BalanceConfigType, key: string, value: any) => {
    setLocalConfig(prev => {
      const updated = { ...prev };
      (updated[category] as any)[key] = Number(value);
      return updated;
    });
    setSaveSuccess(false);
  };

  const handleApplyConfig = () => {
    BalanceConfig.updateConfig(localConfig);
    const result = BalanceConfig.validate();
    setValidationResult(result);
    setSaveSuccess(result.valid);
    
    // Refresh local values after validation changes (in case validation fell back to default)
    setLocalConfig(JSON.parse(JSON.stringify(BalanceConfig.getConfig())));
    loadData();
  };

  const handleClearAnalytics = () => {
    AnalyticsService.clearAnalyticsData();
    loadData();
    alert('Local telemetry storage cleared.');
  };

  return (
    <div id="debug-analytics-dashboard" className="p-6 rounded-2xl border border-blue-900/40 bg-zinc-950/80 backdrop-blur-md space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20 text-xl">
            🛠️
          </span>
          <div>
            <h2 className="text-xl font-black text-white tracking-wider flex items-center gap-2">
              NEON LIVE DEVELOPMENT DASHBOARD
              <span className="text-[10px] font-mono bg-blue-500/20 text-blue-400 px-2.5 py-0.5 rounded uppercase">DEV MODE</span>
            </h2>
            <p className="text-xs text-gray-400 font-medium">Monitoraggio in tempo reale di telemetria locale, bilanciamento, economia e rilevamento anomalie.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={loadData}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 rounded-xl text-zinc-400 hover:text-white transition-all"
            title="Aggiorna Dati"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 text-xs font-bold rounded-xl text-zinc-400 hover:text-white transition-all"
            >
              Chiudi
            </button>
          )}
        </div>
      </div>

      {/* Mini control cheats for easy testing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border border-zinc-900 bg-zinc-950/50">
        <div className="space-y-1">
          <span className="text-[10px] uppercase text-zinc-500 font-black">Azioni Sviluppatore</span>
          <div className="flex gap-2">
            <button 
              onClick={onAddGems} 
              className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-black transition-all"
            >
              +250 Gemme Cheat 💎
            </button>
            <button 
              onClick={onResetProgress} 
              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/20 rounded-lg text-rose-400 text-xs font-black transition-all"
            >
              Reset Profilo ⚠️
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] uppercase text-zinc-500 font-black">Simulazione Economica</span>
          <div className="flex gap-2 text-xs">
            <span className="text-gray-400 font-medium">Gemme: <b className="text-pink-400 font-black">{userState.gems} 💎</b></span>
            <span className="text-gray-400 font-medium">VIP Pass: <b className="text-yellow-400 font-black">{userState.isPremium ? 'Sì' : 'No'} 👑</b></span>
          </div>
        </div>

        <div className="space-y-1 text-right sm:text-left">
          <span className="text-[10px] uppercase text-zinc-500 font-black">Stato Telemetria LocalStorage</span>
          <div className="flex gap-2 justify-end sm:justify-start">
            <button 
              onClick={handleClearAnalytics}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white text-xs font-semibold flex items-center gap-1 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> Cancella Telemetria
            </button>
          </div>
        </div>
      </div>

      {/* Tab select menu */}
      <div className="flex border-b border-zinc-900 gap-2">
        <button 
          onClick={() => setActiveSubTab('analytics')}
          className={`px-4 py-2 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'analytics' 
              ? 'border-blue-500 text-blue-400 bg-blue-500/5' 
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Telemetria & Analytics
        </button>
        <button 
          onClick={() => setActiveSubTab('economy')}
          className={`px-4 py-2 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'economy' 
              ? 'border-pink-500 text-pink-400 bg-pink-500/5' 
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" /> Economy Monitoring & Anomaly Detect
        </button>
        <button 
          onClick={() => setActiveSubTab('config')}
          className={`px-4 py-2 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'config' 
              ? 'border-yellow-500 text-yellow-400 bg-yellow-500/5' 
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" /> Bilanciamento (BalanceConfig)
        </button>
      </div>

      {/* Sub-tab: ANALYTICS */}
      {activeSubTab === 'analytics' && stats && (
        <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
          {/* Key Metric Blocks */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/10">
              <span className="text-[10px] text-zinc-500 uppercase font-black block">Sessioni Totali</span>
              <span className="text-2xl font-black text-white">{stats.totalSessions}</span>
            </div>
            <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/10">
              <span className="text-[10px] text-zinc-500 uppercase font-black block">Voli Iniziati</span>
              <span className="text-2xl font-black text-blue-400">{stats.runsStartedCount}</span>
            </div>
            <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/10">
              <span className="text-[10px] text-zinc-500 uppercase font-black block">Voli Completati</span>
              <span className="text-2xl font-black text-emerald-400">{stats.runsCompletedCount}</span>
            </div>
            <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/10">
              <span className="text-[10px] text-zinc-500 uppercase font-black block">Durata Media Run</span>
              <span className="text-2xl font-black text-purple-400">{stats.avgDuration}s</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Preferred Ships Charts/Usage */}
            <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/20 space-y-3">
              <h3 className="text-xs font-bold uppercase text-white border-b border-zinc-900 pb-2 flex items-center gap-2">
                🛸 Preferenza Astronavi (Voli)
              </h3>
              {Object.keys(stats.shipUsage).length === 0 ? (
                <p className="text-xs text-zinc-500">Nessun dato registrato. Avvia una run per popolare la telemetria.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(stats.shipUsage).map(([ship, count]: [string, any]) => {
                    const pct = Math.round((count / stats.runsStartedCount) * 100);
                    const sName = SHIPS.find(s => s.id === ship)?.name || ship;
                    return (
                      <div key={ship} className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span className="font-semibold text-zinc-300">{sName}</span>
                          <span>{count} voli ({pct}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Death Zone Analysis */}
            <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/20 space-y-3">
              <h3 className="text-xs font-bold uppercase text-white border-b border-zinc-900 pb-2 flex items-center gap-2">
                💥 Analisi della Causa di Fine Volo
              </h3>
              {Object.keys(stats.deathCauses).length === 0 ? (
                <p className="text-xs text-zinc-500">Nessun dato di fine volo registrato.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(stats.deathCauses).map(([cause, count]: [string, any]) => {
                    const pct = Math.round((count / stats.runsCompletedCount) * 100);
                    return (
                      <div key={cause} className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span className="font-semibold text-zinc-300 uppercase font-mono">{cause}</span>
                          <span>{count} volte ({pct}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Real-time telemetry logs */}
          <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/20 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <h3 className="text-xs font-bold uppercase text-white">
                ⏱️ Log Eventi in Tempo Reale ({stats.rawEventsCount} eventi totali)
              </h3>
              <span className="text-[10px] font-mono text-zinc-500 animate-pulse">Aggiornato in tempo reale</span>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 font-mono text-[10px]">
              {stats.events.length === 0 ? (
                <p className="text-xs text-zinc-500 italic p-4 text-center">Nessun evento telemetrico catturato finora.</p>
              ) : (
                stats.events.map((evt: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded bg-zinc-950 border border-zinc-900 flex justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-400 font-extrabold uppercase">{evt.eventName}</span>
                        <span className="text-zinc-600 text-[9px]">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <pre className="text-zinc-400 whitespace-pre-wrap leading-normal font-mono text-[9px]">
                        {JSON.stringify(evt.eventProperties || {}, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab: ECONOMY REPORT */}
      {activeSubTab === 'economy' && economyReport && (
        <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
          
          {/* Anomaly banner block if any */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase text-white">⚠️ RILEVATORE ANOMALIE & SOSPENSIONI</h3>
            {anomalies.length === 0 ? (
              <div className="p-4 border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-400 rounded-xl flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span><b>ECONOMIA SANA:</b> Nessun comportamento sospetto, accumulo anomalo o ad fatigue rilevato per questo profilo.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {anomalies.map((an, idx) => (
                  <div key={idx} className="p-4 border border-rose-500/20 bg-rose-500/5 text-xs text-rose-400 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
                    <div>
                      <span className="font-extrabold uppercase text-[10px] bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 block w-fit mb-1">
                        ANOMALIA: {an.type}
                      </span>
                      <p className="text-zinc-300 font-medium leading-relaxed">{an.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Economy Sources (Fonti) */}
            <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/20 space-y-3">
              <h3 className="text-xs font-bold uppercase text-white border-b border-zinc-900 pb-2 flex items-center justify-between">
                <span>📥 Fonti di Gemme (Credits)</span>
                <span className="text-[10px] font-mono text-zinc-500">Totale: {economyReport.sourcesTotal} 💎</span>
              </h3>
              {Object.keys(economyReport.sources).length === 0 ? (
                <p className="text-xs text-zinc-500">Nessuna transazione registrata.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(economyReport.sources).map(([source, count]: [string, any]) => {
                    const pct = economyReport.sourcesTotal > 0 ? Math.round((count / economyReport.sourcesTotal) * 100) : 0;
                    return (
                      <div key={source} className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span className="font-semibold text-zinc-300 font-mono text-[10px]">{source.toUpperCase()}</span>
                          <span>+{count} 💎 ({pct}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Economy Sinks (Spese/Consumi) */}
            <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/20 space-y-3">
              <h3 className="text-xs font-bold uppercase text-white border-b border-zinc-900 pb-2 flex items-center justify-between">
                <span>📤 Spese / Consumi di Gemme (Sinks)</span>
                <span className="text-[10px] font-mono text-zinc-500">Totale: {economyReport.sinksTotal} 💎</span>
              </h3>
              {Object.keys(economyReport.sinks).length === 0 ? (
                <p className="text-xs text-zinc-500">Nessuna spesa registrata.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(economyReport.sinks).map(([sink, count]: [string, any]) => {
                    const pct = economyReport.sinksTotal > 0 ? Math.round((count / economyReport.sinksTotal) * 100) : 0;
                    return (
                      <div key={sink} className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span className="font-semibold text-zinc-300 font-mono text-[10px]">{sink.toUpperCase()}</span>
                          <span>-{count} 💎 ({pct}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Net balance report card */}
          <div className="p-5 rounded-xl border border-zinc-900 bg-zinc-950 space-y-2">
            <h4 className="text-xs font-extrabold uppercase text-white">RELAZIONE DI FLUSSO ECONOMICO</h4>
            <div className="grid grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3 bg-zinc-900 rounded-lg">
                <span className="text-[10px] text-zinc-500 block">Totale Entrate</span>
                <span className="text-base text-emerald-400 font-extrabold">+{economyReport.sourcesTotal} 💎</span>
              </div>
              <div className="p-3 bg-zinc-900 rounded-lg">
                <span className="text-[10px] text-zinc-500 block">Totale Uscite</span>
                <span className="text-base text-rose-400 font-extrabold">-{economyReport.sinksTotal} 💎</span>
              </div>
              <div className="p-3 bg-zinc-900 rounded-lg">
                <span className="text-[10px] text-zinc-500 block">Saldo Netto Calcolato</span>
                <span className={`text-base font-extrabold ${economyReport.netGems >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {economyReport.netGems >= 0 ? '+' : ''}{economyReport.netGems} 💎
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab: CONFIG EDITOR */}
      {activeSubTab === 'config' && (
        <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
          <div className="p-4 border border-yellow-500/20 bg-yellow-500/5 text-xs text-yellow-400 rounded-xl leading-relaxed">
            💡 <b>MODIFICA DINAMICA DI BILANCIAMENTO:</b> Puoi regolare qualsiasi parametro di gioco e dell'economia in tempo reale. I cambiamenti avranno effetto immediato sulle prossime partite e simulazioni.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Category: GAMEPLAY */}
            <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/20 space-y-4">
              <h3 className="text-xs font-black uppercase text-white border-b border-zinc-900 pb-2 flex items-center gap-1.5">
                ⚡ Gameplay & Difficoltà
              </h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400 block flex justify-between">
                    <span>Velocità Iniziale Meteoriti:</span>
                    <b className="text-white font-mono">{localConfig.gameplay.initialMeteorSpeed}</b>
                  </label>
                  <input 
                    type="range" min="1" max="10" step="0.5" 
                    value={localConfig.gameplay.initialMeteorSpeed}
                    onChange={(e) => handleConfigChange('gameplay', 'initialMeteorSpeed', e.target.value)}
                    className="w-full accent-yellow-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400 block flex justify-between">
                    <span>Vite Iniziali del Pilota:</span>
                    <b className="text-white font-mono">{localConfig.gameplay.initialHP} ❤️</b>
                  </label>
                  <input 
                    type="range" min="1" max="5" step="1" 
                    value={localConfig.gameplay.initialHP}
                    onChange={(e) => handleConfigChange('gameplay', 'initialHP', e.target.value)}
                    className="w-full accent-yellow-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400 block flex justify-between">
                    <span>Frequenza Spawn Meteoriti (ms):</span>
                    <b className="text-white font-mono">{localConfig.gameplay.spawnFrequency}ms</b>
                  </label>
                  <input 
                    type="range" min="200" max="3000" step="100" 
                    value={localConfig.gameplay.spawnFrequency}
                    onChange={(e) => handleConfigChange('gameplay', 'spawnFrequency', e.target.value)}
                    className="w-full accent-yellow-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400 block flex justify-between">
                    <span>Frequenza Spawn Boss (Metri):</span>
                    <b className="text-white font-mono">{localConfig.gameplay.bossFrequency}m</b>
                  </label>
                  <input 
                    type="range" min="500" max="5000" step="250" 
                    value={localConfig.gameplay.bossFrequency}
                    onChange={(e) => handleConfigChange('gameplay', 'bossFrequency', e.target.value)}
                    className="w-full accent-yellow-500"
                  />
                </div>
              </div>
            </div>

            {/* Category: ECONOMY */}
            <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/20 space-y-4">
              <h3 className="text-xs font-black uppercase text-white border-b border-zinc-900 pb-2 flex items-center gap-1.5">
                💰 Economia & Ricompense
              </h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400 block flex justify-between">
                    <span>Moltiplicatore Premio Premium/VIP:</span>
                    <b className="text-white font-mono">{localConfig.economy.premiumMultiplier}x</b>
                  </label>
                  <input 
                    type="range" min="1.1" max="4.0" step="0.1" 
                    value={localConfig.economy.premiumMultiplier}
                    onChange={(e) => handleConfigChange('economy', 'premiumMultiplier', e.target.value)}
                    className="w-full accent-yellow-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400 block flex justify-between">
                    <span>Premio Base Gemme per Volo:</span>
                    <b className="text-white font-mono">{localConfig.economy.baseGemsPerRun} 💎</b>
                  </label>
                  <input 
                    type="range" min="0" max="100" step="5" 
                    value={localConfig.economy.baseGemsPerRun}
                    onChange={(e) => handleConfigChange('economy', 'baseGemsPerRun', e.target.value)}
                    className="w-full accent-yellow-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400 block flex justify-between">
                    <span>Frammenti Richiesti Sblocco (Craft):</span>
                    <b className="text-white font-mono">{localConfig.economy.requiredFragmentsToCraft} 🛸</b>
                  </label>
                  <input 
                    type="range" min="3" max="25" step="1" 
                    value={localConfig.economy.requiredFragmentsToCraft}
                    onChange={(e) => handleConfigChange('economy', 'requiredFragmentsToCraft', e.target.value)}
                    className="w-full accent-yellow-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400 block flex justify-between">
                    <span>Giri Ruota Massimi Giornalieri:</span>
                    <b className="text-white font-mono">{localConfig.retention.maxDailySpins} spins</b>
                  </label>
                  <input 
                    type="range" min="1" max="10" step="1" 
                    value={localConfig.retention.maxDailySpins}
                    onChange={(e) => handleConfigChange('retention', 'maxDailySpins', e.target.value)}
                    className="w-full accent-yellow-500"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Validation & Save buttons */}
          <div className="pt-4 border-t border-zinc-900 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-left">
              {saveSuccess ? (
                <span className="text-xs text-emerald-400 font-extrabold flex items-center gap-1.5 uppercase">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Configurazione applicata e validata con successo!
                </span>
              ) : validationResult.errors.length > 0 ? (
                <div className="space-y-1">
                  <span className="text-xs text-rose-400 font-black flex items-center gap-1 uppercase">
                    <AlertTriangle className="w-4 h-4 text-rose-400" /> Correzione di Sicurezza Applicata:
                  </span>
                  <ul className="list-disc pl-5 text-[10px] text-zinc-400 leading-normal">
                    {validationResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              ) : (
                <span className="text-xs text-gray-500">
                  Modifica i parametri sovrastanti per alterare l'esperienza di simulazione Neon Live.
                </span>
              )}
            </div>

            <button 
              onClick={handleApplyConfig}
              className="px-8 py-3.5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-yellow-500/20 active:scale-95 transition-all"
            >
              Applica e Valida Modifiche ⚙️
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
