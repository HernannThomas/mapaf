export type EquipmentType = 'VFD' | 'CABEZA_POZO' | 'SEPARADOR' | 'TANQUE' | 'BOMBA';

export type EquipmentStatus = 'OPERATIVO' | 'ADVERTENCIA' | 'CRITICO' | 'OFFLINE';

export type AlertLevel = 'ADVERTENCIA' | 'CRITICO';

export type AlertStatus = 'ACTIVA' | 'ATENDIDA' | 'CERRADA';

export type UserRole = 'ADMIN' | 'OPERADOR' | 'AUDITOR';

export interface TelemetryPoint {
  timestamp: string;
  presion: number; // PSI
  temperatura: number; // °C
  caudal: number; // BPD (Barriles por Día) o MSCFD
  frecuenciaVfd?: number; // Hz (for VFD)
  voltaje?: number; // V
  corriente?: number; // A
  vibracion?: number; // mm/s
  nivel?: number; // % (for Tanks & Separators)
}

export interface Equipment {
  id: string;
  codigo: string;
  nombre: string;
  tipo: EquipmentType;
  ubicacion: string; // e.g. 'Campo Lizama', 'Campo Rubiales'
  bateria: string; // e.g. 'Batería 3 - Manifold Central'
  estado: EquipmentStatus;
  ultimaConexion: string;
  imagen: string;
  
  // Current Telemetry Values
  presionActual: number; // PSI
  temperaturaActual: number; // °C
  caudalActual: number; // BPD
  frecuenciaVfd?: number; // Hz
  voltajeActual?: number; // V
  corrienteActual?: number; // A
  vibracionActual?: number; // mm/s
  nivelActual?: number; // %
  
  // History buffer for sparklines & oscilloscope
  historico: TelemetryPoint[];
  
  // Specific notes or specs
  especificaciones: {
    modelo: string;
    fabricante: string;
    anoInstalacion: number;
    capacidadNominal: string;
    protocoloComunicacion: string; // OPC-UA / Modbus TCP / MQTT
  };
}

export interface Alert {
  id: string;
  equipoId: string;
  codigoEquipo: string;
  nombreEquipo: string;
  tipoEquipo: EquipmentType;
  ubicacion: string;
  nivel: AlertLevel;
  variableAfectada: string;
  valorMedido: number;
  umbralLimite: number;
  unidad: string;
  estado: AlertStatus;
  fechaGeneracion: string;
  fechaCierre?: string;
  atendidaPor?: string;
  observaciones?: string;
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  activo: boolean;
  creadoEn: string;
  ultimoAcceso: string;
}

export interface VariableThreshold {
  variable: string;
  label: string;
  unidad: string;
  tipoEquipo: EquipmentType;
  minAdvertencia: number;
  maxAdvertencia: number;
  minCritico: number;
  maxCritico: number;
}

export interface KpiData {
  tiempoDeteccionMin: number;
  disponibilidadPlantaPct: number;
  coberturaMonitoreoPct: number;
  tiempoRespuestaMin: number;
  reduccionPerdidasPct: number;
  reduccionRondasPct: number;
  alertasAtendidasPct: number;
}
