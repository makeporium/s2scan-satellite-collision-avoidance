/**
 * S2SCAN Master Viva Voce Presentation & Slide Deck Mode
 * Comprehensive 12-slide defense deck for academic thesis evaluations,
 * viva examinations, and live mission control demonstrations with extensive speaker defense notes.
 */

export class PresentationMode {
  constructor() {
    this.currentSlide = 0;
    this.showNotes = false;
    this.slides = this.getSlidesData();
    this.initDOM();
  }

  initDOM() {
    if (document.getElementById('presentationOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'presentationOverlay';
    overlay.className = 'presentation-overlay';
    overlay.innerHTML = `
      <div class="pres-header">
        <div class="pres-title-badge">
          <span class="pres-badge">VIVA DEFENSE MASTER DECK</span>
          <span class="pres-slide-title" id="presSlideTitle"></span>
        </div>
        <div class="pres-header-controls">
          <span class="pres-slide-counter" id="presSlideCounter">Slide 1 of 12</span>
          <button class="pres-notes-toggle" id="btnToggleNotes">📝 Speaker Defense Notes (N)</button>
          <button class="pres-btn-close" id="btnClosePres">✕ Exit (ESC)</button>
        </div>
      </div>

      <div class="pres-slide-viewport">
        <div class="pres-slide-content" id="presSlideBody"></div>
      </div>

      <div class="pres-speaker-notes" id="presSpeakerNotes"></div>

      <div class="pres-footer">
        <div class="pres-nav-buttons">
          <button class="pres-btn-nav" id="btnPresPrev">◀ Previous (Left)</button>
          <button class="pres-btn-nav" id="btnPresNext">Next (Right) ▶</button>
        </div>
        <div>
          <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">
            Use [←] / [→] keys to navigate | [N] for speaker notes | [ESC] to return to Mission Control
          </span>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('btnClosePres').addEventListener('click', () => this.exit());
    document.getElementById('btnPresPrev').addEventListener('click', () => this.prevSlide());
    document.getElementById('btnPresNext').addEventListener('click', () => this.nextSlide());
    document.getElementById('btnToggleNotes').addEventListener('click', () => this.toggleNotes());

    window.addEventListener('keydown', (e) => {
      const active = document.getElementById('presentationOverlay').classList.contains('active');
      if (!active) return;

      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        this.nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        this.prevSlide();
      } else if (e.key === 'Escape') {
        this.exit();
      } else if (e.key === 'n' || e.key === 'N') {
        this.toggleNotes();
      }
    });
  }

  start() {
    this.currentSlide = 0;
    this.renderSlide();
    document.getElementById('presentationOverlay').classList.add('active');
  }

  exit() {
    document.getElementById('presentationOverlay').classList.remove('active');
  }

  nextSlide() {
    if (this.currentSlide < this.slides.length - 1) {
      this.currentSlide++;
      this.renderSlide();
    }
  }

  prevSlide() {
    if (this.currentSlide > 0) {
      this.currentSlide--;
      this.renderSlide();
    }
  }

  toggleNotes() {
    this.showNotes = !this.showNotes;
    const notesEl = document.getElementById('presSpeakerNotes');
    const btn = document.getElementById('btnToggleNotes');
    if (notesEl && btn) {
      notesEl.classList.toggle('active', this.showNotes);
      btn.classList.toggle('active', this.showNotes);
      btn.innerText = this.showNotes ? 'Hide Notes (N)' : '📝 Speaker Defense Notes (N)';
    }
  }

  renderSlide() {
    const s = this.slides[this.currentSlide];
    document.getElementById('presSlideTitle').innerText = s.title;
    document.getElementById('presSlideCounter').innerText = `Slide ${this.currentSlide + 1} of ${this.slides.length}`;
    document.getElementById('presSlideBody').innerHTML = s.html;
    document.getElementById('presSpeakerNotes').innerHTML = `<strong>SPEAKER DEFENSE TALKING POINTS:</strong> ${s.notes}`;

    document.getElementById('btnPresPrev').disabled = (this.currentSlide === 0);
    document.getElementById('btnPresNext').disabled = (this.currentSlide === this.slides.length - 1);
  }

  getSlidesData() {
    return [
      {
        title: '1. Title & Executive Overview',
        notes: 'Introduce your project with confidence: S2SCAN is the first decentralized, privacy-preserving, game-theoretic protocol for autonomous cross-operator satellite collision avoidance. Emphasize that it operates over direct inter-satellite laser links in under 2 seconds without relying on ground passes.',
        html: `
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; padding: 4px 12px; background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; color: #f59e0b; border-radius: 4px; font-family: var(--font-mono); font-size: 11px; font-weight: 700; margin-bottom: 12px; letter-spacing: 1px;">
              MASTER THESIS & RESEARCH DEFENSE PRESENTATION
            </div>
            <h1 style="font-size: 32px; font-family: var(--font-display); margin-bottom: 8px; color: #f8fafc; letter-spacing: 0.5px;">
              S2SCAN: Autonomous Cross-Operator Satellite Collision Avoidance Protocol
            </h1>
            <p style="color: #0ea5e9; font-size: 16px; max-width: 900px; margin: 0 auto; line-height: 1.5;">
              Solving the Orbital Tragedy of the Commons via Cryptographic State Commitments, Hardware Attestation, and Asymmetric Nash Bargaining
            </p>
          </div>

          <div class="pres-card-grid">
            <div class="pres-card">
              <div class="pres-big-num" style="color: #f59e0b;">18,049+</div>
              <div class="pres-stat-label">Active Satellites in LEO (2026)</div>
              <p style="font-size: 13px; color: var(--text-secondary); margin-top: 10px; line-height: 1.5;">
                Growing by >23% annually. SpaceX Starlink, Eutelsat OneWeb, and Amazon Kuiper are projecting over 60,000 operational spacecraft by 2030.
              </p>
            </div>

            <div class="pres-card">
              <div class="pres-big-num" style="color: #0ea5e9;">0.260 s</div>
              <div class="pres-stat-label">S2SCAN Median Decision Latency</div>
              <p style="font-size: 13px; color: var(--text-secondary); margin-top: 10px; line-height: 1.5;">
                A 3,461× speedup compared to current human ground coordination (15 to 90 minutes), solving pop-up orbital conjunctions before impact.
              </p>
            </div>

            <div class="pres-card">
              <div class="pres-big-num" style="color: #10b981;">100.0%</div>
              <div class="pres-stat-label">Avoidance Safety Rate (1,000 Runs)</div>
              <p style="font-size: 13px; color: var(--text-secondary); margin-top: 10px; line-height: 1.5;">
                Zero collisions and zero operational constraint violations across 1,000 Monte Carlo trials with 0% to 30% synthetic packet drops.
              </p>
            </div>
          </div>
        `
      },
      {
        title: '2. The Orbital Physics Crisis: High-Speed Kinetic Danger',
        notes: 'Walk the committee through the counter-intuitive physics of LEO: 27,000 km/h orbital velocity, 14.8 km/s relative closing speeds, and the Donald Kessler chain-reaction disaster model.',
        html: `
          <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px;">
            <div class="pres-card">
              <h4>Counter-Intuitive Keplerian Mechanics</h4>
              <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.6;">
                In Low Earth Orbit, spacecraft do not have brakes or atmospheric friction. They travel at <strong>7.5 km/s (27,000 km/h)</strong>—9.4 times faster than a high-powered rifle bullet.
              </p>
              <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin-top: 10px;">
                When two satellites on differing orbital planes intersect, their relative encounter velocity reaches up to <strong>14,800 meters per second</strong>. At this velocity:
              </p>
              <ul style="font-size: 12px; color: var(--text-secondary); line-height: 1.6; margin-top: 8px;">
                <li>Kinetic impact energy scales with the square of velocity: $E_k = \frac{1}{2} m v^2$.</li>
                <li>A 1-centimeter bolt carries the explosive force of an artillery shell.</li>
                <li>A collision pulverizes both spacecraft in <0.5 ms, generating 5,000 to 15,000 lethal debris fragments.</li>
              </ul>
            </div>

            <div class="pres-card">
              <h4>The Kessler Syndrome Threat</h4>
              <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.6;">
                First formulated by NASA astrophysicist Donald J. Kessler in 1978:
              </p>
              <div style="background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; padding: 12px; border-radius: 0 6px 6px 0; margin: 12px 0;">
                <strong style="color: #ef4444; font-size: 12px;">Runaway Cascade Hazard:</strong>
                <p style="font-size: 12px; color: #fca5a5; margin: 4px 0 0 0;">
                  Each collision spawns thousands of hypervelocity fragments that cross adjacent orbital shells, colliding with secondary satellites and rendering LEO unusable for centuries.
                </p>
              </div>
              <p style="font-size: 12px; color: var(--text-muted); line-height: 1.5;">
                With over 18,000 active satellites and 35,000 tracked debris objects today, avoiding kinetic contact is humanity's highest aerospace priority.
              </p>
            </div>
          </div>
        `
      },
      {
        title: '3. Why Centralized Ground-Based Air Traffic Control Fails in Space',
        notes: 'Address the most common committee question: Why not centralized ATC like FAA? Explain the 3 reasons: intermittent ground passes (8-12 mins per 90-min orbit), pop-up 15-minute warnings, and the 1967 Outer Space Treaty sovereignty vacuum.',
        html: `
          <div class="pres-card-grid">
            <div class="pres-card">
              <div style="color: #ef4444; font-weight: 700; font-size: 14px; margin-bottom: 6px;">1. Intermittent Tracking Blackouts</div>
              <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.6;">
                Airplanes are tracked continuously by radar. Satellites pass over dedicated ground stations for only <strong>8 to 12 minutes every 90 minutes</strong>. For the remaining 80 minutes, they are completely out of contact over oceans or foreign territory.
              </p>
            </div>

            <div class="pres-card">
              <div style="color: #ef4444; font-weight: 700; font-size: 14px; margin-bottom: 6px;">2. Pop-Up Conjunction Latency</div>
              <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.6;">
                Atmospheric drag spikes and late radar updates often detect high risk ($P_c > 10^{-4}$) only <strong>15 to 45 minutes before encounter</strong>. Traditional ground loops require 2 to 4 hours of orbit determination plus 15-90 minutes of manual email exchanges.
              </p>
            </div>

            <div class="pres-card">
              <div style="color: #ef4444; font-weight: 700; font-size: 14px; margin-bottom: 6px;">3. The 1967 UN Treaty Vacuum</div>
              <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.6;">
                Under the United Nations Outer Space Treaty, space is a global commons. <strong>No single nation or agency has the sovereign legal jurisdiction</strong> to command a foreign commercial or military spacecraft to burn its engines.
              </p>
            </div>
          </div>

          <div style="margin-top: 20px; background: rgba(14, 165, 233, 0.08); border: 1px solid rgba(14, 165, 233, 0.25); border-radius: 6px; padding: 14px 18px;">
            <strong style="color: #38bdf8;">Architectural Conclusion:</strong>
            <span style="font-size: 13px; color: var(--text-secondary); margin-left: 6px;">
              Centralized arbitration is physically impossible. Avoidance coordination MUST be autonomous, decentralized, and executed directly over Inter-Satellite Links (ISL).
            </span>
          </div>
        `
      },
      {
        title: '4. Real-World Case Study: ESA Aeolus vs. SpaceX Starlink-44',
        notes: 'Present the historical incident of September 2019. ESA Aeolus ($500M wind satellite) had a 1-in-600 collision risk with Starlink-44. Coordination was done via unmonitored email; SpaceX missed the alert; ESA was forced to burn unilaterally.',
        html: `
          <div class="pres-card" style="border-left: 4px solid #f59e0b; margin-bottom: 18px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h4 style="margin: 0; color: #f59e0b;">September 2, 2019: The Day Email Almost Destroyed a $500M Satellite</h4>
              <span style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">INCIDENT RETROSPECTIVE</span>
            </div>
            <p style="font-size: 13px; color: var(--text-secondary); margin-top: 8px; line-height: 1.6;">
              The European Space Agency's (ESA) flagship Earth observation satellite <strong>Aeolus</strong> was on a direct collision course with SpaceX's <strong>Starlink-44</strong> at 320 km altitude. The Collision Probability ($P_c$) reached <strong>1.6 × 10⁻³ (1-in-600)</strong>—16 times higher than the critical safety threshold!
            </p>
          </div>

          <div class="pres-card-grid">
            <div class="pres-card">
              <h4>How They Coordinated</h4>
              <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.6;">
                ESA flight controllers in Darmstadt sent an <strong>unencrypted email</strong> to SpaceX headquarters in California. An internal bug in SpaceX's on-call paging software silenced the notification. SpaceX flight directors never saw the alert!
              </p>
            </div>

            <div class="pres-card">
              <h4>The Outcome</h4>
              <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.6;">
                With zero reply and encounter hours away, ESA was forced to manually interrupt science operations, burn Aeolus's thrusters, and raise its orbit by 350 meters, permanently expending irreplaceable propellant.
              </p>
            </div>

            <div class="pres-card">
              <h4>ESA's Official Verdict</h4>
              <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.6;">
                <em>"In the era of megaconstellations with thousands of satellites, relying on manual emails and phone calls to avoid collisions is completely unsustainable. We need autonomous, machine-to-machine coordination."</em>
              </p>
            </div>
          </div>
        `
      },
      {
        title: '5. The Commercial Secrecy Paradox & The Cheating Dilemma',
        notes: 'Explain why satellites cannot just share fuel data. Propellant mass dictates commercial revenue lifespan (trade secret). If the rule is "lowest fuel gets excused", operators will lie and claim "CRITICAL" (Game of Chicken). S2SCAN solves this.',
        html: `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div class="pres-card">
              <h4>The Commercial Secrecy Paradox</h4>
              <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.6;">
                Satellites operators are fierce commercial rivals (SpaceX vs. OneWeb vs. Kuiper):
              </p>
              <ul style="font-size: 12px; color: var(--text-secondary); line-height: 1.6; margin-top: 8px;">
                <li><strong>Propellant Mass is a Trade Secret:</strong> Revealing exact fuel in kilograms reveals the remaining operational revenue lifespan of an orbital plane and replacement launch dates.</li>
                <li><strong>Defense Missions:</strong> National security spacecraft cannot disclose sensor pointing restrictions or classified orbits.</li>
              </ul>
              <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 4px; padding: 10px; margin-top: 10px; font-size: 12px; color: #fca5a5;">
                Operators will NEVER agree to an open-telemetry system that broadcasts proprietary states to competitors!
              </div>
            </div>

            <div class="pres-card">
              <h4>The Orbital Game of Chicken & Cheating</h4>
              <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.6;">
                Maneuvering consumes finite fuel, shortening commercial lifetime. This creates a fatal moral hazard:
              </p>
              <div style="background: #090c12; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 4px; padding: 12px; margin: 10px 0; font-family: var(--font-mono); font-size: 11px; color: #f59e0b;">
                If Rule = "Satellite with lower fuel is excused":<br>
                ➔ Satellite B has dominant incentive to lie:<br>
                ➔ B claims: "Fuel = CRITICAL (4%)"<br>
                ➔ Peer A is forced to maneuver and burn fuel every time!
              </div>
              <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5;">
                Without cryptographic commitments and hardware attestation, rational economic actors will always exploit negotiation algorithms.
              </p>
            </div>
          </div>
        `
      },
      {
        title: '6. The S2SCAN 6-Stage Bilateral Protocol Architecture',
        notes: 'Walk through the 6 stages. Explain how it executes in under 2 seconds over 128-byte CCSDS binary frames. Stress that it is bilateral and peer-to-peer.',
        html: `
          <div style="background: #090c12; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 18px; margin-bottom: 16px;">
            <pre style="font-family: var(--font-mono); font-size: 11px; color: #38bdf8; line-height: 1.7; margin: 0;">
+----------------------------------------------------------------------------------------------------------+
|                                    6-STAGE BILATERAL STATE MACHINE                                       |
+----------------------------------------------------------------------------------------------------------+
  [Stage 1: DISCOVER]     Onboard radar / GPS detects conjunction: Pc > 1e-4, TCA < 120s.
          │
  [Stage 2: AUTHENTICATE] Mutual Ed25519 digital signature handshake; anti-replay nonces exchanged.
          │
  [Stage 3: EXCHANGE]     Categorical state disclosure + Formula 3 SHA-256 state commitments published.
          │
  [Stage 4: NEGOTIATE]    Multi-attribute Asymmetric Nash Bargaining solved; Rubinstein urgency discount applied.
          │
  [Stage 5: COMMIT]       Two-phase consensus lock; secret salt revealed & hardware enclave attestation verified.
          │
  [Stage 6: EXECUTE/SAFE] Assigned mover fires thrusters (+R: 0.32 m/s); encounter deconflicted (Pc -> 1e-9).
+----------------------------------------------------------------------------------------------------------+
            </pre>
          </div>

          <div class="pres-card-grid">
            <div class="pres-card">
              <h4>CCSDS 128-Byte Binary Framing</h4>
              <p style="font-size: 12px; color: var(--text-secondary);">
                Complies with international Consultative Committee for Space Data Systems standards. 32-bit CRC checksum guarantees microsecond bit-flip detection.
              </p>
            </div>
            <div class="pres-card">
              <h4>4-Tier BFT Fallback Hierarchy</h4>
              <p style="font-size: 12px; color: var(--text-secondary);">
                Level 1: P2P Negotiation ➔ Level 2: Deterministic Rules of Road ➔ Level 3: Local Unilateral Burn ➔ Level 4: Ground Flight Director Escalation.
              </p>
            </div>
          </div>
        `
      },
      {
        title: '7. Formula 3: Anti-Cheat Cryptography & Hardware Enclave Attestation',
        notes: 'Explain Formula 3: SHA-256 commitment ensures consistency (cannot change category mid-negotiation). Hardware Secure Enclave (ARM TrustZone / RISC-V Keystone) connects directly to propellant tank transducers and signs the reading, guaranteeing physical truth.',
        html: `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div class="pres-card">
              <h4>Layer 1: SHA-256 State Commitment</h4>
              <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.6;">
                Fuel is discretized into 4 standardized operational categories: CRITICAL (0-15%), LOW (16-40%), NOMINAL (41-75%), HIGH (76-100%).
              </p>
              <div style="background: #060912; border: 1px solid rgba(14, 165, 233, 0.3); padding: 8px; border-radius: 4px; font-family: var(--font-mono); font-size: 11px; color: #38bdf8; margin: 8px 0;">
                H = SHA-256( Category || ":" || Secret_Salt )
              </div>
              <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5;">
                • <strong>Stage 3:</strong> B publishes only hash $H$ (Hiding Property).<br>
                • <strong>Stage 5:</strong> B reveals (Category, Salt). A re-hashes and asserts equality (Binding Property). B cannot change its story!
              </p>
            </div>

            <div class="pres-card">
              <h4>Layer 2: Remote Hardware Attestation</h4>
              <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.6;">
                What stops B from committing to "CRITICAL" when its tank is 85% full?
              </p>
              <ul style="font-size: 12px; color: var(--text-secondary); line-height: 1.6; margin-top: 6px;">
                <li>Propellant transducers connect directly to an on-chip <strong>Hardware Secure Enclave</strong> via isolated buses, bypassing flight software.</li>
                <li>The enclave signs the category using a factory-burned Ed25519 private key:
                  <code>Sign(EnclaveKey, Category || Nonce || Time)</code>
                </li>
                <li>Software tampering mathematically breaks the signature!</li>
              </ul>
              <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; padding: 6px 10px; border-radius: 4px; font-size: 11px; color: #10b981; margin-top: 8px;">
                ✓ Cheating eliminated under polynomial-time computational bounds.
              </div>
            </div>
          </div>
        `
      },
      {
        title: '8. Multi-Attribute Asymmetric Nash Bargaining',
        notes: 'Explain the 6-term utility weight function. Highlight the hard constraint overrides: dead debris, crewed space stations, and GEO longitude slots automatically receive infinite weight (W = infinity). The lowest weight executes the burn.',
        html: `
          <div style="background: #090c12; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 14px 18px; margin-bottom: 16px;">
            <div style="font-family: var(--font-mono); font-size: 12px; color: #38bdf8; line-height: 1.6;">
              Weight_i = α*(Δv_i / Δv_max) + β*(1 - Fuel_i / Max_Fuel) + γ*(Priority_i / 10) + δ*Formation + ε*Mobility + η*Recovery
              <br><br>
              Assigned_Mover = argmin( Weight_A, Weight_B )
            </div>
          </div>

          <div class="pres-card-grid">
            <div class="pres-card">
              <h4>Hard Constraint Overrides ($W = \infty$)</h4>
              <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.6;">
                • <strong>GEO ITU Slot Breach:</strong> $\pm 0.05^\circ$ box ==> $W = \infty$<br>
                • <strong>Crewed Space Habitat:</strong> ISS / Tiangong ==> $W = \infty$<br>
                • <strong>Unpowered Debris / Dead Bus:</strong> No propulsion ==> Peer moves
              </p>
            </div>

            <div class="pres-card">
              <h4>Axiomatic Nash Fairness</h4>
              <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.6;">
                Satisfies John Nash's (1950) 4 axiomatic bargaining properties: Pareto optimality, symmetry, scale invariance, and independence of irrelevant alternatives.
              </p>
            </div>

            <div class="pres-card">
              <h4>Fleet Propellant Preservation</h4>
              <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.6;">
                Saves up to 26.3% fleet fuel compared to arbitrary heuristics by assigning burns to satellites with healthy reserves and efficient thrusters.
              </p>
            </div>
          </div>
        `
      },
      {
        title: '9. Formula 4: Rubinstein Urgency Time-Discounting',
        notes: 'Explain Formula 4: D(t) = exp(-lambda / (TCA - t)). As TCA ticks down, delay becomes exponentially penalized. Holding out becomes suicidal, so rational agents concede in 1-2 rounds.',
        html: `
          <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px;">
            <div class="pres-card">
              <h4>Encounter Deadline Pressure</h4>
              <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.6;">
                In space, time is finite. Spending 30 seconds arguing means the satellites are closer, requiring a larger, riskier $\Delta v$ burn.
              </p>
              <div style="background: #060912; border: 1px solid rgba(245, 158, 11, 0.3); padding: 10px; border-radius: 4px; font-family: var(--font-mono); font-size: 13px; color: #f59e0b; margin: 12px 0;">
                D(t) = exp( - λ / (TCA - t) )
              </div>
              <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5;">
                Because maneuver cost is scaled by $1 / D(t)$, any satellite attempting to stall suffers an exponentially compounding cost penalty!
              </p>
            </div>

            <div class="pres-card">
              <h4>Urgency Numerical Decay</h4>
              <div class="docs-table-wrapper">
                <table class="prj-academic-table" style="font-size: 11px;">
                  <thead>
                    <tr>
                      <th>Time to TCA</th>
                      <th>$D(t)$</th>
                      <th>Penalty Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>120 s</td>
                      <td>88.2%</td>
                      <td>Ample time; low penalty</td>
                    </tr>
                    <tr>
                      <td>94 s</td>
                      <td>85.2%</td>
                      <td>Normal protocol initiation</td>
                    </tr>
                    <tr>
                      <td>30 s</td>
                      <td>60.6%</td>
                      <td>High urgency; rapid concession</td>
                    </tr>
                    <tr>
                      <td>15 s</td>
                      <td>36.7%</td>
                      <td>Critical! Cost triples</td>
                    </tr>
                    <tr>
                      <td>5 s</td>
                      <td>4.9%</td>
                      <td>Extreme danger! Concede now</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `
      },
      {
        title: '10. 3-Way & N-Way Conjunction Cluster Solver',
        notes: 'Explain secondary collision avoidance: in dense megaconstellations, dodging Satellite B with an in-track burn could steer into Satellite C. S2SCAN solves a joint multi-objective problem and fires a hybrid Radial/Cross-track burn.',
        html: `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div class="pres-card">
              <h4>The Secondary Collision Threat</h4>
              <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.6;">
                In dense megaconstellations (e.g. Starlink shells with 4,000+ satellites), performing an uncoordinated avoidance burn against Satellite B can inadvertently steer your spacecraft into a third trailing craft (Satellite C)!
              </p>
              <div style="background: rgba(239, 68, 68, 0.08); border-left: 3px solid #ef4444; padding: 10px; margin-top: 12px; font-size: 12px; color: #fca5a5;">
                Naive 2-body burn: Clears B (+6.2 km), but reduces A↔C distance to 110m ($P_c = 0.042$)!
              </div>
            </div>

            <div class="pres-card">
              <h4>Joint Multi-Agent Constraint Solution</h4>
              <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.6;">
                S2SCAN integrates a Secondary Clearance Constraint:
              </p>
              <div style="background: #060912; border: 1px solid rgba(14, 165, 233, 0.3); padding: 8px; border-radius: 4px; font-family: var(--font-mono); font-size: 11px; color: #38bdf8; margin: 10px 0;">
                Maximize Joint_Utility subject to:<br>
                P_c(i_burn → k) < 1.0 × 10⁻⁵  ∀ k ∈ { Neighbors in 15 km }
              </div>
              <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5;">
                Assigns a <strong>Hybrid Radial/Cross-Track burn</strong> ($+R: 0.28$ m/s, $+C: 0.15$ m/s), clearing both Satellite B (4.8 km) and Satellite C (3.4 km) simultaneously!
              </p>
            </div>
          </div>
        `
      },
      {
        title: '11. Empirical Monte Carlo Scorecard: 1,000-Run Proof',
        notes: 'Walk through the 1,000-run scorecard: 100.0% safety vs. 90.9% (Baseline 1, 91 crashes, 172 violations) and 53.9% (Baseline 2, 461 crashes due to 15-min human latency). S2SCAN median latency is 0.260s (3,461x speedup).',
        html: `
          <div class="docs-table-wrapper" style="margin-bottom: 16px;">
            <table class="prj-academic-table" style="font-size: 12px;">
              <thead>
                <tr>
                  <th>Performance Metric</th>
                  <th style="color: #10b981;">S2SCAN Protocol</th>
                  <th style="color: #f59e0b;">Baseline 1 (Random Coin-Flip)</th>
                  <th style="color: #ef4444;">Baseline 2 (Human Ground Loop)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Avoidance Safety Rate</strong></td>
                  <td style="color: #10b981; font-weight: 700;">100.0% (1,000/1,000)</td>
                  <td style="color: #f59e0b;">90.9% (909/1,000)</td>
                  <td style="color: #ef4444;">53.9% (539/1,000)</td>
                </tr>
                <tr>
                  <td><strong>Physical Crashes</strong></td>
                  <td style="color: #10b981; font-weight: 700;">0 Crashes</td>
                  <td style="color: #f59e0b;">91 Collisions</td>
                  <td style="color: #ef4444;">461 Collisions</td>
                </tr>
                <tr>
                  <td><strong>Median Latency (P50)</strong></td>
                  <td style="color: #0ea5e9; font-weight: 700;">0.260 seconds</td>
                  <td>0.001 seconds</td>
                  <td>900.000 seconds (15 min)</td>
                </tr>
                <tr>
                  <td><strong>Decision Speedup vs. Ground</strong></td>
                  <td style="color: #f59e0b; font-weight: 700;">3,461× Speedup</td>
                  <td>N/A</td>
                  <td>Reference Baseline</td>
                </tr>
                <tr>
                  <td><strong>Operational Constraint Violations</strong></td>
                  <td style="color: #10b981; font-weight: 700;">0 Violations</td>
                  <td style="color: #ef4444;">172 Violations</td>
                  <td>N/A (Timeouts)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="pres-card-grid">
            <div class="pres-card">
              <strong style="color: #10b981;">Why Baseline 1 Failed (172 Violations):</strong>
              <p style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">
                81 fuel-depleted burnouts, 53 GEO license breaches, 21 dead debris assignments, 17 crewed disruptions.
              </p>
            </div>
            <div class="pres-card">
              <strong style="color: #ef4444;">Why Baseline 2 Failed (461 Crashes):</strong>
              <p style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">
                In 46.1% of runs, TCA was < 15 minutes. Humans were still checking emails when the crash occurred!
              </p>
            </div>
            <div class="pres-card">
              <strong style="color: #0ea5e9;">S2SCAN Invariant Safety:</strong>
              <p style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">
                Tier 3 autonomous unilateral fallback guarantees 100.0% collision clearance even under 30% packet loss.
              </p>
            </div>
          </div>
        `
      },
      {
        title: '12. Master Viva Voce Defense Checklist & Conclusion',
        notes: 'Summarize the core thesis contribution: S2SCAN is the first open, decentralized systems architecture solving the space operational privacy paradox. Highlight that all artifacts, pipelines, UDP sockets, and 1,000-run benchmarks are fully implemented and verifiable.',
        html: `
          <div class="pres-card-grid">
            <div class="pres-card">
              <h4>Top Committee Defense Questions Prepared</h4>
              <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.6;">
                1. <em>"Why not centralized ATC?"</em> ➔ Ground pass blackout (80 min), pop-up warnings, Outer Space Treaty.<br>
                2. <em>"Can an operator fake fuel?"</em> ➔ Formula 3 SHA-256 commitment + hardware enclave sensor bus attestation.<br>
                3. <em>"What if laser link drops?"</em> ➔ 4-Tier BFT fallback executes unilateral burn with 0 network round-trips.
              </p>
            </div>

            <div class="pres-card">
              <h4>Complete Verified Research Deliverables</h4>
              <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.6;">
                • <strong>Mission Control Console:</strong> 10 interactive tabs with 2D radar, 3D globe, and dual What/Why inspectors.<br>
                • <strong>SGP4 Astrodynamics Pipeline:</strong> 220 live Starlink TLEs and 24 authentic conjunctions.<br>
                • <strong>Networking:</strong> Live dual-process UDP daemon exchanging 128-byte CCSDS binary packets.<br>
                • <strong>Publication Manuscript:</strong> IEEE/AIAA draft with 3 formal mathematical proofs.
              </p>
            </div>
          </div>

          <div style="margin-top: 24px; text-align: center;">
            <div style="display: inline-block; background: #f59e0b; color: #090c12; padding: 12px 32px; border-radius: 6px; font-weight: 800; font-family: var(--font-display); font-size: 16px; letter-spacing: 0.5px;">
              Ready for Academic Thesis Defense & Live Mission Control Demonstration
            </div>
          </div>
        `
      }
    ];
  }
}
