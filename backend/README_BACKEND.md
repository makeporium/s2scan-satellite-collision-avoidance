# S2SCAN Python Backend Architecture & Integration Guide

This document provides the complete roadmap for integrating the Python backend with the frontend Mission Control Simulator.

---

## 1. What Is Implemented in Frontend vs. What Remains for Backend

### Currently Operating in Frontend (`index.html`, `js/`):
- **Aerospace Radar Visualizer**: Canvas rendering of Earth, orbits, approaching satellites, TCA encounter sphere, and post-burn green trajectory escape path.
- **Client Protocol Stepper**: Complete 6-Stage Finite State Machine (Discover &rarr; Authenticate &rarr; Exchange &rarr; Negotiate &rarr; Commit &rarr; Verify).
- **105+ Variables Database**: Full searchable catalog with categorized tabs, units, and live weight calculation effects.
- **Client Cryptography Simulation**: WebCrypto SHA-256 commitments, salt generation, secret verification, and Byzantine lying detection.
- **Game Theory Studio**: Interactive multi-attribute cost formula with live coefficient tuning ($\alpha, \beta, \gamma, \delta, \eta$) and Nash Bargaining outcome determination.
- **Scenario Presets**: Standard LEO, GEO ITU Constraint, Formation Flight Multiplier, Non-Maneuverable / Defunct, Byzantine Lying Satellite, 30% ISL Packet Loss, and Crewed Vehicle Override.

---

### What Is NOT Implemented Yet in Backend (To Be Built):

#### 1. Real SGP4 / Skyfield Orbital Propagation Pipeline (Week 5 Milestone)
- **Status**: Not Implemented
- **Requirements**:
  - Python script fetching real Starlink TLE ephemerides from CelesTrak API (`https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle`).
  - Loading ~200 active satellites into `skyfield.api.EarthSatellite` objects.
  - Computing $(x, y, z)$ inertial position vectors over 24–48 hour windows using numpy vectorized broadcasting.
  - Pairwise Euclidean distance evaluation: identifying actual conjunction pairs ($< 5\text{ km}$ miss distance).
  - Output: `conjunction_events.csv` ground truth file.

#### 2. 3D Conjunction Assessment Covariance Integrator
- **Status**: Not Implemented
- **Requirements**:
  - Read $6 \times 6$ Cartesian state covariance matrices from Space-Track CDMs.
  - Project covariance into encounter plane ($B$-plane coordinate system).
  - Implement Foster 1992 or Akella-Alfriend 3D Collision Probability ($P_c$) numerical integration algorithm.

#### 3. Real Asynchronous Peer-to-Peer Network Daemon (Week 7 Milestone)
- **Status**: Prototype created in `backend/satellite_agent.py`; multi-port socket daemon pending.
- **Requirements**:
  - Python `asyncio` or ZeroMQ / UDP socket listeners where each satellite runs as an isolated process on its own port (e.g. `localhost:8101` for Sat A, `localhost:8102` for Sat B).
  - Simulating inter-satellite physical crosslink constraints:
    - Configurable synthetic propagation delay (10–30 ms).
    - Configurable Bernoulli packet drop rates (0%, 5%, 10%, 20%, 30%).
    - Automatic state timer timeouts and fallback triggering.

#### 4. Real Cryptographic Engine using Native Libraries
- **Status**: Prototype created; Ed25519 native integration pending.
- **Requirements**:
  - Use Python's `cryptography.hazmat.primitives.asymmetric.ed25519` for true key generation, private key signing, and signature verification.
  - Deterministic nonces per RFC 6979 to prevent side-channel leakage.
  - Zero-Knowledge Range Proofs via `py_ecc` or zk-SNARK proof abstraction for proving $\text{fuel} \ge \Delta v_{\text{required}}$.

#### 5. Comparison Baseline Implementations (Week 8 Milestone)
- **Status**: Not Implemented
- **Requirements**:
  - `baseline_random.py`: Randomly picks one satellite to maneuver without negotiation. Measures fuel waste and how often a constrained GEO or low-fuel satellite is picked.
  - `baseline_ground.py`: Simulates current real-world manual process (ESA email model) with a 15-minute operational latency. Measures failure rate when $\text{TCA} < 15\text{ minutes}$.

#### 6. Monte Carlo Experiment Suite (Weeks 9–11 Milestones)
- **Status**: Not Implemented
- **Requirements**:
  - Batch experiment script running 1,000+ conjunction scenarios across varying fuel levels, satellite classes, and packet loss rates.
  - Logs: negotiation duration, message count, agreement rate, commitment verification pass rate, total $\Delta v$ consumed.
  - Generates raw CSV files and matplotlib graphs for research paper Section 4.

#### 7. REST & WebSocket Telemetry Server
- **Status**: Not Implemented
- **Requirements**:
  - FastAPI application serving WebSocket endpoint `/ws/telemetry`.
  - Streams real-time Python agent states, propagated orbits, and message traces into this frontend dashboard.

---

## 2. How to Run the Backend Starter

1. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

2. Test the core Python agent model and S2SCAN engine:
   ```bash
   python backend/satellite_agent.py
   ```

3. Expected Output:
   ```
   Negotiation Result: CONVERGED_SAFE
   Assigned Mover: STARLINK-3104
   [T+0.0s] STARLINK-3104 -> ONEWEB-0412: ConjunctionAlert (Pc=1.84e-3)
   [T+0.1s] STARLINK-3104 -> ONEWEB-0412: AuthRequest
   [T+0.2s] ONEWEB-0412 -> STARLINK-3104: AuthResponse [VERIFIED]
   [T+0.3s] StateExchange (Commitment Hashes)
   [T+0.4s] ManeuverProposal (Assigned by Game-Theoretic Weights)
   [T+0.7s] CONSENSUS LOCKED
   [T+0.8s] Maneuver Executed: Miss Distance increased to 4642m [SAFE]
   ```
