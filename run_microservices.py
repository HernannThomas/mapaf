"""
SCADA Separador de Prueba SPS-01 - Master Microservices Orchestrator.
Launches all 5 decoupled microservices concurrently, performs health checks,
and opens the live SCADA HMI in your default browser.
"""
import sys
import os
import time
import subprocess
import webbrowser
import urllib.request
import signal

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from common.config import (
    TELEMETRY_PORT,
    PRODUCTION_PORT,
    ALERTS_PORT,
    ASSETS_PORT,
    GATEWAY_PORT
)

SERVICES = [
    {
        "name": "Telemetry Service",
        "script": os.path.join(BASE_DIR, "services", "telemetry_service", "main.py"),
        "port": TELEMETRY_PORT,
        "health_url": f"http://127.0.0.1:{TELEMETRY_PORT}/health",
        "description": "Sensores del Separador, P&ID live feeds y variables operativas"
    },
    {
        "name": "Production Service",
        "script": os.path.join(BASE_DIR, "services", "production_service", "main.py"),
        "port": PRODUCTION_PORT,
        "health_url": f"http://127.0.0.1:{PRODUCTION_PORT}/health",
        "description": "Contabilidad fiscal 24h (Crudo Neto, Agua Total, Gas Venteado)"
    },
    {
        "name": "Alertas Service",
        "script": os.path.join(BASE_DIR, "services", "alerts_service", "main.py"),
        "port": ALERTS_PORT,
        "health_url": f"http://127.0.0.1:{ALERTS_PORT}/health",
        "description": "Alarmas SCADA ISA-18.2 y enclavamientos de seguridad"
    },
    {
        "name": "Assets Service",
        "script": os.path.join(BASE_DIR, "services", "assets_service", "main.py"),
        "port": ASSETS_PORT,
        "health_url": f"http://127.0.0.1:{ASSETS_PORT}/health",
        "description": "Topología de planta (Pozos, Separador, Tanques, Bombas, CCM)"
    },
    {
        "name": "Gateway Service",
        "script": os.path.join(BASE_DIR, "services", "gateway_service", "main.py"),
        "port": GATEWAY_PORT,
        "health_url": f"http://127.0.0.1:{GATEWAY_PORT}/health",
        "description": "API Gateway unificado y Dashboard Web HMI"
    }
]

def check_service_health(url: str, timeout: float = 1.0) -> bool:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "SCADA-Runner/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status == 200
    except Exception:
        return False

def main():
    print("\n" + "=" * 70)
    print("   SISTEMA SCADA SEPARADOR DE PRUEBA SPS-01 — SENA CIES")
    print("   Arquitectura de Microservicios Desacoplados en Python")
    print("=" * 70 + "\n")

    python_executable = sys.executable

    # Iniciar procesos de microservicios
    processes = []
    
    for s in SERVICES:
        print(f"[*] Iniciando {s['name']} en puerto {s['port']}...")
        env = os.environ.copy()
        env["PYTHONPATH"] = BASE_DIR
        
        proc = subprocess.Popen(
            [python_executable, s["script"]],
            cwd=BASE_DIR,
            env=env
        )
        processes.append((s, proc))
        time.sleep(0.3)

    print("\n[*] Esperando a que todos los microservicios estén operativos...")
    max_wait = 15
    start_time = time.time()
    all_ready = False

    while time.time() - start_time < max_wait:
        ready_count = 0
        for s, _ in processes:
            if check_service_health(s["health_url"]):
                ready_count += 1
        if ready_count == len(processes):
            all_ready = True
            break
        time.sleep(0.5)

    print("\n" + "-" * 70)
    print("  ESTADO DE LOS MICROSERVICIOS:")
    for s, _ in processes:
        ok = check_service_health(s["health_url"])
        status_sym = "[ONLINE] " if ok else "[ESPERA] "
        print(f"  {status_sym} {s['name']:<22} -> http://127.0.0.1:{s['port']:<5} ({s['description']})")
    print("-" * 70)

    url_dashboard = f"http://127.0.0.1:{GATEWAY_PORT}"
    print(f"\n[+] Dashboard SCADA disponible en: {url_dashboard}")
    print("[+] Abriendo interfaz en el navegador...")

    try:
        webbrowser.open(url_dashboard)
    except Exception:
        pass

    print("\n[INFO] Presiona Ctrl+C en cualquier momento para detener todos los microservicios.\n")

    def signal_handler(sig, frame):
        print("\n[*] Deteniendo todos los microservicios...")
        for s, proc in processes:
            try:
                proc.terminate()
            except Exception:
                pass
        print("[+] Todos los microservicios han sido detenidos correctamente.")
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)

    try:
        while True:
            for s, proc in processes:
                if proc.poll() is not None:
                    print(f"[ALERTA] {s['name']} se detuvo (código: {proc.returncode}). Reiniciando...")
                    env = os.environ.copy()
                    env["PYTHONPATH"] = BASE_DIR
                    new_proc = subprocess.Popen(
                        [python_executable, s["script"]],
                        cwd=BASE_DIR,
                        env=env
                    )
                    processes[processes.index((s, proc))] = (s, new_proc)
            time.sleep(2)
    except KeyboardInterrupt:
        signal_handler(None, None)

if __name__ == "__main__":
    main()
