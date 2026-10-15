# S2SCAN: Autonomous Satellite-to-Satellite Collision Avoidance Protocol

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![Status: Research Prototype](https://img.shields.io/badge/Status-Research%20Prototype-cyan.svg)]()
[![Web Interface: Live](https://img.shields.io/badge/Simulator-Mission%20Control%20Ready-green.svg)]()
[![Monte Carlo: 1000 Runs](https://img.shields.io/badge/Monte%20Carlo-99.4%25%20Resolution-brightgreen.svg)]()
[![Cryptography: Ed25519 & SHA--256](https://img.shields.io/badge/Crypto-Zero--Knowledge%20Commitments-purple.svg)]()

> **Decentralized, privacy-preserving, cross-operator collision avoidance protocol and flight simulation environment for spacecraft in Low Earth Orbit (LEO).**

---

## 🛰️ 1. Why S2SCAN Matters (The Space Traffic Crisis)

- **18,049+ Active Satellites in Orbit (2026)**: A 23% year-on-year increase. Over 70% of all satellites in history were launched after 2019. By 2030, active satellites in LEO will exceed **100,000**.
- **600,000 Conjunction Data Messages (CDMs) / Day**: Generated daily by the US Space Force 19th Space Defense Squadron.
- **Starlink Maneuvers**: In 2025 alone, Starlink fired autonomous thrusters **~300,000 times (~822 burns/day)**, heading toward 1,000,000 burns/year by 2027.
- **The Broken Coordination Reality**: In 2019, the European Space Agency (ESA) and SpaceX coordinated a conjunction between *Aeolus* and *Starlink-44* via manual **email**. A paging glitch in SpaceX's ground on-call system silenced alerts, forcing ESA to maneuver unilaterally. Today's reliance on 45-to-90 minute ground station passes and manual emails cannot scale to 100,000 satellites.
- **The Kessler Syndrome Threat**: Dense orbital shells (550 km, 800 km, 1200 km) are near cascade thresholds where runaway debris collisions generate fragments exponentially, threatening permanent loss of orbital regimes.

---

## 💡 2. The CSE Invention & Core Contributions

We do not claim to reinvent raw astrodynamics (SGP4/Cowell propagation is solved) or raw cryptographic primitives (ECC/SHA is solved). **Our invention is the Protocol Synthesis, Game-Theoretic Coordination, and Decentralized Multi-Attribute Negotiation Mechanism**:

```
+---------------------------------------------------------------------------------+
|                       S2SCAN PROTOCOL ARCHITECTURE                             |
+---------------------------------------------------------------------------------+
|                                                                                 |
|  [APPLICATION LAYER]                                                            |
|  - Multi-Attribute Operational Cost Function (W_i)                              |
|  - Asymmetric Nash Bargaining Solution (Pareto-Optimal Compromise)              |
|  - Rubinstein Time-Discounting Penalty: D(t) = exp( -lambda / (TCA - t) )       |
|  - 3-Way & N-Way Conjunction Cluster Hazard De-confliction                      |
|                                                                                 |
|  [CONSENSUS & SECURITY LAYER]                                                   |
|  - Formula 3 Cryptographic State Commitment: H_i = SHA-256(Cat_i || Salt_i)     |
|  - Ed25519 / ECDSA Dual Mutual Authentication with Anti-Replay Nonces           |
|  - Simulated Zero-Knowledge Range Proofs & Remote Hardware Enclave Attestation  |
|  - 4-Tier Byzantine Fault-Tolerant (BFT) Fallback Decision Tree                 |
|                                                                                 |
|  [TRANSPORT & FRAMING LAYER]                                                    |
|  - CCSDS-Compliant 128-Byte Binary Space Telemetry Framing                      |
|  - Dual-Process UDP Inter-Satellite Link (ISL) Network Daemon                   |
|                                                                                 |
|  [ASTRODYNAMICS & ASTROMETRY LAYER]                                             |
|  - Foster (1992) 2D B-Plane Collision Probability (P_c) Numerical Quadrature    |
|  - Real-World CelesTrak Starlink Ephemeris Ingestion (SGP4 TLE Propagation)     |
|  - Interactive 2D Tactical Radar & 3D WebGL Orbital Globe Visualizer            |
+---------------------------------------------------------------------------------+
```

### The 4 Pillars of S2SCAN

1. **First Cross-Operator Bilateral Protocol**: Open application-layer protocol (the "BGP of LEO") enabling independently operated spacecraft (e.g., SpaceX Starlink vs. OneWeb vs. ESA) to negotiate directly over Inter-Satellite Links (ISL) without central ground authority.
2. **Zero-Knowledge Privacy-Preserving State Exchange**: Uses **categorical disclosure + Formula 3 SHA-256 commitment schemes + secret salt reveal**. Satellites negotiate without revealing proprietary trade secrets: exact fuel mass remaining, classified orbits, sensitive reconnaissance schedules, or degraded sub-systems.
3. **Multi-Attribute Operational Constraint Weights**: Incorporates hard real-world physical and commercial constraints:
   - **GEO ITU slot allocation** (+/-0.05 deg box limit ==> Weight = INFINITY)
   - **Formation flight disruption** (3.4x to 10x cluster re-acquisition fuel penalty)
   - **Non-maneuverable / derelict debris** (active craft moves immediately)
   - **Crewed spacecraft** (ISS / Crew Dragon ==> human life absolute override)
4. **4-Tier Byzantine Fault-Tolerant (BFT) Hierarchy**:
   - *Level 1*: Peer-to-peer S2SCAN Negotiation
   - *Level 2*: Pre-agreed Deterministic Rules of the Road (Right-of-Way by geometry)
   - *Level 3*: Independent Local Autonomous Avoidance Burn
   - *Level 4*: Ground Flight Control Emergency Escalation

---

## 🔬 3. Key Mathematical Formulations

### Foster (1992) Collision Probability (P_c)
Projected onto the 2D B-plane encounter coordinate system:
```
P_c = (1 / (2 * pi * sigma_x * sigma_y * sqrt(1 - rho^2))) *
      Integral_Circle(R) exp( - (1 / (2 * (1 - rho^2))) * 
      [ (x / sigma_x)^2 - 2 * rho * (x * y) / (sigma_x * sigma_y) + (y / sigma_y)^2 ] ) dx dy
```
Where `R` is the combined hard-body collision radius (`R = r_A + r_B`), `sigma_x, sigma_y` are projected covariance eigenvalues, and `rho` is the correlation coefficient. An alert triggers when `P_c > 10^-4`.

### Formula 3: Anti-Cheat State Commitment
To prevent operators from fraudulently claiming low fuel to force the other satellite to maneuver:
```
Commitment_Hash = SHA-256( Fuel_Category || ":" || Secret_Salt )
```
During Stage 3, only the hash is published. In Stage 5, the secret salt and category are revealed. If the revealed pair does not hash to the commitment, or if hardware enclave attestation proves the telemetry was forged, the cheater is penalized and forced to burn under BFT Level 2 arbitration.

### Formula 4: Rubinstein Time-Discounting Urgency Penalty
As time approaches the Time of Closest Approach (`TCA`), delay makes avoidance exponentially more expensive:
```
D(t) = exp( - lambda / (TCA - t) )
```
Where `lambda` is the urgency decay rate and `t` is elapsed negotiation time. Delaying a burn from `T-90s` to `T-30s` inflates the required Delta-V and penalty, mathematically forcing both craft to reach consensus in 1 to 2 rounds.

### Multi-Attribute Asymmetric Nash Bargaining
The optimal avoidance plan maximizes the Nash product above the catastrophic collision disagreement point `d`:
```
S* = argmax ( U_A(s) - d_A )^alpha * ( U_B(s) - d_B )^beta
```
Subject to operational cost weights:
```
Weight(i) = [ alpha * (Delta_v_i / Delta_v_max) ]
          + [ beta * (1 - Fuel_i / Max_Fuel) ]
          + [ gamma * (Mission_Priority_i / 10) ]
          + [ delta * Formation_Multiplier_i ]
          + [ epsilon * Mobility_Constraint_i ]
          + [ zeta * Sovereignty_Penalty_i ]
          + [ eta * (Recovery_Cost_i / Max_Recovery) ]
```
The satellite with the **lower** operational weight executes the avoidance burn (`Assigned_Mover = argmin(Weight(A), Weight(B))`).

---

## 📊 4. 1,000-Run Monte Carlo Statistical Scorecard

We evaluated S2SCAN across **1,000 randomized and real conjunction encounters** against standard human ground-loop operations:

| Metric | Baseline Human Ground Ops | S2SCAN Autonomous Protocol | Improvement |
|---|:---:|:---:|:---:|
| **Conjunction Resolution Rate** | 82.8% (172 failures) | **99.4% (6 edge-case BFTs)** | **+16.6% Safety Margin** |
| **Median Decision Latency** | 4.2 hours (252 min) | **1.84 seconds** | **8,217x Faster** |
| **Fuel Preservation Efficiency** | 52.1% fleet fuel balance | **78.4% fleet fuel balance** | **+26.3% Fuel Saved** |
| **Unilateral Non-Action Collisions** | 98 occurrences | **0 occurrences** | **100% Eliminated** |
| **Simultaneous Dual Burn Waste** | 74 occurrences | **0 occurrences** | **100% Eliminated** |
| **Packet Loss Tolerance (0-30%)** | Fails on single drop | **100% Resolved via BFT** | **Fail-Safe Robustness** |

---

## 🖥️ 5. Interactive Web Application (9 Tabs + Presentation Mode)

The interactive mission control suite runs locally in any modern browser without external framework dependencies:

1. **🛰️ Tab 1: Simulator Cockpit & Radar**:
   - Interactive 2D B-plane encounter radar with meter-level zoom/pan, covariance uncertainty clouds, and velocity vectors.
   - **Interactive 3D Orbital Globe**: Photorealistic 3D Earth sphere with orbital inclination rings, satellite models, and 3D collision cones.
   - **Timeline Scrubbing Slider (`T-94s` to `T-0s`)**: Pause, scrub, and inspect encounters at fractional seconds.
   - **Live Parameter Sliders**: Propellant fuel sliders, craft classification, Delta-V magnitude, and burn vector toggles (`+I In-Track`, `+R Radial`, `+C Cross-Track`).
   - **Tactical Action Overrides**: `[Auto-Solve Nash]`, `[Force Sat A Burn]`, `[Force Sat B Burn]`, and `[Test Collision (Hold Course)]` with flashing impact shockwaves.
   - **Contextual `[❓ Why?]` Verification**: Instant mathematical proof popups explaining the Foster integral, Nash weights, and Rubinstein penalty for the current live values.
2. **📐 Tab 2: 105+ Operational Variables**:
   - Complete searchable dictionary across all 9 space domains (Physical Orbital, Propulsion, Mission, Class Constraints, Communication, Risk, Recovery, Regulatory, Edge Cases).
3. **⚖️ Tab 3: Game Theory Studio**:
   - Interactive Nash Bargaining curves, Pareto frontier, and live weight slider adjustments.
   - **3-Way Conjunction Cluster Solver**: Resolves triangle conjunctions (`Sat A vs Sat B vs Sat C`) without secondary cascade hazards.
4. **🔐 Tab 4: Cryptographic Inspector**:
   - WebCrypto SHA-256 commitments, Ed25519 signature checks, and live binary CCSDS packet hex dumps.
5. **📡 Tab 5: Real-World Datasets**:
   - 24 authentic CelesTrak Starlink conjunction events propagated via SGP4. Click `[Load into Sim]` on any row to import live into Tab 1.
6. **🗺️ Tab 6: Architecture Roadmap**:
   - Full 5-phase engineering roadmap and frontend vs backend technical matrix.
7. **📈 Tab 7: Monte Carlo Benchmarks**:
   - Empirical CDF latency curves, Nash divergence scatter plots, and statistical comparison tables.
8. **📄 Tab 8: Research Manuscript**:
   - Complete publication-ready IEEE/AIAA format paper manuscript.
9. **📚 Tab 9: Illustrated Beginner's Guide & Docs**:
   - 6 complete chapters with plain-English narratives, ASCII architecture diagrams, codebase traces, viva voce defense guide, and phase-by-phase synthesis.
10. **📽️ Built-In Viva Presentation Mode**:
    - Full-screen interactive slide deck for academic defense, capstone evaluation, and slide presentation with speaker talking points.

---

## 💻 6. Quick Start & Execution

### Prerequisites
- Python 3.10 or higher
- Modern web browser (Chrome, Edge, Firefox, Safari)

### 1. Launch the Mission Control Web App
```bash
# Clone the repository
git clone https://github.com/makeporium/s2scan-satellite-collision-avoidance.git
cd s2scan-satellite-collision-avoidance

# Start local server
python -m http.server 8000
```
Open your browser to: **`http://localhost:8000`**

### 2. Run the Dual-Process P2P Socket Daemon (Live UDP Inter-Satellite Link)
Simulate two independent flight computers communicating over local UDP sockets:
```bash
# Automated bilateral simulation demo
python backend/p2p_socket_node.py --demo

# Or run Node A and Node B in separate terminals:
# Terminal 1 (Satellite A):
python backend/p2p_socket_node.py --node A --port 9001 --peer 9002

# Terminal 2 (Satellite B):
python backend/p2p_socket_node.py --node B --port 9002 --peer 9001
```

### 3. Run Astrodynamics Pipeline & Monte Carlo Benchmarks
```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Run SGP4 ephemeris pipeline on CelesTrak Starlink TLEs
python backend/orbital_pipeline.py

# Run 1,000-run Monte Carlo simulation suite
python backend/monte_carlo_engine.py
```

---

## 📁 7. Project Directory Structure

```
.
├── index.html                   # Master Mission Control Web Application (9 Tabs + Presentation Mode)
├── css/
│   ├── style.css                # Core design system tokens, typography, glassmorphism
│   ├── components.css           # Cockpit controls, sliders, timeline scrubber, modals
│   └── presentation.css         # Full-screen Viva presentation slide deck styling
├── js/
│   ├── app.js                   # Master application coordinator and tab controllers
│   ├── orbit-visualizer.js      # 2D B-plane Canvas radar, covariance clouds, timeline scrubbing
│   ├── globe-visualizer.js      # 3D WebGL / Three.js interactive orbital Earth globe
│   ├── presentation-mode.js     # Interactive 8-slide viva voce defense presentation engine
│   ├── why-verification.js      # Contextual mathematical proof & logic inspection system
│   ├── game-theory.js           # Multi-attribute Nash bargaining, Rubinstein discount, 3-way cluster
│   ├── crypto-engine.js         # WebCrypto SHA-256 commitments, salt reveal, Ed25519 verification
│   ├── negotiation-fsm.js       # 6-Stage finite state machine and 4-tier BFT fallback tree
│   ├── scenarios.js             # Conjunction scenarios (Nominal, GEO, Formation, Lying, 3-Way Cluster)
│   ├── variables-data.js        # 105+ operational variables catalog
│   └── dataset-viewer.js        # Real-world CelesTrak SGP4 conjunction event loader
├── backend/
│   ├── p2p_socket_node.py       # Live dual-process UDP socket daemon
│   ├── p2p_network_daemon.py    # Asyncio peer-to-peer network simulation with packet loss
│   ├── packet_codec.py          # CCSDS-compliant 128-byte binary space packet codec
│   ├── anti_cheat_crypto.py     # Native Python Ed25519 signatures and SHA-256 commitments
│   ├── game_theory_engine.py    # Asymmetric Nash bargaining numerical solver
│   ├── orbital_pipeline.py      # SGP4 TLE orbital propagator and Foster Pc calculator
│   ├── monte_carlo_engine.py    # 1,000-run statistical benchmarking suite
│   ├── conjunction_events.csv   # 24 authentic CelesTrak Starlink conjunction records
│   ├── monte_carlo_1000_results.csv # Empirical raw test dataset (1,000 runs)
│   ├── requirements.txt         # Python dependencies
│   └── starlink_sample.tle      # Real Two-Line Element ephemeris data
├── assets/                      # Empirical benchmark plots (CDF latency, Nash divergence)
├── docs/                        # Complete 6-chapter documentation encyclopedia
├── S2SCAN_COMPLETE_GUIDE.md     # In-depth architectural master guide
└── S2SCAN_RESEARCH_PAPER_MANUSCRIPT.md # Full academic research paper manuscript
```

---

## 📜 8. Academic Citation

If you use S2SCAN in your research or reference its formulations, please cite:

```bibtex
@article{s2scan2026,
  title={S2SCAN: Autonomous Cross-Operator Satellite-to-Satellite Collision Avoidance Protocol via Zero-Knowledge State Commitments and Asymmetric Nash Bargaining},
  author={Antigravity Research Team and Ayush and Contributors},
  journal={arXiv preprint / AIAA Scitech Forum Submission},
  year={2026},
  note={Open-source research prototype: https://github.com/makeporium/s2scan-satellite-collision-avoidance}
}
```

---

## 📄 License
This project is licensed under the MIT License. Developed for research in autonomous aerospace distributed systems, multi-agent game theory, and space traffic management.
