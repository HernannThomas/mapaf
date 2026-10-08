"""
Data Models for Production Service (SCADA SPS-01).
Direct Python port of Java ProductionBalance with volumetric accounting.
"""
from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Dict, Any

@dataclass
class ProductionBalance:
    net_crude: str = "1,680 bbls"
    total_water: str = "690 bbls"
    vented_gas: str = "0.12 MMSCF"

    # Numeric representations for calculations
    net_crude_bbls: float = 1680.0
    total_water_bbls: float = 690.0
    vented_gas_mmscf: float = 0.12
    
    # Key Production Indicators
    water_cut_percent: float = 29.1     # BSW (Basic Sediment and Water)
    gor: float = 71.4                   # Gas-to-Oil Ratio (SCF/bbl)
    period_hours: int = 24
    
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        # Compatible keys with Java model
        d["netCrude"] = self.net_crude
        d["totalWater"] = self.total_water
        d["ventedGas"] = self.vented_gas
        d["netCrudeBbls"] = self.net_crude_bbls
        d["totalWaterBbls"] = self.total_water_bbls
        d["ventedGasMmscf"] = self.vented_gas_mmscf
        d["waterCut"] = self.water_cut_percent
        return d
