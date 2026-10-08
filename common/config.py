"""
Centralized Configuration for SCADA SPS-01 Microservices.
"""
import os

TELEMETRY_PORT = int(os.environ.get("TELEMETRY_PORT", 8001))
PRODUCTION_PORT = int(os.environ.get("PRODUCTION_PORT", 8002))
ALERTS_PORT = int(os.environ.get("ALERTS_PORT", 8003))
ASSETS_PORT = int(os.environ.get("ASSETS_PORT", 8004))
GATEWAY_PORT = int(os.environ.get("GATEWAY_PORT", 8000))

HOST = os.environ.get("SCADA_HOST", "0.0.0.0")
SERVICE_HOST = os.environ.get("SERVICE_HOST", "127.0.0.1")

MICROSERVICES = {
    "telemetry": f"http://{SERVICE_HOST}:{TELEMETRY_PORT}",
    "production": f"http://{SERVICE_HOST}:{PRODUCTION_PORT}",
    "alerts": f"http://{SERVICE_HOST}:{ALERTS_PORT}",
    "assets": f"http://{SERVICE_HOST}:{ASSETS_PORT}",
}
