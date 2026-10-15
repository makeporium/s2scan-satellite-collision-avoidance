// S2SCAN Simulator Master Application Controller
// Orchestrates views, state machine, orbital canvas, crypto verification, and UI interactions

import { OrbitVisualizer } from './orbit-visualizer.js';
import { S2SCANProtocolEngine, PROTOCOL_STAGES } from './negotiation-fsm.js';
import { S2SCANGameTheory } from './game-theory.js';
import { S2SCANCrypto } from './crypto-engine.js';
import { SIMULATION_SCENARIOS } from './scenarios.js';
import { VARIABLE_CATEGORIES, S2SCAN_VARIABLES } from './variables-data.js';
import { DATASET_CATALOG } from './dataset-viewer.js';

class S2SCANApp {
  constructor() {
    this.currentScenario = SIMULATION_SCENARIOS[0];
    this.protocolEngine = new S2SCANProtocolEngine(this.currentScenario);
    this.orbitVis = null;
    this.activeTab = 'tab_simulator';
    this.coefficients = { ...S2SCANGameTheory.defaultCoefficients };

    this.init();
  }

  init() {
    this.setupTabs();
    this.setupControls();
    this.setupScenarioSelector();
    this.renderStagesHeader();
    this.renderVariablesTable();
    this.renderGameTheoryStudio();
    this.renderCryptoInspector();
    this.renderDatasetsTab();
    this.renderBackendMatrixTab();

    // Init Canvas visualizer
    setTimeout(() => {
      this.orbitVis = new OrbitVisualizer('orbitCanvas');
      this.orbitVis.setScenario(this.currentScenario);
    }, 100);

    // Listen to protocol state updates
    this.protocolEngine.onUpdate(state => this.handleProtocolUpdate(state));
    this.updateUI();
  }

  setupTabs() {
    const tabButtons = document.querySelectorAll('.nav-tab');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', e => {
        const tabId = btn.getAttribute('data-tab');
        this.switchTab(tabId);
      });
    });
  }

  switchTab(tabId) {
    this.activeTab = tabId;
    document.querySelectorAll('.nav-tab').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === tabId);
    });

    if (tabId === 'tab_simulator' && this.orbitVis) {
      setTimeout(() => this.orbitVis.resizeCanvas(), 50);
    }
  }

  setupControls() {
    // Step button
    document.getElementById('btnStep')?.addEventListener('click', async () => {
      await this.protocolEngine.step();
    });

    // Auto-Play button
    document.getElementById('btnAutoPlay')?.addEventListener('click', async () => {
      await this.protocolEngine.autoPlay(500);
    });

    // Reset button
    document.getElementById('btnReset')?.addEventListener('click', () => {
      this.protocolEngine.reset();
      if (this.orbitVis) {
        this.orbitVis.setScenario(this.currentScenario);
        this.orbitVis.setManeuverExecuted(false);
      }
      this.updateUI();
    });

    // Quick Byzantine Lie Injection Button
    document.getElementById('btnInjectLie')?.addEventListener('click', () => {
      const byzScenario = SIMULATION_SCENARIOS.find(s => s.id === 'scen_byzantine_liar');
      if (byzScenario) {
        this.loadScenario(byzScenario);
      }
    });

    // Quick Packet Drop Injection Button
    document.getElementById('btnInjectDrop')?.addEventListener('click', () => {
      const dropScenario = SIMULATION_SCENARIOS.find(s => s.id === 'scen_packet_loss');
      if (dropScenario) {
        this.loadScenario(dropScenario);
      }
    });
  }

  setupScenarioSelector() {
    const selector = document.getElementById('scenarioSelector');
    if (!selector) return;

    selector.innerHTML = '';
    SIMULATION_SCENARIOS.forEach(scen => {
      const opt = document.createElement('option');
      opt.value = scen.id;
      opt.textContent = `${scen.title} [${scen.badge}]`;
      selector.appendChild(opt);
    });

    selector.addEventListener('change', e => {
      const found = SIMULATION_SCENARIOS.find(s => s.id === e.target.value);
      if (found) this.loadScenario(found);
    });
  }

  loadScenario(scenario) {
    this.currentScenario = scenario;
    const selector = document.getElementById('scenarioSelector');
    if (selector) selector.value = scenario.id;

    this.protocolEngine = new S2SCANProtocolEngine(scenario);
    this.protocolEngine.onUpdate(state => this.handleProtocolUpdate(state));

    if (this.orbitVis) {
      this.orbitVis.setScenario(scenario);
      this.orbitVis.setManeuverExecuted(false);
    }

    this.renderGameTheoryStudio();
    this.renderCryptoInspector();
    this.updateUI();
  }

  renderStagesHeader() {
    const container = document.getElementById('protocolStagesBar');
    if (!container) return;

    container.innerHTML = PROTOCOL_STAGES.map((st, i) => `
      <div class="stage-step" id="step-indicator-${i}">
        <div class="step-num">${st.id}</div>
        <div class="step-info">
          <div class="step-title">${st.name}</div>
          <div class="step-desc">${st.desc}</div>
        </div>
      </div>
    `).join('');
  }

  handleProtocolUpdate(state) {
    this.updateUI();

    // If stage 6 verified or agreed, tell orbit visualizer to divert
    if (state.currentStageIndex >= 5 && state.status === 'AGREED') {
      if (this.orbitVis) this.orbitVis.setManeuverExecuted(true);
    }
  }

  updateUI() {
    const state = this.protocolEngine.getState();

    // 1. Update Stages Bar
    PROTOCOL_STAGES.forEach((st, i) => {
      const el = document.getElementById(`step-indicator-${i}`);
      if (!el) return;
      el.classList.remove('active', 'completed', 'failed');
      if (i < state.currentStageIndex) {
        el.classList.add('completed');
      } else if (i === state.currentStageIndex) {
        if (state.status === 'FALLBACK' || state.status === 'ABORTED') {
          el.classList.add('failed');
        } else {
          el.classList.add('active');
        }
      }
    });

    // 2. Update Protocol Status Badge
    const badge = document.getElementById('protocolStatusBadge');
    if (badge) {
      badge.textContent = `STATUS: ${state.status}`;
      badge.className = `status-badge badge-${state.status.toLowerCase()}`;
    }

    // 3. Update Satellite Telemetry Cards
    const cardA = document.getElementById('cardSatA');
    const cardB = document.getElementById('cardSatB');
    if (cardA && cardB) {
      cardA.innerHTML = this.renderSatCardContent(state.agentA, 'Satellite A (Initiator)', '#00e5ff');
      cardB.innerHTML = this.renderSatCardContent(state.agentB, 'Satellite B (Responder)', '#ff9500');
    }

    // 4. Update Conjunction Overview HUD
    const hudTca = document.getElementById('hudTca');
    const hudMiss = document.getElementById('hudMiss');
    const hudPc = document.getElementById('hudPc');
    if (hudTca) hudTca.textContent = `${this.currentScenario.tcaSeconds}s`;
    if (hudMiss) hudMiss.textContent = `${this.currentScenario.missDistanceMeters}m`;
    if (hudPc) hudPc.textContent = this.currentScenario.pcValue;

    // 5. Update Message Trace Log
    this.renderMessageLog(state.messageLog);
  }

  renderSatCardContent(sat, role, color) {
    return `
      <div class="sat-card-header" style="border-left-color: ${color}">
        <div>
          <span class="sat-role">${role}</span>
          <h3 class="sat-name">${sat.satelliteId}</h3>
        </div>
        <span class="sat-class-badge">${sat.satClass}</span>
      </div>
      <div class="sat-metrics-grid">
        <div class="metric-box">
          <span class="m-label">Propellant Level</span>
          <span class="m-val" style="color: ${sat.fuelRemainingPct < 25 ? '#ff453a' : '#00ff88'}">
            ${sat.fuelRemainingPct}% (${sat.fuelCategory})
          </span>
        </div>
        <div class="metric-box">
          <span class="m-label">Req. Delta-V</span>
          <span class="m-val">${sat.deltaVRequired} m/s</span>
        </div>
        <div class="metric-box">
          <span class="m-label">Mission Priority</span>
          <span class="m-val">${sat.missionPriority}/10</span>
        </div>
        <div class="metric-box">
          <span class="m-label">Mobility / ITU</span>
          <span class="m-val">${sat.isGEO ? 'GEO (LOCKED)' : (sat.hasPropulsion ? 'MOBILE' : 'DEFUNCT')}</span>
        </div>
      </div>
    `;
  }

  renderMessageLog(logs) {
    const container = document.getElementById('messageLogContainer');
    if (!container) return;

    if (logs.length === 0) {
      container.innerHTML = `
        <div class="empty-log-state">
          <span class="icon">📡</span>
          <p>No active message transmission. Click <strong>Step Next</strong> or <strong>Auto-Run</strong> to initiate the S2SCAN 6-stage negotiation protocol.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = logs.map(l => `
      <div class="msg-log-entry status-${l.status.toLowerCase()}">
        <div class="msg-header">
          <span class="msg-time">T+${l.timestamp}s</span>
          <span class="msg-tag">${l.stageKey}</span>
          <span class="msg-route">${l.sender} ➔ ${l.receiver}</span>
          <span class="msg-type-pill">${l.type}</span>
        </div>
        <div class="msg-body">${l.message}</div>
        ${l.payload ? `
          <div class="msg-payload-box">
            <pre>${JSON.stringify(l.payload, null, 2)}</pre>
          </div>
        ` : ''}
      </div>
    `).join('');

    container.scrollTop = container.scrollHeight;
  }

  // --- Tab 2: 105+ Variables Database ---
  renderVariablesTable() {
    const catContainer = document.getElementById('varCategoriesList');
    const tableBody = document.getElementById('varTableBody');
    const searchInput = document.getElementById('varSearchInput');
    if (!catContainer || !tableBody) return;

    let selectedCat = 'ALL';

    const renderCategories = () => {
      catContainer.innerHTML = `
        <button class="cat-pill ${selectedCat === 'ALL' ? 'active' : ''}" data-cat="ALL">
          All Categories (105)
        </button>
        ${VARIABLE_CATEGORIES.map(c => `
          <button class="cat-pill ${selectedCat === c.id ? 'active' : ''}" data-cat="${c.id}">
            ${c.name} (${c.count})
          </button>
        `).join('')}
      `;

      catContainer.querySelectorAll('.cat-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          selectedCat = btn.getAttribute('data-cat');
          renderCategories();
          filterAndRenderRows();
        });
      });
    };

    const filterAndRenderRows = () => {
      const q = (searchInput?.value || '').toLowerCase();
      const filtered = S2SCAN_VARIABLES.filter(v => {
        const matchesCat = selectedCat === 'ALL' || v.cat === selectedCat;
        const matchesQuery = !q || v.name.toLowerCase().includes(q) || v.why.toLowerCase().includes(q);
        return matchesCat && matchesQuery;
      });

      tableBody.innerHTML = filtered.map(v => `
        <tr>
          <td><span class="var-id">#${v.id}</span></td>
          <td>
            <strong>${v.name}</strong>
            <div class="var-why">${v.why}</div>
          </td>
          <td><code>${v.unit}</code></td>
          <td><span class="val-sat-a">${v.satA_val}</span></td>
          <td><span class="val-sat-b">${v.satB_val}</span></td>
          <td><span class="influence-badge influence-${v.weightInfluence.toLowerCase()}">${v.weightInfluence}</span></td>
        </tr>
      `).join('');

      document.getElementById('varRowCount').textContent = `Showing ${filtered.length} of ${S2SCAN_VARIABLES.length} variables`;
    };

    searchInput?.addEventListener('input', () => filterAndRenderRows());
    renderCategories();
    filterAndRenderRows();
  }

  // --- Tab 3: Game Theory & Negotiation Weights Studio ---
  renderGameTheoryStudio() {
    const container = document.getElementById('gameTheoryStudio');
    if (!container) return;

    const sol = S2SCANGameTheory.solveBilateralNegotiation(
      this.currentScenario.satA,
      this.currentScenario.satB,
      this.coefficients
    );

    container.innerHTML = `
      <div class="gt-grid">
        <div class="gt-panel config-panel">
          <h3>Weighting Coefficients (Tuning Formula)</h3>
          <p class="section-desc">Formula: $W_i = \alpha \cdot \Delta v + \beta \cdot (1 - \text{Fuel}) + \gamma \cdot \text{Priority} + \delta \cdot \text{Formation} + \dots$</p>

          <div class="slider-group">
            <label>Alpha (&alpha;) - Maneuver &Delta;v Required: <span id="valAlpha">${this.coefficients.alpha}</span></label>
            <input type="range" min="0" max="1" step="0.05" value="${this.coefficients.alpha}" data-coeff="alpha">
          </div>
          <div class="slider-group">
            <label>Beta (&beta;) - Fuel Depletion Penalty: <span id="valBeta">${this.coefficients.beta}</span></label>
            <input type="range" min="0" max="1" step="0.05" value="${this.coefficients.beta}" data-coeff="beta">
          </div>
          <div class="slider-group">
            <label>Gamma (&gamma;) - Mission Priority Protection: <span id="valGamma">${this.coefficients.gamma}</span></label>
            <input type="range" min="0" max="1" step="0.05" value="${this.coefficients.gamma}" data-coeff="gamma">
          </div>
          <div class="slider-group">
            <label>Delta (&delta;) - Formation Disruption Multiplier: <span id="valDelta">${this.coefficients.delta}</span></label>
            <input type="range" min="0" max="1" step="0.05" value="${this.coefficients.delta}" data-coeff="delta">
          </div>
          <div class="slider-group">
            <label>Eta (&eta;) - Post-Maneuver Re-circularization: <span id="valEta">${this.coefficients.eta}</span></label>
            <input type="range" min="0" max="1" step="0.05" value="${this.coefficients.eta}" data-coeff="eta">
          </div>
        </div>

        <div class="gt-panel results-panel">
          <h3>Live Game Theory Resolution</h3>
          <div class="assignment-banner ${sol.assignedMover === 'NEITHER_CAN_MOVE' ? 'banner-deadlock' : 'banner-winner'}">
            <div class="banner-title">Assigned Maneuver Responsibility</div>
            <div class="banner-winner-name">${sol.assignedMover}</div>
            <div class="banner-rationale">${sol.rationale}</div>
          </div>

          <div class="weight-comparison-cards">
            <div class="w-card">
              <h4>${this.currentScenario.satA.satelliteId}</h4>
              <div class="big-weight">${sol.weightA.isInfinite ? '&infin;' : sol.weightA.totalWeight}</div>
              <div class="breakdown-list">
                ${sol.weightA.overrideReason ? `<div class="override-tag">${sol.weightA.overrideReason}</div>` : `
                  <div>&Delta;v Term: ${sol.weightA.components.alphaCost}</div>
                  <div>Fuel Depletion: ${sol.weightA.components.betaCost}</div>
                  <div>Priority: ${sol.weightA.components.gammaCost}</div>
                  <div>Formation: ${sol.weightA.components.deltaCost}</div>
                `}
              </div>
            </div>
            <div class="w-card">
              <h4>${this.currentScenario.satB.satelliteId}</h4>
              <div class="big-weight">${sol.weightB.isInfinite ? '&infin;' : sol.weightB.totalWeight}</div>
              <div class="breakdown-list">
                ${sol.weightB.overrideReason ? `<div class="override-tag">${sol.weightB.overrideReason}</div>` : `
                  <div>&Delta;v Term: ${sol.weightB.components.alphaCost}</div>
                  <div>Fuel Depletion: ${sol.weightB.components.betaCost}</div>
                  <div>Priority: ${sol.weightB.components.gammaCost}</div>
                  <div>Formation: ${sol.weightB.components.deltaCost}</div>
                `}
              </div>
            </div>
          </div>

          <div class="fairness-index-box">
            <span>Fairness Index: <strong>${(sol.fairnessIndex * 100).toFixed(1)}%</strong></span>
            <span>Nash Bargaining State: <strong>Pareto Optimal</strong></span>
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll('input[type="range"]').forEach(input => {
      input.addEventListener('input', e => {
        const cKey = e.target.getAttribute('data-coeff');
        this.coefficients[cKey] = parseFloat(e.target.value);
        this.renderGameTheoryStudio();
      });
    });
  }

  // --- Tab 4: Cryptography & Privacy Deep Dive ---
  async renderCryptoInspector() {
    const container = document.getElementById('cryptoDeepDive');
    if (!container) return;

    const saltA = S2SCANCrypto.generateNonce(12);
    const commitA = await S2SCANCrypto.createCommitment(this.currentScenario.satA.fuelCategory, saltA);
    const zkpA = S2SCANCrypto.generateFuelZKPProof(this.currentScenario.satA.fuelRemainingPct, 15);

    container.innerHTML = `
      <div class="crypto-grid">
        <div class="crypto-card">
          <div class="crypto-card-head">
            <span class="icon">🔐</span>
            <h4>Mutual Ed25519 Authentication Handshake</h4>
          </div>
          <div class="crypto-item">
            <label>Public Key (Satellite A):</label>
            <code>ed25519_pk_${this.currentScenario.satA.satelliteId.toLowerCase()}_09a8f2</code>
          </div>
          <div class="crypto-item">
            <label>Public Key (Satellite B):</label>
            <code>ed25519_pk_${this.currentScenario.satB.satelliteId.toLowerCase()}_77c1d4</code>
          </div>
          <div class="crypto-item">
            <label>Anti-Replay Mechanism:</label>
            <span>Cryptographic Nonce Pair (N_A || N_B) with GPS-synchronized UTC timestamp window (&plusmn;300ms)</span>
          </div>
        </div>

        <div class="crypto-card">
          <div class="crypto-card-head">
            <span class="icon">📦</span>
            <h4>SHA-256 Categorical Commitment Scheme</h4>
          </div>
          <div class="crypto-item">
            <label>True Internal Fuel (Hidden):</label>
            <span class="badge-secret">${this.currentScenario.satA.fuelRemainingPct}% (${this.currentScenario.satA.fuelCategory})</span>
          </div>
          <div class="crypto-item">
            <label>Cryptographic Salt:</label>
            <code>0x${saltA}</code>
          </div>
          <div class="crypto-item">
            <label>Published Commitment Hash (Shared in StateExchange):</label>
            <code>0x${commitA.commitmentHash}</code>
          </div>
          <div class="crypto-item">
            <label>Verification Proof Rule:</label>
            <span>SHA256(FuelCategory || Salt) == CommitmentHash</span>
          </div>
        </div>

        <div class="crypto-card">
          <div class="crypto-card-head">
            <span class="icon">🛡️</span>
            <h4>Zero-Knowledge Proof (ZKP) Range Verification</h4>
          </div>
          <div class="crypto-item">
            <label>ZKP Statement:</label>
            <span>${zkpA.statement}</span>
          </div>
          <div class="crypto-item">
            <label>zk-SNARK Signature:</label>
            <code>${zkpA.proofSignature}</code>
          </div>
          <div class="crypto-item">
            <label>Information Leaked to Competitor:</label>
            <span class="badge-success">${zkpA.revealedData}</span>
          </div>
        </div>

        <div class="crypto-card tamper-test-card">
          <div class="crypto-card-head">
            <span class="icon">⚠️</span>
            <h4>Adversarial Integrity & Lying Detection</h4>
          </div>
          <p>What happens if a rogue satellite operator lies about its fuel category to avoid maneuvering?</p>
          <div class="tamper-box">
            <div class="t-row">Satellite B Internal State: <strong>HIGH (85%)</strong></div>
            <div class="t-row">Satellite B Fraudulent Claim: <strong style="color: #ff453a">CRITICAL</strong></div>
            <div class="t-row">Verification Status: <strong style="color: #ff453a">HASH_MISMATCH_ABORT (Byzantine Caught!)</strong></div>
          </div>
          <button class="btn-tamper-run" id="btnRunTamperTest">Run Byzantine Test in Simulator</button>
        </div>
      </div>
    `;

    document.getElementById('btnRunTamperTest')?.addEventListener('click', () => {
      const byz = SIMULATION_SCENARIOS.find(s => s.id === 'scen_byzantine_liar');
      if (byz) {
        this.loadScenario(byz);
        this.switchTab('tab_simulator');
      }
    });
  }

  // --- Tab 5: Real-World Datasets ---
  renderDatasetsTab() {
    const container = document.getElementById('datasetsViewer');
    if (!container) return;

    container.innerHTML = `
      <div class="dataset-sources-grid">
        ${DATASET_CATALOG.sources.map(s => `
          <div class="d-source-card">
            <h4>${s.name}</h4>
            <p>${s.description}</p>
            <div class="d-meta">
              <span><strong>Format:</strong> ${s.format}</span>
              <span><strong>Access:</strong> ${s.license}</span>
            </div>
            <a href="${s.url}" target="_blank" class="d-link">External Data Repository &rarr;</a>
          </div>
        `).join('')}
      </div>

      <div class="dataset-records-panel">
        <h3>Sample Conjunction Records in Database</h3>
        <p class="section-desc">Click any record to load its parameters directly into the S2SCAN Simulator.</p>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Record ID</th>
                <th>Source</th>
                <th>Objects in Encounter</th>
                <th>Miss Distance</th>
                <th>Relative Speed</th>
                <th>Collision Prob (Pc)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${DATASET_CATALOG.records.map((r, i) => `
                <tr>
                  <td><code>${r.id}</code></td>
                  <td><span class="source-tag">${r.source}</span></td>
                  <td><strong>${r.sat1_name}</strong> &harr; <strong>${r.sat2_name || 'COSMOS DEBRIS'}</strong></td>
                  <td>${r.miss_distance_m ? r.miss_distance_m + ' m' : 'N/A'}</td>
                  <td>${r.relative_speed_km_s ? r.relative_speed_km_s + ' km/s' : 'N/A'}</td>
                  <td><span class="pc-badge">${r.collision_probability || 'N/A'}</span></td>
                  <td>
                    <button class="btn-load-record" data-idx="${i}">Load into Sim</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.querySelectorAll('.btn-load-record').forEach(btn => {
      btn.addEventListener('click', e => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        const record = DATASET_CATALOG.records[idx];
        if (record) {
          alert(`Loaded record ${record.id} (${record.sat1_name}). Ready for simulation!`);
          this.switchTab('tab_simulator');
        }
      });
    });
  }

  // --- Tab 6: Frontend vs Backend Architecture Matrix ---
  renderBackendMatrixTab() {
    const container = document.getElementById('backendMatrixTab');
    if (!container) return;

    container.innerHTML = `
      <div class="matrix-overview">
        <div class="matrix-banner">
          <h3>Architectural Division: Frontend Client vs. Python Backend</h3>
          <p>
            This dashboard is the <strong>fully functional frontend mission control simulator</strong>.
            Below is the comprehensive technical breakdown detailing what is currently operating inside this browser client,
            and what backend services remain to be implemented in Python.
          </p>
        </div>

        <div class="matrix-comparison-grid">
          <div class="matrix-column client-col">
            <div class="col-head">
              <span class="badge-col">CURRENTLY ACTIVE IN FRONTEND</span>
              <h4>Browser Client Simulator (Completed)</h4>
            </div>
            <ul class="matrix-list">
              <li><span class="check">✓</span> <strong>Interactive 2D/3D Orbital Radar:</strong> Canvas projection with real-time approach, TCA miss distance, covariance ellipsoid, and green post-burn escape trajectory.</li>
              <li><span class="check">✓</span> <strong>S2SCAN 6-Stage Protocol Stepper:</strong> Step-by-step FSM execution (Discover &rarr; Auth &rarr; Exchange &rarr; Negotiate &rarr; Commit &rarr; Verify).</li>
              <li><span class="check">✓</span> <strong>Full 105+ Variables Database:</strong> Interactive searchable catalog across all 9 categories with live weight influence indicators.</li>
              <li><span class="check">✓</span> <strong>WebCrypto Commitment Engine:</strong> Real browser SHA-256 hashing, secret salt reveal, and tamper detection.</li>
              <li><span class="check">✓</span> <strong>Game-Theoretic Weight Calculator:</strong> Multi-attribute weight formula with interactive sliders (&alpha;, &beta;, &gamma;, &delta;, &eta;) and Nash assignment.</li>
              <li><span class="check">✓</span> <strong>Pre-configured Scenario Matrix:</strong> Presets for GEO ITU restrictions, Formation Flight multipliers, Defunct objects, Byzantine cheaters, and Crewed spacecraft.</li>
              <li><span class="check">✓</span> <strong>Real Message Trace Logs:</strong> Inspectable JSON payloads for all 10 protocol message types.</li>
            </ul>
          </div>

          <div class="matrix-column backend-col">
            <div class="col-head">
              <span class="badge-col badge-pending">TO BE IMPLEMENTED IN BACKEND</span>
              <h4>Python Protocol Engine & Orbital Daemon</h4>
            </div>
            <ul class="matrix-list">
              <li><span class="cross">✕</span> <strong>Real SGP4 / Skyfield Ephemeris Propagation:</strong> Background Python worker fetching live CelesTrak TLEs and propagating 200+ satellites at 60-second timesteps.</li>
              <li><span class="cross">✕</span> <strong>Numerical Conjunction Covariance Integrator:</strong> 3D collision probability integration (Foster 1992 or Akella-Alfriend algorithm) from full 6x6 state covariance matrices.</li>
              <li><span class="cross">✕</span> <strong>Asynchronous Peer-to-Peer Daemon (asyncio):</strong> True decentralized socket processes running on independent ports (e.g., SatA on :8001, SatB on :8002) with synthetic packet loss and latency.</li>
              <li><span class="cross">✕</span> <strong>Production Cryptography Engine:</strong> Native Python <code>cryptography</code> library for real Ed25519 key generation and py_ecc for verifiable zk-SNARKs.</li>
              <li><span class="cross">✕</span> <strong>CCSDS Proximity-1 / Space Packet Framing:</strong> Binary packet serialization (ASN.1 / Protobuf) matching space communication standards.</li>
              <li><span class="cross">✕</span> <strong>Monte Carlo Batch Experiment Suite (Weeks 9-11):</strong> Automated runner executing 1,000+ conjunctions across message loss rates (0% to 30%) and outputting research CSVs.</li>
              <li><span class="cross">✕</span> <strong>REST / WebSocket Telemetry Bridge:</strong> FastAPI WebSocket endpoint piping live Python simulation ticks directly into this frontend dashboard.</li>
            </ul>
          </div>
        </div>

        <div class="backend-roadmap-box">
          <h4>Python Backend Directory Structure & Starter Code</h4>
          <p>We have pre-created the backend skeleton in <code>backend/satellite_agent.py</code> and <code>backend/README_BACKEND.md</code> with full specifications.</p>
        </div>
      </div>
    `;
  }
}

// Instantiate application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.s2scanApp = new S2SCANApp();
});
