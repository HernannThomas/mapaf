"""
Production Accounting & Fiscal Balance Calculator.
Calculates net oil, water and gas balances over 24-hour testing periods.
"""
import threading
from .models import ProductionBalance

class ProductionCalculator:
    def __init__(self):
        self._balance = ProductionBalance()
        self._lock = threading.Lock()

    def get_current_balance(self) -> ProductionBalance:
        with self._lock:
            return ProductionBalance(
                net_crude=self._balance.net_crude,
                total_water=self._balance.total_water,
                vented_gas=self._balance.vented_gas,
                net_crude_bbls=self._balance.net_crude_bbls,
                total_water_bbls=self._balance.total_water_bbls,
                vented_gas_mmscf=self._balance.vented_gas_mmscf,
                water_cut_percent=self._balance.water_cut_percent,
                gor=self._balance.gor,
                period_hours=self._balance.period_hours
            )

    def update_volumes(self, crude_bbls: float = None, water_bbls: float = None, gas_mmscf: float = None):
        with self._lock:
            if crude_bbls is not None:
                self._balance.net_crude_bbls = round(float(crude_bbls), 1)
                self._balance.net_crude = f"{self._balance.net_crude_bbls:,.0f} bbls"

            if water_bbls is not None:
                self._balance.total_water_bbls = round(float(water_bbls), 1)
                self._balance.total_water = f"{self._balance.total_water_bbls:,.0f} bbls"

            if gas_mmscf is not None:
                self._balance.vented_gas_mmscf = round(float(gas_mmscf), 2)
                self._balance.vented_gas = f"{self._balance.vented_gas_mmscf:.2f} MMSCF"

            # Recalculate Water Cut & GOR
            total_liquid = self._balance.net_crude_bbls + self._balance.total_water_bbls
            if total_liquid > 0:
                self._balance.water_cut_percent = round((self._balance.total_water_bbls / total_liquid) * 100.0, 1)

            if self._balance.net_crude_bbls > 0:
                self._balance.gor = round((self._balance.vented_gas_mmscf * 1_000_000) / self._balance.net_crude_bbls, 1)

    def reset_balance(self):
        with self._lock:
            self._balance = ProductionBalance()
