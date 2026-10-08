"""
Production Accounting Microservice (Port 8002)
Computes and serves the 24-hour production balances (Crudo Neto, Agua Total, Gas Venteado).
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

from services.production_service.calculator import ProductionCalculator

PORT = int(os.environ.get("PRODUCTION_PORT", 8002))
HOST = os.environ.get("SCADA_HOST", "0.0.0.0")

calculator = ProductionCalculator()

class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True

class ProductionHandler(BaseHTTPRequestHandler):
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
                "service": "production_service",
                "port": PORT,
                "version": "1.0.0"
            })
        elif path in ("/production/balance", "/balance", "/"):
            balance = calculator.get_current_balance()
            self._send_json(200, balance.to_dict())
        elif path in ("/production/summary", "/summary"):
            balance = calculator.get_current_balance()
            self._send_json(200, {
                "balance": balance.to_dict(),
                "metrics": {
                    "dailyTargetBbls": 2000,
                    "compliancePercent": round((balance.net_crude_bbls / 2000.0) * 100, 1),
                    "efficiency": "94.2%"
                }
            })
        else:
            self._send_json(404, {"error": f"Endpoint {path} not found in Production Service"})

    def do_POST(self):
        path = self.path.split("?")[0]
        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length) if content_length > 0 else b"{}"

        try:
            payload = json.loads(post_data.decode("utf-8")) if post_data else {}
        except Exception:
            payload = {}

        if path in ("/production/update", "/update"):
            calculator.update_volumes(
                crude_bbls=payload.get("crude_bbls", payload.get("netCrudeBbls")),
                water_bbls=payload.get("water_bbls", payload.get("totalWaterBbls")),
                gas_mmscf=payload.get("gas_mmscf", payload.get("ventedGasMmscf"))
            )
            balance = calculator.get_current_balance()
            self._send_json(200, {
                "status": "updated",
                "current": balance.to_dict()
            })
        elif path in ("/production/reset", "/reset"):
            calculator.reset_balance()
            self._send_json(200, {
                "status": "reset",
                "current": calculator.get_current_balance().to_dict()
            })
        else:
            self._send_json(404, {"error": f"POST endpoint {path} not found in Production Service"})

    def log_message(self, format, *args):
        pass

def run():
    server = ThreadingHTTPServer((HOST, PORT), ProductionHandler)
    print(f"[PRODUCTION_SERVICE] Running on http://{HOST}:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("[PRODUCTION_SERVICE] Shutting down...")
    finally:
        server.server_close()

if __name__ == "__main__":
    run()
