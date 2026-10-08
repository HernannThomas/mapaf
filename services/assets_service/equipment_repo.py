"""
Equipment Repository and Digital Twin for Plant Subsystems.
"""
from typing import Dict, List, Optional
from .models import EquipmentItem, PlantModule

class EquipmentRepository:
    def __init__(self):
        self._modules: Dict[str, PlantModule] = {
            "dashboard": PlantModule(
                id="dashboard",
                title="Dashboard General",
                icon="dashboard",
                description="Vista panorámica de telemetría y balance de producción",
                equipment_count=1
            ),
            "pozos": PlantModule(
                id="pozos",
                title="Pozos (Wells)",
                icon="pozos",
                description="Monitoreo de cabezales y líneas de flujo de producción",
                equipment_count=3,
                items=[
                    EquipmentItem("PZ-01", "Pozo SPS-01", "pozos", "OPERATIVO", "Macropera A", {"thp": "180 psi", "chp": "60 psi", "bpd": 850}),
                    EquipmentItem("PZ-02", "Pozo SPS-02", "pozos", "OPERATIVO", "Macropera A", {"thp": "165 psi", "chp": "55 psi", "bpd": 720}),
                    EquipmentItem("PZ-03", "Pozo SPS-03", "pozos", "EN_ESPERA", "Macropera B", {"thp": "90 psi", "chp": "20 psi", "bpd": 0}),
                ]
            ),
            "separador": PlantModule(
                id="separador",
                title="Separador de Prueba",
                icon="separador",
                description="Separador Trifásico Horizontal SPS-01 (Petróleo, Agua, Gas)",
                equipment_count=1,
                items=[
                    EquipmentItem("SPS-01", "Separador SPS-01", "separador", "OPERATIVO", "Estación Central", {
                        "designPressure": "150 psi",
                        "workingPressure": "85 psi",
                        "temperature": "112 °F",
                        "volume": "120 bbls",
                        "weirHeight": "1.15 m"
                    })
                ]
            ),
            "tanques": PlantModule(
                id="tanques",
                title="Tanques de Almacenamiento",
                icon="tanques",
                description="Batería de tanques de crudo y agua clarificada",
                equipment_count=2,
                items=[
                    EquipmentItem("TK-101", "Tanque Crudo 5000 bbls", "tanques", "OPERATIVO", "Patio Tanques", {"level": "74%", "apiGravity": "28.4"}),
                    EquipmentItem("TK-102", "Tanque Agua Producida", "tanques", "OPERATIVO", "Patio Tanques", {"level": "41%", "oilPpm": "45 ppm"}),
                ]
            ),
            "piscina": PlantModule(
                id="piscina",
                title="Piscina API / Skimmer",
                icon="piscina",
                description="Fosa API de sedimentación y recuperación de hidrocarburo",
                equipment_count=1,
                items=[
                    EquipmentItem("API-01", "Piscina Separadora API", "piscina", "OPERATIVO", "Área Efluentes", {"capacity": "1500 bbls", "oilLayer": "1.2 cm"})
                ]
            ),
            "tablero": PlantModule(
                id="tablero",
                title="Tablero Eléctrico / CCM",
                icon="tablero",
                description="Centro de Control de Motores (CCM) y bancos de variadores",
                equipment_count=1,
                items=[
                    EquipmentItem("CCM-01", "Tablero Distribución 480V", "tablero", "OPERATIVO", "Cuarto Eléctrico", {"voltage": "480 V", "current": "142 A", "freq": "60 Hz"})
                ]
            ),
            "bombas": PlantModule(
                id="bombas",
                title="Bombas de Transferencia",
                icon="bombas",
                description="Bombas centrífugas y de cavidad progresiva (BCP)",
                equipment_count=2,
                items=[
                    EquipmentItem("P-101A", "Bomba Crudo Principal", "bombas", "OPERATIVO", "Manifold Bombas", {"rpm": 1750, "flow": "85 gpm", "pressure": "95 psi"}),
                    EquipmentItem("P-101B", "Bomba Crudo Respaldo", "bombas", "EN_ESPERA", "Manifold Bombas", {"rpm": 0, "flow": "0 gpm", "pressure": "0 psi"}),
                ]
            ),
            "alertas": PlantModule(
                id="alertas",
                title="Gestor de Alertas",
                icon="alertas",
                description="Registro histórico y supervisión de enclavamientos",
                equipment_count=0
            ),
            "reportes": PlantModule(
                id="reportes",
                title="Reportes de Operación",
                icon="reportes",
                description="Balances fiscales de 24 horas y bitácora de turnos",
                equipment_count=0
            ),
            "usuarios": PlantModule(
                id="usuarios",
                title="Control de Usuarios",
                icon="usuarios",
                description="Gestión de operadores, supervisores y permisos SENA-CIES",
                equipment_count=3
            ),
            "configuracion": PlantModule(
                id="configuracion",
                title="Configuración SCADA",
                icon="configuracion",
                description="Parámetros de telemetría, red industrial y lazos PID",
                equipment_count=0
            ),
        }

    def get_all_modules(self) -> List[PlantModule]:
        return list(self._modules.values())

    def get_module(self, module_id: str) -> Optional[PlantModule]:
        return self._modules.get(module_id.lower())
