import React, { useState } from 'react';
import { useScada } from '../context/ScadaContext';
import { Equipment } from '../types/scada';
import { Activity, Gauge, Flame, Droplets, Zap, AlertTriangle, CheckCircle2, ChevronRight, Eye } from 'lucide-react';

interface SchematicViewProps {
  onOpenEquipmentDetail: (eq: Equipment) => void;
}

export const SchematicView: React.FC<SchematicViewProps> = ({ onOpenEquipmentDetail }) => {
  const { equipment, alerts, triggerAnomaly } = useScada();
  const [selectedNodeId, setSelectedNodeId] = useState<string>('eq-001');

  const selectedNode = equipment.find((e) => e.id === selectedNodeId) || equipment[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CRITICO':
        return '#ef4444';
      case 'ADVERTENCIA':
        return '#f59e0b';
      case 'OFFLINE':
        return '#64748b';
      default:
        return '#10b981';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e293b]">
        <div>
          <h2 className="font-sans font-bold text-lg text-white tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 bg-[#00d2ff] glow-cyan" />
            DIAGRAMA P&ID DE CAMPO & SEPARACIÓN TRIFÁSICA
          </h2>
          <p className="text-xs text-[#859399] font-mono mt-0.5">
            Arquitectura de recolección, manifolds de flujo, separación de fluidos y bombeo fiscal
          </p>
        </div>

        {/* Quick simulation buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => triggerAnomaly('PRESSURE_SURGE')}
            className="px-2.5 py-1 text-xs font-mono bg-[#111827] hover:bg-[#1e293b] text-[#f59e0b] border border-[#f59e0b]/40 hover:border-[#f59e0b] transition-colors"
          >
            + Simular Golpe Presión
          </button>
          <button
            onClick={() => triggerAnomaly('VFD_THERMAL_TRIP')}
            className="px-2.5 py-1 text-xs font-mono bg-[#111827] hover:bg-[#1e293b] text-[#ef4444] border border-[#ef4444]/40 hover:border-[#ef4444] transition-colors"
          >
            + Simular Falla VFD
          </button>
          <button
            onClick={() => triggerAnomaly('RESET_ALL')}
            className="px-2.5 py-1 text-xs font-mono bg-[#111827] hover:bg-[#1e293b] text-[#00d2ff] border border-[#00d2ff]/40 hover:border-[#00d2ff] transition-colors"
          >
            Restablecer Nominal
          </button>
        </div>
      </div>

      {/* Main Grid: P&ID Canvas + Node Telemetry Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left 3 Cols: Interactive P&ID SVG Map */}
        <div className="lg:col-span-3 bg-[#0a0f18] border border-[#1e293b] p-3 sm:p-5 relative overflow-hidden scada-grid-bg">
          {/* Status strip */}
          <div className="flex items-center justify-between text-[11px] font-mono text-[#859399] mb-3 pb-2 border-b border-[#1e293b]/60">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#10b981] animate-ping" />
              LÍNEAS DE FLUJO ENERGIZADAS (PRESURIZADAS)
            </span>
            <span className="hidden sm:inline">NORMA ANSI/ISA-5.1 SCADA INDUSTRIAL</span>
          </div>

          <div className="w-full aspect-[16/10] sm:aspect-[16/9] min-h-[380px] relative">
            <svg
              viewBox="0 0 1000 560"
              className="w-full h-full select-none"
              style={{ filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.7))' }}
            >
              <defs>
                {/* Flow animation gradient */}
                <linearGradient id="flowOil" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00d2ff" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#10b981" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#00d2ff" stopOpacity="0.8" />
                </linearGradient>

                <linearGradient id="flowGas" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.9" />
                </linearGradient>

                <filter id="glowEffect">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* PIPELINE LINES */}
              {/* Line 1: Wellhead Lizama to Manifold */}
              <path
                d="M 120 120 L 260 120 L 260 250"
                fill="none"
                stroke="#1e293b"
                strokeWidth="6"
              />
              <path
                d="M 120 120 L 260 120 L 260 250"
                fill="none"
                stroke="#00d2ff"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                className="animate-[dash_10s_linear_infinite]"
              />

              {/* Line 2: Wellhead Rubiales to Manifold */}
              <path
                d="M 120 250 L 260 250"
                fill="none"
                stroke="#1e293b"
                strokeWidth="6"
              />
              <path
                d="M 120 250 L 260 250"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeDasharray="6 4"
              />

              {/* Line 3: Wellhead Casabe to Manifold */}
              <path
                d="M 120 380 L 260 380 L 260 250"
                fill="none"
                stroke="#1e293b"
                strokeWidth="6"
              />
              <path
                d="M 120 380 L 260 380 L 260 250"
                fill="none"
                stroke="#00d2ff"
                strokeWidth="2.5"
                strokeDasharray="6 4"
              />

              {/* Manifold Junction to Separator */}
              <path
                d="M 260 250 L 430 250"
                fill="none"
                stroke="#1e293b"
                strokeWidth="8"
              />
              <path
                d="M 260 250 L 430 250"
                fill="none"
                stroke="url(#flowOil)"
                strokeWidth="3.5"
                strokeDasharray="8 6"
              />

              {/* Separator Gas Outlet (Top) to Compressor VFD */}
              <path
                d="M 520 190 L 520 110 L 720 110"
                fill="none"
                stroke="#1e293b"
                strokeWidth="5"
              />
              <path
                d="M 520 190 L 520 110 L 720 110"
                fill="none"
                stroke="url(#flowGas)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />

              {/* Separator Oil Outlet (Bottom) to Tank */}
              <path
                d="M 580 280 L 670 280 L 670 330"
                fill="none"
                stroke="#1e293b"
                strokeWidth="6"
              />
              <path
                d="M 580 280 L 670 280 L 670 330"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeDasharray="6 4"
              />

              {/* Tank to Pump */}
              <path
                d="M 770 380 L 830 380"
                fill="none"
                stroke="#1e293b"
                strokeWidth="6"
              />
              <path
                d="M 770 380 L 830 380"
                fill="none"
                stroke="#00d2ff"
                strokeWidth="2.5"
              />

              {/* Pump to Export Oleoducto */}
              <path
                d="M 900 380 L 980 380"
                fill="none"
                stroke="#1e293b"
                strokeWidth="7"
              />
              <path
                d="M 900 380 L 980 380"
                fill="none"
                stroke="#00d2ff"
                strokeWidth="3"
                strokeDasharray="8 4"
              />

              {/* VFD Control Wire to ESP Pump */}
              <path
                d="M 865 240 L 865 350"
                fill="none"
                stroke="#00d2ff"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />

              {/* MANIFOLD BLOCK */}
              <rect
                x="245"
                y="210"
                width="30"
                height="80"
                fill="#111827"
                stroke="#334155"
                strokeWidth="2"
              />
              <text
                x="260"
                y="255"
                fill="#859399"
                fontSize="8"
                fontFamily="JetBrains Mono"
                textAnchor="middle"
                transform="rotate(-90 260 255)"
              >
                MANIFOLD
              </text>

              {/* NODE 1: PZ-LIZ-104 */}
              {(() => {
                const eq = equipment.find((e) => e.id === 'eq-001')!;
                const isSelected = selectedNodeId === 'eq-001';
                return (
                  <g
                    className="cursor-pointer group"
                    onClick={() => setSelectedNodeId('eq-001')}
                  >
                    <rect
                      x="40"
                      y="85"
                      width="100"
                      height="70"
                      fill={isSelected ? '#111827' : '#0a0f18'}
                      stroke={isSelected ? '#00d2ff' : getStatusColor(eq.estado)}
                      strokeWidth={isSelected ? '2.5' : '1.5'}
                    />
                    <circle cx="90" cy="100" r="4" fill={getStatusColor(eq.estado)} />
                    <text x="90" y="118" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="Space Grotesk" textAnchor="middle">
                      {eq.codigo}
                    </text>
                    <text x="90" y="132" fill="#00d2ff" fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle">
                      {eq.presionActual.toFixed(1)} PSI
                    </text>
                    <text x="90" y="145" fill="#859399" fontSize="8" fontFamily="JetBrains Mono" textAnchor="middle">
                      {eq.caudalActual.toFixed(0)} BPD
                    </text>
                  </g>
                );
              })()}

              {/* NODE 2: PZ-RUB-018 */}
              {(() => {
                const eq = equipment.find((e) => e.id === 'eq-003')!;
                const isSelected = selectedNodeId === 'eq-003';
                return (
                  <g
                    className="cursor-pointer group"
                    onClick={() => setSelectedNodeId('eq-003')}
                  >
                    <rect
                      x="40"
                      y="215"
                      width="100"
                      height="70"
                      fill={isSelected ? '#111827' : '#0a0f18'}
                      stroke={isSelected ? '#00d2ff' : getStatusColor(eq.estado)}
                      strokeWidth={isSelected ? '2.5' : '1.5'}
                    />
                    <circle cx="90" cy="230" r="4" fill={getStatusColor(eq.estado)} />
                    <text x="90" y="248" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="Space Grotesk" textAnchor="middle">
                      {eq.codigo}
                    </text>
                    <text x="90" y="262" fill="#f59e0b" fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle">
                      {eq.presionActual.toFixed(1)} PSI
                    </text>
                    <text x="90" y="275" fill="#859399" fontSize="8" fontFamily="JetBrains Mono" textAnchor="middle">
                      ALERTA PRES.
                    </text>
                  </g>
                );
              })()}

              {/* NODE 3: PZ-CSB-082 */}
              {(() => {
                const eq = equipment.find((e) => e.id === 'eq-008')!;
                const isSelected = selectedNodeId === 'eq-008';
                return (
                  <g
                    className="cursor-pointer group"
                    onClick={() => setSelectedNodeId('eq-008')}
                  >
                    <rect
                      x="40"
                      y="345"
                      width="100"
                      height="70"
                      fill={isSelected ? '#111827' : '#0a0f18'}
                      stroke={isSelected ? '#00d2ff' : getStatusColor(eq.estado)}
                      strokeWidth={isSelected ? '2.5' : '1.5'}
                    />
                    <circle cx="90" cy="360" r="4" fill={getStatusColor(eq.estado)} />
                    <text x="90" y="378" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="Space Grotesk" textAnchor="middle">
                      {eq.codigo}
                    </text>
                    <text x="90" y="392" fill={eq.estado === 'OFFLINE' ? '#64748b' : '#00d2ff'} fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle">
                      {eq.estado === 'OFFLINE' ? 'OFFLINE' : `${eq.presionActual.toFixed(1)} PSI`}
                    </text>
                    <text x="90" y="405" fill="#859399" fontSize="8" fontFamily="JetBrains Mono" textAnchor="middle">
                      {eq.estado}
                    </text>
                  </g>
                );
              })()}

              {/* NODE 4: SEPARATOR SEP-TRI-03 */}
              {(() => {
                const eq = equipment.find((e) => e.id === 'eq-004')!;
                const isSelected = selectedNodeId === 'eq-004';
                return (
                  <g
                    className="cursor-pointer group"
                    onClick={() => setSelectedNodeId('eq-004')}
                  >
                    {/* Vessel cylinder outline */}
                    <rect
                      x="430"
                      y="190"
                      width="150"
                      height="110"
                      rx="16"
                      fill={isSelected ? '#111827' : '#0a0f18'}
                      stroke={isSelected ? '#00d2ff' : getStatusColor(eq.estado)}
                      strokeWidth={isSelected ? '2.5' : '1.5'}
                    />
                    <circle cx="505" cy="210" r="4" fill={getStatusColor(eq.estado)} />
                    <text x="505" y="228" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="Space Grotesk" textAnchor="middle">
                      SEP-TRI-03 (SEPARADOR)
                    </text>
                    <text x="505" y="246" fill="#00d2ff" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
                      P: {eq.presionActual.toFixed(1)} PSI
                    </text>
                    <text x="505" y="262" fill="#10b981" fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle">
                      NIVEL: {eq.nivelActual?.toFixed(1)}% | T: {eq.temperaturaActual.toFixed(1)}°C
                    </text>
                    <text x="505" y="278" fill="#859399" fontSize="8" fontFamily="JetBrains Mono" textAnchor="middle">
                      CRUDO / AGUA / GAS
                    </text>
                  </g>
                );
              })()}

              {/* NODE 5: GAS COMPRESSOR VFD (VFD-MOT-305) */}
              {(() => {
                const eq = equipment.find((e) => e.id === 'eq-007')!;
                const isSelected = selectedNodeId === 'eq-007';
                return (
                  <g
                    className="cursor-pointer group"
                    onClick={() => setSelectedNodeId('eq-007')}
                  >
                    <rect
                      x="720"
                      y="75"
                      width="140"
                      height="75"
                      fill={isSelected ? '#111827' : '#0a0f18'}
                      stroke={isSelected ? '#00d2ff' : getStatusColor(eq.estado)}
                      strokeWidth={isSelected ? '2.5' : '1.5'}
                    />
                    <circle cx="790" cy="92" r="4" fill={getStatusColor(eq.estado)} />
                    <text x="790" y="110" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="Space Grotesk" textAnchor="middle">
                      {eq.codigo} (VFD GAS)
                    </text>
                    <text x="790" y="125" fill="#ef4444" fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle">
                      {eq.temperaturaActual.toFixed(1)} °C [CRITICO]
                    </text>
                    <text x="790" y="138" fill="#859399" fontSize="8" fontFamily="JetBrains Mono" textAnchor="middle">
                      FREQ: {eq.frecuenciaVfd?.toFixed(1)} Hz
                    </text>
                  </g>
                );
              })()}

              {/* NODE 6: STORAGE TANK (TK-ALM-01) */}
              {(() => {
                const eq = equipment.find((e) => e.id === 'eq-005')!;
                const isSelected = selectedNodeId === 'eq-005';
                return (
                  <g
                    className="cursor-pointer group"
                    onClick={() => setSelectedNodeId('eq-005')}
                  >
                    <rect
                      x="670"
                      y="330"
                      width="100"
                      height="100"
                      fill={isSelected ? '#111827' : '#0a0f18'}
                      stroke={isSelected ? '#00d2ff' : getStatusColor(eq.estado)}
                      strokeWidth={isSelected ? '2.5' : '1.5'}
                    />
                    <circle cx="720" cy="348" r="4" fill={getStatusColor(eq.estado)} />
                    <text x="720" y="366" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="Space Grotesk" textAnchor="middle">
                      TK-101 (CRUDO)
                    </text>
                    <text x="720" y="385" fill="#00d2ff" fontSize="11" fontWeight="bold" fontFamily="JetBrains Mono" textAnchor="middle">
                      {eq.nivelActual?.toFixed(1)}%
                    </text>
                    <text x="720" y="402" fill="#859399" fontSize="8" fontFamily="JetBrains Mono" textAnchor="middle">
                      50,000 BBL CAP.
                    </text>
                  </g>
                );
              })()}

              {/* NODE 7: BOOSTER PUMP (BMB-INJ-04) */}
              {(() => {
                const eq = equipment.find((e) => e.id === 'eq-006')!;
                const isSelected = selectedNodeId === 'eq-006';
                return (
                  <g
                    className="cursor-pointer group"
                    onClick={() => setSelectedNodeId('eq-006')}
                  >
                    <circle
                      cx="865"
                      cy="380"
                      r="35"
                      fill={isSelected ? '#111827' : '#0a0f18'}
                      stroke={isSelected ? '#00d2ff' : getStatusColor(eq.estado)}
                      strokeWidth={isSelected ? '2.5' : '1.5'}
                    />
                    <circle cx="865" cy="360" r="4" fill={getStatusColor(eq.estado)} />
                    <text x="865" y="378" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="Space Grotesk" textAnchor="middle">
                      {eq.codigo}
                    </text>
                    <text x="865" y="392" fill="#00d2ff" fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle">
                      {eq.presionActual.toFixed(0)} PSI
                    </text>
                  </g>
                );
              })()}

              {/* NODE 8: MAIN VFD DRIVE (VFD-MOT-201) */}
              {(() => {
                const eq = equipment.find((e) => e.id === 'eq-002')!;
                const isSelected = selectedNodeId === 'eq-002';
                return (
                  <g
                    className="cursor-pointer group"
                    onClick={() => setSelectedNodeId('eq-002')}
                  >
                    <rect
                      x="815"
                      y="170"
                      width="100"
                      height="70"
                      fill={isSelected ? '#111827' : '#0a0f18'}
                      stroke={isSelected ? '#00d2ff' : getStatusColor(eq.estado)}
                      strokeWidth={isSelected ? '2.5' : '1.5'}
                    />
                    <circle cx="865" cy="186" r="4" fill={getStatusColor(eq.estado)} />
                    <text x="865" y="202" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="Space Grotesk" textAnchor="middle">
                      {eq.codigo}
                    </text>
                    <text x="865" y="217" fill="#10b981" fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle">
                      {eq.frecuenciaVfd?.toFixed(1)} Hz | {eq.voltajeActual?.toFixed(0)}V
                    </text>
                    <text x="865" y="229" fill="#859399" fontSize="8" fontFamily="JetBrains Mono" textAnchor="middle">
                      CONTROL BOMBA
                    </text>
                  </g>
                );
              })()}

              {/* PIPELINE DISPATCH LABEL */}
              <text x="945" y="365" fill="#859399" fontSize="8" fontFamily="JetBrains Mono" textAnchor="middle">
                OLEODUCTO
              </text>
              <polygon points="980,375 995,380 980,385" fill="#00d2ff" />
            </svg>
          </div>

          <div className="flex items-center gap-4 text-[10px] font-mono text-[#859399] pt-2 border-t border-[#1e293b]/60 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[#10b981]" /> Operativo Nominal
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[#f59e0b]" /> Advertencia Umbral
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[#ef4444]" /> Disparo Crítico
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[#64748b]" /> Sensor Desconectado (Offline)
            </span>
            <span className="text-white/60 ml-auto">Haz clic en cualquier nodo para inspeccionar</span>
          </div>
        </div>

        {/* Right Col: Selected Node Telemetry HUD */}
        <div className="bg-[#0a0f18] border border-[#1e293b] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#1e293b] mb-3">
              <span className="text-[10px] font-mono text-[#859399] tracking-wider uppercase">
                DETALLE DEL NODO
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 font-bold ${
                  selectedNode.estado === 'CRITICO'
                    ? 'bg-[#ef4444] text-white glow-crimson'
                    : selectedNode.estado === 'ADVERTENCIA'
                    ? 'bg-[#f59e0b] text-black'
                    : selectedNode.estado === 'OFFLINE'
                    ? 'bg-[#334155] text-[#859399]'
                    : 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40'
                }`}
              >
                {selectedNode.estado}
              </span>
            </div>

            {/* Equipment Image preview */}
            <div className="relative aspect-video w-full mb-3 border border-[#1e293b] overflow-hidden bg-black">
              <img
                src={selectedNode.imagen}
                alt={selectedNode.nombre}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs font-mono text-white">
                <span className="font-bold">{selectedNode.codigo}</span>
                <span className="text-[10px] text-[#859399]">{selectedNode.ubicacion}</span>
              </div>
            </div>

            <h3 className="font-sans font-bold text-sm text-white mb-1">
              {selectedNode.nombre}
            </h3>
            <p className="text-[11px] font-mono text-[#859399] mb-4">
              {selectedNode.bateria} · {selectedNode.especificaciones.modelo}
            </p>

            {/* Live Metrics */}
            <div className="space-y-2.5 font-mono text-xs">
              <div className="bg-[#030509] p-2.5 border border-[#151d2d] flex justify-between items-center">
                <span className="text-[#859399] text-[11px]">PRESIÓN LÍNEA</span>
                <span className="text-white font-bold tabular-nums">
                  {selectedNode.presionActual.toFixed(1)} <span className="text-[#859399] font-normal text-[10px]">PSI</span>
                </span>
              </div>

              <div className="bg-[#030509] p-2.5 border border-[#151d2d] flex justify-between items-center">
                <span className="text-[#859399] text-[11px]">TEMPERATURA</span>
                <span className="text-white font-bold tabular-nums">
                  {selectedNode.temperaturaActual.toFixed(1)} <span className="text-[#859399] font-normal text-[10px]">°C</span>
                </span>
              </div>

              <div className="bg-[#030509] p-2.5 border border-[#151d2d] flex justify-between items-center">
                <span className="text-[#859399] text-[11px]">CAUDAL FLUJO</span>
                <span className="text-white font-bold tabular-nums">
                  {selectedNode.caudalActual.toFixed(0)} <span className="text-[#859399] font-normal text-[10px]">BPD</span>
                </span>
              </div>

              {selectedNode.frecuenciaVfd !== undefined && (
                <div className="bg-[#030509] p-2.5 border border-[#151d2d] flex justify-between items-center">
                  <span className="text-[#859399] text-[11px]">FRECUENCIA VFD</span>
                  <span className="text-[#00d2ff] font-bold tabular-nums">
                    {selectedNode.frecuenciaVfd.toFixed(1)} <span className="text-[#859399] font-normal text-[10px]">Hz</span>
                  </span>
                </div>
              )}

              {selectedNode.nivelActual !== undefined && (
                <div className="bg-[#030509] p-2.5 border border-[#151d2d] flex justify-between items-center">
                  <span className="text-[#859399] text-[11px]">NIVEL TANQUE</span>
                  <span className="text-[#10b981] font-bold tabular-nums">
                    {selectedNode.nivelActual.toFixed(1)} <span className="text-[#859399] font-normal text-[10px]">%</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onOpenEquipmentDetail(selectedNode)}
            className="w-full mt-4 py-2 px-3 bg-[#111827] hover:bg-[#1e293b] text-[#00d2ff] border border-[#00d2ff]/40 hover:border-[#00d2ff] text-xs font-mono font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            ABRIR INSTRUMENTACIÓN DETALLADA
          </button>
        </div>
      </div>
    </div>
  );
};
