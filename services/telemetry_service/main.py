"""
Telemetry Microservice (Port 8001)
Responsible for Separator SPS-01 sensor ingestion, streaming & simulated PLC feeds.
"""
import json
import os
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn

# Add root directory to sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from services.telemetry_service.simulator import TelemetrySimulator

PORT = int(os.environ.get("TELEMETRY_PORT", 8001))
HOST = os.environ.get("SCADA_HOST", "0.0.0.0")

simulator = TelemetrySimulator()
simulator.start(interval_sec=1.5)

class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True

class TelemetryHandler(BaseHTTPRequestHandler):
    def _send_json(self, status: int, data: dict):
        body = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/health":
            self._send_json(200, {
                "status": "healthy",
                "service": "telemetry_service",
                "port": PORT,
                "version": "1.0.0"
            })
        elif path in ("/metrics/current", "/metrics", "/"):
            metrics = simulator.get_current_metrics()
            self._send_json(200, metrics.to_dict())
        elif path == "/metrics/history":
            history = simulator.get_history()
            self._send_json(200, {"history": history, "count": len(history)})
        else:
            self._send_json(404, {"error": f"Endpoint {path} not found in Telemetry Service"})

    def do_POST(self):
        path = self.path.split("?")[0]
        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length) if content_length > 0 else b"{}"

        try:
            payload = json.loads(post_data.decode("utf-8")) if post_data else {}
        except Exception:
            payload = {}

        if path in ("/metrics/update", "/metrics"):
            simulator.update_metrics(payload)
            metrics = simulator.get_current_metrics()
            self._send_json(200, {
                "status": "updated",
                "current": metrics.to_dict()
            })
        elif path == "/metrics/reset":
            simulator.reset_metrics()
            self._send_json(200, {
                "status": "reset",
                "current": simulator.get_current_metrics().to_dict()
            })
        else:
            self._send_json(404, {"error": f"POST endpoint {path} not found"})

    def log_message(self, format, *args):
        # Quiet standard output
        pass

def run():
    server = ThreadingHTTPServer((HOST, PORT), TelemetryHandler)
    print(f"[TELEMETRY_SERVICE] Running on http://{HOST}:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("[TELEMETRY_SERVICE] Shutting down...")
    finally:
        simulator.stop()
        server.server_close()

if __name__ == "__main__":
    run()
