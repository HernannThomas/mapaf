"""
Alerts Microservice (Port 8003)
Monitors SCADA alarms, abnormal conditions, and safety interlocks for Separator SPS-01.
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

from services.alerts_service.rule_engine import AlertRuleEngine

PORT = int(os.environ.get("ALERTS_PORT", 8003))
HOST = os.environ.get("SCADA_HOST", "0.0.0.0")

rule_engine = AlertRuleEngine()

class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True

class AlertsHandler(BaseHTTPRequestHandler):
    def _send_json(self, status: int, data: dict):
        body = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/health":
            self._send_json(200, {
                "status": "healthy",
                "service": "alerts_service",
                "port": PORT,
                "version": "1.0.0"
            })
        elif path in ("/alerts", "/"):
            alerts = rule_engine.get_active_alerts()
            self._send_json(200, [a.to_dict() for a in alerts])
        else:
            self._send_json(404, {"error": f"Endpoint {path} not found in Alerts Service"})

    def do_POST(self):
        path = self.path.split("?")[0]
        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length) if content_length > 0 else b"{}"

        try:
            payload = json.loads(post_data.decode("utf-8")) if post_data else {}
        except Exception:
            payload = {}

        if path in ("/alerts", "/alerts/create"):
            msg = payload.get("message", "Nueva alerta SCADA detectada")
            atype = payload.get("type", "WARNING")
            new_alert = rule_engine.add_alert(msg, atype)
            self._send_json(201, {
                "status": "created",
                "alert": new_alert.to_dict()
            })
        elif path.startswith("/alerts/acknowledge/"):
            alert_id = path.replace("/alerts/acknowledge/", "").strip()
            ok = rule_engine.acknowledge_alert(alert_id)
            if ok:
                self._send_json(200, {"status": "acknowledged", "id": alert_id})
            else:
                self._send_json(404, {"error": f"Alert {alert_id} not found"})
        elif path == "/alerts/reset":
            rule_engine.reset_alerts()
            self._send_json(200, {
                "status": "reset",
                "alerts": [a.to_dict() for a in rule_engine.get_active_alerts()]
            })
        else:
            self._send_json(404, {"error": f"POST endpoint {path} not found"})

    def log_message(self, format, *args):
        pass

def run():
    server = ThreadingHTTPServer((HOST, PORT), AlertsHandler)
    print(f"[ALERTS_SERVICE] Running on http://{HOST}:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("[ALERTS_SERVICE] Shutting down...")
    finally:
        server.server_close()

if __name__ == "__main__":
    run()
