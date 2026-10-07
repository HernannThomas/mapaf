import React, { useState } from 'react';
import { Equipment } from '../types/scada';
import { OscilloscopeChart } from './OscilloscopeChart';
import { SegmentedGauge } from './SegmentedGauge';
import { X, Activity, Download, Cpu, HardDrive, Wifi, ShieldCheck, AlertOctagon, CheckCircle2 } from 'lucide-react';

interface EquipmentDetailModalProps {
  equipment: Equipment | null;
  onClose: () => void;
}

export const EquipmentDetailModal: React.FC<EquipmentDetailModalProps> = ({
  equipment,
  onClose,
}) => {
  const [activeMetricTab, setActiveMetricTab] = useState<'presion' | 'temperatura' | 'caudal' | 'frecuencia'>('presion');

  if (!equipment) return null;

  const handleExportTelemetry = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Timestamp,Presion_PSI,Temperatura_C,Caudal_BPD,Frecuencia_Hz,Vibracion_mms\n' +
      equipment.historico
        .map(
          (h) =>
            `${h.timestamp},${h.presion},${h.temperatura},${h.caudal},${h.frecuenciaVfd ?? ''},${h.vibracion ?? ''}`
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `telemetria_${equipment.codigo}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isCritical = equipment.estado === 'CRITICO';
  const isWarning = equipment.estado === 'ADVERTENCIA';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 overflow-y-auto font-mono">
      <div className="w-full max-w-5xl bg-[#0a0f18] border border-[#1e293b] shadow-2xl overflow-hidden my-auto">
        {/* Header bar */}
        <div className="flex items-center justify-between p-4 bg-[#030509] border-b border-[#1e293b]">
          <div className="flex items-center gap-3">
            <span
              className={`w-3 h-3 ${
                isCritical
                  ? 'bg-[#ef4444] glow-crimson animate-pulse'
                  : isWarning
                  ? 'bg-[#f59e0b]'
                  : equipment.estado === 'OFFLINE'
                  ? 'bg-[#64748b]'
                  : 'bg-[#10b981] glow-emerald'
              }`}
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-sans font-bold text-lg text-white">
                  {equipment.codigo} — {equipment.nombre}
                </h2>
                <span
                  className={`text-[10px] px-2 py-0.5 font-bold ${
                    isCritical
                      ? 'bg-[#ef4444] text-white'
                      : isWarning
                      ? 'bg-[#f59e0b] text-black'
                      : equipment.estado === 'OFFLINE'
                      ? 'bg-[#334155] text-white'
                      : 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40'
                  }`}
                >
                  {equipment.estado}
                </span>
              </div>
              <p className="text-xs text-[#859399] mt-0.5">
                {equipment.ubicacion} · {equipment.bateria} · {equipment.especificaciones.modelo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportTelemetry}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111827] hover:bg-[#1e293b] text-[#00d2ff] border border-[#00d2ff]/40 text-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#859399] hover:text-white bg-[#111827] border border-[#1e293b]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Split layout */}
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Image Asset & Hardware Specs */}
          <div className="space-y-4">
            <div className="relative aspect-video w-full border border-[#1e293b] bg-black overflow-hidden group">
              <img
                src={equipment.imagen}
                alt={equipment.nombre}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute bottom-2.5 left-2.5 right-2.5 text-xs text-white">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#859399]">FABRICANTE:</span>
                  <span className="font-bold">{equipment.especificaciones.fabricante}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-[#859399]">CAPACIDAD:</span>
                  <span className="text-[#00d2ff] text-[11px]">{equipment.especificaciones.capacidadNominal}</span>
                </div>
              </div>
            </div>

            {/* Hardware specifications matrix */}
            <div className="bg-[#030509] p-3.5 border border-[#1e293b] text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-[#00d2ff] text-[11px] font-bold border-b border-[#151d2d] pb-1.5">
                <Cpu className="w-3.5 h-3.5" />
                <span>ESPECIFICACIONES DEL ACTIVO</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-[#859399]">Protocolo IoT:</span>
                <span className="text-white">{equipment.especificaciones.protocoloComunicacion}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-[#859399]">Año Puesta en Marcha:</span>
                <span className="text-white">{equipment.especificaciones.anoInstalacion}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-[#859399]">Muestreo Telemetría:</span>
                <span className="text-[#10b981]">2,000 ms continuo</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-[#859399]">Última Trama Recibida:</span>
                <span className="text-white">{equipment.ultimaConexion}</span>
              </div>
            </div>

            {/* Gauges */}
            <div className="bg-[#030509] p-3.5 border border-[#1e293b] space-y-4">
              <SegmentedGauge
                label="Presión Transmisor"
                value={equipment.presionActual}
                min={0}
                max={1000}
                unit="PSI"
              />
              <SegmentedGauge
                label="Temperatura Termocupla"
                value={equipment.temperaturaActual}
                min={0}
                max={120}
                unit="°C"
              />
            </div>
          </div>

          {/* Right 2 Columns: Multi-Channel Oscilloscope & Detailed Telemetry Matrix */}
          <div className="lg:col-span-2 space-y-4">
            {/* Metric Switcher Tabs */}
            <div className="flex items-center gap-1 bg-[#030509] p-1 border border-[#1e293b] text-xs">
              <button
                onClick={() => setActiveMetricTab('presion')}
                className={`flex-1 py-1.5 px-3 transition-colors ${
                  activeMetricTab === 'presion'
                    ? 'bg-[#111827] text-[#00d2ff] font-bold border-b border-[#00d2ff]'
                    : 'text-[#859399] hover:text-white'
                }`}
              >
                PRESIÓN (PSI)
              </button>
              <button
                onClick={() => setActiveMetricTab('temperatura')}
                className={`flex-1 py-1.5 px-3 transition-colors ${
                  activeMetricTab === 'temperatura'
                    ? 'bg-[#111827] text-[#ef4444] font-bold border-b border-[#ef4444]'
                    : 'text-[#859399] hover:text-white'
                }`}
              >
                TEMPERATURA (°C)
              </button>
              <button
                onClick={() => setActiveMetricTab('caudal')}
                className={`flex-1 py-1.5 px-3 transition-colors ${
                  activeMetricTab === 'caudal'
                    ? 'bg-[#111827] text-[#10b981] font-bold border-b border-[#10b981]'
                    : 'text-[#859399] hover:text-white'
                }`}
              >
                CAUDAL (BPD)
              </button>
              {equipment.frecuenciaVfd !== undefined && (
                <button
                  onClick={() => setActiveMetricTab('frecuencia')}
                  className={`flex-1 py-1.5 px-3 transition-colors ${
                    activeMetricTab === 'frecuencia'
                      ? 'bg-[#111827] text-[#f59e0b] font-bold border-b border-[#f59e0b]'
                      : 'text-[#859399] hover:text-white'
                  }`}
                >
                  FREQ VFD (Hz)
                </button>
              )}
            </div>

            {/* Live Chart Canvas */}
            {activeMetricTab === 'presion' && (
              <OscilloscopeChart
                data={equipment.historico}
                metricKey="presion"
                label="CURVA DINÁMICA DE PRESIÓN HIDRÁULICA"
                unit="PSI"
                strokeColor="#00d2ff"
              />
            )}
            {activeMetricTab === 'temperatura' && (
              <OscilloscopeChart
                data={equipment.historico}
                metricKey="temperatura"
                label="PERFIL TÉRMICO CONTINUO"
                unit="°C"
                strokeColor="#ef4444"
              />
            )}
            {activeMetricTab === 'caudal' && (
              <OscilloscopeChart
                data={equipment.historico}
                metricKey="caudal"
                label="TASA DE FLUJO DE PRODUCCIÓN"
                unit="BPD"
                strokeColor="#10b981"
              />
            )}
            {activeMetricTab === 'frecuencia' && (
              <OscilloscopeChart
                data={equipment.historico}
                metricKey="frecuenciaVfd"
                label="MODULACIÓN DE FRECUENCIA VARIADOR (VFD)"
                unit="Hz"
                strokeColor="#f59e0b"
              />
            )}

            {/* Instantaneous Values Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#030509] p-3 border border-[#1e293b]">
                <div className="text-[10px] text-[#859399]">PRESIÓN ACTUAL</div>
                <div className="text-lg font-bold text-white tabular-nums mt-0.5">
                  {equipment.presionActual.toFixed(1)} <span className="text-[10px] font-normal text-[#859399]">PSI</span>
                </div>
              </div>

              <div className="bg-[#030509] p-3 border border-[#1e293b]">
                <div className="text-[10px] text-[#859399]">TEMPERATURA</div>
                <div className="text-lg font-bold text-white tabular-nums mt-0.5">
                  {equipment.temperaturaActual.toFixed(1)} <span className="text-[10px] font-normal text-[#859399]">°C</span>
                </div>
              </div>

              <div className="bg-[#030509] p-3 border border-[#1e293b]">
                <div className="text-[10px] text-[#859399]">CAUDAL BRUTO</div>
                <div className="text-lg font-bold text-white tabular-nums mt-0.5">
                  {equipment.caudalActual.toFixed(0)} <span className="text-[10px] font-normal text-[#859399]">BPD</span>
                </div>
              </div>

              <div className="bg-[#030509] p-3 border border-[#1e293b]">
                <div className="text-[10px] text-[#859399]">VIBRACIÓN RADIAL</div>
                <div className="text-lg font-bold text-white tabular-nums mt-0.5">
                  {(equipment.vibracionActual ?? 1.4).toFixed(1)} <span className="text-[10px] font-normal text-[#859399]">mm/s</span>
                </div>
              </div>
            </div>

            {/* Electrical parameters if VFD */}
            {equipment.frecuenciaVfd !== undefined && (
              <div className="bg-[#030509] p-3.5 border border-[#1e293b]">
                <div className="text-[11px] font-bold text-[#00d2ff] mb-2 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>BUS ELÉCTRICO DE POTENCIA (VARIADOR ACS880 / SINAMICS)</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[#859399] text-[10px]">Tensión de Barra:</span>
                    <div className="text-white font-bold tabular-nums">
                      {equipment.voltajeActual?.toFixed(0)} VAC
                    </div>
                  </div>
                  <div>
                    <span className="text-[#859399] text-[10px]">Corriente Consumida:</span>
                    <div className="text-white font-bold tabular-nums">
                      {equipment.corrienteActual?.toFixed(1)} A
                    </div>
                  </div>
                  <div>
                    <span className="text-[#859399] text-[10px]">Frecuencia Inversor:</span>
                    <div className="text-[#00d2ff] font-bold tabular-nums">
                      {equipment.frecuenciaVfd?.toFixed(1)} Hz
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
