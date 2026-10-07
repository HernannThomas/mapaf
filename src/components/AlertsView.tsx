import React, { useState } from 'react';
import { useScada } from '../context/ScadaContext';
import { Alert, AlertLevel, AlertStatus } from '../types/scada';
import { AlertTriangle, ShieldAlert, CheckCircle, Clock, Check, X, Filter, FileText, BellRing } from 'lucide-react';

export const AlertsView: React.FC = () => {
  const { alerts, acknowledgeAlert, closeAlert, currentRole } = useScada();
  const [filterLevel, setFilterLevel] = useState<string>('TODAS');
  const [filterStatus, setFilterStatus] = useState<string>('TODAS');
  
  // Modal state for closing alert with required justification
  const [closingAlert, setClosingAlert] = useState<Alert | null>(null);
  const [operatorNotes, setOperatorNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filteredAlerts = alerts.filter((alt) => {
    if (filterLevel !== 'TODAS' && alt.nivel !== filterLevel) return false;
    if (filterStatus !== 'TODAS' && alt.estado !== filterStatus) return false;
    return true;
  });

  const handleOpenCloseModal = (alert: Alert) => {
    setClosingAlert(alert);
    setOperatorNotes('');
    setErrorMessage(null);
  };

  const handleSubmitResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingAlert) return;

    const res = closeAlert(closingAlert.id, operatorNotes);
    if (!res.success) {
      setErrorMessage(res.error || 'Error al cerrar la alerta');
    } else {
      setClosingAlert(null);
      setOperatorNotes('');
      setErrorMessage(null);
    }
  };

  const isReadOnly = currentRole === 'AUDITOR';

  return (
    <div className="space-y-4 font-mono">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e293b]">
        <div>
          <h2 className="font-sans font-bold text-lg text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#ef4444]" />
            ENGINE DE ALERTAS, ANOMALÍAS & EVENTOS OPERACIONALES
          </h2>
          <p className="text-xs text-[#859399] mt-0.5">
            Registro auditable con requerimiento estricto de justificación técnica para el cierre
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1 bg-[#0a0f18] border border-[#1e293b] px-2 py-1">
            <span className="text-[#859399] text-[10px]">NIVEL:</span>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="TODAS" className="bg-[#111827]">TODAS</option>
              <option value="CRITICO" className="bg-[#111827]">CRÍTICO</option>
              <option value="ADVERTENCIA" className="bg-[#111827]">ADVERTENCIA</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-[#0a0f18] border border-[#1e293b] px-2 py-1">
            <span className="text-[#859399] text-[10px]">ESTADO:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="TODAS" className="bg-[#111827]">TODAS</option>
              <option value="ACTIVA" className="bg-[#111827]">ACTIVAS</option>
              <option value="ATENDIDA" className="bg-[#111827]">ATENDIDAS</option>
              <option value="CERRADA" className="bg-[#111827]">CERRADAS</option>
            </select>
          </div>
        </div>
      </div>

      {/* Role notice if AUDITOR */}
      {isReadOnly && (
        <div className="bg-[#111827] border-l-2 border-[#f59e0b] px-4 py-2 text-xs text-[#859399]">
          Modo Auditor (Solo Lectura): La atención y cierre de eventos operacionales requiere perfil de Operador o Administrador.
        </div>
      )}

      {/* Alarms Feed Table */}
      <div className="bg-[#0a0f18] border border-[#1e293b] overflow-x-auto">
        <table className="w-full text-left text-xs divide-y divide-[#1e293b]">
          <thead className="bg-[#030509] text-[11px] text-[#859399] uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3">Nivel / Estado</th>
              <th className="py-2.5 px-3">Equipo & Campo</th>
              <th className="py-2.5 px-3">Variable Afectada</th>
              <th className="py-2.5 px-3 text-right">Valor Medido</th>
              <th className="py-2.5 px-3 text-right">Umbral Límite</th>
              <th className="py-2.5 px-3">Generación / Cierre</th>
              <th className="py-2.5 px-3">Observaciones Técnicas</th>
              <th className="py-2.5 px-3 text-right">Acción Operativa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]/60">
            {filteredAlerts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-[#859399]">
                  No se registran alertas con los filtros seleccionados
                </td>
              </tr>
            ) : (
              filteredAlerts.map((alt) => {
                const isCrit = alt.nivel === 'CRITICO';
                const isActive = alt.estado === 'ACTIVA';
                return (
                  <tr
                    key={alt.id}
                    className={`hover:bg-[#111827]/60 transition-colors ${
                      isActive && isCrit ? 'bg-[#ef4444]/5' : ''
                    }`}
                  >
                    {/* Level / Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 ${
                            isCrit
                              ? 'bg-[#ef4444] glow-crimson animate-pulse'
                              : 'bg-[#f59e0b]'
                          }`}
                        />
                        <span
                          className={`font-bold ${
                            isCrit ? 'text-[#ef4444]' : 'text-[#f59e0b]'
                          }`}
                        >
                          {alt.nivel}
                        </span>
                        <span className="text-[#859399]">/</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 ${
                            alt.estado === 'ACTIVA'
                              ? 'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30'
                              : alt.estado === 'ATENDIDA'
                              ? 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30'
                              : 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                          }`}
                        >
                          {alt.estado}
                        </span>
                      </div>
                    </td>

                    {/* Equipment */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-bold text-white">{alt.codigoEquipo}</div>
                      <div className="text-[10px] text-[#859399]">{alt.ubicacion}</div>
                    </td>

                    {/* Variable */}
                    <td className="py-3 px-3 text-[#e0e2ec]">
                      {alt.variableAfectada}
                    </td>

                    {/* Measured */}
                    <td className="py-3 px-3 text-right tabular-nums font-bold text-white">
                      {alt.valorMedido.toFixed(1)} <span className="text-[#859399] font-normal text-[10px]">{alt.unidad}</span>
                    </td>

                    {/* Limit */}
                    <td className="py-3 px-3 text-right tabular-nums text-[#859399]">
                      {alt.umbralLimite.toFixed(1)} <span className="text-[10px]">{alt.unidad}</span>
                    </td>

                    {/* Timestamps */}
                    <td className="py-3 px-3 whitespace-nowrap text-[11px]">
                      <div className="text-[#e0e2ec] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#859399]" />
                        {alt.fechaGeneracion}
                      </div>
                      {alt.fechaCierre && (
                        <div className="text-[#10b981] text-[10px] mt-0.5">
                          Cerrada: {alt.fechaCierre}
                        </div>
                      )}
                    </td>

                    {/* Observations */}
                    <td className="py-3 px-3 max-w-xs text-[11px] text-[#859399]">
                      <p className="line-clamp-2">
                        {alt.observaciones || 'Sin anotaciones registradas aún.'}
                      </p>
                      {alt.atendidaPor && (
                        <span className="text-[10px] text-[#00d2ff]">
                          Por: {alt.atendidaPor}
                        </span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      {alt.estado === 'ACTIVA' && !isReadOnly && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => acknowledgeAlert(alt.id)}
                            className="px-2 py-1 bg-[#111827] hover:bg-[#1e293b] text-[#f59e0b] border border-[#f59e0b]/40 text-[11px] transition-colors"
                            title="Reconocer evento operacional"
                          >
                            Atender
                          </button>
                          <button
                            onClick={() => handleOpenCloseModal(alt)}
                            className="px-2 py-1 bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#10b981] border border-[#10b981]/40 text-[11px] transition-colors"
                          >
                            Cerrar con Nota
                          </button>
                        </div>
                      )}

                      {alt.estado === 'ATENDIDA' && !isReadOnly && (
                        <button
                          onClick={() => handleOpenCloseModal(alt)}
                          className="px-2.5 py-1 bg-[#10b981] hover:bg-[#00a572] text-black font-semibold text-[11px] transition-colors"
                        >
                          Cerrar Novedad
                        </button>
                      )}

                      {alt.estado === 'CERRADA' && (
                        <span className="text-[#10b981] text-[11px] flex items-center justify-end gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Resuelta
                        </span>
                      )}

                      {isReadOnly && alt.estado !== 'CERRADA' && (
                        <span className="text-[#859399] text-[10px]">Solo Lectura</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Mandatory Justification for Closing Alert (PRD Criterion 3.2) */}
      {closingAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg bg-[#0a0f18] border border-[#1e293b] shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b] mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#00d2ff]" />
                <h3 className="font-sans font-bold text-white text-base">
                  CIERRE AUDITABLE DE ALERTA OPERACIONAL
                </h3>
              </div>
              <button
                onClick={() => setClosingAlert(null)}
                className="text-[#859399] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#030509] p-3 border border-[#151d2d] mb-4 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[#859399]">Equipo:</span>
                <span className="text-white font-bold">{closingAlert.codigoEquipo} ({closingAlert.nombreEquipo})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#859399]">Variable Desviada:</span>
                <span className="text-[#ef4444] font-bold">{closingAlert.variableAfectada}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#859399]">Valor Registrado:</span>
                <span className="text-white tabular-nums">{closingAlert.valorMedido} {closingAlert.unidad} (Umbral: {closingAlert.umbralLimite} {closingAlert.unidad})</span>
              </div>
            </div>

            <form onSubmit={handleSubmitResolution} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#e0e2ec] mb-1.5">
                  Justificación Técnica / Acción Correctiva Obligatoria:
                  <span className="text-[#ef4444] ml-1">*</span>
                </label>
                <p className="text-[10px] text-[#859399] mb-2">
                  Especifique la intervención de campo, ajuste de VFD, verificación de estrangulador o normalización de instrumentación realizada.
                </p>
                <textarea
                  rows={4}
                  required
                  value={operatorNotes}
                  onChange={(e) => setOperatorNotes(e.target.value)}
                  placeholder="Ej: Se coordinó verificación de choque con cuadrilla en pozo. Se calibró transmisor PT-104 y se restableció presión a 520 PSI nominales."
                  className="w-full bg-[#030509] border border-[#1e293b] focus:border-[#00d2ff] p-2.5 text-xs text-white focus:outline-none resize-none"
                />
              </div>

              {errorMessage && (
                <div className="bg-[#ef4444]/10 border border-[#ef4444] text-[#ef4444] p-2 text-xs">
                  {errorMessage}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setClosingAlert(null)}
                  className="px-3 py-1.5 bg-[#111827] hover:bg-[#1e293b] text-[#859399] hover:text-white text-xs border border-[#1e293b]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#10b981] hover:bg-[#00a572] text-black font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  Firmar y Cerrar Alerta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
