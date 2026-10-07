import React, { useState } from 'react';
import { ScadaProvider, useScada } from './context/ScadaContext';
import { TopBar, ActiveTab } from './components/TopBar';
import { DashboardView } from './components/DashboardView';
import { SchematicView } from './components/SchematicView';
import { AlertsView } from './components/AlertsView';
import { EquipmentListView } from './components/EquipmentListView';
import { AdminRbacView } from './components/AdminRbacView';
import { EquipmentDetailModal } from './components/EquipmentDetailModal';
import { Equipment } from './types/scada';

const ScadaAppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [inspectionModalEq, setInspectionModalEq] = useState<Equipment | null>(null);
  const { equipment } = useScada();

  // If inspection modal equipment updates in streaming, keep it fresh
  const activeModalEquipment = inspectionModalEq
    ? equipment.find((e) => e.id === inspectionModalEq.id) || inspectionModalEq
    : null;

  return (
    <div className="min-h-screen bg-[#05080e] text-[#e0e2ec] flex flex-col font-mono selection:bg-[#00d2ff]/30 selection:text-white">
      {/* Top Bar with 1-Row 3-Zone Contract */}
      <TopBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Viewport Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            onOpenEquipmentDetail={(eq) => setInspectionModalEq(eq)}
            onNavigateToSchematic={() => setActiveTab('schematic')}
          />
        )}

        {activeTab === 'schematic' && (
          <SchematicView
            onOpenEquipmentDetail={(eq) => setInspectionModalEq(eq)}
          />
        )}

        {activeTab === 'alerts' && <AlertsView />}

        {activeTab === 'equipment' && (
          <EquipmentListView
            onOpenEquipmentDetail={(eq) => setInspectionModalEq(eq)}
          />
        )}

        {activeTab === 'rbac' && <AdminRbacView />}
      </main>

      {/* Modal for Deep Equipment Inspection & Oscilloscope */}
      {activeModalEquipment && (
        <EquipmentDetailModal
          equipment={activeModalEquipment}
          onClose={() => setInspectionModalEq(null)}
        />
      )}

      {/* Quiet Industrial SCADA Footer */}
      <footer className="border-t border-[#1e293b] bg-[#05080e] px-4 lg:px-6 py-3 text-[11px] font-mono text-[#859399]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[#10b981]">
              <span className="w-1.5 h-1.5 bg-[#10b981] rounded-none animate-pulse" />
              TELEMETRÍA ENLACE VIVO: 24/7 ACTIVO
            </span>
            <span aria-hidden="true" className="text-[#334155]">·</span>
            <span>LATENCIA: 32ms</span>
            <span aria-hidden="true" className="text-[#334155]">·</span>
            <span>PROTOCOLO: OPC-UA / TIMESCALEDB</span>
          </div>
          <div>
            <span>SISTEMA SCADA ECOPETROL · VIBE DEPLOY 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ScadaProvider>
      <ScadaAppContent />
    </ScadaProvider>
  );
}
