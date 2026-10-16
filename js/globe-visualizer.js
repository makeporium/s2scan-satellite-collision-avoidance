/**
 * S2SCAN 3D Interactive Orbital Globe Visualizer
 * High-performance 3D Earth, Keplerian orbital plane rings, 3D satellite nodes,
 * relative encounter geometry, and collision hazard volume.
 * Supports mouse orbit rotation, panning, and zoom.
 */

export class GlobeVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.rotX = 0.35;
    this.rotY = -0.55;
    this.zoom = 1.0;
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.earthRadius = 140;

    this.scenario = null;
    this.animTime = 0;
    this.is3Way = false;

    this.initEvents();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.startLoop();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width || 800;
    this.canvas.height = rect.height || 500;
  }

  setScenario(sc) {
    this.scenario = sc;
    this.is3Way = (sc && (sc.id === 'scenario-3way' || sc.is3Way));
  }

  initEvents() {
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.rotY += dx * 0.006;
      this.rotX = Math.max(-1.4, Math.min(1.4, this.rotX + dy * 0.006));
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.zoom = Math.max(0.5, Math.min(2.5, this.zoom - e.deltaY * 0.0015));
    }, { passive: false });
  }

  project3D(x, y, z, cx, cy) {
    // Rotate around Y axis (longitude)
    let x1 = x * Math.cos(this.rotY) + z * Math.sin(this.rotY);
    let y1 = y;
    let z1 = -x * Math.sin(this.rotY) + z * Math.cos(this.rotY);

    // Rotate around X axis (latitude/tilt)
    let x2 = x1;
    let y2 = y1 * Math.cos(this.rotX) - z1 * Math.sin(this.rotX);
    let z2 = y1 * Math.sin(this.rotX) + z1 * Math.cos(this.rotX);

    // Perspective projection
    const fov = 650 * this.zoom;
    const distance = 700;
    const scale = fov / (distance + z2);

    return {
      x: cx + x2 * scale,
      y: cy + y2 * scale,
      z: z2,
      scale: scale,
      visible: z2 > -400
    };
  }

  startLoop() {
    const loop = () => {
      this.animTime += 0.015;
      this.draw();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Deep Space Background Stars
    ctx.fillStyle = '#050814';
    ctx.fillRect(0, 0, w, h);

    // Atmospheric outer glow
    const glowRadius = this.earthRadius * this.zoom * 1.35;
    const glowGrad = ctx.createRadialGradient(cx, cy, this.earthRadius * this.zoom * 0.8, cx, cy, glowRadius);
    glowGrad.addColorStop(0, 'rgba(0, 180, 255, 0.25)');
    glowGrad.addColorStop(0.5, 'rgba(0, 100, 255, 0.08)');
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // 1. Draw 3D Earth Wireframe / Continents
    this.drawEarth(cx, cy);

    // 2. Draw 3D Orbital Rings
    this.drawOrbitRings(cx, cy);

    // 3. Draw 3D Satellites & Conjunction Hazard Cones
    this.drawSatellites(cx, cy);

    // 4. Draw HUD Overlay
    this.drawHUD(w, h);
  }

  drawEarth(cx, cy) {
    const ctx = this.ctx;
    const r = this.earthRadius;

    // Base Earth Globe (Dark oceanic blue)
    const earthGrad = ctx.createRadialGradient(cx - r * 0.3 * this.zoom, cy - r * 0.3 * this.zoom, r * 0.1, cx, cy, r * this.zoom);
    earthGrad.addColorStop(0, '#102a45');
    earthGrad.addColorStop(0.7, '#071626');
    earthGrad.addColorStop(1, '#030a12');

    ctx.fillStyle = earthGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r * this.zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw Longitude Lines (Meridians)
    ctx.lineWidth = 0.8;
    for (let lon = 0; lon < Math.PI; lon += Math.PI / 6) {
      ctx.beginPath();
      let started = false;
      for (let lat = -Math.PI / 2; lat <= Math.PI / 2; lat += 0.1) {
        const x = r * Math.cos(lat) * Math.sin(lon);
        const y = r * Math.sin(lat);
        const z = r * Math.cos(lat) * Math.cos(lon);
        const p = this.project3D(x, y, z, cx, cy);
        if (p.z > 0) { // Front face only
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.18)';
          if (!started) { ctx.moveTo(p.x, p.y); started = true; }
          else { ctx.lineTo(p.x, p.y); }
        } else {
          started = false;
        }
      }
      ctx.stroke();
    }

    // Draw Latitude Lines (Parallels)
    for (let lat = -Math.PI / 2 + 0.3; lat < Math.PI / 2; lat += Math.PI / 6) {
      ctx.beginPath();
      let started = false;
      const ringR = r * Math.cos(lat);
      const ringY = r * Math.sin(lat);
      for (let lon = 0; lon <= Math.PI * 2 + 0.1; lon += 0.15) {
        const x = ringR * Math.sin(lon);
        const z = ringR * Math.cos(lon);
        const p = this.project3D(x, ringY, z, cx, cy);
        if (p.z > 0) {
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.18)';
          if (!started) { ctx.moveTo(p.x, p.y); started = true; }
          else { ctx.lineTo(p.x, p.y); }
        } else {
          started = false;
        }
      }
      ctx.stroke();
    }
  }

  drawOrbitRings(cx, cy) {
    const ctx = this.ctx;
    const rOrbitA = this.earthRadius + 60; // LEO 550 km
    const rOrbitB = this.earthRadius + 75; // LEO 620 km

    // Orbit A: Starlink 53° Inclination
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
    this.drawKeplerianRing(rOrbitA, 53 * (Math.PI / 180), 0.2, cx, cy);

    // Orbit B: OneWeb 87.4° Polar Inclination
    ctx.strokeStyle = 'rgba(255, 170, 0, 0.5)';
    this.drawKeplerianRing(rOrbitB, 87.4 * (Math.PI / 180), 1.8, cx, cy);

    // Orbit C (If 3-way cluster): Debris Orbit
    if (this.is3Way) {
      ctx.strokeStyle = 'rgba(255, 71, 87, 0.6)';
      ctx.setLineDash([4, 4]);
      this.drawKeplerianRing(rOrbitA + 5, 71.0 * (Math.PI / 180), 0.8, cx, cy);
      ctx.setLineDash([]);
    }
  }

  drawKeplerianRing(radius, inc, raan, cx, cy) {
    const ctx = this.ctx;
    ctx.beginPath();
    let started = false;

    for (let theta = 0; theta <= Math.PI * 2 + 0.1; theta += 0.08) {
      // Keplerian coordinates to 3D Cartesian
      const x0 = radius * Math.cos(theta);
      const y0 = radius * Math.sin(theta);
      const z0 = 0;

      // Apply inclination and RAAN rotations
      const x1 = x0;
      const y1 = y0 * Math.cos(inc) - z0 * Math.sin(inc);
      const z1 = y0 * Math.sin(inc) + z0 * Math.cos(inc);

      const x2 = x1 * Math.cos(raan) + z1 * Math.sin(raan);
      const y2 = y1;
      const z2 = -x1 * Math.sin(raan) + z1 * Math.cos(raan);

      const p = this.project3D(x2, y2, z2, cx, cy);
      if (!started) { ctx.moveTo(p.x, p.y); started = true; }
      else { ctx.lineTo(p.x, p.y); }
    }
    ctx.stroke();
  }

  drawSatellites(cx, cy) {
    const ctx = this.ctx;
    const satA = this.scenario?.satA || { satelliteId: 'STARLINK-3104', satClass: 'LEO_COMM' };
    const satB = this.scenario?.satB || { satelliteId: 'ONEWEB-0412', satClass: 'LEO_COMM' };

    const isGEO_A = satA.isGEO;
    const isGEO_B = satB.isGEO;

    const rOrbitA = isGEO_A ? (this.earthRadius + 130) : (this.earthRadius + 55);
    const rOrbitB = isGEO_B ? (this.earthRadius + 130) : (this.earthRadius + 68);

    // Sat A Position
    const incA = isGEO_A ? 0.05 : (53 * Math.PI / 180);
    const thetaA = 1.2 - Math.sin(this.animTime * 0.4) * 0.12;
    const pA = this.getSatellitePos(rOrbitA, incA, 0.2, thetaA, cx, cy);

    // Sat B Position
    const incB = isGEO_B ? 0.05 : (87.4 * Math.PI / 180);
    const thetaB = 1.25 + Math.sin(this.animTime * 0.4) * 0.12;
    const pB = this.getSatellitePos(rOrbitB, incB, 1.8, thetaB, cx, cy);

    // Conjunction Intersection Hazard Sphere
    const pConj = this.getSatellitePos((rOrbitA + rOrbitB) / 2, 53 * (Math.PI / 180), 0.2, 1.22, cx, cy);
    const pulseR = (14 + Math.sin(this.animTime * 6) * 5) * pConj.scale;

    // Pulsing Red Collision Zone
    const hazardGrad = ctx.createRadialGradient(pConj.x, pConj.y, 2, pConj.x, pConj.y, pulseR);
    hazardGrad.addColorStop(0, 'rgba(255, 71, 87, 0.85)');
    hazardGrad.addColorStop(0.5, 'rgba(255, 71, 87, 0.3)');
    hazardGrad.addColorStop(1, 'rgba(255, 71, 87, 0)');
    ctx.fillStyle = hazardGrad;
    ctx.beginPath();
    ctx.arc(pConj.x, pConj.y, pulseR, 0, Math.PI * 2);
    ctx.fill();

    // Connecting Warning Vector between A and B
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255, 71, 87, 0.7)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(pA.x, pA.y);
    ctx.lineTo(pB.x, pB.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Satellite A (Cyan)
    const velA = isGEO_A ? '0.35 km/s (35,786 km GEO)' : (satA.isCrewed ? '7.66 km/s (4 CREW)' : '7.58 km/s');
    this.renderSatIcon(pA, '#00f0ff', satA.satelliteId, velA, satA);

    // Draw Satellite B (Orange)
    const velB = isGEO_B ? '0.35 km/s (35,786 km GEO)' : (satB.isDefunct ? '14.2 km/s (DEFUNCT DEBRIS)' : (satB.isCrewed ? '7.66 km/s (4 CREW)' : (satB.liesAboutFuel ? '7.54 km/s (ROGUE SAT)' : '7.54 km/s')));
    this.renderSatIcon(pB, '#ffaa00', satB.satelliteId, velB, satB);

    // Draw Satellite C (If 3-way cluster)
    if (this.is3Way && this.scenario?.satC) {
      const pC = this.getSatellitePos(this.earthRadius + 60, 71.0 * (Math.PI / 180), 0.8, 1.35, cx, cy);
      this.renderSatIcon(pC, '#ff4757', this.scenario.satC.satelliteId, '7.60 km/s (DEAD DEBRIS)', this.scenario.satC);

      // Draw secondary hazard vector from A to C
      ctx.strokeStyle = 'rgba(255, 200, 0, 0.6)';
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(pA.x, pA.y);
      ctx.lineTo(pC.x, pC.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  getSatellitePos(radius, inc, raan, theta, cx, cy) {
    const x0 = radius * Math.cos(theta);
    const y0 = radius * Math.sin(theta);
    const z0 = 0;

    const x1 = x0;
    const y1 = y0 * Math.cos(inc) - z0 * Math.sin(inc);
    const z1 = y0 * Math.sin(inc) + z0 * Math.cos(inc);

    const x2 = x1 * Math.cos(raan) + z1 * Math.sin(raan);
    const y2 = y1;
    const z2 = -x1 * Math.sin(raan) + z1 * Math.cos(raan);

    return this.project3D(x2, y2, z2, cx, cy);
  }

  renderSatIcon(p, color, name, vel, sat) {
    const ctx = this.ctx;
    const size = Math.max(5, 7 * p.scale);

    ctx.save();
    ctx.translate(p.x, p.y);

    const isDefunct = sat?.isDefunct || sat?.satClass === 'NON_MANEUVERABLE';
    const isGEO = sat?.isGEO;
    const isCrewed = sat?.isCrewed;

    if (isDefunct) {
      // Tumbling red debris polygon
      const rot = (Date.now() * 0.002) % (Math.PI * 2);
      ctx.rotate(rot);
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-size, -size * 0.6);
      ctx.lineTo(size * 0.8, -size);
      ctx.lineTo(size, size * 0.6);
      ctx.lineTo(-size * 0.5, size);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (isGEO) {
      // Gold satellite with solar panels
      ctx.fillStyle = '#eab308';
      ctx.fillRect(-size, -size * 0.6, size * 2, size * 1.2);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(-size * 2.2, -size * 0.4, size * 1.1, size * 0.8);
      ctx.fillRect(size * 1.1, -size * 0.4, size * 1.1, size * 0.8);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(-size, -size * 0.6, size * 2, size * 1.2);
    } else if (isCrewed) {
      // Crewed Dragon capsule
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.beginPath();
      ctx.arc(0, 0, size * 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.8, size * 0.8);
      ctx.lineTo(-size * 0.8, size * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // Normal glowing satellite dot
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();

    // Satellite Tag Card
    const cardX = p.x + size + 7;
    const cardY = p.y - 12;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(cardX, cardY, 140, 26);
    ctx.strokeStyle = isDefunct ? '#ef4444' : (isCrewed ? '#38bdf8' : (isGEO ? '#eab308' : color));
    ctx.lineWidth = 1;
    ctx.strokeRect(cardX, cardY, 140, 26);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px var(--font-mono)';
    ctx.fillText(name, cardX + 5, cardY + 11);

    ctx.fillStyle = isDefunct ? '#f87171' : 'var(--text-muted)';
    ctx.font = '8px var(--font-mono)';
    ctx.fillText(vel, cardX + 5, cardY + 22);
  }

  drawHUD(w, h) {
    const ctx = this.ctx;
    const title = this.scenario?.title || '1. Standard LEO: Fuel Asymmetry';
    const miss = this.scenario?.missDistanceMeters || 142;
    const tca = this.scenario?.tcaSeconds || 94;
    const pc = this.scenario?.pcValue || '1.84e-3';

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(16, 16, 320, 52);
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(16, 16, 320, 52);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 10px var(--font-mono)';
    ctx.fillText(title, 24, 30);

    ctx.fillStyle = '#f87171';
    ctx.font = '9px var(--font-mono)';
    ctx.fillText(`Miss Distance: ${miss} m | TCA: ${tca} s | Pc: ${pc}`, 24, 45);

    ctx.fillStyle = 'var(--accent-cyan)';
    ctx.font = '8px var(--font-mono)';
    ctx.fillText(`3D Earth Orbit | Rotate: ${(this.rotX * 57.3).toFixed(0)}°, ${(this.rotY * 57.3).toFixed(0)}° | Zoom: ${this.zoom.toFixed(2)}x`, 24, 58);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText('Click & Drag to rotate Earth | Scroll to zoom | Real-time Keplerian orbital shells', 18, h - 16);
  }
}
