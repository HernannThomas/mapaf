# SCADA Separador de Prueba SPS-01 — SENA CIES
## Arquitectura de Microservicios Desacoplados en Python

Sistema SCADA industrial para el monitoreo y control en tiempo real del **Separador de Prueba Trifásico SPS-01** (Petróleo, Agua, Gas) y activos de producción asociados.

---

## 🏗️ Arquitectura de Microservicios

El sistema está dividido en **5 microservicios independientes y desacoplados**:

```
                              ┌───────────────────────────────────┐
                              │     SCADA Web HMI / Dashboard     │
                              │     http://localhost:8000/        │
                              └─────────────────┬─────────────────┘
                                                │
                                                ▼
                              ┌───────────────────────────────────┐
                              │     Gateway Service (Port 8000)   │
                              │     API Gateway & Reverse Proxy   │
                              └───────┬───────┬───────┬───────┬───┘
                                      │       │       │       │
              ┌───────────────────────┘       │       │       └────────────────────────┐
              ▼                               ▼       ▼                                ▼
┌──────────────────────────┐    ┌──────────────────────────┐    ┌──────────────────────────┐    ┌──────────────────────────┐
│   Telemetry Service      │    │   Production Service     │    │     Alerts Service       │    │     Assets Service       │
│      (Port 8001)         │    │      (Port 8002)         │    │      (Port 8003)         │    │      (Port 8004)         │
│                          │    │                          │    │                          │    │                          │
│ • Presión (psi)          │    │ • Crudo Neto (bbls)      │    │ • Alarmas ISA 18.2       │    │ • Pozos (Wells)          │
│ • Nivel de Fluido (%)    │    │ • Agua Total (bbls)      │    │ • Enclavamientos         │    │ • Separador SPS-01       │
│ • % Aceite y % Agua      │    │ • Gas Venteado (MMSCF)   │    │ • Reconocimiento (Ack)   │    │ • Tanques y Piscinas     │
│ • Caudal de Gas (MSCFD)  │    │ • Ratio GOR y BSW        │    │ • Estados NORMAL/ALERTA  │    │ • Bombas y Tableros CCM  │
└──────────────────────────┘    └──────────────────────────┘    └──────────────────────────┘    └──────────────────────────┘
```

---

## 🔌 Puertos y Endpoints de la API

| Microservicio | Puerto | Endpoint Principal | Descripción |
|---|---|---|---|
| **Gateway Service** | `8000` | `http://localhost:8000` | Dashboard Web HMI y punto único de entrada |
| | | `GET /api/scada/dashboard-summary` | Agregador concurrido de todos los microservicios |
| **Telemetry Service** | `8001` | `GET /metrics/current` | Telemetría viva de presión, nivel y flujos |
| | | `POST /metrics/update` | Actualización / Override manual de sensores |
| | | `GET /metrics/history` | Historial de telemetría para gráficos |
| **Production Service** | `8002` | `GET /production/balance` | Balance fiscal de 24 horas |
| | | `POST /production/update` | Actualización de acumulados de producción |
| **Alertas Service** | `8003` | `GET /alerts` | Lista de alarmas activas y estados |
| | | `POST /alerts/acknowledge/{id}` | Reconocimiento de alarma por operador |
| | | `POST /alerts/create` | Emisión de nueva alerta |
| **Assets Service** | `8004` | `GET /assets` | Catálogo de módulos de planta y equipos |
| | | `GET /assets/{module_id}` | Detalle de subsistema (pozos, bombas, etc.) |

---

## 🚀 Cómo Ejecutar el Proyecto

### Opción 1: Un Clic con el Launcher (Recomendado en Windows)
Haz doble clic sobre el archivo **`run.bat`** o ejecútalo desde la consola:
```bat
run.bat
```
El script detectará Python, iniciará los 5 microservicios simultáneamente y abrirá automáticamente el navegador en `http://localhost:8000`.

### Opción 2: Ejecución Directa con Python
```bash
python run_microservices.py
```

### Opción 3: Ejecución con Docker Compose
```bash
docker compose up --build
```

---

## 🛑 Cómo Detener los Microservicios
- Presiona **`Ctrl + C`** en la consola del orquestador, o
- Haz doble clic en **`stop.bat`** para liberar los puertos 8000 a 8004.

---

Desarrollado para: **SENA - CIES** | Especialidad Automatización Industrial & SCADA.
