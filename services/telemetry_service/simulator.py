"""
SCADA Field Simulator for Separator SPS-01.
Simulates live sensor signals with realistic industrial micro-variations.
"""
import math
import time
import threading
from datetime import datetime
from collections import deque
from .models import SeparatorMetrics

class TelemetrySimulator:
    def __init__(self, history_limit: int = 60):
        self._metrics = SeparatorMetrics()
        self._lock = threading.Lock()
        self._history = deque(maxlen=history_limit)
        self._running = False
        self._thread = None
        self._tick = 0
        
        # Save initial state
        self._record_history()

    def get_current_metrics(self) -> SeparatorMetrics:
        with self._lock:
            return SeparatorMetrics(
                pressure=round(self._metrics.pressure, 1),
                pressure_range=self._metrics.pressure_range,
                fluid_level=round(self._metrics.fluid_level, 1),
                fluid_status=self._metrics.fluid_status,
                oil_percent=round(self._metrics.oil_percent, 1),
                oil_quality=self._metrics.oil_quality,
                water_percent=round(self._metrics.water_percent, 1),
                water_status=self._metrics.water_status,
                gas_flow=round(self._metrics.gas_flow, 1),
                gas_status=self._metrics.gas_status,
                inlet_valve_open=self._metrics.inlet_valve_open,
                diluent_valve_percent=self._metrics.diluent_valve_percent,
                gas_valve_open=self._metrics.gas_valve_open,
                water_valve_open=self._metrics.water_valve_open,
                oil_valve_open=self._metrics.oil_valve_open,
                timestamp=datetime.utcnow().isoformat()
            )

    def get_history(self):
        with self._lock:
            return list(self._history)

    def update_metrics(self, data: dict):
        with self._lock:
            if "pressure" in data:
                self._metrics.pressure = float(data["pressure"])
            if "fluid_level" in data or "fluidLevel" in data:
                self._metrics.fluid_level = float(data.get("fluid_level", data.get("fluidLevel")))
            if "oil_percent" in data or "oilPercent" in data:
                self._metrics.oil_percent = float(data.get("oil_percent", data.get("oilPercent")))
            if "water_percent" in data or "waterPercent" in data:
                self._metrics.water_percent = float(data.get("water_percent", data.get("waterPercent")))
            if "gas_flow" in data or "gasFlow" in data:
                self._metrics.gas_flow = float(data.get("gas_flow", data.get("gasFlow")))
            if "diluent_valve_percent" in data or "diluentValvePercent" in data:
                self._metrics.diluent_valve_percent = float(data.get("diluent_valve_percent", data.get("diluentValvePercent")))
            self._record_history()

    def reset_metrics(self):
        with self._lock:
            self._metrics = SeparatorMetrics()
            self._record_history()

    def _record_history(self):
        self._history.append({
            "timestamp": datetime.utcnow().strftime("%H:%M:%S"),
            "pressure": round(self._metrics.pressure, 1),
            "fluid_level": round(self._metrics.fluid_level, 1),
            "oil_percent": round(self._metrics.oil_percent, 1),
            "water_percent": round(self._metrics.water_percent, 1),
            "gas_flow": round(self._metrics.gas_flow, 1),
        })

    def start(self, interval_sec: float = 1.0):
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._loop, args=(interval_sec,), daemon=True)
        self._thread.start()

    def stop(self):
        self._running = False

    def _loop(self, interval_sec: float):
        while self._running:
            self._tick += 1
            with self._lock:
                # Small physical perturbation (within +/- 0.5% for realism)
                p_noise = math.sin(self._tick * 0.15) * 0.4 + math.cos(self._tick * 0.05) * 0.2
                self._metrics.pressure = max(50.0, min(120.0, 85.0 + p_noise))

                lvl_noise = math.cos(self._tick * 0.1) * 0.3
                self._metrics.fluid_level = max(10.0, min(95.0, 62.0 + lvl_noise))

                oil_noise = math.sin(self._tick * 0.08) * 0.15
                self._metrics.oil_percent = max(40.0, min(90.0, 68.5 + oil_noise))

                water_noise = -oil_noise * 0.8
                self._metrics.water_percent = max(10.0, min(50.0, 28.3 + water_noise))

                gas_noise = math.sin(self._tick * 0.2) * 1.2
                self._metrics.gas_flow = max(80.0, min(160.0, 125.0 + gas_noise))

                self._record_history()
            time.sleep(interval_sec)
