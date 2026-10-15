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
    const rOrbit = this.earthRadius + 60;

    // Sat A Position (Approaching conjunction point at theta = 1.2)
    const thetaA = 1.2 - Math.sin(this.animTime * 0.4) * 0.12;
    const pA = this.getSatellitePos(rOrbit, 53 * (Math.PI / 180), 0.2, thetaA, cx, cy);

    // Sat B Position (Approaching same conjunction point)
    const thetaB = 1.25 + Math.sin(this.animTime * 0.4) * 0.12;
    const pB = this.getSatellitePos(rOrbit + 15, 87.4 * (Math.PI / 180), 1.8, thetaB, cx, cy);

    // Conjunction Intersection Hazard Sphere
    const pConj = this.getSatellitePos(rOrbit + 8, 53 * (Math.PI / 180), 0.2, 1.22, cx, cy);
    const pulseR = (14 + Math.sin(this.animTime * 6) * 5) * pConj.scale;

    // Pulsing Red Collision Zone
    const hazardGrad = ctx.createRadialGradient(pConj.x, pConj.y, 2, pConj.x, pConj.y, pulseR);
    hazardGrad.addColorStop(0, 'rgba(255, 71, 87, 0.8)');
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
    this.renderSatIcon(pA, '#00f0ff', 'STARLINK-3104', '7.58 km/s');

    // Draw Satellite B (Orange)
    this.renderSatIcon(pB, '#ffaa00', 'ONEWEB-0412', '7.54 km/s');

    // Draw Satellite C (If 3-way cluster)
    if (this.is3Way) {
      const pC = this.getSatellitePos(rOrbit + 5, 71.0 * (Math.PI / 180), 0.8, 1.35, cx, cy);
      this.renderSatIcon(pC, '#ff4757', 'COSMOS-2251 DEBRIS', '7.60 km/s');

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

  renderSatIcon(p, color, name, vel) {
    const ctx = this.ctx;
    const size = Math.max(5, 7 * p.scale);

    // Glowing dot
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Satellite Tag
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 11px var(--font-mono)';
    ctx.fillText(name, p.x + size + 6, p.y - 2);

    ctx.fillStyle = 'var(--text-muted)';
    ctx.font = '10px var(--font-mono)';
    ctx.fillText(vel, p.x + size + 6, p.y + 11);
  }

  drawHUD(w, h) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '700 11px var(--font-mono)';
    ctx.fillText('3D ORBITAL ENCOUNTER GLOBE (WGS-84 LEO SHELL)', 18, 26);

    ctx.fillStyle = 'var(--accent-cyan)';
    ctx.font = '10px var(--font-mono)';
    ctx.fillText(`ROTATION: [X: ${(this.rotX * 57.3).toFixed(0)}°, Y: ${(this.rotY * 57.3).toFixed(0)}°] | ZOOM: ${this.zoom.toFixed(2)}x`, 18, 42);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText('Click & Drag to rotate Earth | Scroll to zoom | Real-time Keplerian inclination projection', 18, h - 16);
  }
}
