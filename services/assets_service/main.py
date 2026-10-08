"""
Assets Microservice (Port 8004)
Manages Plant Equipment Topology, Units (Wells, Tanks, Pumps, etc.), and Module definitions.
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

from services.assets_service.equipment_repo import EquipmentRepository

PORT = int(os.environ.get("ASSETS_PORT", 8004))
HOST = os.environ.get("SCADA_HOST", "0.0.0.0")

repo = EquipmentRepository()

class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True

class AssetsHandler(BaseHTTPRequestHandler):
    def _send_json(self, status: int, data: dict):
        body = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/health":
            self._send_json(200, {
                "status": "healthy",
                "service": "assets_service",
                "port": PORT,
                "version": "1.0.0"
            })
        elif path in ("/assets", "/modules", "/"):
            modules = repo.get_all_modules()
            self._send_json(200, [m.to_dict() for m in modules])
        elif path.startswith("/assets/"):
            mod_id = path.replace("/assets/", "").strip()
            mod = repo.get_module(mod_id)
            if mod:
                self._send_json(200, mod.to_dict())
            else:
                self._send_json(404, {"error": f"Module {mod_id} not found"})
        else:
            self._send_json(404, {"error": f"Endpoint {path} not found in Assets Service"})

    def log_message(self, format, *args):
        pass

def run():
    server = ThreadingHTTPServer((HOST, PORT), AssetsHandler)
    print(f"[ASSETS_SERVICE] Running on http://{HOST}:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("[ASSETS_SERVICE] Shutting down...")
    finally:
        server.server_close()

if __name__ == "__main__":
    run()
