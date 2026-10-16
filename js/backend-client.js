// S2SCAN Python Backend API Client
// Provides high-performance async bridge to the Python 3.12 FastAPI engine on port 8000
// Handles real-time telemetry streaming, Nash Bargaining calculations, Ed25519 signatures,
// SGP4 conjunction retrieval, and live UDP socket node control.

export class S2SCANBackendClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl; // Relative to current origin (works seamlessly with FastAPI StaticFiles)
    this.isOnline = false;
    this.latencyMs = 0;
    this.serverInfo = null;
    this.listeners = [];
  }

  onStatusChange(callback) {
    this.listeners.push(callback);
  }

  notifyStatus() {
    this.listeners.forEach(cb => {
      try {
        cb({
          isOnline: this.isOnline,
          latencyMs: this.latencyMs,
          serverInfo: this.serverInfo
        });
      } catch (err) {
        console.error('Status callback error:', err);
      }
    });
  }

  // Probe server health and determine roundtrip latency
  async checkStatus() {
    const t0 = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`${this.baseUrl}/api/status`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        this.latencyMs = Math.round(performance.now() - t0);
        this.serverInfo = await res.json();
        this.isOnline = true;
      } else {
        this.isOnline = false;
        this.serverInfo = null;
      }
    } catch (err) {
      this.isOnline = false;
      this.serverInfo = null;
      this.latencyMs = -1;
    }

    this.notifyStatus();
    return {
      isOnline: this.isOnline,
      latencyMs: this.latencyMs,
      serverInfo: this.serverInfo
    };
  }

  // Evaluate scenario hazard, Nash equilibrium, and threat level instantly in Python
  async evaluateScenario(scenarioId, scenarioData = null) {
    const t0 = performance.now();
    const res = await fetch(`${this.baseUrl}/api/scenario/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario_id: scenarioId,
        scenario_data: scenarioData
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Python Evaluation Error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    data.latencyMs = Math.round(performance.now() - t0);
    return data;
  }

  // Advance protocol state via Python S2SCANGIMEngine & SatelliteAgent
  async stepProtocol({ scenarioId = 'scen_leo_standard', currentStage = 0, byzantineInjected = false, scenarioData = null }) {
    const t0 = performance.now();
    const res = await fetch(`${this.baseUrl}/api/protocol/step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario_id: scenarioId,
        current_stage: currentStage,
        byzantine_injected: byzantineInjected,
        scenario_data: scenarioData
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Python Backend Error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    data.latencyMs = Math.round(performance.now() - t0);
    return data;
  }

  // Solve multi-attribute Nash Bargaining & Rubinstein urgency in Python
  async solveGameTheory(params = {}) {
    const t0 = performance.now();
    const payload = {
      delta_v: params.deltaV ?? 0.45,
      fuel_a: params.fuelA ?? 75.0,
      fuel_b: params.fuelB ?? 25.0,
      priority_a: params.priorityA ?? 5,
      priority_b: params.priorityB ?? 6,
      formation_a: params.formationA ?? 1.0,
      formation_b: params.formationB ?? 1.0,
      is_geo_a: params.isGeoA ?? false,
      is_geo_b: params.isGeoB ?? false,
      is_crewed_a: params.isCrewedA ?? false,
      is_crewed_b: params.isCrewedB ?? false,
      is_defunct_a: params.isDefunctA ?? false,
      is_defunct_b: params.isDefunctB ?? false,
      tca_seconds: params.tcaSeconds ?? 94.0,
      current_t: params.currentT ?? 15.0,
      lambda_urgency: params.lambdaUrgency ?? 15.0
    };

    const res = await fetch(`${this.baseUrl}/api/game_theory/solve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Python Game Theory Solver Error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    data.latencyMs = Math.round(performance.now() - t0);
    return data;
  }

  // Verify Ed25519 signatures and SHA-256 commitments in Python native cryptography
  async verifyCrypto(params = {}) {
    const t0 = performance.now();
    const payload = {
      category: params.category || 'HIGH',
      salt_hex: params.saltHex || null,
      commitment_hash: params.commitmentHash || null,
      tamper_claim: params.tamperClaim || null
    };

    const res = await fetch(`${this.baseUrl}/api/crypto/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Python Crypto Verification Error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    data.latencyMs = Math.round(performance.now() - t0);
    return data;
  }

  // Execute authentic loopback UDP socket exchange between ports 9001 and 9002
  async runSocketExchange(rounds = 3) {
    const t0 = performance.now();
    const res = await fetch(`${this.baseUrl}/api/socket/run_exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rounds })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Python Socket Node Error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    data.latencyMs = Math.round(performance.now() - t0);
    return data;
  }

  // Fetch real CelesTrak SGP4 conjunction events calculated by Python
  async getOrbitalConjunctions() {
    const t0 = performance.now();
    const res = await fetch(`${this.baseUrl}/api/orbital/conjunctions`);
    if (!res.ok) {
      throw new Error(`Python Orbital Pipeline Error (${res.status})`);
    }
    const data = await res.json();
    data.latencyMs = Math.round(performance.now() - t0);
    return data;
  }

  // Fetch 1,000-trial Monte Carlo benchmark results
  async getBenchmarksSummary() {
    const t0 = performance.now();
    const res = await fetch(`${this.baseUrl}/api/benchmarks/summary`);
    if (!res.ok) {
      throw new Error(`Python Benchmarks Error (${res.status})`);
    }
    const data = await res.json();
    data.latencyMs = Math.round(performance.now() - t0);
    return data;
  }

  // Fetch registered scenarios from Python backend
  async getScenarios() {
    const res = await fetch(`${this.baseUrl}/api/scenarios`);
    if (!res.ok) {
      throw new Error(`Python Scenarios Error (${res.status})`);
    }
    return await res.json();
  }
}

// Global singleton instance
export const backendClient = new S2SCANBackendClient();
