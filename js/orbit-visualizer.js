// S2SCAN Orbital Conjunction Canvas Visualizer
// Aerospace-grade 2D/3D orbital projection with real-time TCA encounter,
// interactive zoom/pan, covariance uncertainty clouds, manual burn vectors,
// and collision impact simulation.

export class OrbitVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!canvasId || !this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.animationFrame = null;
    this.isRunning = true;
    this.simTime = 0.1; // 0 to 1 progress toward TCA
    this.timeDirection = 1;
    this.maneuverExecuted = false;
    this.scenario = null;

    // Interactive Controls State
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.showCovariance = true;
    this.showVelocityVectors = true;
    this.whoManeuvers = 'satA'; // 'satA', 'satB', 'both', 'none'
    this.maneuverMagnitude = 1.0; // delta-v scaling multiplier
    this.maneuverDirection = 'radial'; // 'radial', 'intrack', 'crosstrack'
    this.isManualTime = false;

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    this.animate();
  }

  setScenario(scenario) {
    this.scenario = scenario;
    this.simTime = 0.1;
    this.maneuverExecuted = false;
    this.whoManeuvers = 'satA';
  }

  setManeuverExecuted(status) {
    this.maneuverExecuted = status;
  }

  setWhoManeuvers(who) {
    this.whoManeuvers = who;
  }

  setManeuverMagnitude(mag) {
    this.maneuverMagnitude = Math.max(0.1, Math.min(5.0, mag));
  }

  setManeuverDirection(dir) {
    this.maneuverDirection = dir;
  }

  setManualTime(t) {
    this.simTime = Math.max(0.02, Math.min(0.98, t));
    this.isManualTime = true;
  }

  resumeAutoPlay() {
    this.isManualTime = false;
  }

  setZoom(z) {
    this.zoom = Math.max(0.5, Math.min(3.0, z));
  }

  zoomIn() {
    this.setZoom(this.zoom + 0.2);
  }

  zoomOut() {
    this.setZoom(this.zoom - 0.2);
  }

  resetZoom() {
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
  }

  toggleCovariance(show) {
    this.showCovariance = show;
  }

  toggleVelocityVectors(show) {
    this.showVelocityVectors = show;
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
    if (this.isRunning && !this.isManualTime) {
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

    // Apply zoom and pan transform centered around screen center
    ctx.save();
    ctx.translate(w / 2 + this.panX, h / 2 + this.panY);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-w / 2, -h / 2);

    // Draw deep space star grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = -w * 0.5; x < w * 1.5; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, -h * 0.5);
      ctx.lineTo(x, h * 1.5);
      ctx.stroke();
    }
    for (let y = -h * 0.5; y < h * 1.5; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(-w * 0.5, y);
      ctx.lineTo(w * 1.5, y);
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
    const tcaPointX = cx + orbitRadiusA * 0.95;
    const tcaPointY = cy - 25;

    const progress = this.simTime;
    let satAx = cx + Math.cos(-0.35 + (progress * 1.1) - 0.9) * orbitRadiusA * 1.25;
    let satAy = cy + Math.sin(-0.35 + (progress * 1.1) - 0.9) * orbitRadiusA * 0.7;

    let satBx = cx + Math.cos(0.42 - (progress * 1.05) + 0.8) * orbitRadiusB * 1.2;
    let satBy = cy + Math.sin(0.42 - (progress * 1.05) + 0.8) * orbitRadiusB * 0.75;

    // Apply Maneuver Offset based on whoManeuvers, magnitude, and direction
    let isColliding = false;
    const isAvoided = this.maneuverExecuted && this.whoManeuvers !== 'none';

    if (isAvoided) {
      const divertFactor = Math.max(0, (progress - 0.35) * 45 * this.maneuverMagnitude);
      let dx = 0;
      let dy = 0;

      if (this.maneuverDirection === 'radial') {
        dx = divertFactor * 0.8;
        dy = -divertFactor * 1.2;
      } else if (this.maneuverDirection === 'intrack') {
        dx = divertFactor * 1.4;
        dy = divertFactor * 0.3;
      } else { // crosstrack
        dx = -divertFactor * 0.5;
        dy = -divertFactor * 1.5;
      }

      if (this.whoManeuvers === 'satA' || this.whoManeuvers === 'both') {
        satAx += dx;
        satAy += dy;

        // Draw Sat A Thruster Burn Plume
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.85)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(satAx - dx, satAy - dy);
        ctx.lineTo(satAx, satAy);
        ctx.stroke();

        ctx.fillStyle = 'rgba(0, 255, 200, 0.9)';
        ctx.beginPath();
        ctx.arc(satAx - dx * 0.1, satAy - dy * 0.1, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (this.whoManeuvers === 'satB' || this.whoManeuvers === 'both') {
        satBx -= dx;
        satBy -= dy;

        // Draw Sat B Thruster Burn Plume
        ctx.strokeStyle = 'rgba(255, 180, 0, 0.85)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(satBx + dx, satBy + dy);
        ctx.lineTo(satBx, satBy);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 200, 0, 0.9)';
        ctx.beginPath();
        ctx.arc(satBx + dx * 0.1, satBy + dy * 0.1, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.whoManeuvers === 'none' && progress >= 0.70) {
      // User chose to TEST COLLISION (No maneuver!)
      isColliding = true;
      const flash = Math.sin(Date.now() * 0.02) > 0;

      // Shockwave rings
      ctx.strokeStyle = flash ? '#ff3b30' : 'rgba(255, 59, 48, 0.3)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(tcaPointX, tcaPointY, 35 + (Date.now() % 500) * 0.08, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 59, 48, 0.25)';
      ctx.beginPath();
      ctx.arc(tcaPointX, tcaPointY, 25, 0, Math.PI * 2);
      ctx.fill();

      // Flashing Collision Banner
      ctx.fillStyle = '#ff3b30';
      ctx.font = 'bold 12px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CRITICAL: ORBITAL COLLISION IMPACT DETECTED!', tcaPointX, tcaPointY - 45);
    }

    // Draw Conjunction Covariance Uncertainty Ellipsoid at TCA
    if (this.showCovariance && !isColliding) {
      ctx.save();
      ctx.translate(tcaPointX, tcaPointY);
      ctx.strokeStyle = isAvoided ? 'rgba(0, 255, 136, 0.6)' : 'rgba(255, 59, 48, 0.85)';
      ctx.fillStyle = isAvoided ? 'rgba(0, 255, 136, 0.08)' : 'rgba(255, 59, 48, 0.18)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.ellipse(0, 0, 52, 30, 0.35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();

      // TCA Label
      ctx.fillStyle = isAvoided ? '#00ff88' : '#ff453a';
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      const label = isAvoided 
        ? `TCA EXPANDED (${(3.2 * this.maneuverMagnitude).toFixed(1)} km - SAFE)` 
        : 'TCA THREAT ZONE (142 m)';
      ctx.fillText(label, 0, -38);
      ctx.restore();
    }

    // Draw Velocity Vector Arrows
    if (this.showVelocityVectors) {
      // Sat A Velocity Vector
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(satAx, satAy);
      ctx.lineTo(satAx + 32, satAy - 18);
      ctx.stroke();

      // Sat B Velocity Vector
      ctx.strokeStyle = '#ff9500';
      ctx.beginPath();
      ctx.moveTo(satBx, satBy);
      ctx.lineTo(satBx - 30, satBy + 16);
      ctx.stroke();
    }

    // Draw ISL Laser Link beam between Sat A and Sat B
    if (!isColliding) {
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(satAx, satAy);
      ctx.lineTo(satBx, satBy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Animated ISL Data Packet
      const packetProgress = (Date.now() % 1000) / 1000;
      const packetX = satAx + (satBx - satAx) * packetProgress;
      const packetY = satAy + (satBy - satAy) * packetProgress;
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.arc(packetX, packetY, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Satellite Nodes
    const satAName = this.scenario?.satA?.satelliteId || 'SAT_A';
    const satAStatus = (isAvoided && (this.whoManeuvers === 'satA' || this.whoManeuvers === 'both'))
      ? `BURNING Δv: ${(0.32 * this.maneuverMagnitude).toFixed(2)} m/s`
      : (isColliding ? 'COLLISION COURSE' : 'NOMINAL');
    this.drawSatelliteNode(ctx, satAx, satAy, '#00e5ff', satAName, '550 km | 7.59 km/s', satAStatus);

    const satBName = this.scenario?.satB?.satelliteId || 'SAT_B';
    const satBStatus = (isAvoided && (this.whoManeuvers === 'satB' || this.whoManeuvers === 'both'))
      ? `BURNING Δv: ${(0.35 * this.maneuverMagnitude).toFixed(2)} m/s`
      : (isColliding ? 'COLLISION COURSE' : 'TRACKING');
    this.drawSatelliteNode(ctx, satBx, satBy, '#ff9500', satBName, '551 km | 7.58 km/s', satBStatus);

    ctx.restore(); // Restore zoom/pan

    // HUD Stats Overlay in top-left corner
    this.drawHUDOverlay(ctx, w, h, isAvoided, isColliding);
  }

  drawSatelliteNode(ctx, x, y, color, name, telemetry, status) {
    ctx.fillStyle = color.replace(')', ', 0.25)').replace('rgb', 'rgba');
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(10, 16, 28, 0.9)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    const cardW = 135;
    const cardH = 36;
    const cardX = x + 16;
    const cardY = y - 18;

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
    ctx.font = 'bold 8px JetBrains Mono, monospace';
    ctx.fillText(status, cardX + 6, cardY + 32);
  }

  drawHUDOverlay(ctx, w, h, isAvoided, isColliding) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(15, 15, 220, 85);
    ctx.strokeStyle = isColliding ? '#ff3b30' : 'rgba(0, 229, 255, 0.4)';
    ctx.lineWidth = isColliding ? 2 : 1;
    ctx.strokeRect(15, 15, 220, 85);

    ctx.fillStyle = isColliding ? '#ff3b30' : '#38bdf8';
    ctx.font = 'bold 9px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(isColliding ? '⚠️ CRITICAL IMPACT WARNING' : 'ORBITAL RADAR INTERFEROMETRY', 25, 30);

    const timeRemaining = Math.max(0, (94.2 * (1 - this.simTime))).toFixed(1);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillText(`Time to TCA: ${timeRemaining} s`, 25, 46);
    ctx.fillText(`Zoom: ${this.zoom.toFixed(1)}x | Mode: ${this.maneuverDirection.toUpperCase()}`, 25, 60);

    let missDistText = '142 m (DANGER)';
    let missColor = '#f87171';
    if (isColliding) {
      missDistText = '0.0 m (IMPACT CRASH!)';
      missColor = '#ff3b30';
    } else if (isAvoided) {
      missDistText = `${(2450 * this.maneuverMagnitude).toFixed(0)} m (SAFE)`;
      missColor = '#4ade80';
    }

    ctx.fillStyle = missColor;
    ctx.fillText(`Miss Distance: ${missDistText}`, 25, 74);
  }
}
