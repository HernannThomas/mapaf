import React, { useState } from 'react';
import { useScada } from '../context/ScadaContext';
import { Equipment } from '../types/scada';
import { OscilloscopeChart } from './OscilloscopeChart';
import { SegmentedGauge } from './SegmentedGauge';
import { Search, Filter, Eye, Cpu, Activity, Download, HardDrive } from 'lucide-react';

interface EquipmentListViewProps {
  onOpenEquipmentDetail: (eq: Equipment) => void;
}

export const EquipmentListView: React.FC<EquipmentListViewProps> = ({ onOpenEquipmentDetail }) => {
  const { equipment } = useScada();
  const [selectedEqId, setSelectedEqId] = useState<string>(equipment[0]?.id || 'eq-001');
  const [filterType, setFilterType] = useState<string>('TODOS');
  const [search, setSearch] = useState<string>('');

  const filtered = equipment.filter((eq) => {
    if (filterType !== 'TODOS' && eq.tipo !== filterType) return false;
    if (search && !eq.codigo.toLowerCase().includes(search.toLowerCase()) && !eq.nombre.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const activeEq = equipment.find((e) => e.id === selectedEqId) || equipment[0];

  return (
    <div className="space-y-4 font-mono">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e293b]">
        <div>
          <h2 className="font-sans font-bold text-lg text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#00d2ff]" />
            CONSOLA DE ACTIVOS & TELEMETRÍA POR EQUIPO
          </h2>
          <p className="text-xs text-[#859399] mt-0.5">
            Diagnóstico profundo de cabezas de pozo, variadores (VFD), separadores, tanques y bombas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por código o activo..."
            className="bg-[#030509] border border-[#1e293b] px-3 py-1 text-xs text-white placeholder-[#859399] focus:outline-none focus:border-[#00d2ff]"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#0a0f18] border border-[#1e293b] px-2 py-1 text-xs text-white focus:outline-none cursor-pointer"
          >
            <option value="TODOS" className="bg-[#111827]">Todos los tipos</option>
            <option value="CABEZA_POZO" className="bg-[#111827]">Cabeza Pozo</option>
            <option value="VFD" className="bg-[#111827]">Variador VFD</option>
            <option value="SEPARADOR" className="bg-[#111827]">Separador</option>
            <option value="TANQUE" className="bg-[#111827]">Tanque</option>
            <option value="BOMBA" className="bg-[#111827]">Bomba</option>
          </select>
        </div>
      </div>

      {/* Split View: Left List / Right Active Inspection Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Equipment Racks (5 cols) */}
        <div className="lg:col-span-5 space-y-2 max-h-[720px] overflow-y-auto pr-1">
          {filtered.map((eq) => {
            const isSelected = eq.id === activeEq.id;
            return (
              <div
                key={eq.id}
                onClick={() => setSelectedEqId(eq.id)}
                className={`p-3 bg-[#0a0f18] border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#00d2ff] bg-[#111827]'
                    : 'border-[#1e293b] hover:border-[#334155]'
                }`}
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-[#1e293b]/60 mb-2">
                  <span className="font-bold text-white text-xs">{eq.codigo}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 font-bold ${
                      eq.estado === 'CRITICO'
                        ? 'bg-[#ef4444] text-white'
                        : eq.estado === 'ADVERTENCIA'
                        ? 'bg-[#f59e0b] text-black'
                        : eq.estado === 'OFFLINE'
                        ? 'bg-[#64748b] text-white'
                        : 'bg-[#10b981]/20 text-[#10b981]'
                    }`}
                  >
                    {eq.estado}
                  </span>
                </div>

                <div className="text-xs text-[#e0e2ec] font-sans font-medium line-clamp-1">
                  {eq.nombre}
                </div>
                <div className="text-[10px] text-[#859399] flex justify-between mt-1">
                  <span>{eq.ubicacion}</span>
                  <span>{eq.tipo}</span>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#1e293b]/40 text-xs">
                  <span className="text-[#859399] text-[10px]">P: {eq.presionActual.toFixed(1)} PSI</span>
                  <span className="text-[#859399] text-[10px]">T: {eq.temperaturaActual.toFixed(1)} °C</span>
                  <span className="text-[#00d2ff] text-[10px] font-bold">
                    {eq.frecuenciaVfd ? `${eq.frecuenciaVfd.toFixed(1)} Hz` : `${eq.caudalActual.toFixed(0)} BPD`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: In-Depth Console for activeEq (7 cols) */}
        <div className="lg:col-span-7 bg-[#0a0f18] border border-[#1e293b] p-4 space-y-4">
          <div className="flex items-start justify-between pb-3 border-b border-[#1e293b]">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-sans font-bold text-base text-white">{activeEq.nombre}</h3>
                <span className="text-xs text-[#00d2ff] bg-[#00d2ff]/10 px-2 py-0.5 border border-[#00d2ff]/30 font-mono">
                  {activeEq.codigo}
                </span>
              </div>
              <p className="text-xs text-[#859399] mt-0.5">
                {activeEq.ubicacion} · {activeEq.bateria} · {activeEq.especificaciones.modelo}
              </p>
            </div>

            <button
              onClick={() => onOpenEquipmentDetail(activeEq)}
              className="px-3 py-1.5 bg-[#00d2ff] hover:bg-[#47d6ff] text-black font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              Modal Completo
            </button>
          </div>

          {/* Image & Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative aspect-video border border-[#1e293b] bg-black overflow-hidden">
              <img
                src={activeEq.imagen}
                alt={activeEq.nombre}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-2 left-2 text-xs text-white">
                <span className="text-[10px] text-[#859399] block">INSTALACIÓN & COMUNICACIÓN</span>
                <span className="text-[11px] font-bold">{activeEq.especificaciones.protocoloComunicacion}</span>
              </div>
            </div>

            <div className="space-y-3">
              <SegmentedGauge
                label="Presión de Operación"
                value={activeEq.presionActual}
                min={0}
                max={1000}
                unit="PSI"
              />
              <SegmentedGauge
                label="Temperatura de Fluido"
                value={activeEq.temperaturaActual}
                min={0}
                max={120}
                unit="°C"
              />
              {activeEq.frecuenciaVfd !== undefined && (
                <SegmentedGauge
                  label="Frecuencia Inversor (VFD)"
                  value={activeEq.frecuenciaVfd}
                  min={0}
                  max={70}
                  unit="Hz"
                />
              )}
            </div>
          </div>

          {/* Live Trend Oscilloscope */}
          <div className="pt-2">
            <OscilloscopeChart
              data={activeEq.historico}
              metricKey="presion"
              label={`SERIE TEMPORAL DE PRESIÓN [${activeEq.codigo}]`}
              unit="PSI"
              strokeColor="#00d2ff"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
