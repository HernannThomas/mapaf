"""
API Gateway Proxy & Aggregator.
Routes client calls to dedicated backend microservices with thread-pool fan-out.
"""
import json
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, Any

from common.config import MICROSERVICES

class ServiceProxy:
    def __init__(self, timeout: float = 2.0):
        self.timeout = timeout
        self.executor = ThreadPoolExecutor(max_workers=8)

    def _fetch_json(self, url: str) -> Any:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "SCADA-Gateway/1.0"})
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                if resp.status == 200:
                    return json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            return {"error": str(e), "unavailable": True}
        return None

    def _post_json(self, url: str, data: dict) -> Any:
        try:
            body = json.dumps(data).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=body,
                headers={"Content-Type": "application/json", "User-Agent": "SCADA-Gateway/1.0"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            return {"error": str(e), "unavailable": True}

    def get_dashboard_summary(self) -> Dict[str, Any]:
        """
        Fans out concurrent calls to Telemetry, Production, Alerts, and Assets microservices
        and aggregates them into a single high-performance payload.
        """
        futures = {
            "telemetry": self.executor.submit(self._fetch_json, f"{MICROSERVICES['telemetry']}/metrics/current"),
            "production": self.executor.submit(self._fetch_json, f"{MICROSERVICES['production']}/production/balance"),
            "alerts": self.executor.submit(self._fetch_json, f"{MICROSERVICES['alerts']}/alerts"),
            "assets": self.executor.submit(self._fetch_json, f"{MICROSERVICES['assets']}/assets"),
        }

        results = {}
        for key, fut in futures.items():
            try:
                results[key] = fut.result(timeout=self.timeout + 0.5)
            except Exception as e:
                results[key] = {"error": str(e)}

        return {
            "status": "OPERATIVO",
            "telemetry": results.get("telemetry", {}),
            "production": results.get("production", {}),
            "alerts": results.get("alerts", []),
            "assets": results.get("assets", []),
            "gateway": {
                "services": {
                    "telemetry": "online" if isinstance(results.get("telemetry"), dict) and not results["telemetry"].get("unavailable") else "offline",
                    "production": "online" if isinstance(results.get("production"), dict) and not results["production"].get("unavailable") else "offline",
                    "alerts": "online" if isinstance(results.get("alerts"), list) or (isinstance(results.get("alerts"), dict) and not results["alerts"].get("unavailable")) else "offline",
                    "assets": "online" if isinstance(results.get("assets"), list) or (isinstance(results.get("assets"), dict) and not results["assets"].get("unavailable")) else "offline",
                }
            }
        }

    def forward_request(self, service_name: str, path: str, method: str = "GET", data: dict = None) -> Any:
        base_url = MICROSERVICES.get(service_name)
        if not base_url:
            return {"error": f"Unknown microservice {service_name}"}

        target_url = f"{base_url}{path}"
        if method.upper() == "POST":
            return self._post_json(target_url, data or {})
        return self._fetch_json(target_url)
