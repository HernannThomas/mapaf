import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  Equipment,
  Alert,
  Usuario,
  VariableThreshold,
  KpiData,
  UserRole,
  AlertLevel,
} from '../types/scada';
import {
  INITIAL_EQUIPMENT,
  INITIAL_ALERTS,
  INITIAL_USERS,
  INITIAL_THRESHOLDS,
  INITIAL_KPIS,
} from '../data/initialData';

interface ScadaContextType {
  equipment: Equipment[];
  selectedEquipment: Equipment | null;
  setSelectedEquipment: (eq: Equipment | null) => void;
  alerts: Alert[];
  users: Usuario[];
  thresholds: VariableThreshold[];
  kpis: KpiData;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  isStreaming: boolean;
  setIsStreaming: (streaming: boolean) => void;
  audioAlertsEnabled: boolean;
  setAudioAlertsEnabled: (enabled: boolean) => void;
  selectedField: string;
  setSelectedField: (field: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Actions
  acknowledgeAlert: (alertId: string) => void;
  closeAlert: (alertId: string, observations: string) => { success: boolean; error?: string };
  updateUserRole: (userId: string, newRole: UserRole) => void;
  toggleUserActive: (userId: string) => void;
  addUser: (name: string, email: string, role: UserRole) => void;
  updateThreshold: (variable: string, field: 'minAdvertencia' | 'maxAdvertencia' | 'minCritico' | 'maxCritico', value: number) => void;
  
  // Simulator triggers
  triggerAnomaly: (type: 'PRESSURE_SURGE' | 'VFD_THERMAL_TRIP' | 'PUMP_VIBRATION' | 'SENSOR_OFFLINE' | 'RESET_ALL') => void;
  lastAnomalyNotice: string | null;
  clearAnomalyNotice: () => void;
}

const ScadaContext = createContext<ScadaContextType | undefined>(undefined);

export const ScadaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [equipment, setEquipment] = useState<Equipment[]>(INITIAL_EQUIPMENT);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [users, setUsers] = useState<Usuario[]>(INITIAL_USERS);
  const [thresholds, setThresholds] = useState<VariableThreshold[]>(INITIAL_THRESHOLDS);
  const [kpis, setKpis] = useState<KpiData>(INITIAL_KPIS);
  const [currentRole, setCurrentRole] = useState<UserRole>('ADMIN');
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [audioAlertsEnabled, setAudioAlertsEnabled] = useState<boolean>(true);
  const [selectedField, setSelectedField] = useState<string>('TODOS');
  const [selectedType, setSelectedType] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lastAnomalyNotice, setLastAnomalyNotice] = useState<string | null>(null);

  // Play subtle synth beep on critical alert if audio enabled
  const playAlertBuzzer = useCallback((level: AlertLevel) => {
    if (!audioAlertsEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = level === 'CRITICO' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(level === 'CRITICO' ? 880 : 540, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {
      // AudioContext policy fallback
    }
  }, [audioAlertsEnabled]);

  // Telemetry streaming engine
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      setEquipment((prevList) => {
        return prevList.map((eq) => {
          if (eq.estado === 'OFFLINE') {
            return eq; // No live readings when offline
          }

          // Natural fluctuations
          const pDelta = (Math.random() - 0.5) * 2.8;
          const tDelta = (Math.random() - 0.5) * 0.4;
          const qDelta = (Math.random() - 0.5) * 12.0;

          const newPresion = Math.max(10, Math.round((eq.presionActual + pDelta) * 10) / 10);
          const newTemp = Math.max(10, Math.round((eq.temperaturaActual + tDelta) * 10) / 10);
          const newCaudal = Math.max(0, Math.round((eq.caudalActual + qDelta) * 10) / 10);
          
          let newFreq = eq.frecuenciaVfd;
          let newVolt = eq.voltajeActual;
          let newAmp = eq.corrienteActual;
          let newVib = eq.vibracionActual;
          let newLvl = eq.nivelActual;

          if (eq.frecuenciaVfd !== undefined) {
            newFreq = Math.round((eq.frecuenciaVfd + (Math.random() - 0.5) * 0.3) * 10) / 10;
            newVolt = Math.round(480 + (Math.random() - 0.5) * 4);
            newAmp = Math.round(114 + (Math.random() - 0.5) * 5);
          }
          if (eq.vibracionActual !== undefined) {
            newVib = Math.max(0.1, Math.round((eq.vibracionActual + (Math.random() - 0.5) * 0.15) * 10) / 10);
          }
          if (eq.nivelActual !== undefined) {
            newLvl = Math.min(100, Math.max(0, Math.round((eq.nivelActual + (Math.random() - 0.5) * 0.2) * 10) / 10));
          }

          const nowTime = new Date().toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });

          // Append to history buffer, cap at 30 points
          const updatedHistory = [
            ...eq.historico.slice(eq.historico.length >= 30 ? 1 : 0),
            {
              timestamp: nowTime,
              presion: newPresion,
              temperatura: newTemp,
              caudal: newCaudal,
              frecuenciaVfd: newFreq,
              voltaje: newVolt,
              corriente: newAmp,
              vibracion: newVib,
              nivel: newLvl,
            },
          ];

          // Check against thresholds to determine status
          const relThresholds = thresholds.filter((t) => t.tipoEquipo === eq.tipo);
          let hasCritical = false;
          let hasWarning = false;

          for (const th of relThresholds) {
            let valToTest: number | undefined;
            if (th.variable === 'presion') valToTest = newPresion;
            else if (th.variable === 'temperatura') valToTest = newTemp;
            else if (th.variable === 'frecuenciaVfd') valToTest = newFreq;
            else if (th.variable === 'vibracion') valToTest = newVib;
            else if (th.variable === 'nivel') valToTest = newLvl;

            if (valToTest !== undefined) {
              if (valToTest >= th.maxCritico || valToTest <= th.minCritico) {
                hasCritical = true;
              } else if (valToTest >= th.maxAdvertencia || valToTest <= th.minAdvertencia) {
                hasWarning = true;
              }
            }
          }

          const derivedStatus = hasCritical ? 'CRITICO' : hasWarning ? 'ADVERTENCIA' : 'OPERATIVO';

          return {
            ...eq,
            presionActual: newPresion,
            temperaturaActual: newTemp,
            caudalActual: newCaudal,
            frecuenciaVfd: newFreq,
            voltajeActual: newVolt,
            corrienteActual: newAmp,
            vibracionActual: newVib,
            nivelActual: newLvl,
            estado: derivedStatus,
            ultimaConexion: 'En vivo',
            historico: updatedHistory,
          };
        });
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [isStreaming, thresholds]);

  // Keep selectedEquipment in sync with the live streaming updates
  useEffect(() => {
    if (selectedEquipment) {
      const fresh = equipment.find((e) => e.id === selectedEquipment.id);
      if (fresh) setSelectedEquipment(fresh);
    }
  }, [equipment, selectedEquipment?.id]);

  // Alert acknowledgment
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((alt) =>
        alt.id === alertId ? { ...alt, estado: 'ATENDIDA', atendidaPor: `Operador de Turno (${currentRole})` } : alt
      )
    );
  }, [currentRole]);

  // Alert resolution (Enforcing PRD: mandatory justification)
  const closeAlert = useCallback(
    (alertId: string, observations: string) => {
      if (!observations || observations.trim().length < 8) {
        return {
          success: false,
          error: 'Debe ingresar una observación técnica detallada (mínimo 8 caracteres) para cerrar la novedad operacional.',
        };
      }

      setAlerts((prev) =>
        prev.map((alt) =>
          alt.id === alertId
            ? {
                ...alt,
                estado: 'CERRADA',
                fechaCierre: new Date().toISOString().replace('T', ' ').slice(0, 19),
                atendidaPor: `Operador de Turno (${currentRole})`,
                observaciones: observations.trim(),
              }
            : alt
        )
      );

      // Recompute KPI for attended alerts
      setKpis((prev) => ({
        ...prev,
        alertasAtendidasPct: Math.min(99.4, Math.round((prev.alertasAtendidasPct + 0.5) * 10) / 10),
      }));

      return { success: true };
    },
    [currentRole]
  );

  // RBAC User Actions
  const updateUserRole = useCallback(
    (userId: string, newRole: UserRole) => {
      if (currentRole !== 'ADMIN') return;
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, rol: newRole } : u))
      );
    },
    [currentRole]
  );

  const toggleUserActive = useCallback(
    (userId: string) => {
      if (currentRole !== 'ADMIN') return;
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, activo: !u.activo } : u))
      );
    },
    [currentRole]
  );

  const addUser = useCallback(
    (name: string, email: string, role: UserRole) => {
      if (currentRole !== 'ADMIN') return;
      const newUser: Usuario = {
        id: `usr-${Date.now()}`,
        nombre: name,
        email,
        rol: role,
        activo: true,
        creadoEn: new Date().toISOString().slice(0, 10),
        ultimoAcceso: 'Nunca',
      };
      setUsers((prev) => [newUser, ...prev]);
    },
    [currentRole]
  );

  const updateThreshold = useCallback(
    (variable: string, field: 'minAdvertencia' | 'maxAdvertencia' | 'minCritico' | 'maxCritico', value: number) => {
      if (currentRole !== 'ADMIN') return;
      setThresholds((prev) =>
        prev.map((t) => (t.variable === variable ? { ...t, [field]: value } : t))
      );
    },
    [currentRole]
  );

  // Simulator for anomaly injection
  const triggerAnomaly = useCallback(
    (type: 'PRESSURE_SURGE' | 'VFD_THERMAL_TRIP' | 'PUMP_VIBRATION' | 'SENSOR_OFFLINE' | 'RESET_ALL') => {
      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

      if (type === 'PRESSURE_SURGE') {
        setEquipment((prev) =>
          prev.map((eq) =>
            eq.id === 'eq-001'
              ? { ...eq, presionActual: 994.5, estado: 'CRITICO' }
              : eq
          )
        );
        const newAlt: Alert = {
          id: `alt-${Date.now()}`,
          equipoId: 'eq-001',
          codigoEquipo: 'PZ-LIZ-104',
          nombreEquipo: 'Cabeza de Pozo Lizama 104',
          tipoEquipo: 'CABEZA_POZO',
          ubicacion: 'Campo Lizama',
          nivel: 'CRITICO',
          variableAfectada: 'Presión en Cabeza de Pozo',
          valorMedido: 994.5,
          umbralLimite: 980.0,
          unidad: 'PSI',
          estado: 'ACTIVA',
          fechaGeneracion: nowStr,
          observaciones: 'Sobretensión de presión por restricción de choque hidráulico.',
        };
        setAlerts((prev) => [newAlt, ...prev]);
        playAlertBuzzer('CRITICO');
        setLastAnomalyNotice('Sobrecarga de Presión inyectada en Cabeza de Pozo Lizama 104 (994.5 PSI > 980.0 PSI)');
      } else if (type === 'VFD_THERMAL_TRIP') {
        setEquipment((prev) =>
          prev.map((eq) =>
            eq.id === 'eq-002'
              ? { ...eq, temperaturaActual: 91.5, frecuenciaVfd: 67.8, estado: 'CRITICO' }
              : eq
          )
        );
        const newAlt: Alert = {
          id: `alt-${Date.now()}`,
          equipoId: 'eq-002',
          codigoEquipo: 'VFD-MOT-201',
          nombreEquipo: 'Variador Frecuencia Bomba ESP #2',
          tipoEquipo: 'VFD',
          ubicacion: 'Campo Lizama',
          nivel: 'CRITICO',
          variableAfectada: 'Temperatura Operacional VFD',
          valorMedido: 91.5,
          umbralLimite: 88.0,
          unidad: '°C',
          estado: 'ACTIVA',
          fechaGeneracion: nowStr,
          observaciones: 'Falla térmica crítica en puente inversor IGBT. Enfriamiento insuficiente.',
        };
        setAlerts((prev) => [newAlt, ...prev]);
        playAlertBuzzer('CRITICO');
        setLastAnomalyNotice('Disparo Térmico Crítico simulado en VFD-MOT-201 (91.5 °C > 88.0 °C)');
      } else if (type === 'PUMP_VIBRATION') {
        setEquipment((prev) =>
          prev.map((eq) =>
            eq.id === 'eq-006'
              ? { ...eq, vibracionActual: 6.8, estado: 'ADVERTENCIA' }
              : eq
          )
        );
        const newAlt: Alert = {
          id: `alt-${Date.now()}`,
          equipoId: 'eq-006',
          codigoEquipo: 'BMB-INJ-04',
          nombreEquipo: 'Bomba Booster Despacho de Línea',
          tipoEquipo: 'BOMBA',
          ubicacion: 'Campo Cusiana',
          nivel: 'ADVERTENCIA',
          variableAfectada: 'Vibración Radial de Bomba',
          valorMedido: 6.8,
          umbralLimite: 4.8,
          unidad: 'mm/s',
          estado: 'ACTIVA',
          fechaGeneracion: nowStr,
          observaciones: 'Cavitación incipiente detectada por desbalanceo hidráulico en succión.',
        };
        setAlerts((prev) => [newAlt, ...prev]);
        playAlertBuzzer('ADVERTENCIA');
        setLastAnomalyNotice('Cavitación y vibración anormal inyectada en Bomba Booster BMB-INJ-04 (6.8 mm/s)');
      } else if (type === 'SENSOR_OFFLINE') {
        // PRD Criterion 5.1: If equipment stops emitting telemetry, transition to OFFLINE and generate alert
        setEquipment((prev) =>
          prev.map((eq) =>
            eq.id === 'eq-008'
              ? { ...eq, estado: 'OFFLINE', ultimaConexion: 'Pérdida de señal (>60s)' }
              : eq
          )
        );
        const newAlt: Alert = {
          id: `alt-${Date.now()}`,
          equipoId: 'eq-008',
          codigoEquipo: 'PZ-CSB-082',
          nombreEquipo: 'Cabeza de Pozo Casabe Profundo 82',
          tipoEquipo: 'CABEZA_POZO',
          ubicacion: 'Campo Casabe',
          nivel: 'CRITICO',
          variableAfectada: 'Conectividad Telemetría IoT / Heartbeat',
          valorMedido: 0,
          umbralLimite: 1,
          unidad: 'Estado',
          estado: 'ACTIVA',
          fechaGeneracion: nowStr,
          observaciones: 'Desconexión de telemetría detectada. Timeout de canal inalámbrico > 60s sin paquetes recibidos.',
        };
        setAlerts((prev) => [newAlt, ...prev]);
        playAlertBuzzer('CRITICO');
        setLastAnomalyNotice('Transición automática a OFFLINE activada para Pozo Casabe 82 tras caída de telemetría');
      } else if (type === 'RESET_ALL') {
        setEquipment(INITIAL_EQUIPMENT);
        setAlerts(INITIAL_ALERTS);
        setLastAnomalyNotice('Condiciones nominales de campo restauradas para todos los equipos.');
      }
    },
    [playAlertBuzzer]
  );

  const clearAnomalyNotice = () => setLastAnomalyNotice(null);

  return (
    <ScadaContext.Provider
      value={{
        equipment,
        selectedEquipment,
        setSelectedEquipment,
        alerts,
        users,
        thresholds,
        kpis,
        currentRole,
        setCurrentRole,
        isStreaming,
        setIsStreaming,
        audioAlertsEnabled,
        setAudioAlertsEnabled,
        selectedField,
        setSelectedField,
        selectedType,
        setSelectedType,
        searchQuery,
        setSearchQuery,
        acknowledgeAlert,
        closeAlert,
        updateUserRole,
        toggleUserActive,
        addUser,
        updateThreshold,
        triggerAnomaly,
        lastAnomalyNotice,
        clearAnomalyNotice,
      }}
    >
      {children}
    </ScadaContext.Provider>
  );
};

export const useScada = () => {
  const context = useContext(ScadaContext);
  if (!context) {
    throw new Error('useScada must be used within a ScadaProvider');
  }
  return context;
};
