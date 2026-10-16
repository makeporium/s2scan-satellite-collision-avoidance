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
      const realMiss = this.scenario?.missDistanceMeters || 142;
      const label = isAvoided 
        ? `TCA EXPANDED (${(3.2 * this.maneuverMagnitude).toFixed(1)} km - SAFE)` 
        : `TCA THREAT ZONE (${realMiss} m)`;
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

    // Draw Spacecraft Showcases (Sat A and Sat B)
    const satA = this.scenario?.satA || { satelliteId: 'SAT_A', satClass: 'LEO_COMM' };
    const satB = this.scenario?.satB || { satelliteId: 'SAT_B', satClass: 'LEO_COMM' };

    const isBurningA = isAvoided && (this.whoManeuvers === 'satA' || this.whoManeuvers === 'both');
    const isBurningB = isAvoided && (this.whoManeuvers === 'satB' || this.whoManeuvers === 'both');

    this.drawSpacecraftShowcase(ctx, satAx, satAy, '#00e5ff', satA, isBurningA, isColliding, 0.32 * this.maneuverMagnitude, false);
    this.drawSpacecraftShowcase(ctx, satBx, satBy, '#ff9500', satB, isBurningB, isColliding, 0.35 * this.maneuverMagnitude, true);

    // If 3-Way Cluster: Draw Satellite C (Defunct Debris)
    if (this.scenario?.is3Way && this.scenario?.satC) {
      const satCx = tcaPointX + 105 * (1 - this.simTime * 0.25);
      const satCy = tcaPointY - 95 * (1 - this.simTime * 0.3);

      // Exclusion Zone Circle around Debris
      ctx.strokeStyle = 'rgba(255, 69, 58, 0.5)';
      ctx.fillStyle = 'rgba(255, 69, 58, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(satCx, satCy, 38, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();
      ctx.setLineDash([]);

      // Secondary Hazard Vector from Sat A to Sat C
      ctx.strokeStyle = 'rgba(255, 204, 0, 0.6)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(satAx, satAy);
      ctx.lineTo(satCx, satCy);
      ctx.stroke();
      ctx.setLineDash([]);

      this.drawSpacecraftShowcase(ctx, satCx, satCy, '#ff453a', this.scenario.satC, false, isColliding, 0, false);
    }

    ctx.restore(); // Restore zoom/pan

    // HUD Stats Overlay in top-left corner
    this.drawHUDOverlay(ctx, w, h, isAvoided, isColliding);
  }

  drawSpacecraftShowcase(ctx, x, y, themeColor, sat, isBurning, isColliding, burnDv, isSatB) {
    ctx.save();
    ctx.translate(x, y);

    const isDefunct = sat.isDefunct || sat.satClass === 'NON_MANEUVERABLE';
    const isGEO = sat.isGEO;
    const isCrewed = sat.isCrewed;
    const isFormation = sat.isFormation;
    const isByzantine = sat.liesAboutFuel || (this.scenario?.id === 'scen_byzantine_liar' && isSatB);

    // --- 1. CRAFT GRAPHICS ---
    if (isDefunct) {
      // 1. Defunct Object / Space Debris (Tumbling jagged shard)
      const tumbleAngle = ((Date.now() * 0.0012) % (Math.PI * 2));
      ctx.save();
      ctx.rotate(tumbleAngle);

      // Hazard aura
      ctx.fillStyle = 'rgba(255, 59, 48, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();

      // Jagged metallic fragment
      ctx.fillStyle = '#64748b';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-10, -8);
      ctx.lineTo(6, -11);
      ctx.lineTo(12, 4);
      ctx.lineTo(2, 10);
      ctx.lineTo(-9, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Broken jagged solar boom stump
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(6, -11);
      ctx.lineTo(16, -16);
      ctx.stroke();
      ctx.restore();

    } else if (isGEO) {
      // 2. Geostationary High-Power Craft (Massive gold body + dual long solar arrays + dishes)
      // Dashed ITU ±0.05° orbital slot boundary box
      ctx.save();
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.45)';
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.strokeRect(-28, -24, 56, 48);
      ctx.restore();

      // Deployable Solar Wings
      ctx.fillStyle = '#0284c7';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      // Left solar wing
      ctx.fillRect(-30, -5, 18, 10);
      ctx.strokeRect(-30, -5, 18, 10);
      // Right solar wing
      ctx.fillRect(12, -5, 18, 10);
      ctx.strokeRect(12, -5, 18, 10);

      // Gold MLI bus
      ctx.fillStyle = '#eab308';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1.5;
      ctx.fillRect(-8, -8, 16, 16);
      ctx.strokeRect(-8, -8, 16, 16);

      // Twin Parabolic Dish Antennas
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(-4, -10, 5, Math.PI * 0.8, Math.PI * 1.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(4, -10, 5, Math.PI * 1.2, Math.PI * 2.2);
      ctx.stroke();

    } else if (isCrewed) {
      // 3. Crewed Spacecraft (Crew Dragon: conical capsule + blue human life shield)
      // Glowing blue Human Safety Halo
      const pulse = 18 + Math.sin(Date.now() * 0.005) * 3;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
      ctx.beginPath();
      ctx.arc(0, 0, pulse, 0, Math.PI * 2);
      ctx.fill();

      // White aerodynamic capsule cone
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -12); // nosecone
      ctx.lineTo(8, 6);
      ctx.lineTo(-8, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Dark service trunk
      ctx.fillStyle = '#334155';
      ctx.fillRect(-7, 6, 14, 6);
      ctx.strokeRect(-7, 6, 14, 6);

      // Docking port hatch dot
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(0, -7, 2, 0, Math.PI * 2);
      ctx.fill();

    } else if (isFormation) {
      // 4. Formation Cluster (3 synchronized satellites with cyan baseline links)
      // Inter-satellite baseline triad
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(-12, 8);
      ctx.lineTo(12, 8);
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);

      // 3 satellite nodes
      const nodes = [{x: 0, y: -8}, {x: -12, y: 8}, {x: 12, y: 8}];
      nodes.forEach((n, idx) => {
        ctx.fillStyle = idx === 0 ? themeColor : '#38bdf8';
        ctx.beginPath();
        ctx.arc(n.x, n.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

    } else if (isByzantine) {
      // 5. Byzantine Rogue Satellite (Stealth dark angular body + pulsing red deception signature)
      const flash = Math.sin(Date.now() * 0.008) > 0;
      ctx.fillStyle = flash ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.1)';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();

      // Dark diamond stealth hull
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(9, 0);
      ctx.lineTo(0, 10);
      ctx.lineTo(-9, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Crimson core
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();

    } else {
      // 6. Commercial LEO Satellite (Modern rectangular bus + solar wings)
      // Solar array panels
      ctx.fillStyle = '#0284c7';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.fillRect(-22, -3, 14, 6);
      ctx.strokeRect(-22, -3, 14, 6);
      ctx.fillRect(8, -3, 14, 6);
      ctx.strokeRect(8, -3, 14, 6);

      // Central bus body
      ctx.fillStyle = themeColor;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.fillRect(-6, -6, 12, 12);
      ctx.strokeRect(-6, -6, 12, 12);

      // Phased array optical face
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-3, -3, 6, 6);
    }

    // --- 2. THRUSTER PLUME (If Burning) ---
    if (isBurning) {
      ctx.strokeStyle = 'rgba(0, 255, 200, 0.9)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(0, 22);
      ctx.stroke();

      ctx.fillStyle = 'rgba(0, 255, 200, 0.8)';
      ctx.beginPath();
      ctx.arc(0, 20, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- 3. TELEMETRY & SPEC CARD ---
    const cardW = 160;
    const cardH = 46;
    const cardX = 22;
    const cardY = -22;

    ctx.fillStyle = 'rgba(10, 16, 28, 0.92)';
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 1;
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    // Name & Class badge
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(sat.satelliteId, cardX + 7, cardY + 13);

    // Dynamic Altitude & Velocity
    let altVel = '550 km | 7.59 km/s';
    if (isGEO) altVel = '35,786 km (GEO) | 0.35 km/s';
    else if (isCrewed) altVel = '410 km | 7.66 km/s';
    else if (isDefunct) altVel = '550 km | 14.2 km/s (DEAD)';

    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px JetBrains Mono, monospace';
    ctx.fillText(altVel, cardX + 7, cardY + 24);

    // Status / Constraint Description
    let statusDesc = isDefunct 
      ? '⚠️ NO PROPULSION (DEFUNCT)'
      : (isCrewed ? '👨‍🚀 4 CREW (WEIGHT=∞)' : (isGEO ? '🔒 ITU SLOT RESTRICTED' : (isByzantine ? '🚨 FRAUD / ADVERSARIAL' : (isFormation ? '🔗 3-SAT (3.4x COUPLING)' : `PROP: ${sat.fuelRemainingPct}% (${sat.fuelCategory})`))));
    
    if (isBurning) {
      statusDesc = `BURNING Δv: ${burnDv.toFixed(2)} m/s`;
    } else if (isColliding) {
      statusDesc = 'COLLISION COURSE!';
    }

    ctx.fillStyle = isBurning ? '#4ade80' : (isDefunct || isColliding || isByzantine ? '#f87171' : themeColor);
    ctx.font = 'bold 8px JetBrains Mono, monospace';
    ctx.fillText(statusDesc, cardX + 7, cardY + 36);

    ctx.restore();
  }

  drawHUDOverlay(ctx, w, h, isAvoided, isColliding) {
    const sc = this.scenario || {};
    const tcaSec = sc.tcaSeconds || 94.0;
    const missDistM = sc.missDistanceMeters || 142.0;
    const relSpeed = sc.relativeSpeedKmS || 14.82;
    const pcVal = sc.pcValue || '1.84e-3';

    // Kinetic impact energy for 500kg craft
    const keGj = (0.5 * 500.0 * Math.pow(relSpeed * 1000.0, 2) / 1e9).toFixed(1);
    const tntTons = (keGj / 4.184).toFixed(1);

    const isHighThreat = parseFloat(pcVal) >= 1e-4 || missDistM < 100 || sc.satB?.isDefunct || sc.satB?.isCrewed;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
    ctx.fillRect(15, 15, 260, 100);
    ctx.strokeStyle = isColliding ? '#ff3b30' : (isHighThreat ? '#ff9500' : 'rgba(0, 229, 255, 0.4)');
    ctx.lineWidth = isColliding ? 2 : 1;
    ctx.strokeRect(15, 15, 260, 100);

    // Banner Header
    ctx.fillStyle = isColliding ? '#ff3b30' : (isHighThreat ? '#ff9500' : '#38bdf8');
    ctx.font = 'bold 9px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(
      isColliding 
        ? '⚠️ CRITICAL IMPACT DETECTED!' 
        : (isHighThreat ? '🚨 NASA RED-ALERT CONJUNCTION' : '🛰️ ORBITAL CONJUNCTION RADAR'), 
      25, 30
    );

    const timeRemaining = Math.max(0, (tcaSec * (1 - this.simTime))).toFixed(1);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillText(`TCA Countdown: ${timeRemaining} s | Rel: ${relSpeed} km/s`, 25, 46);
    ctx.fillText(`Kinetic Energy: ${keGj} GJ (~${tntTons} Tons TNT)`, 25, 60);

    let missDistText = `${missDistM} m (HAZARD - Pc: ${pcVal})`;
    let missColor = '#f87171';
    if (isColliding) {
      missDistText = '0.0 m (IMPACT COLLISION!)';
      missColor = '#ff3b30';
    } else if (isAvoided) {
      missDistText = `${(2450 * this.maneuverMagnitude).toFixed(0)} m (SAFE SEPARATION)`;
      missColor = '#4ade80';
    }

    ctx.fillStyle = missColor;
    ctx.fillText(`Miss Distance: ${missDistText}`, 25, 75);

    // Mode and zoom indicator
    ctx.fillStyle = '#64748b';
    ctx.font = '8px JetBrains Mono, monospace';
    ctx.fillText(`Zoom: ${this.zoom.toFixed(1)}x | Mode: ${this.maneuverDirection.toUpperCase()} | Engine: Python 3.12 GIM`, 25, 90);
  }
}

