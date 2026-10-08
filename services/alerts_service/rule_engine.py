"""
SCADA Alarm Rule Engine.
Evaluates plant variables and manages the active alarm roster.
"""
import threading
import uuid
from typing import List
from .models import SystemAlert, AlertType

class AlertRuleEngine:
    def __init__(self):
        self._lock = threading.Lock()
        self._alerts = [
            SystemAlert(
                id="alt-01",
                message="Presión regulada — Presostato OK",
                type=AlertType.NORMAL
            ),
            SystemAlert(
                id="alt-02",
                message="Válvula de diluente abierta (15%)",
                type=AlertType.WARNING
            )
        ]

    def get_active_alerts(self) -> List[SystemAlert]:
        with self._lock:
            return list(self._alerts)

    def add_alert(self, message: str, alert_type: str = "NORMAL") -> SystemAlert:
        with self._lock:
            t = AlertType.NORMAL
            if str(alert_type).upper() == "WARNING":
                t = AlertType.WARNING
            elif str(alert_type).upper() == "CRITICAL":
                t = AlertType.CRITICAL

            alert = SystemAlert(
                id=f"alt-{uuid.uuid4().hex[:6]}",
                message=message,
                type=t
            )
            # Add to top of list
            self._alerts.insert(0, alert)
            return alert

    def acknowledge_alert(self, alert_id: str) -> bool:
        with self._lock:
            for a in self._alerts:
                if a.id == alert_id:
                    a.acknowledged = True
                    return True
            return False

    def remove_alert(self, alert_id: str) -> bool:
        with self._lock:
            for i, a in enumerate(self._alerts):
                if a.id == alert_id:
                    del self._alerts[i]
                    return True
            return False

    def reset_alerts(self):
        with self._lock:
            self._alerts = [
                SystemAlert(
                    id="alt-01",
                    message="Presión regulada — Presostato OK",
                    type=AlertType.NORMAL
                ),
                SystemAlert(
                    id="alt-02",
                    message="Válvula de diluente abierta (15%)",
                    type=AlertType.WARNING
                )
            ]
