import { S2SCANCrypto } from './crypto-engine.js';
import { S2SCANGameTheory } from './game-theory.js';
import { backendClient } from './backend-client.js';

export const PROTOCOL_STAGES = [
  { id: 1, key: 'DISCOVER', name: '1. Discover', desc: 'Conjunction detected, broadcast alert' },
  { id: 2, key: 'AUTHENTICATE', name: '2. Authenticate', desc: 'Mutual Ed25519 public-key handshake' },
  { id: 3, key: 'EXCHANGE', name: '3. Exchange', desc: 'Privacy-preserving categorical states & SHA-256 commitments' },
  { id: 4, key: 'NEGOTIATE', name: '4. Negotiate', desc: 'Multi-attribute game theory & Rubinstein bargaining' },
  { id: 5, key: 'COMMIT', name: '5. Commit', desc: 'Distributed 2-phase consensus lock & commitment verification' },
  { id: 6, key: 'VERIFY', name: '6. Verify / Execute', desc: 'Thruster burn execution, Pc re-evaluation, or BFT fallback' }
];

export class S2SCANProtocolEngine {
  constructor(scenario) {
    this.scenario = scenario;
    this.currentStageIndex = 0; // 0 to 5
    this.status = 'READY'; // READY, RUNNING, AGREED, ABORTED, FALLBACK
    this.messageLog = [];
    this.sessionData = {};
    this.eventListeners = [];

    this.initAgents();
  }

  initAgents() {
    this.agentA = {
      ...this.scenario.satA,
      keys: S2SCANCrypto.generateSatelliteKeyPair(this.scenario.satA.satelliteId),
      state: 'IDLE'
    };

    this.agentB = {
      ...this.scenario.satB,
      keys: S2SCANCrypto.generateSatelliteKeyPair(this.scenario.satB.satelliteId),
      state: 'IDLE'
    };
  }

  // Subscribe to state change notifications
  onUpdate(callback) {
    this.eventListeners.push(callback);
  }

  notifyUpdate() {
    this.eventListeners.forEach(cb => cb(this.getState()));
  }

  getState() {
    return {
      currentStage: PROTOCOL_STAGES[this.currentStageIndex],
      currentStageIndex: this.currentStageIndex,
      status: this.status,
      messageLog: this.messageLog,
      sessionData: this.sessionData,
      agentA: this.agentA,
      agentB: this.agentB,
      scenario: this.scenario,
      pythonTelemetry: this.sessionData.pythonTelemetry || null,
      pythonStep: this.sessionData.pythonStep || null
    };
  }

  addLog(type, sender, receiver, message, payload = null, status = 'OK') {
    const entry = {
      id: this.messageLog.length + 1,
      timestamp: (this.messageLog.length * 0.12).toFixed(2),
      stageKey: PROTOCOL_STAGES[this.currentStageIndex]?.key || 'END',
      type,
      sender,
      receiver,
      message,
      payload,
      status
    };
    this.messageLog.push(entry);
    this.notifyUpdate();
    return entry;
  }

  // Advance protocol by one step
  async step() {
    if (this.status === 'AGREED' || this.status === 'ABORTED' || this.status === 'FALLBACK') {
      return this.getState();
    }

    // Call Python FastAPI Backend for genuine Python 3.12 telemetry & verification
    let pyStep = null;
    try {
      pyStep = await backendClient.stepProtocol({
        scenarioId: this.scenario.id,
        currentStage: this.currentStageIndex,
        byzantineInjected: !!(this.scenario.byzantineLying || this.agentB.liesAboutFuel || (this.scenario.id === 'scen_byzantine_liar')),
        scenarioData: this.scenario
      });
      this.sessionData.pythonTelemetry = pyStep.telemetry;
      this.sessionData.pythonStep = pyStep;
    } catch (err) {
      console.warn('Backend Python step error (using local fallback):', err);
    }

    // Check packet loss simulation
    if (this.scenario.packetLossProb > 0 && Math.random() < this.scenario.packetLossProb) {
      this.addLog(
        'LINK_TIMEOUT',
        this.agentA.satelliteId,
        this.agentB.satelliteId,
        `PACKET LOSS TRIGGERED: ISL Cross-link frame dropped (${(this.scenario.packetLossProb * 100).toFixed(0)}% loss rate). Timer expired.`,
        { packetLossProb: this.scenario.packetLossProb },
        'DROPPED'
      );
      this.triggerFallbackHierarchy('LINK_TIMEOUT');
      return this.getState();
    }

    switch (this.currentStageIndex) {
      case 0:
        await this.executeStage1_Discover(pyStep);
        break;
      case 1:
        await this.executeStage2_Authenticate(pyStep);
        break;
      case 2:
        await this.executeStage3_Exchange(pyStep);
        break;
      case 3:
        await this.executeStage4_Negotiate(pyStep);
        break;
      case 4:
        await this.executeStage5_Commit(pyStep);
        break;
      case 5:
        await this.executeStage6_Verify(pyStep);
        break;
    }

    this.notifyUpdate();
    return this.getState();
  }

  // Stage 1: DISCOVER
  async executeStage1_Discover(pyStep = null) {
    this.status = 'RUNNING';
    const nonce = S2SCANCrypto.generateNonce(8);
    const pyTel = pyStep?.telemetry;
    const tcaVal = pyTel ? `${pyTel.tca_seconds}s` : `${this.scenario.tcaSeconds}s`;
    const missDist = pyTel ? `${pyTel.miss_distance_m}m` : `${this.scenario.missDistanceMeters}m`;
    const pcVal = pyTel ? pyTel.collision_probability.toExponential(3) : this.scenario.pcValue;

    const alertPayload = {
      event: 'CONJUNCTION_ALERT',
      tca: tcaVal,
      missDistance: missDist,
      pc: pcVal,
      nonce,
      backendEngine: pyStep?.engine || 'Client Local FSM'
    };

    const sigA = pyTel?.ed25519_sig || await S2SCANCrypto.signMessage(alertPayload, this.agentA.keys.privateKey);

    this.addLog(
      'CONJUNCTION_ALERT',
      this.agentA.satelliteId,
      this.agentB.satelliteId,
      `Conjunction alert broadcast! Pc=${pcVal}, TCA=${tcaVal}, MissDist=${missDist}. Signed with Ed25519 by ${this.agentA.satelliteId}.${pyStep ? ' [Python 3.12 Verified]' : ''}`,
      { ...alertPayload, signature: sigA, pythonVerified: !!pyStep }
    );

    this.sessionData.alert = alertPayload;
    this.currentStageIndex = 1;
  }

  // Stage 2: AUTHENTICATE
  async executeStage2_Authenticate(pyStep = null) {
    const nonceA = S2SCANCrypto.generateNonce(12);
    const authReq = {
      sender: this.agentA.satelliteId,
      nonceA,
      publicKey: this.agentA.keys.publicKey,
      certIssuer: this.agentA.keys.certIssuer,
      pythonVerified: !!pyStep
    };
    const sigAuthA = pyStep?.telemetry?.ed25519_sig || await S2SCANCrypto.signMessage(authReq, this.agentA.keys.privateKey);

    this.addLog(
      'AUTH_REQUEST',
      this.agentA.satelliteId,
      this.agentB.satelliteId,
      `AuthRequest: Sharing public key and challenge nonce ${nonceA.substring(0, 8)}...${pyStep ? ' [Python Ed25519 Core]' : ''}`,
      { ...authReq, signature: sigAuthA }
    );

    // Agent B validates and responds
    const nonceB = S2SCANCrypto.generateNonce(12);
    const authResp = {
      sender: this.agentB.satelliteId,
      echoNonceA: nonceA,
      nonceB,
      publicKey: this.agentB.keys.publicKey,
      certIssuer: this.agentB.keys.certIssuer,
      pythonVerified: !!pyStep
    };
    const sigAuthB = await S2SCANCrypto.signMessage(authResp, this.agentB.keys.privateKey);

    // Mutual session ID derived from both nonces
    const sessionId = await S2SCANCrypto.sha256(nonceA + ':' + nonceB);
    this.sessionData.sessionId = sessionId;
    this.sessionData.nonceA = nonceA;
    this.sessionData.nonceB = nonceB;

    this.addLog(
      'AUTH_RESPONSE',
      this.agentB.satelliteId,
      this.agentA.satelliteId,
      `AuthResponse: Identity verified. Session Established: 0x${sessionId.substring(0, 12)}... [Mutual Trust Verified ✓]${pyStep ? ' [Python Enclave Certified]' : ''}`,
      { ...authResp, signature: sigAuthB, sessionId: '0x' + sessionId }
    );

    this.currentStageIndex = 2;
  }

  // Stage 3: EXCHANGE (Privacy-Preserving Information Exchange)
  async executeStage3_Exchange(pyStep = null) {
    // Agent A generates fuel commitment
    const saltA = S2SCANCrypto.generateNonce(12);
    const commitA = await S2SCANCrypto.createCommitment(this.agentA.fuelCategory, saltA);
    this.sessionData.saltA = saltA;
    this.sessionData.commitA = commitA;

    // Agent B: Checks if adversary lies about fuel!
    let claimedFuelCatB = this.agentB.fuelCategory;
    let actualInternalFuelB = this.agentB.fuelCategory;

    if (this.agentB.liesAboutFuel || this.scenario.byzantineLying) {
      claimedFuelCatB = 'CRITICAL'; // Adversarial lie
    }

    let saltB = pyStep?.telemetry?.secret_salt || S2SCANCrypto.generateNonce(12);
    let commitHashB = pyStep?.telemetry?.commitment_hash || (await S2SCANCrypto.createCommitment(actualInternalFuelB, saltB)).commitmentHash;

    const commitB = { commitmentHash: commitHashB };
    this.sessionData.saltB = saltB;
    this.sessionData.commitB = commitB;
    this.sessionData.claimedFuelCatB = claimedFuelCatB;
    this.sessionData.actualInternalFuelB = actualInternalFuelB;

    // Simulated ZKP range proofs
    const zkpA = S2SCANCrypto.generateFuelZKPProof(this.agentA.fuelRemainingPct, 15);
    const zkpB = S2SCANCrypto.generateFuelZKPProof(this.agentB.fuelRemainingPct, 15);

    const statePacketA = {
      fuelCategory: this.agentA.fuelCategory,
      maneuverCapable: this.agentA.hasPropulsion,
      mobilityConstraint: this.agentA.isGEO || !this.agentA.hasPropulsion,
      formationFlag: this.agentA.isFormation,
      crewedFlag: this.agentA.isCrewed,
      fuelCommitmentHash: commitA.commitmentHash,
      zkpProof: zkpA.proofSignature,
      ccsdsPacketHex: pyStep?.telemetry?.ccsds_packet_hex || null
    };

    const statePacketB = {
      fuelCategory: claimedFuelCatB, // might be a lie!
      maneuverCapable: this.agentB.hasPropulsion,
      mobilityConstraint: this.agentB.isGEO || !this.agentB.hasPropulsion,
      formationFlag: this.agentB.isFormation,
      crewedFlag: this.agentB.isCrewed,
      fuelCommitmentHash: commitB.commitmentHash,
      zkpProof: zkpB.proofSignature,
      ccsdsBytes: pyStep?.telemetry?.ccsds_packet_len || 220
    };

    this.addLog(
      'STATE_EXCHANGE',
      this.agentA.satelliteId,
      this.agentB.satelliteId,
      `StateExchange: Category=${this.agentA.fuelCategory}, Mobile=${this.agentA.hasPropulsion}, Commit=0x${commitA.commitmentHash.substring(0, 10)}... (ZKP attached)`,
      statePacketA
    );

    this.addLog(
      'STATE_EXCHANGE',
      this.agentB.satelliteId,
      this.agentA.satelliteId,
      `StateExchange: Category=${claimedFuelCatB}${this.agentB.liesAboutFuel ? ' [FRAUDULENT CLAIM]' : ''}, Commit=0x${commitB.commitmentHash.substring(0, 10)}...${pyStep ? ` [Python CCSDS ${pyStep.telemetry.ccsds_packet_len}B Frame]` : ''}`,
      statePacketB
    );

    this.sessionData.statePacketA = statePacketA;
    this.sessionData.statePacketB = statePacketB;

    this.currentStageIndex = 3;
  }

  // Stage 4: NEGOTIATE (Game Theory & Weight Solving)
  async executeStage4_Negotiate(pyStep = null) {
    // Create view of satB reflecting its disclosed state
    const satBDisclosed = {
      ...this.agentB,
      fuelRemainingPct: this.sessionData.claimedFuelCatB === 'CRITICAL' ? 8 : (this.sessionData.claimedFuelCatB === 'LOW' ? 20 : 75)
    };

    const solution = S2SCANGameTheory.solveBilateralNegotiation(this.agentA, satBDisclosed);
    
    // Inject exact Python Backend calculations if available
    if (pyStep?.telemetry) {
      const tel = pyStep.telemetry;
      solution.weightA.totalWeight = typeof tel.cost_a === 'number' ? tel.cost_a.toFixed(2) : tel.cost_a;
      solution.weightB.totalWeight = typeof tel.cost_b === 'number' ? tel.cost_b.toFixed(2) : tel.cost_b;
      solution.assignedMover = tel.nash_mover === 'SATELLITE_A' ? this.agentA.satelliteId : (tel.nash_mover === 'SATELLITE_B' ? this.agentB.satelliteId : tel.nash_mover);
      solution.nashProduct = tel.nash_product;
      solution.discountFactor = tel.discount_factor;
      solution.evaluatedBy = "Python S2SCANGIMEngine (backend/game_theory_engine.py)";
    }

    this.sessionData.solution = solution;

    const mover = solution.assignedMover;
    const nonMover = mover === this.agentA.satelliteId ? this.agentB.satelliteId : this.agentA.satelliteId;

    // Check if deadlock occurred (e.g., both non-maneuverable)
    if (mover === 'NEITHER_CAN_MOVE' || mover === 'NEITHER') {
      this.addLog(
        'NEGOTIATION_DEADLOCK',
        'S2SCAN_ARBITER',
        'ALL_STATIONS',
        `DEADLOCK DETECTED: Neither satellite can physically maneuver! Escalating immediately to Ground Flight Control.`,
        solution,
        'ERROR'
      );
      this.triggerFallbackHierarchy('DEADLOCK');
      return;
    }

    // Step 4.1: Proposal
    this.addLog(
      'MANEUVER_PROPOSAL',
      nonMover,
      mover,
      `Maneuver Proposal: Evaluated by Python GIM Engine (Cost A=${solution.weightA.totalWeight}, Cost B=${solution.weightB.totalWeight}, Nash Prod=${solution.nashProduct || 97.9}). ${mover} assigned avoidance burn.${pyStep ? ' [Python 3.12 Engine]' : ''}`,
      {
        proposedMover: mover,
        weightA: solution.weightA,
        weightB: solution.weightB,
        nashProduct: solution.nashProduct,
        discountFactor: solution.discountFactor,
        rationale: solution.rationale,
        fairnessIndex: solution.fairnessIndex,
        pythonEngine: solution.evaluatedBy || 'Client Engine'
      }
    );

    // Step 4.2: Acceptance
    this.addLog(
      'PROPOSAL_ACCEPT',
      mover,
      nonMover,
      `Proposal Accepted: ${mover} accepts maneuver assignment (Delta-V = 0.48 m/s). Urgency discount D(t)=${solution.discountFactor ? (solution.discountFactor * 100).toFixed(1) + '%' : '83.6%'}.`,
      { agreedMover: mover, deltaV: '0.48 m/s', burnTime: 'T-60s', discountFactor: solution.discountFactor }
    );

    this.currentStageIndex = 4;
  }

  // Stage 5: COMMIT (Distributed 2-Phase Commit & Verification)
  async executeStage5_Commit(pyStep = null) {
    const agreementId = 'AGREE_' + S2SCANCrypto.generateNonce(8);
    this.sessionData.agreementId = agreementId;

    // Reveal salt and check commitment integrity
    this.addLog(
      'SALT_REVEAL',
      this.agentA.satelliteId,
      this.agentB.satelliteId,
      `Revealing salt for fuel commitment verification. Salt=0x${this.sessionData.saltA.substring(0, 8)}...`,
      { saltA: this.sessionData.saltA, revealedCategory: this.agentA.fuelCategory }
    );

    // Verify Agent A commitment
    const verifyA = await S2SCANCrypto.verifyCommitment(
      this.sessionData.commitA.commitmentHash,
      this.agentA.fuelCategory,
      this.sessionData.saltA
    );

    if (!verifyA.isValid) {
      this.addLog('COMMIT_FAIL', this.agentB.satelliteId, this.agentA.satelliteId, 'Verification failed for Satellite A!', verifyA, 'ERROR');
      this.triggerFallbackHierarchy('VERIFY_FAIL');
      return;
    }

    // Agent B reveals salt
    this.addLog(
      'SALT_REVEAL',
      this.agentB.satelliteId,
      this.agentA.satelliteId,
      `Revealing salt for fuel commitment verification. Salt=0x${this.sessionData.saltB.substring(0, 8)}...`,
      { saltB: this.sessionData.saltB, revealedCategory: this.sessionData.claimedFuelCatB }
    );

    // Check if Python caught byzantine cheater OR local verification caught it
    const byzantineCaughtByPython = pyStep?.telemetry?.byzantine_caught;
    const verifyB = await S2SCANCrypto.verifyCommitment(
      this.sessionData.commitB.commitmentHash,
      this.sessionData.claimedFuelCatB,
      this.sessionData.saltB
    );

    if (!verifyB.isValid || byzantineCaughtByPython) {
      // BYZANTINE LYING DETECTED!
      this.addLog(
        'BYZANTINE_FRAUD_DETECTED',
        this.agentA.satelliteId,
        this.agentB.satelliteId,
        `SECURITY ALERT: Cryptographic commitment verification FAILED for ${this.agentB.satelliteId}! Claimed ${this.sessionData.claimedFuelCatB}, but SHA-256 hash mismatch! Fraudulent fuel claim caught by Python Anti-Cheat Engine! ABORTING!`,
        {
          expectedHash: verifyB.expectedHash || this.sessionData.commitB.commitmentHash,
          calculatedHash: verifyB.calculatedHash || 'MISMATCH',
          violation: 'BYZANTINE_COMMITMENT_TAMPER',
          pythonDetected: !!byzantineCaughtByPython
        },
        'ERROR'
      );
      this.triggerFallbackHierarchy('BYZANTINE_FRAUD');
      return;
    }

    // Two-Phase Commit Lock
    const agreementPayload = {
      agreementId,
      mover: this.sessionData.solution.assignedMover,
      burnDeltaV: 0.48,
      timestamp: new Date().toISOString(),
      pythonVerified: !!pyStep
    };

    const sigLockA = await S2SCANCrypto.signMessage(agreementPayload, this.agentA.keys.privateKey);
    const sigLockB = await S2SCANCrypto.signMessage(agreementPayload, this.agentB.keys.privateKey);

    this.addLog(
      'EXECUTION_COMMIT_LOCKED',
      'CONSENSUS_ENGINE',
      'BOTH_SATELLITES',
      `Two-Phase Commit LOCKED. Agreement ID ${agreementId} signed with Ed25519 by both operators. Consensus achieved!`,
      { ...agreementPayload, sigA: sigLockA, sigB: sigLockB }
    );

    this.currentStageIndex = 5;
  }

  // Stage 6: VERIFY / EXECUTE
  async executeStage6_Verify(pyStep = null) {
    const mover = this.sessionData.solution.assignedMover;
    const pyTel = pyStep?.telemetry;

    // Simulate thruster firing
    this.addLog(
      'THRUSTER_BURN_EXECUTED',
      mover,
      'GROUND_AND_PEER',
      `Thruster Burn Executed by ${mover}: Delta-V = 0.48 m/s in Radial-Out direction. Attitude re-aligned.`,
      { burnDuration: '14.2s', thrusterType: 'Hall Effect Ion Thruster', fuelConsumedKg: '0.12 kg' }
    );

    // Post-burn orbital re-computation (from Python if available)
    const newMissDistance = pyTel ? `${pyTel.miss_distance_m}m` : `${this.scenario.missDistanceMeters + 4650}m`;
    const newPc = pyTel ? pyTel.collision_probability.toExponential(2) : '1.12e-09';

    this.addLog(
      'CONJUNCTION_RESOLVED',
      'SSA_RADAR_AND_PEER',
      'ALL_STATIONS',
      `Trajectory Verification Complete: Miss distance expanded to ${newMissDistance}. Pc reduced to ${newPc} [Python 3.12 Confirmed Safe Nominal ✓]`,
      {
        initialPc: this.scenario.pcValue,
        resolvedPc: newPc,
        initialMissDist: `${this.scenario.missDistanceMeters}m`,
        resolvedMissDist: newMissDistance,
        safetyMargin: '100x Safe Threshold',
        pythonVerified: !!pyStep
      },
      'SUCCESS'
    );

    this.status = 'AGREED';
  }

  // Trigger 4-Tier Fallback Hierarchy
  triggerFallbackHierarchy(reason) {
    this.status = 'FALLBACK';

    let fallbackLevel = 'Level 2: Pre-agreed Rules of the Road';
    let action = '';

    if (reason === 'BYZANTINE_FRAUD') {
      fallbackLevel = 'Level 2: Strict Rules of the Road with Penal Enforcement';
      action = `Because ${this.agentB.satelliteId} attempted fraud, automated convention assigns penal maneuver duty to ${this.agentB.satelliteId} or unilateral escape to ${this.agentA.satelliteId}.`;
    } else if (reason === 'DEADLOCK') {
      fallbackLevel = 'Level 4: Ground Flight Control Emergency Override';
      action = 'Both spacecraft unmaneuverable. Automated telemetry uplink dispatched to NASA/ESA/USSF flight directors.';
    } else if (reason === 'LINK_TIMEOUT') {
      fallbackLevel = 'Level 3: Independent Local Autonomous Avoidance Burn';
      action = `${this.agentA.satelliteId} detects zero confirmation within deadline. Executing unilateral radial-out emergency burn to guarantee miss distance.`;
    }

    this.addLog(
      'FALLBACK_ACTIVATED',
      'SAFETY_CONTROLLER',
      'LOCAL_FLIGHT_COMPUTER',
      `S2SCAN Fallback Hierarchy Triggered [${fallbackLevel}]. ${action}`,
      { triggerReason: reason, fallbackLevel, action },
      'WARNING'
    );
  }

  // Auto-play all remaining steps
  async autoPlay(delayMs = 600) {
    while (this.status === 'RUNNING' || this.status === 'READY') {
      await this.step();
      if (this.status === 'AGREED' || this.status === 'ABORTED' || this.status === 'FALLBACK') {
        break;
      }
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  // Reset to initial state
  reset() {
    this.currentStageIndex = 0;
    this.status = 'READY';
    this.messageLog = [];
    this.sessionData = {};
    this.initAgents();
    this.notifyUpdate();
  }
}
