/**
 * SCADA SPS-01 Live HMI Logic & P&ID Canvas Engine.
 * Interacts with Python Microservices (Telemetry, Production, Alerts, Assets).
 */

const state = {
  telemetry: {
    pressure: 85.0,
    pressureRange: "Rango: 50-120 psi",
    fluidLevel: 62.0,
    fluidStatus: "Estable — 1.2 m",
    oilPercent: 68.5,
    oilQuality: "Calidad: Excelente",
    waterPercent: 28.3,
    waterStatus: "Retorno en rango base",
    gasFlow: 125.0,
    gasStatus: "Normal — Línea de venteo"
  },
  production: {
    netCrude: "1,680 bbls",
    totalWater: "690 bbls",
    ventedGas: "0.12 MMSCF"
  },
  alerts: [
    { id: "alt-01", message: "Presión regulada — Presostato OK", type: "NORMAL" },
    { id: "alt-02", message: "Válvula de diluente abierta (15%)", type: "WARNING" }
  ],
  animPhase: 0.0
};

// Canvas references
const canvas = document.getElementById("pidCanvas");
const ctx = canvas ? canvas.getContext("2d") : null;

function resizeCanvas() {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
}
window.addEventListener("resize", resizeCanvas);

// Canvas P&ID Rendering Loop
function renderSchematic() {
  if (!canvas || !ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  // Separator Vessel Geometry
  const vesselW = Math.min(380, w * 0.46);
  const vesselH = Math.min(170, h * 0.48);
  const vesselX = (w - vesselW) / 2 - 20;
  const vesselY = (h - vesselH) / 2 + 15;
  const cornerArc = 35; // radius for capsule rounded corners

  const pipeColor = "#1E3047";

  // 1. Pipes (P&ID lines)
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = pipeColor;

  // --- ENTRADA MULTIFASICA ---
  const inletY = vesselY + vesselH / 2 + 20;
  const inletStartX = Math.max(30, vesselX - 160);
  const inletEndX = vesselX;

  ctx.beginPath();
  ctx.moveTo(inletStartX, inletY);
  ctx.lineTo(inletEndX, inletY);
  ctx.stroke();

  // Valve Body
  const valveW = 65, valveH = 14, valveX = inletStartX + 20;
  ctx.fillStyle = "#172538";
  ctx.fillRect(valveX, inletY - valveH / 2, valveW, valveH);
  ctx.strokeStyle = "#2D415F";
  ctx.strokeRect(valveX, inletY - valveH / 2, valveW, valveH);

  // Arrow inside Valve
  ctx.fillStyle = "#38BDF8";
  ctx.beginPath();
  ctx.moveTo(valveX + valveW - 14, inletY - 5);
  ctx.lineTo(valveX + valveW - 4, inletY);
  ctx.lineTo(valveX + valveW - 14, inletY + 5);
  ctx.fill();

  ctx.fillStyle = "#38BDF8";
  ctx.font = "bold 10px Segoe UI, sans-serif";
  ctx.fillText("ENTRADA MULTIFÁSICA", inletStartX, inletY - 14);

  // --- SALIDA GAS (Top -> Right) ---
  const gasStartX = vesselX + vesselW * 0.65;
  const gasTopY = Math.max(45, vesselY - 45);
  const gasEndX = Math.min(w - 30, gasStartX + 180);

  ctx.strokeStyle = pipeColor;
  ctx.beginPath();
  ctx.moveTo(gasStartX, vesselY);
  ctx.lineTo(gasStartX, gasTopY);
  ctx.lineTo(gasEndX, gasTopY);
  ctx.stroke();

  ctx.fillStyle = "#2DD4BF";
  ctx.fillText(`SALIDA GAS (${Math.round(state.telemetry.gasFlow)} MSCFD)`, gasStartX + 18, gasTopY - 8);

  // --- SALIDA AGUA (Bottom Left -> Left) ---
  const waterStartX = vesselX + 70;
  const waterEndY = Math.min(h - 25, vesselY + vesselH + 45);
  const waterTurnX = Math.max(30, waterStartX - 90);

  ctx.strokeStyle = pipeColor;
  ctx.beginPath();
  ctx.moveTo(waterStartX, vesselY + vesselH);
  ctx.lineTo(waterStartX, waterEndY);
  ctx.lineTo(waterTurnX, waterEndY);
  ctx.stroke();

  ctx.fillStyle = "#F59E0B";
  ctx.fillText(`SALIDA AGUA (${state.telemetry.waterPercent}%)`, waterTurnX, waterEndY + 16);

  // --- SALIDA ACEITE (Bottom Right -> Right) ---
  const oilStartX = vesselX + vesselW - 70;
  const oilEndY = Math.min(h - 25, vesselY + vesselH + 45);
  const oilTurnX = Math.min(w - 30, oilStartX + 120);

  ctx.strokeStyle = pipeColor;
  ctx.beginPath();
  ctx.moveTo(oilStartX, vesselY + vesselH);
  ctx.lineTo(oilStartX, oilEndY);
  ctx.lineTo(oilTurnX, oilEndY);
  ctx.stroke();

  ctx.fillStyle = "#38BDF8";
  ctx.fillText(`SALIDA ACEITE (${state.telemetry.oilPercent}%)`, oilStartX + 15, oilEndY + 16);

  // 2. Horizontal Vessel Capsule
  ctx.save();
  drawRoundedRect(ctx, vesselX, vesselY, vesselW, vesselH, cornerArc);
  
  // Vessel background gradient
  const bgGrad = ctx.createLinearGradient(vesselX, vesselY, vesselX, vesselY + vesselH);
  bgGrad.addColorStop(0, "#0D1624");
  bgGrad.addColorStop(1, "#070C15");
  ctx.fillStyle = bgGrad;
  ctx.fill();

  // Clip to fill inside capsule only
  ctx.clip();

  // Liquid level
  const fluidPct = Math.max(0, Math.min(100, state.telemetry.fluidLevel));
  const liquidHeight = (vesselH * fluidPct) / 100.0;
  const liquidY = vesselY + vesselH - liquidHeight;

  const fluidGrad = ctx.createLinearGradient(vesselX, liquidY, vesselX, vesselY + vesselH);
  fluidGrad.addColorStop(0, "rgba(6, 68, 52, 0.88)");
  fluidGrad.addColorStop(1, "rgba(4, 38, 30, 0.95)");
  ctx.fillStyle = fluidGrad;
  ctx.fillRect(vesselX, liquidY, vesselW, liquidHeight);

  // Meniscus surface highlight
  ctx.strokeStyle = "#10B981";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(vesselX, liquidY);
  ctx.lineTo(vesselX + vesselW, liquidY);
  ctx.stroke();

  // Text inside fluid
  ctx.fillStyle = "#2DD4BF";
  ctx.font = "bold 13px Segoe UI, sans-serif";
  const lvlText = `NIVEL: ${Math.round(fluidPct)}%`;
  const textMetrics = ctx.measureText(lvlText);
  ctx.fillText(lvlText, vesselX + (vesselW - textMetrics.width) / 2, liquidY + liquidHeight / 2 + 5);

  ctx.restore();

  // Outer Vessel Border glow
  ctx.strokeStyle = "#28415F";
  ctx.lineWidth = 2.2;
  drawRoundedRect(ctx, vesselX, vesselY, vesselW, vesselH, cornerArc);
  ctx.stroke();

  // 3. Animated Particles in Pipes
  drawParticle(inletStartX + 20, inletEndX, inletY, true, "#38BDF8");
  drawParticle(gasStartX, gasEndX, gasTopY, true, "#2DD4BF");
  drawParticle(waterStartX, waterTurnX, waterEndY, false, "#F59E0B");
  drawParticle(oilStartX, oilTurnX, oilEndY, true, "#38BDF8");

  ctx.restore();

  // Step animation phase
  state.animPhase = (state.animPhase + 0.015) % 1.0;
  requestAnimationFrame(renderSchematic);
}

function drawRoundedRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r);
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.closePath();
}

function drawParticle(x1, x2, y, forward, color) {
  const len = Math.abs(x2 - x1);
  if (len <= 0) return;
  const p = forward ? state.animPhase : (1.0 - state.animPhase);
  const px = Math.min(x1, x2) + len * p;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(px, y, 3, 0, Math.PI * 2);
  ctx.fill();
}

// Update DOM elements with live microservices data
function updateUI() {
  const t = state.telemetry;
  const p = state.production;
  const a = state.alerts;

  // KPIs
  document.getElementById("kpiPressureVal").textContent = `${Math.round(t.pressure)} psi`;
  document.getElementById("kpiPressureSub").textContent = t.pressureRange;

  document.getElementById("kpiLevelVal").textContent = `${Math.round(t.fluidLevel)}%`;
  document.getElementById("kpiLevelSub").textContent = t.fluidStatus;
  const lvlBar = document.getElementById("kpiLevelBar");
  if (lvlBar) lvlBar.style.width = `${Math.min(100, Math.max(0, t.fluidLevel))}%`;

  document.getElementById("kpiOilVal").textContent = `${t.oilPercent}%`;
  document.getElementById("kpiOilSub").textContent = t.oilQuality;
  updateCircleGauge("oilCircle", t.oilPercent);

  document.getElementById("kpiWaterVal").textContent = `${t.waterPercent}%`;
  document.getElementById("kpiWaterSub").textContent = t.waterStatus;
  updateCircleGauge("waterCircle", t.waterPercent);

  document.getElementById("kpiGasVal").textContent = `${Math.round(t.gasFlow)} MSCFD`;
  document.getElementById("kpiGasSub").textContent = t.gasStatus;

  // Production
  document.getElementById("prodNetCrude").textContent = p.netCrude || "1,680 bbls";
  document.getElementById("prodTotalWater").textContent = p.totalWater || "690 bbls";
  document.getElementById("prodVentedGas").textContent = p.ventedGas || "0.12 MMSCF";

  // Alerts
  const alertsBox = document.getElementById("alertsList");
  if (alertsBox && Array.isArray(a)) {
    alertsBox.innerHTML = "";
    a.forEach((item) => {
      const pill = document.createElement("div");
      pill.className = `alert-pill ${item.type || "NORMAL"}`;
      pill.innerHTML = `<span class="alert-dot"></span><span>${item.message}</span>`;
      alertsBox.appendChild(pill);
    });
  }
}

function updateCircleGauge(id, pct) {
  const el = document.getElementById(id);
  if (!el) return;
  const circumference = 2 * Math.PI * 10; // r=10 => ~62.8
  const offset = circumference - (pct / 100) * circumference;
  el.style.strokeDasharray = `${circumference}`;
  el.style.strokeDashoffset = `${offset}`;
}

// Polling Gateway
async function pollMicroservices() {
  try {
    const res = await fetch("/api/scada/dashboard-summary");
    if (res.ok) {
      const data = await res.json();
      if (data.telemetry && !data.telemetry.unavailable) state.telemetry = data.telemetry;
      if (data.production && !data.production.unavailable) state.production = data.production;
      if (data.alerts && Array.isArray(data.alerts)) state.alerts = data.alerts;
      updateUI();
    }
  } catch (err) {
    console.warn("Polling error:", err);
  }
}

// User Simulation Controls
window.simulateOverpressure = async function () {
  await fetch("/api/telemetry/metrics/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pressure: 118.5 })
  });
  await fetch("/api/alerts/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Alerta de Sobrepresión en Separador (>115 psi)", type: "CRITICAL" })
  });
  pollMicroservices();
};

window.resetSensors = async function () {
  await fetch("/api/telemetry/metrics/reset", { method: "POST" });
  await fetch("/api/alerts/reset", { method: "POST" });
  pollMicroservices();
};

// Sidebar active switching
document.querySelectorAll(".sidebar-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll(".sidebar-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  resizeCanvas();
  renderSchematic();
  updateUI();
  setInterval(pollMicroservices, 1200);
});
