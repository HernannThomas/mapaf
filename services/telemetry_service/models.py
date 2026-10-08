"""
Data Models for Telemetry Service (SCADA SPS-01).
Direct Python port of Java SeparatorMetrics with time-series history and serialization.
"""
from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import List, Dict, Any

@dataclass
class SeparatorMetrics:
    pressure: float = 85.0              # 85 psi
    pressure_range: str = "Rango: 50-120 psi"
    fluid_level: float = 62.0           # 62%
    fluid_status: str = "Estable — 1.2 m"
    oil_percent: float = 68.5           # 68.5%
    oil_quality: str = "Calidad: Excelente"
    water_percent: float = 28.3         # 28.3%
    water_status: str = "Retorno en rango base"
    gas_flow: float = 125.0             # 125 MSCFD
    gas_status: str = "Normal — Línea de venteo"
    
    # Valvulas y Estados Operativos
    inlet_valve_open: bool = True
    diluent_valve_percent: float = 15.0 # Válvula de diluente abierta al 15%
    gas_valve_open: bool = True
    water_valve_open: bool = True
    oil_valve_open: bool = True
    
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        # Format matching Java bean property names for seamless compatibility
        d["pressureRange"] = self.pressure_range
        d["fluidLevel"] = self.fluid_level
        d["fluidStatus"] = self.fluid_status
        d["oilPercent"] = self.oil_percent
        d["oilQuality"] = self.oil_quality
        d["waterPercent"] = self.water_percent
        d["waterStatus"] = self.water_status
        d["gasFlow"] = self.gas_flow
        d["gasStatus"] = self.gas_status
        d["diluentValvePercent"] = self.diluent_valve_percent
        return d
