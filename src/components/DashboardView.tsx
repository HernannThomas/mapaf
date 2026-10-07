import React from 'react';
import { useScada } from '../context/ScadaContext';
import { Equipment } from '../types/scada';
import { SegmentedGauge } from './SegmentedGauge';
import {
  Activity,
  AlertTriangle,
  Radio,
  Search,
  Filter,
  ArrowUpRight,
  Sparkles,
  Zap,
  Gauge,
  Thermometer,
  RotateCcw,
  Sliders,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Clock,
} from 'lucide-react';

interface DashboardViewProps {
  onOpenEquipmentDetail: (eq: Equipment) => void;
  onNavigateToSchematic: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenEquipmentDetail,
  onNavigateToSchematic,
}) => {
  const {
    equipment,
    kpis,
    selectedField,
    setSelectedField,
    selectedType,
    setSelectedType,
    searchQuery,
    setSearchQuery,
    alerts,
    triggerAnomaly,
    lastAnomalyNotice,
    clearAnomalyNotice,
  } = useScada();

  const activeAlerts = alerts.filter((a) => a.estado === 'ACTIVA');
  const criticalAlerts = activeAlerts.filter((a) => a.nivel === 'CRITICO');

  // Filter equipment
  const filteredEquipment = equipment.filter((eq) => {
    if (selectedField !== 'TODOS' && eq.ubicacion !== selectedField) return false;
    if (selectedType !== 'TODOS' && eq.tipo !== selectedType) return false;
    if (
      searchQuery &&
      !eq.codigo.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !eq.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-5 font-mono">
      {/* Simulation Alert notice toast if triggered */}
      {lastAnomalyNotice && (
        <div className="bg-[#111827] border-l-4 border-[#00d2ff] p-3 flex items-center justify-between text-xs text-white">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#00d2ff] animate-pulse" />
            <span>{lastAnomalyNotice}</span>
          </div>
          <button
            onClick={clearAnomalyNotice}
            className="text-[#859399] hover:text-white text-xs underline ml-4"
          >
            Descartar
          </button>
        </div>
      )}

      {/* KPI METRIC STRIP (PRD Section 1.3) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        <div className="bg-[#0a0f18] border border-[#1e293b] p-3">
          <div className="text-[10px] text-[#859399] uppercase tracking-wider">TIEMPO DETECCIÓN</div>
          <div className="text-xl font-bold text-white tabular-nums mt-1 flex items-baseline gap-1">
            {kpis.tiempoDeteccionMin} <span className="text-[11px] font-normal text-[#859399]">min</span>
          </div>
          <div className="text-[10px] text-[#10b981] flex items-center gap-1 mt-1">
            <TrendingDown className="w-3 h-3" />
            <span>Meta: ≤5m (Antes 60m)</span>
          </div>
        </div>

        <div className="bg-[#0a0f18] border border-[#1e293b] p-3">
          <div className="text-[10px] text-[#859399] uppercase tracking-wider">DISPONIBILIDAD</div>
          <div className="text-xl font-bold text-[#10b981] tabular-nums mt-1 flex items-baseline gap-1">
            {kpis.disponibilidadPlantaPct}%
          </div>
          <div className="text-[10px] text-[#859399] flex items-center gap-1 mt-1">
            <span>Meta: ≥95% cumplida</span>
          </div>
        </div>

        <div className="bg-[#0a0f18] border border-[#1e293b] p-3">
          <div className="text-[10px] text-[#859399] uppercase tracking-wider">COBERTURA TIEMPO REAL</div>
          <div className="text-xl font-bold text-[#00d2ff] tabular-nums mt-1 flex items-baseline gap-1">
            {kpis.coberturaMonitoreoPct}%
          </div>
          <div className="text-[10px] text-[#859399] flex items-center gap-1 mt-1">
            <span>{equipment.length} Activos Enlazados</span>
          </div>
        </div>

        <div className="bg-[#0a0f18] border border-[#1e293b] p-3">
          <div className="text-[10px] text-[#859399] uppercase tracking-wider">RESPUESTA ALERTAS</div>
          <div className="text-xl font-bold text-white tabular-nums mt-1 flex items-baseline gap-1">
            {kpis.tiempoRespuestaMin} <span className="text-[11px] font-normal text-[#859399]">min</span>
          </div>
          <div className="text-[10px] text-[#10b981] flex items-center gap-1 mt-1">
            <span>Meta: ≤10m (Despacho veloz)</span>
          </div>
        </div>

        <div className="bg-[#0a0f18] border border-[#1e293b] p-3">
          <div className="text-[10px] text-[#859399] uppercase tracking-wider">REDUCCIÓN PÉRDIDAS</div>
          <div className="text-xl font-bold text-[#10b981] tabular-nums mt-1 flex items-baseline gap-1">
            +{kpis.reduccionPerdidasPct}%
          </div>
          <div className="text-[10px] text-[#859399] flex items-center gap-1 mt-1">
            <span>Sin paradas no planificadas</span>
          </div>
        </div>

        <div className="bg-[#0a0f18] border border-[#1e293b] p-3">
          <div className="text-[10px] text-[#859399] uppercase tracking-wider">RONDAS PRESENCIALES</div>
          <div className="text-xl font-bold text-[#00d2ff] tabular-nums mt-1 flex items-baseline gap-1">
            -{kpis.reduccionRondasPct}%
          </div>
          <div className="text-[10px] text-[#859399] flex items-center gap-1 mt-1">
            <span>Meta: ≥30% optimizada</span>
          </div>
        </div>
      </div>

      {/* ANOMALY TEST INJECTION STRIP & CONTROLS */}
      <div className="bg-[#0a0f18] border border-[#1e293b] p-3 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#f59e0b]" />
          <span className="text-xs font-bold text-white">SIMULADOR OPERATIVO DE EVENTOS DE CAMPO:</span>
          <span className="text-[11px] text-[#859399] hidden sm:inline">
            Inyecta perturbaciones para verificar detección inmediata y transiciones automáticas
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => triggerAnomaly('PRESSURE_SURGE')}
            className="px-2.5 py-1 text-xs bg-[#111827] hover:bg-[#1e293b] text-[#f59e0b] border border-[#f59e0b]/30 hover:border-[#f59e0b] transition-colors"
          >
            Sobrecarga Presión (Pozo)
          </button>
          <button
            onClick={() => triggerAnomaly('VFD_THERMAL_TRIP')}
            className="px-2.5 py-1 text-xs bg-[#111827] hover:bg-[#1e293b] text-[#ef4444] border border-[#ef4444]/30 hover:border-[#ef4444] transition-colors"
          >
            Térmico VFD Crítico
          </button>
          <button
            onClick={() => triggerAnomaly('SENSOR_OFFLINE')}
            className="px-2.5 py-1 text-xs bg-[#111827] hover:bg-[#1e293b] text-[#859399] hover:text-white border border-[#1e293b] transition-colors"
            title="Prueba de desconexión IoT: transiciona automáticamente a OFFLINE"
          >
            Desconexión Sensor (Offline)
          </button>
          <button
            onClick={() => triggerAnomaly('RESET_ALL')}
            className="px-2.5 py-1 text-xs bg-[#111827] hover:bg-[#1e293b] text-[#00d2ff] border border-[#00d2ff]/30 hover:border-[#00d2ff] transition-colors flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Restablecer
          </button>
        </div>
      </div>

      {/* CRITICAL ALARMS SUMMARY TICKER (if any active) */}
      {activeAlerts.length > 0 && (
        <div className="bg-[#0a0f18] border-l-4 border-[#ef4444] p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-[#ef4444] glow-crimson animate-pulse" />
            <span className="text-xs font-bold text-white">
              {criticalAlerts.length > 0 ? 'DESPACHO OPERATIVO: ALERTA CRÍTICA ACTIVA' : 'NOVEDADES EN CURSO'}
            </span>
            <span className="text-xs text-[#859399]">
              — {activeAlerts[0].codigoEquipo}: {activeAlerts[0].variableAfectada} ({activeAlerts[0].valorMedido} {activeAlerts[0].unidad})
            </span>
          </div>
          <button
            onClick={onNavigateToSchematic}
            className="text-xs text-[#00d2ff] hover:underline flex items-center gap-1 shrink-0"
          >
            Localizar en Esquema P&ID <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#0a0f18] border border-[#1e293b] p-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#859399]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por código (ej: PZ-LIZ) o nombre..."
            className="w-full bg-[#030509] border border-[#1e293b] focus:border-[#00d2ff] pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#859399] focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Field filter */}
          <div className="flex items-center gap-1 bg-[#030509] border border-[#1e293b] px-2 py-1">
            <span className="text-[#859399] text-[10px]">CAMPO:</span>
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="TODOS" className="bg-[#111827]">TODOS LOS CAMPOS</option>
              <option value="Campo Lizama" className="bg-[#111827]">Campo Lizama</option>
              <option value="Campo Rubiales" className="bg-[#111827]">Campo Rubiales</option>
              <option value="Campo Cusiana" className="bg-[#111827]">Campo Cusiana</option>
              <option value="Campo Casabe" className="bg-[#111827]">Campo Casabe</option>
            </select>
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-1 bg-[#030509] border border-[#1e293b] px-2 py-1">
            <span className="text-[#859399] text-[10px]">EQUIPO:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="TODOS" className="bg-[#111827]">TODOS LOS TIPOS</option>
              <option value="CABEZA_POZO" className="bg-[#111827]">Cabezas de Pozo</option>
              <option value="VFD" className="bg-[#111827]">Variadores (VFD)</option>
              <option value="SEPARADOR" className="bg-[#111827]">Separadores</option>
              <option value="TANQUE" className="bg-[#111827]">Tanques</option>
              <option value="BOMBA" className="bg-[#111827]">Bombas</option>
            </select>
          </div>

          <span className="text-[#859399] text-xs ml-auto">
            {filteredEquipment.length} equipos activos
          </span>
        </div>
      </div>

      {/* HIGH-DENSITY EQUIPMENT TELEMETRY TILES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {filteredEquipment.map((eq) => {
          const isCrit = eq.estado === 'CRITICO';
          const isWarn = eq.estado === 'ADVERTENCIA';
          const isOff = eq.estado === 'OFFLINE';

          return (
            <div
              key={eq.id}
              onClick={() => onOpenEquipmentDetail(eq)}
              className={`bg-[#0a0f18] border transition-all duration-200 cursor-pointer flex flex-col justify-between p-3.5 group relative hover:border-[#334155] ${
                isCrit
                  ? 'border-[#ef4444]/60 bg-[#ef4444]/5'
                  : isWarn
                  ? 'border-[#f59e0b]/50'
                  : isOff
                  ? 'border-[#1e293b] opacity-75'
                  : 'border-[#1e293b] hover:border-[#00d2ff]/40'
              }`}
            >
              {/* Header Strip */}
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#1e293b]/70 mb-2.5">
                  <span className="text-xs font-bold text-white tracking-wide group-hover:text-[#00d2ff] transition-colors">
                    {eq.codigo}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 ${
                        isCrit
                          ? 'bg-[#ef4444] glow-crimson animate-pulse'
                          : isWarn
                          ? 'bg-[#f59e0b]'
                          : isOff
                          ? 'bg-[#64748b]'
                          : 'bg-[#10b981] glow-emerald'
                      }`}
                    />
                    <span
                      className={`text-[10px] font-bold ${
                        isCrit
                          ? 'text-[#ef4444]'
                          : isWarn
                          ? 'text-[#f59e0b]'
                          : isOff
                          ? 'text-[#64748b]'
                          : 'text-[#10b981]'
                      }`}
                    >
                      {eq.estado}
                    </span>
                  </div>
                </div>

                {/* Subtitle info */}
                <h4 className="font-sans font-bold text-xs text-[#e0e2ec] line-clamp-1 mb-0.5">
                  {eq.nombre}
                </h4>
                <div className="text-[10px] text-[#859399] flex items-center justify-between mb-3">
                  <span>{eq.ubicacion}</span>
                  <span>{eq.tipo}</span>
                </div>

                {/* Segmented meter for primary variable */}
                <div className="mb-3">
                  <SegmentedGauge
                    label={
                      eq.tipo === 'TANQUE'
                        ? 'Nivel de Llenado'
                        : eq.tipo === 'VFD'
                        ? 'Frecuencia Operación'
                        : 'Presión Transmisor'
                    }
                    value={
                      eq.tipo === 'TANQUE'
                        ? eq.nivelActual ?? 70
                        : eq.tipo === 'VFD'
                        ? eq.frecuenciaVfd ?? 58
                        : eq.presionActual
                    }
                    min={eq.tipo === 'VFD' ? 0 : 0}
                    max={eq.tipo === 'VFD' ? 70 : eq.tipo === 'TANQUE' ? 100 : 1000}
                    unit={eq.tipo === 'VFD' ? 'Hz' : eq.tipo === 'TANQUE' ? '%' : 'PSI'}
                  />
                </div>

                {/* Secondary tabular parameters */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-[#030509] p-2 border border-[#151d2d]">
                  <div>
                    <span className="text-[9px] text-[#859399] uppercase block">TEMPERATURA</span>
                    <span className="text-white font-bold tabular-nums">
                      {eq.temperaturaActual.toFixed(1)} <span className="text-[#859399] text-[9px]">°C</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#859399] uppercase block">CAUDAL</span>
                    <span className="text-white font-bold tabular-nums">
                      {eq.caudalActual.toFixed(0)} <span className="text-[#859399] text-[9px]">BPD</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between text-[10px] text-[#859399] pt-2.5 mt-2.5 border-t border-[#1e293b]/70">
                <span>{eq.ultimaConexion}</span>
                <span className="text-[#00d2ff] opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                  Inspeccionar <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
