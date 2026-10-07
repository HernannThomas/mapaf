import React, { useState } from 'react';
import { useScada } from '../context/ScadaContext';
import { UserRole, VariableThreshold } from '../types/scada';
import { Shield, Users, Sliders, UserPlus, CheckCircle, AlertTriangle, Lock, KeyRound } from 'lucide-react';

export const AdminRbacView: React.FC = () => {
  const {
    users,
    currentRole,
    updateUserRole,
    toggleUserActive,
    addUser,
    thresholds,
    updateThreshold,
  } = useScada();

  const [activeTab, setActiveTab] = useState<'users' | 'thresholds' | 'audit'>('users');

  // Add User Form
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('OPERADOR');
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const isAdmin = currentRole === 'ADMIN';

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    addUser(newUserName.trim(), newUserEmail.trim(), newUserRole);
    setNewUserName('');
    setNewUserEmail('');
    setFormSuccess(`Usuario ${newUserName} añadido con perfil ${newUserRole}`);
    setTimeout(() => setFormSuccess(null), 4000);
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e293b]">
        <div>
          <h2 className="font-sans font-bold text-lg text-white tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#00d2ff]" />
            GESTIÓN DE ROLES (RBAC) & UMBRALES DE DISPARO
          </h2>
          <p className="text-xs text-[#859399] mt-0.5">
            Control granular de accesos, tokens operativos y parametrización de alarmas
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-[#0a0f18] p-1 border border-[#1e293b] text-xs">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 transition-colors ${
              activeTab === 'users'
                ? 'bg-[#111827] text-[#00d2ff] font-bold border-b border-[#00d2ff]'
                : 'text-[#859399] hover:text-white'
            }`}
          >
            USUARIOS & PERMISOS
          </button>
          <button
            onClick={() => setActiveTab('thresholds')}
            className={`px-3 py-1.5 transition-colors ${
              activeTab === 'thresholds'
                ? 'bg-[#111827] text-[#00d2ff] font-bold border-b border-[#00d2ff]'
                : 'text-[#859399] hover:text-white'
            }`}
          >
            UMBRALES OPERACIONALES
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 transition-colors ${
              activeTab === 'audit'
                ? 'bg-[#111827] text-[#00d2ff] font-bold border-b border-[#00d2ff]'
                : 'text-[#859399] hover:text-white'
            }`}
          >
            AUDITORÍA & LOGS
          </button>
        </div>
      </div>

      {/* Permission alert if not admin */}
      {!isAdmin && (
        <div className="bg-[#111827] border-l-2 border-[#f59e0b] p-3 text-xs text-[#e0e2ec] flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#f59e0b] shrink-0" />
          <span>
            Perfil actual: <strong className="text-white">{currentRole}</strong>. La modificación de privilegios de usuario y umbrales operacionales está reservada exclusivamente para el rol <strong>ADMIN (Jefe de Planta)</strong>.
          </span>
        </div>
      )}

      {/* TAB 1: USERS & RBAC */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User List Table */}
          <div className="lg:col-span-2 bg-[#0a0f18] border border-[#1e293b] overflow-hidden">
            <div className="p-3 bg-[#030509] border-b border-[#1e293b] flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#00d2ff]" />
                MATRIZ DE USUARIOS AUTORIZADOS
              </span>
              <span className="text-[11px] text-[#859399]">{users.length} Registrados</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-[#1e293b]">
                <thead className="bg-[#030509] text-[10px] text-[#859399] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Usuario / Email</th>
                    <th className="py-2.5 px-3">Rol Asignado</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3">Último Acceso</th>
                    <th className="py-2.5 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]/60">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-[#111827]/50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-white">{u.nombre}</div>
                        <div className="text-[11px] text-[#859399]">{u.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        {isAdmin ? (
                          <select
                            value={u.rol}
                            onChange={(e) => updateUserRole(u.id, e.target.value as UserRole)}
                            className="bg-[#111827] text-white border border-[#1e293b] p-1 text-xs focus:outline-none"
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="OPERADOR">OPERADOR</option>
                            <option value="AUDITOR">AUDITOR</option>
                          </select>
                        ) : (
                          <span className="px-2 py-0.5 bg-[#111827] border border-[#1e293b] text-white font-bold text-[11px]">
                            {u.rol}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] px-2 py-0.5 font-bold ${
                            u.activo
                              ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                              : 'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30'
                          }`}
                        >
                          {u.activo ? 'ACTIVO' : 'BLOQUEADO'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#859399] text-[11px]">
                        {u.ultimoAcceso}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {isAdmin && (
                          <button
                            onClick={() => toggleUserActive(u.id)}
                            className={`px-2 py-1 text-[11px] border transition-colors ${
                              u.activo
                                ? 'bg-[#111827] text-[#ef4444] border-[#ef4444]/30 hover:bg-[#ef4444]/10'
                                : 'bg-[#111827] text-[#10b981] border-[#10b981]/30 hover:bg-[#10b981]/10'
                            }`}
                          >
                            {u.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add User Form */}
          <div className="bg-[#0a0f18] border border-[#1e293b] p-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#1e293b] mb-4">
              <UserPlus className="w-4 h-4 text-[#00d2ff]" />
              <h3 className="font-sans font-bold text-white text-sm">
                REGISTRAR NUEVO COLABORADOR
              </h3>
            </div>

            {formSuccess && (
              <div className="bg-[#10b981]/20 border border-[#10b981] text-[#10b981] p-2 text-xs mb-3 flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5" />
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#859399] mb-1">Nombre Completo:</label>
                <input
                  type="text"
                  required
                  disabled={!isAdmin}
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Ej: Ing. Laura Restrepo"
                  className="w-full bg-[#030509] border border-[#1e293b] p-2 text-white focus:outline-none focus:border-[#00d2ff] disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[#859399] mb-1">Correo Institucional:</label>
                <input
                  type="email"
                  required
                  disabled={!isAdmin}
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="l.restrepo@ecopetrol.com.co"
                  className="w-full bg-[#030509] border border-[#1e293b] p-2 text-white focus:outline-none focus:border-[#00d2ff] disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[#859399] mb-1">Rol Operativo:</label>
                <select
                  disabled={!isAdmin}
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full bg-[#030509] border border-[#1e293b] p-2 text-white focus:outline-none disabled:opacity-50"
                >
                  <option value="OPERADOR">OPERADOR (Gestión de telemetría y alarmas)</option>
                  <option value="ADMIN">ADMIN (Jefe de planta / Control total)</option>
                  <option value="AUDITOR">AUDITOR (Inspección y reportes solo lectura)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={!isAdmin}
                className="w-full mt-4 py-2 bg-[#00d2ff] hover:bg-[#47d6ff] text-black font-semibold text-xs disabled:opacity-40 transition-colors"
              >
                Crear Credencial de Acceso
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: OPERATIONAL THRESHOLDS */}
      {activeTab === 'thresholds' && (
        <div className="bg-[#0a0f18] border border-[#1e293b] p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#1e293b] mb-4">
            <div>
              <h3 className="font-sans font-bold text-white text-base flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#00d2ff]" />
                CALIBRACIÓN DE UMBRALES DE ALARMA & DISPARO ESD
              </h3>
              <p className="text-xs text-[#859399] mt-0.5">
                Los cambios se aplican inmediatamente al motor de evaluación de telemetría en tiempo real
              </p>
            </div>
            <span className="text-[11px] text-[#10b981] bg-[#10b981]/10 px-2 py-1 border border-[#10b981]/30">
              ● SINCRONIZACIÓN AUTOMÁTICA
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {thresholds.map((th) => (
              <div
                key={`${th.tipoEquipo}-${th.variable}`}
                className="bg-[#030509] border border-[#1e293b] p-4 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-[#151d2d] pb-2">
                  <div>
                    <span className="text-[10px] text-[#859399]">{th.tipoEquipo}</span>
                    <h4 className="text-white font-bold text-sm">{th.label}</h4>
                  </div>
                  <span className="text-xs text-[#00d2ff] font-bold">{th.unidad}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Warning bounds */}
                  <div className="bg-[#111827]/40 p-2 border border-[#f59e0b]/20">
                    <span className="text-[#f59e0b] text-[10px] font-bold block mb-1">
                      RANGO ADVERTENCIA (Min / Max)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        disabled={!isAdmin}
                        value={th.minAdvertencia}
                        onChange={(e) =>
                          updateThreshold(th.variable, 'minAdvertencia', parseFloat(e.target.value) || 0)
                        }
                        className="w-1/2 bg-[#030509] border border-[#1e293b] p-1 text-white text-right font-mono"
                      />
                      <span className="text-[#859399]">-</span>
                      <input
                        type="number"
                        disabled={!isAdmin}
                        value={th.maxAdvertencia}
                        onChange={(e) =>
                          updateThreshold(th.variable, 'maxAdvertencia', parseFloat(e.target.value) || 0)
                        }
                        className="w-1/2 bg-[#030509] border border-[#1e293b] p-1 text-white text-right font-mono"
                      />
                    </div>
                  </div>

                  {/* Critical bounds */}
                  <div className="bg-[#111827]/40 p-2 border border-[#ef4444]/20">
                    <span className="text-[#ef4444] text-[10px] font-bold block mb-1">
                      RANGO CRÍTICO / DISPARO (Min / Max)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        disabled={!isAdmin}
                        value={th.minCritico}
                        onChange={(e) =>
                          updateThreshold(th.variable, 'minCritico', parseFloat(e.target.value) || 0)
                        }
                        className="w-1/2 bg-[#030509] border border-[#1e293b] p-1 text-white text-right font-mono"
                      />
                      <span className="text-[#859399]">-</span>
                      <input
                        type="number"
                        disabled={!isAdmin}
                        value={th.maxCritico}
                        onChange={(e) =>
                          updateThreshold(th.variable, 'maxCritico', parseFloat(e.target.value) || 0)
                        }
                        className="w-1/2 bg-[#030509] border border-[#1e293b] p-1 text-white text-right font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-[#0a0f18] border border-[#1e293b] p-4">
          <div className="text-xs text-[#859399] pb-3 border-b border-[#1e293b] mb-3 flex items-center justify-between">
            <span>REGISTRO INMUTABLE DE SESIONES & TRAZABILIDAD OPERACIONAL</span>
            <span>POLÍTICA DE RETENCIÓN: 365 DÍAS</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="bg-[#030509] p-2.5 border-l-2 border-[#10b981] flex justify-between">
              <div>
                <span className="text-white font-bold">Autenticación exitosa JWT Bearer</span>
                <p className="text-[11px] text-[#859399]">Usuario: Ing. Rodrigo Valenzuela (ADMIN) desde terminal 10.14.20.108</p>
              </div>
              <span className="text-[#859399] text-[10px]">2026-10-07 13:35:10</span>
            </div>

            <div className="bg-[#030509] p-2.5 border-l-2 border-[#f59e0b] flex justify-between">
              <div>
                <span className="text-white font-bold">Alerta reconocida en Pozo Rubiales Pad 18</span>
                <p className="text-[11px] text-[#859399]">Operador Carlos Mendoza inspecciona estrangulador hidráulico</p>
              </div>
              <span className="text-[#859399] text-[10px]">2026-10-07 13:31:52</span>
            </div>

            <div className="bg-[#030509] p-2.5 border-l-2 border-[#00d2ff] flex justify-between">
              <div>
                <span className="text-white font-bold">Sincronización de Gateway IoT OPC-UA / MQTT</span>
                <p className="text-[11px] text-[#859399]">8 dispositivos enlazados con tasa de paquetes de 1,000 evt/s sin pérdida</p>
              </div>
              <span className="text-[#859399] text-[10px]">2026-10-07 13:20:00</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
