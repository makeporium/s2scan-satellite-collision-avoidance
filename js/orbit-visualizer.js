// S2SCAN Orbital Conjunction Canvas Visualizer
// Aerospace-grade 2D/3D orbital projection with real-time TCA encounter,
// ISL crosslink beam, thruster plume diversion, and covariance collision ellipsoid.

export class OrbitVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!canvasId || !this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.animationFrame = null;
    this.isRunning = true;
    this.simTime = 0; // 0 to 1 progress toward TCA
    this.timeDirection = 1;
    this.maneuverExecuted = false;
    this.scenario = null;

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    this.animate();
  }

  setScenario(scenario) {
    this.scenario = scenario;
    this.simTime = 0.1;
    this.maneuverExecuted = false;
  }

  setManeuverExecuted(status) {
    this.maneuverExecuted = status;
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;
  }

  animate() {
    if (this.isRunning) {
      this.simTime += 0.003 * this.timeDirection;
      if (this.simTime > 0.95) this.simTime = 0.95;
      if (this.simTime < 0.05) this.simTime = 0.05;
    }
    this.draw();
    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  draw() {
    const ctx = this.ctx;
    if (!ctx) return;
    const w = this.width;
    const h = this.height;

    // Clear dark space background
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, w, h);

    // Draw deep space star grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const cx = w * 0.48;
    const cy = h * 0.52;
    const earthRadius = Math.min(w, h) * 0.28;

    // Draw Earth Glow Atmosphere
    const earthGrad = ctx.createRadialGradient(cx - 30, cy - 30, earthRadius * 0.2, cx, cy, earthRadius * 1.25);
    earthGrad.addColorStop(0, '#1a3a6b');
    earthGrad.addColorStop(0.7, '#0b1d3a');
    earthGrad.addColorStop(0.95, '#052347');
    earthGrad.addColorStop(1, 'rgba(0, 166, 255, 0)');

    ctx.fillStyle = earthGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, earthRadius * 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Draw Earth Body
    ctx.fillStyle = '#0f2444';
    ctx.beginPath();
    ctx.arc(cx, cy, earthRadius, 0, Math.PI * 2);
    ctx.fill();

    // Earth Continents / Latitude Lines
    ctx.strokeStyle = 'rgba(74, 144, 226, 0.25)';
    ctx.lineWidth = 1.5;
    for (let r = earthRadius * 0.3; r < earthRadius; r += earthRadius * 0.3) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Earth Terminator Rim
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, earthRadius, -Math.PI * 0.4, Math.PI * 0.6);
    ctx.stroke();

    // Orbital Radii
    const orbitRadiusA = earthRadius + 55;
    const orbitRadiusB = earthRadius + 75;

    // Orbit Path A (Cyan)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.35);
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.45)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.ellipse(0, 0, orbitRadiusA * 1.3, orbitRadiusA * 0.72, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Orbit Path B (Amber / Red)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(0.42);
    ctx.strokeStyle = 'rgba(255, 110, 64, 0.45)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.ellipse(0, 0, orbitRadiusB * 1.25, orbitRadiusB * 0.78, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Calculate Satellite Positions based on simulation time
    // At simTime = 0.8, they reach TCA (Encounter Point)
    const tcaPointX = cx + orbitRadiusA * 0.95;
    const tcaPointY = cy - 25;

    // Approach trajectories
    const progress = this.simTime;
    let satAx = cx + Math.cos(-0.35 + (progress * 1.1) - 0.9) * orbitRadiusA * 1.25;
    let satAy = cy + Math.sin(-0.35 + (progress * 1.1) - 0.9) * orbitRadiusA * 0.7;

    let satBx = cx + Math.cos(0.42 - (progress * 1.05) + 0.8) * orbitRadiusB * 1.2;
    let satBy = cy + Math.sin(0.42 - (progress * 1.05) + 0.8) * orbitRadiusB * 0.75;

    // If maneuver is executed, divert Satellite A outward!
    if (this.maneuverExecuted) {
      const divertFactor = Math.max(0, (progress - 0.4) * 55);
      satAx += divertFactor * 0.8;
      satAy -= divertFactor * 1.2;

      // Draw post-burn diversion path (Green)
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.8)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(satAx - divertFactor * 0.8, satAy + divertFactor * 1.2);
      ctx.lineTo(satAx, satAy);
      ctx.stroke();

      // Thruster Plume Flame
      ctx.fillStyle = 'rgba(0, 255, 200, 0.9)';
      ctx.beginPath();
      ctx.arc(satAx - 10, satAy + 10, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Conjunction Risk Covariance Ellipsoid at TCA Point
    ctx.save();
    ctx.translate(tcaPointX, tcaPointY);
    ctx.strokeStyle = this.maneuverExecuted ? 'rgba(0, 255, 136, 0.5)' : 'rgba(255, 59, 48, 0.8)';
    ctx.fillStyle = this.maneuverExecuted ? 'rgba(0, 255, 136, 0.08)' : 'rgba(255, 59, 48, 0.15)';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.ellipse(0, 0, 48, 28, 0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fill();

    // TCA Label
    ctx.fillStyle = this.maneuverExecuted ? '#00ff88' : '#ff453a';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.maneuverExecuted ? 'TCA CLEARED (4.8km)' : 'TCA ENCOUNTER (142m)', 0, -35);
    ctx.restore();

    // Draw ISL Laser Link beam between Sat A and Sat B
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.75)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(satAx, satAy);
    ctx.lineTo(satBx, satBy);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw ISL Data Packet animation
    const packetProgress = (Date.now() % 1200) / 1200;
    const packetX = satAx + (satBx - satAx) * packetProgress;
    const packetY = satAy + (satBy - satAy) * packetProgress;
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.arc(packetX, packetY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Draw Satellite A Marker (Cyan)
    const satAName = this.scenario?.satA?.satelliteId || 'SAT_A';
    this.drawSatelliteNode(ctx, satAx, satAy, '#00e5ff', satAName, '550 km | 7.59 km/s', this.maneuverExecuted ? 'THRUSTER ACTIVE' : 'NOMINAL');

    // Draw Satellite B Marker (Orange)
    const satBName = this.scenario?.satB?.satelliteId || 'SAT_B';
    this.drawSatelliteNode(ctx, satBx, satBy, '#ff9500', satBName, '551 km | 7.58 km/s', 'TRACKING');

    // HUD Stats Overlay in corner
    this.drawHUDOverlay(ctx, w, h);
  }

  drawSatelliteNode(ctx, x, y, color, name, telemetry, status) {
    // Outer glow
    ctx.fillStyle = color.replace(')', ', 0.25)').replace('rgb', 'rgba');
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();

    // Inner core
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();

    // Label card
    ctx.fillStyle = 'rgba(10, 16, 28, 0.85)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    const cardW = 120;
    const cardH = 34;
    const cardX = x + 16;
    const cardY = y - 17;

    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(name, cardX + 6, cardY + 13);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px JetBrains Mono, monospace';
    ctx.fillText(telemetry, cardX + 6, cardY + 23);

    ctx.fillStyle = color;
    ctx.fillText(status, cardX + 6, cardY + 31);
  }

  drawHUDOverlay(ctx, w, h) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(15, 15, 190, 75);
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
    ctx.strokeRect(15, 15, 190, 75);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 9px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('ORBITAL RADAR INTERFEROMETRY', 25, 30);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillText(`Time to TCA: ${(Math.max(0, 94.2 - this.simTime * 94)).toFixed(1)} s`, 25, 46);
    ctx.fillText(`Relative Velocity: 10.84 km/s`, 25, 60);

    const missDist = this.maneuverExecuted ? '4,792 m (SAFE)' : '142 m (DANGER)';
    ctx.fillStyle = this.maneuverExecuted ? '#4ade80' : '#f87171';
    ctx.fillText(`Miss Distance: ${missDist}`, 25, 74);
  }
}
