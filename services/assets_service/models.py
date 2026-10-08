"""
Data Models for Assets Service (SCADA SPS-01).
Represents plant equipment, topology, and operational modules.
"""
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional

@dataclass
class EquipmentItem:
    id: str
    name: str
    category: str  # pozos, separador, tanques, piscina, tablero, bombas
    status: str    # OPERATIVO, EN_ESPERA, MANTENIMIENTO, ALERTA
    location: str
    parameters: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class PlantModule:
    id: str
    title: str
    icon: str
    description: str
    equipment_count: int
    items: List[EquipmentItem] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["items"] = [it.to_dict() if hasattr(it, "to_dict") else it for it in self.items]
        return d
