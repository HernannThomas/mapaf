"""
Data Models for Alerts Service (SCADA SPS-01).
Direct Python port of Java SystemAlert with ISA 18.2 SCADA Alarm standards.
"""
from enum import Enum
from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Dict, Any

class AlertType(str, Enum):
    NORMAL = "NORMAL"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"

@dataclass
class SystemAlert:
    id: str
    message: str
    type: AlertType = AlertType.NORMAL
    acknowledged: bool = False
    timestamp: str = field(default_factory=lambda: datetime.utcnow().strftime("%H:%M:%S"))

    @property
    def background_color(self) -> str:
        if self.type == AlertType.NORMAL:
            return "rgba(6, 78, 59, 0.43)"    # Theme.ALERT_GREEN_BG
        elif self.type == AlertType.WARNING:
            return "rgba(120, 53, 15, 0.43)"  # Theme.ALERT_ORANGE_BG
        else:
            return "rgba(153, 27, 27, 0.45)"  # Red critical BG

    @property
    def border_color(self) -> str:
        if self.type == AlertType.NORMAL:
            return "rgba(16, 185, 129, 0.35)" # Theme.ALERT_GREEN_BORDER
        elif self.type == AlertType.WARNING:
            return "rgba(245, 158, 11, 0.35)" # Theme.ALERT_ORANGE_BORDER
        else:
            return "rgba(239, 68, 68, 0.45)"  # Red critical border

    @property
    def text_color(self) -> str:
        if self.type == AlertType.NORMAL:
            return "#10B981"  # Theme.ACCENT_GREEN
        elif self.type == AlertType.WARNING:
            return "#F59E0B"  # Theme.ACCENT_ORANGE
        else:
            return "#EF4444"  # Red critical text

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "message": self.message,
            "type": self.type.value if hasattr(self.type, "value") else str(self.type),
            "acknowledged": self.acknowledged,
            "timestamp": self.timestamp,
            "backgroundColor": self.background_color,
            "borderColor": self.border_color,
            "textColor": self.text_color
        }
