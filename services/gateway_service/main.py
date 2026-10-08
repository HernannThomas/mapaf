"""
API Gateway & SCADA Dashboard Microservice (Port 8000).
Acts as the unified entry point, reverse-proxy and host of the SCADA Web HMI.
"""
import json
import mimetypes
import os
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from common.config import GATEWAY_PORT, HOST
from services.gateway_service.proxy import ServiceProxy

GATEWAY_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(GATEWAY_DIR, "static")
TEMPLATES_DIR = os.path.join(GATEWAY_DIR, "templates")

proxy = ServiceProxy(timeout=2.0)

class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True

class GatewayHandler(BaseHTTPRequestHandler):
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

    def _serve_file(self, filepath: str, content_type: str = None):
        if not os.path.isfile(filepath):
            self._send_json(404, {"error": "File not found"})
            return

        if not content_type:
            content_type, _ = mimetypes.guess_type(filepath)
            content_type = content_type or "application/octet-stream"

        try:
            with open(filepath, "rb") as f:
                content = f.read()
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self._send_json(500, {"error": str(e)})

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        path = self.path.split("?")[0]

        # 1. Dashboard View
        if path in ("/", "/index.html", "/scada"):
            html_path = os.path.join(TEMPLATES_DIR, "index.html")
            self._serve_file(html_path, "text/html; charset=utf-8")
            return

        # 2. Static Assets
        if path.startswith("/static/"):
            rel_path = path[len("/static/"):].lstrip("/\\")
            filepath = os.path.join(STATIC_DIR, rel_path)
            self._serve_file(filepath)
            return

        # 3. Health check
        if path == "/health":
            self._send_json(200, {
                "status": "healthy",
                "service": "gateway_service",
                "port": GATEWAY_PORT,
                "version": "1.0.0"
            })
            return

        # 4. Aggregated Dashboard Summary
        if path == "/api/scada/dashboard-summary":
            summary = proxy.get_dashboard_summary()
            self._send_json(200, summary)
            return

        # 5. Reverse Proxy Routes
        if path.startswith("/api/telemetry"):
            subpath = path[len("/api/telemetry"):] or "/"
            res = proxy.forward_request("telemetry", subpath, "GET")
            self._send_json(200, res)
            return

        if path.startswith("/api/production"):
            subpath = path[len("/api/production"):] or "/"
            res = proxy.forward_request("production", subpath, "GET")
            self._send_json(200, res)
            return

        if path.startswith("/api/alerts"):
            subpath = path[len("/api/alerts"):] or "/"
            res = proxy.forward_request("alerts", subpath, "GET")
            self._send_json(200, res)
            return

        if path.startswith("/api/assets"):
            subpath = path[len("/api/assets"):] or "/"
            res = proxy.forward_request("assets", subpath, "GET")
            self._send_json(200, res)
            return

        self._send_json(404, {"error": f"Endpoint {path} not found in Gateway"})

    def do_POST(self):
        path = self.path.split("?")[0]
        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length) if content_length > 0 else b"{}"

        try:
            payload = json.loads(post_data.decode("utf-8")) if post_data else {}
        except Exception:
            payload = {}

        if path.startswith("/api/telemetry"):
            subpath = path[len("/api/telemetry"):] or "/"
            res = proxy.forward_request("telemetry", subpath, "POST", payload)
            self._send_json(200, res)
            return

        if path.startswith("/api/production"):
            subpath = path[len("/api/production"):] or "/"
            res = proxy.forward_request("production", subpath, "POST", payload)
            self._send_json(200, res)
            return

        if path.startswith("/api/alerts"):
            subpath = path[len("/api/alerts"):] or "/"
            res = proxy.forward_request("alerts", subpath, "POST", payload)
            self._send_json(200, res)
            return

        self._send_json(404, {"error": f"POST endpoint {path} not supported by Gateway"})

    def log_message(self, format, *args):
        pass

def run():
    server = ThreadingHTTPServer((HOST, GATEWAY_PORT), GatewayHandler)
    print("=" * 60)
    print(f"  SCADA SPS-01 API GATEWAY & DASHBOARD ONLINE")
    print(f"  URL: http://127.0.0.1:{GATEWAY_PORT}")
    print("=" * 60)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("[GATEWAY] Shutting down...")
    finally:
        server.server_close()

if __name__ == "__main__":
    run()
