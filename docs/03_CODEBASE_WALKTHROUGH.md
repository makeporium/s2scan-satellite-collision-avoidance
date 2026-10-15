# Chapter 3: Complete Codebase Walkthrough
## How the Frontend and Python Backend Work Together to Create S2SCAN

---

### Introduction: The Dual Architecture

To understand how S2SCAN is coded, you need to understand that the project is built in two interconnected layers:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        S2SCAN DUAL ARCHITECTURE                        │
├───────────────────────────────────┬────────────────────────────────────┤
│ LAYER 1: Aerospace Frontend Client│ LAYER 2: Python Computational Core │
│ (HTML5 / Vanilla CSS / JavaScript)│ (Python 3.12 / SGP4 / Asyncio / ML)│
├───────────────────────────────────┼────────────────────────────────────┤
│ • Interactive Mission Control UI  │ • Real orbital propagator (SGP4)   │
│ • 2D Canvas orbital radar         │ • Live CelesTrak TLE satellite data│
│ • 6-stage protocol FSM animation  │ • Formal Nash Bargaining solver    │
│ • Client-side SHA-256 crypto demo │ • CCSDS binary space packet framing│
│ • 105+ variables filterable table │ • Async P2P network daemon         │
│ • Academic reader & benchmarks    │ • 1,000-run Monte Carlo runner     │
└───────────────────────────────────┴────────────────────────────────────┘
```

Why do we have both?
- **The Python Backend** is where the heavy scientific computations happen: solving orbital differential equations, generating 300-DPI Matplotlib research charts, and running 1,000 automated Monte Carlo simulations.
- **The Frontend Client** is what brings it all to life visually: letting a professor, examiner, or satellite operator watch the radar screen, click through each stage of the negotiation, inject Byzantine faults, and verify the math interactively in their web browser without installing complex Python dependencies.

Let's take a tour of every single file in the repository.

---

## 1. The Frontend Tour (What You See in the Browser)

All frontend code lives in the root directory and the `js/` and `css/` folders.

```text
PRJ/
├── index.html                 ◄── Master Mission Control interface
├── css/
│   ├── style.css              ◄── Cyberpunk dark aerospace theme tokens & layouts
│   └── components.css         ◄── Cards, radars, tables, paper reader & figure styles
└── js/
    ├── app.js                 ◄── Main orchestrator & tab controller
    ├── orbit-visualizer.js    ◄── 2D Canvas orbital radar & B-plane visualizer
    ├── negotiation-fsm.js     ◄── 6-stage protocol finite state machine
    ├── variables-data.js      ◄── 105+ operational satellite variables database
    ├── scenarios.js           ◄── Preset conjunction scenarios (Starlink, OneWeb, etc.)
    ├── crypto-engine.js       ◄── Client-side WebCrypto SHA-256 demonstration
    ├── game-theory.js         ◄── Client-side Nash bargaining calculator
    └── dataset-viewer.js      ◄── Real Space-Track CDM and CelesTrak data viewer
```

---

### 1.1 `index.html`: The Master Mission Control
- **What it does:** Contains the semantic structure for all **8 tabs** of the application.
- **Key Tabs in the Navigation Bar:**
  1. `tab_simulator`: The interactive cockpit showing the orbital radar, the 6-stage negotiation bar, and real-time telemetry logs.
  2. `tab_variables`: Searchable database of 105+ aerospace variables (propellant levels, orbital elements, communication latencies).
  3. `tab_game_theory`: An interactive tuning studio with sliders to adjust bargaining weights (`α`, `β`, `γ`, `δ`).
  4. `tab_crypto`: Cryptographic inspector showing SHA-256 commitments, salt generation, and an adversarial "Byzantine Lie" test button.
  5. `tab_datasets`: Authentic space conjunction datasets (Space-Track CDMs, CelesTrak TLEs, ESA Kelvins challenge).
  6. `tab_backend_matrix`: A transparent matrix detailing what runs in JavaScript vs. what runs in Python.
  7. `tab_benchmarks`: The Phase 4 empirical results dashboard displaying the 1,000 Monte Carlo runs and 300-DPI Matplotlib figures.
  8. `tab_paper`: The Phase 5 IEEE/AIAA Academic Research Paper Reader.

---

### 1.2 `js/orbit-visualizer.js`: The 2D Radar Canvas
- **What it does:** Uses the HTML5 2D Canvas API to draw a high-tech orbital radar screen.
- **How it works:**
  - It maintains an internal physics loop (`requestAnimationFrame`) running at 60 frames per second.
  - It draws the central Earth wireframe, concentric radar range rings (from 500 meters up to 10 kilometers), and two satellite icons (`Satellite A` in Cyan, `Satellite B` in Purple).
  - When you click **"Step Protocol"**, as soon as Stage 5/6 completes (Maneuver Agreed), the visualizer smoothly animates a **thruster burn trail**, shifting the maneuvered satellite out of the collision path and expanding the miss distance to safety!

---

### 1.3 `js/negotiation-fsm.js`: The 6-Stage Protocol State Machine
- **What it does:** Manages the sequential flow of the negotiation between Satellite A and Satellite B.
- **The 6 Stages It Steps Through:**
  1. **Stage 1 (Discover):** Satellites detect each other via radar/ISL; compute miss distance and Time to Closest Approach (TCA).
  2. **Stage 2 (Authenticate):** Mutual cryptographic handshake using Ed25519 digital signatures and public keys.
  3. **Stage 3 (Commit):** Both satellites generate secret salts and broadcast SHA-256 state commitments (locking their claims).
  4. **Stage 4 (Bargain):** Both satellites evaluate maneuver costs and solve the Asymmetric Nash Bargaining equation.
  5. **Stage 5 (Reveal):** Both satellites reveal their secret salts to audit their claims.
  6. **Stage 6 (Verify & Burn):** Cryptographic verification checks out; the assigned satellite fires its thrusters and broadcasts the confirmation receipt.

---

### 1.4 `js/variables-data.js`: The 105+ Variables Database
- **What it does:** A comprehensive catalog of 105 real physical parameters modeled by S2SCAN.
- **Examples of Variables Included:**
  - `Var #01`: Semi-Major Axis ($a$) in kilometers.
  - `Var #02`: Orbital Eccentricity ($e$).
  - `Var #14`: Remaining Propellant Mass ($m_{\text{fuel}}$) in kilograms.
  - `Var #28`: Specific Impulse ($I_{\text{sp}}$) in seconds.
  - `Var #45`: Hard-Body Collision Cross-Section ($A_{\text{coll}}$) in square meters.
  - `Var #72`: Inter-Satellite Laser Bit-Error Rate (BER).
  - `Var #91`: ITU Geostationary Slot Tolerance ($\pm 0.05^\circ$).

---

## 2. The Python Backend Tour (The Computational Engine)

All Python code lives in the `backend/` directory:

```text
PRJ/backend/
├── orbital_pipeline.py         ◄── SGP4 orbital propagator (220 live Starlinks)
├── anti_cheat_crypto.py        ◄── 3-layer SHA-256 + Ed25519 anti-cheat verifier
├── game_theory_engine.py       ◄── Asymmetric Nash bargaining & Rubinstein engine
├── baseline_random.py          ◄── Baseline 1 (Random selection policy)
├── baseline_ground.py          ◄── Baseline 2 (Ground-mediated 15-min delay model)
├── s2scan_protocol.py          ◄── Master comparative pipeline
├── packet_codec.py             ◄── CCSDS 133.0-B-1 binary space packet framing
├── p2p_network_daemon.py       ◄── Asynchronous concurrent ISL crosslink daemon
├── adversarial_stress_suite.py ◄── BFT stress suite & 350-trial packet loss sweep
├── monte_carlo_engine.py       ◄── 1,000-run Monte Carlo simulation harness
├── conjunction_events.csv      ◄── Real orbital close approaches from CelesTrak
├── adversarial_test_results.csv◄── Raw data from 350 packet loss trials
├── monte_carlo_1000_results.csv◄── Raw telemetry from 1,000 Monte Carlo runs
└── monte_carlo_summary.json    ◄── Statistical metrics (median, P95, failure rates)
```

Let's examine how the core Python files work:

---

### 2.1 `backend/orbital_pipeline.py`: Real Orbital Astrodynamics
- **What it does:** Connects to **CelesTrak** (the official international satellite ephemeris repository) and downloads live Two-Line Element (TLE) sets for **220 active Starlink satellites**.
- **The SGP4 Propagator:**
  Using the NASA-standard **SGP4 (Simplified General Perturbations-4)** orbital mechanics library, it propagates each satellite's trajectory forward in time second-by-second.
- **Conjunction Detection:**
  It calculates pairwise distances across all 24,090 potential satellite pairs. Whenever two satellites pass within 5 km of each other, it extracts the encounter geometry, computes the Foster collision probability ($P_c$), and saves authentic conjunction events to `backend/conjunction_events.csv`.

---

### 2.2 `backend/anti_cheat_crypto.py`: The 3-Layer Anti-Cheat Engine
- **What it does:** Implements the complete anti-cheat verification pipeline in Python.
- **Key Functions:**
  - `generate_enclave_attestation(satellite_id, fuel_percent, is_geo)`: Simulates the on-chip Secure Enclave. It categorizes fuel into `CRITICAL`, `NOMINAL`, or `HIGH`, and signs the measurement using an Ed25519 private key.
  - `create_sha256_commitment(satellite_id, fuel_class, salt)`: Hashes the claimed category with a 128-bit random cryptographic salt using Python's `hashlib.sha256()`.
  - `verify_commitment_and_attestation(...)`: Checks both that the revealed salt matches the pre-commitment hash AND that the enclave hardware signature is genuine. If an adversary attempts to lie, this function immediately returns `False` and flags a `BYZANTINE_FRAUD_DETECTED` alert!

---

### 2.3 `backend/game_theory_engine.py`: The Nash Bargaining Solver
- **What it does:** Solves the cooperative game between Satellite A and Satellite B.
- **Key Functions:**
  - `compute_maneuver_cost(delta_v, fuel_fraction, priority, is_geo)`: Evaluates the operational fuel burden using rocket equations and penalty multipliers.
  - `solve_asymmetric_nash(...)`: Solves the Generalized Nash Product:
    ```text
    Maximize: [Utility_A - d_A]^α * [Utility_B - d_B]^β
    ```
    It outputs the optimal maneuver allocation: who moves, in what orbital direction (Radial-Out, In-Track, or Cross-Track), and the exact delta-v (m/s) required to expand miss distance beyond 2,000 meters.
  - `rubinstein_discount(tca, elapsed_t, lambda_urgency)`: Computes the decaying discount factor $D(t) = \exp(-\lambda / (T_{\text{CA}} - t))$, forcing rapid convergence as time runs out.

---

### 2.4 `backend/packet_codec.py`: CCSDS Binary Space Packet Framing
- **What it does:** Implements the international space standard **CCSDS 133.0-B-1 Space Packet Protocol** using Python's `struct` library.
- **How it works:**
  - `encode_packet(...)`: Packs message headers, sequence counters, timestamps, session IDs, and Ed25519 digital signatures into a compact binary byte array.
  - At the very end of the byte array, it computes a **32-bit CRC (Cyclic Redundancy Check)** checksum:
    ```python
    crc = zlib.crc32(packet_bytes) & 0xffffffff
    ```
  - `decode_packet(...)`: Unpacks the binary bytes. It checks the CRC-32 first. If a bit was flipped during transmission, it throws a `ChecksumError` in microseconds.

---

### 2.5 `backend/p2p_network_daemon.py`: Asynchronous Peer-to-Peer Daemon
- **What it does:** Uses Python's `asyncio` framework to run two truly concurrent satellite nodes (`Satellite A` and `Satellite B`) as independent asynchronous event loops.
- **Realistic Physical Space Channel:**
  It introduces a simulated physical laser crosslink with:
  - Physical light-speed propagation delay ($12.4\text{ ms}$).
  - Configurable random packet drop probability ($p \in [0.0, 0.30]$).
  - Independent watchdog timeout timers ($T_{\text{watchdog}} = 1.5\text{ s}$).
- If packets are dropped by laser scintillation, this daemon proves that the satellites do not deadlock; they smoothly escalate to **Tier 3 (Local Autonomous Avoidance Burns)**.

---

### 2.6 `backend/monte_carlo_engine.py`: The 1,000-Run Experiment Runner
- **What it does:** The master automation script that runs 1,000 randomized conjunction encounters to scientifically benchmark S2SCAN.
- **What it produces:**
  - `backend/monte_carlo_1000_results.csv`: Row-by-row telemetry of all 1,000 runs.
  - `backend/monte_carlo_summary.json`: Summary statistics (mean, median, P95, failure rates).
  - Three 300-DPI Matplotlib research figures saved directly to `assets/`:
    - `figure1_latency_cdf.png` (Latency CDF curve)
    - `figure2_safety_comparison.png` (Safety comparison bar chart)
    - `figure3_packet_loss_reliability.png` (Packet loss resilience curve)

---

## 3. Tracing a Single Conjunction from Start to Finish

To see how all these pieces fit together, let's trace an encounter from the instant a collision is detected to the moment safety is confirmed:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   A COMPLETE S2SCAN ENCOUNTER TIMELINE                 │
├─────────┬──────────────────────────────────────────────────────────────┤
│ Time    │ Event & Action Taken                                         │
├─────────┼──────────────────────────────────────────────────────────────┤
│ T - 90s │ SENSING & DISCOVERY:                                         │
│         │ Onboard radar senses an approaching object. SGP4 calculates  │
│         │ miss distance = 310 meters, Pc = 4.2e-3 (> 1e-4 threshold).  │
├─────────┼──────────────────────────────────────────────────────────────┤
│ T - 89s │ STAGE 1 & 2: DISCOVERY & AUTHENTICATION                      │
│         │ Satellites establish laser crosslink (ISL).                  │
│         │ Mutual handshake packets exchanged using Ed25519 signatures. │
├─────────┼──────────────────────────────────────────────────────────────┤
│ T - 88s │ STAGE 3: CRYPTOGRAPHIC COMMITMENT                            │
│         │ Hardware Secure Enclave reads fuel tank sensors.             │
│         │ Satellites hash their claims with secret salts (SHA-256)     │
│         │ and broadcast the commitment hashes. Neither can lie now!    │
├─────────┼──────────────────────────────────────────────────────────────┤
│ T - 87s │ STAGE 4: ASYMMETRIC NASH BARGAINING                          │
│         │ Both satellites feed parameters into the Nash Bargaining     │
│         │ equation. In 15 milliseconds, the math determines:           │
│         │ "Satellite A has 75% fuel; Satellite B is low on fuel.       │
│         │ Satellite A will execute a +0.32 m/s radial burn."           │
├─────────┼──────────────────────────────────────────────────────────────┤
│ T - 86s │ STAGE 5: REVEAL & AUDIT                                      │
│         │ Both satellites reveal their salts and enclave signatures.   │
│         │ Hashes match! Hardware signatures verify! No cheating.       │
├─────────┼──────────────────────────────────────────────────────────────┤
│ T - 85s │ STAGE 6: VERIFIED BURN EXECUTION                             │
│         │ Satellite A's flight computer commands its Hall-effect ion   │
│         │ thrusters to fire for 4.2 seconds.                           │
├─────────┼──────────────────────────────────────────────────────────────┤
│ T - 0s  │ TIME OF CLOSEST APPROACH (TCA):                              │
│         │ Satellites pass each other safely at a miss distance of      │
│         │ 2,450 meters (well beyond the 2,000-meter safety envelope).  │
│         │ COLLISION AVOIDED WITH ZERO HUMAN DELAY!                     │
└─────────┴──────────────────────────────────────────────────────────────┘
```

---

### Summary of Chapter 3
- The project has a dual architecture: a lightweight, interactive HTML5/Canvas Mission Control frontend, and a high-performance Python astrodynamics and game-theory backend.
- The Python backend fetches live satellite ephemerides from CelesTrak, verifies cryptographic commitments, runs asynchronous P2P network daemons, and executes 1,000-run Monte Carlo campaigns.
- Every encounter follows a clean 6-stage protocol that resolves collisions in under 0.3 seconds.

Next, let's explore **what our 1,000 scientific experiments proved and how to read the research figures** in [Chapter 4](file:///c:/Users/astro/Desktop/College%20Ayush/PRJ/docs/04_EMPIRICAL_RESULTS_EXPLAINED.md)!
