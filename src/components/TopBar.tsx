import React from 'react';
import { useScada } from '../context/ScadaContext';
import { Activity, Bell, Shield, Radio, Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { UserRole } from '../types/scada';

export type ActiveTab = 'dashboard' | 'schematic' | 'alerts' | 'equipment' | 'rbac';

interface TopBarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ activeTab, setActiveTab }) => {
  const {
    currentRole,
    setCurrentRole,
    alerts,
    isStreaming,
    setIsStreaming,
    audioAlertsEnabled,
    setAudioAlertsEnabled,
  } = useScada();

  const activeAlertsCount = alerts.filter((a) => a.estado === 'ACTIVA').length;
  const criticalCount = alerts.filter((a) => a.estado === 'ACTIVA' && a.nivel === 'CRITICO').length;

  return (
    <header className="sticky top-0 z-40 bg-[#05080e]/95 backdrop-blur-md border-b border-[#1e293b] px-4 lg:px-6 py-2.5">
      {/* 1-Row 3-Zone Top Bar Contract */}
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Zone 1: Brand Zone (Single clean text element wordmark) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-2.5 h-2.5 rounded-none bg-[#00d2ff] glow-cyan group-hover:scale-125 transition-transform" />
            <span className="font-sans font-bold text-base tracking-tight text-white group-hover:text-[#00d2ff] transition-colors">
              TELEMETRY VOID SCADA
            </span>
          </button>
          <span className="hidden sm:inline text-xs text-[#859399] tracking-wider font-mono">
            ECOPETROL OILFIELDS
          </span>
        </div>

        {/* Zone 2: Navigation Links (Text with active hover indicators) */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-mono font-medium tracking-wide">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`transition-colors pb-0.5 border-b-2 ${
              activeTab === 'dashboard'
                ? 'text-[#00d2ff] border-[#00d2ff]'
                : 'text-[#859399] border-transparent hover:text-white'
            }`}
          >
            DASHBOARD EN VIVO
          </button>
          <button
            onClick={() => setActiveTab('schematic')}
            className={`transition-colors pb-0.5 border-b-2 ${
              activeTab === 'schematic'
                ? 'text-[#00d2ff] border-[#00d2ff]'
                : 'text-[#859399] border-transparent hover:text-white'
            }`}
          >
            ESQUEMA P&ID
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`relative transition-colors pb-0.5 border-b-2 ${
              activeTab === 'alerts'
                ? 'text-[#00d2ff] border-[#00d2ff]'
                : 'text-[#859399] border-transparent hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5">
              ALERTAS & EVENTOS
              {activeAlertsCount > 0 && (
                <span
                  className={`px-1 py-0.2 text-[10px] font-mono font-bold ${
                    criticalCount > 0
                      ? 'bg-[#ef4444] text-white glow-crimson'
                      : 'bg-[#f59e0b] text-black'
                  }`}
                >
                  {activeAlertsCount}
                </span>
              )}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('equipment')}
            className={`transition-colors pb-0.5 border-b-2 ${
              activeTab === 'equipment'
                ? 'text-[#00d2ff] border-[#00d2ff]'
                : 'text-[#859399] border-transparent hover:text-white'
            }`}
          >
            EQUIPOS & DETALLE
          </button>
          <button
            onClick={() => setActiveTab('rbac')}
            className={`transition-colors pb-0.5 border-b-2 ${
              activeTab === 'rbac'
                ? 'text-[#00d2ff] border-[#00d2ff]'
                : 'text-[#859399] border-transparent hover:text-white'
            }`}
          >
            RBAC & UMBRALES
          </button>
        </nav>

        {/* Zone 3: Primary Actions (Role Switcher & Stream Control) */}
        <div className="flex items-center gap-3">
          {/* Sound Mute/Unmute */}
          <button
            onClick={() => setAudioAlertsEnabled(!audioAlertsEnabled)}
            title={audioAlertsEnabled ? 'Silenciar alertas acústicas' : 'Activar alertas acústicas'}
            className="p-1.5 text-[#859399] hover:text-white bg-[#0a0f18] border border-[#1e293b] hover:border-[#334155] transition-colors"
          >
            {audioAlertsEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-[#00d2ff]" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-[#859399]" />
            )}
          </button>

          {/* Telemetry Stream Toggle */}
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            title={isStreaming ? 'Pausar ingesta de telemetría' : 'Reanudar ingesta en vivo'}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono border transition-all ${
              isStreaming
                ? 'bg-[#0a0f18] text-[#10b981] border-[#10b981]/40'
                : 'bg-[#111827] text-[#f59e0b] border-[#f59e0b]/40'
            }`}
          >
            {isStreaming ? (
              <>
                <Radio className="w-3 h-3 animate-pulse text-[#10b981]" />
                <span className="hidden sm:inline">INGESTA ACTIVA</span>
              </>
            ) : (
              <>
                <Pause className="w-3 h-3 text-[#f59e0b]" />
                <span className="hidden sm:inline">PAUSADO</span>
              </>
            )}
          </button>

          {/* RBAC Role Switcher */}
          <div className="flex items-center gap-1 bg-[#0a0f18] border border-[#1e293b] px-2 py-1">
            <Shield className="w-3.5 h-3.5 text-[#00d2ff]" />
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value as UserRole)}
              className="bg-transparent text-xs font-mono text-[#e0e2ec] focus:outline-none cursor-pointer"
            >
              <option value="ADMIN" className="bg-[#111827] text-white">
                ROL: ADMIN (Jefe de Planta)
              </option>
              <option value="OPERADOR" className="bg-[#111827] text-white">
                ROL: OPERADOR (Analista)
              </option>
              <option value="AUDITOR" className="bg-[#111827] text-white">
                ROL: AUDITOR (Solo Lectura)
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Mobile Nav Drawer Row */}
      <div className="flex md:hidden items-center justify-between pt-2 border-t border-[#1e293b] mt-2 text-[11px] font-mono text-[#859399]">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={activeTab === 'dashboard' ? 'text-[#00d2ff] font-bold' : ''}
        >
          DASHBOARD
        </button>
        <button
          onClick={() => setActiveTab('schematic')}
          className={activeTab === 'schematic' ? 'text-[#00d2ff] font-bold' : ''}
        >
          P&ID
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={activeTab === 'alerts' ? 'text-[#00d2ff] font-bold' : ''}
        >
          ALERTAS ({activeAlertsCount})
        </button>
        <button
          onClick={() => setActiveTab('equipment')}
          className={activeTab === 'equipment' ? 'text-[#00d2ff] font-bold' : ''}
        >
          EQUIPOS
        </button>
        <button
          onClick={() => setActiveTab('rbac')}
          className={activeTab === 'rbac' ? 'text-[#00d2ff] font-bold' : ''}
        >
          RBAC
        </button>
      </div>
    </header>
  );
};
