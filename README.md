# S2SCAN: Autonomous Satellite-to-Satellite Collision Avoidance Negotiation Protocol

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![Status: Research Prototype](https://img.shields.io/badge/Status-Research%20Prototype-cyan.svg)]()
[![Web Interface: Live](https://img.shields.io/badge/Simulator-Mission%20Control%20Ready-green.svg)]()

> **Decentralized, privacy-preserving, cross-operator collision avoidance protocol for spacecraft in Low Earth Orbit.**

---

## 🛰️ 1. Why S2SCAN Matters (The Space Traffic Crisis)

- **18,049+ Active Satellites in Orbit (2026)**: A 23% year-on-year increase. Over 70% of all satellites in history were launched after 2019. By 2030, this count will exceed **100,000**.
- **600,000 Conjunction Data Messages (CDMs) / Day**: Generated daily by the US Space Force 19th Space Defense Squadron.
- **Starlink Maneuvers**: In 2025 alone, Starlink fired thrusters **~300,000 times (~822 burns/day)**, heading toward 1,000,000 burns/year by 2027.
- **The Broken Coordination Reality**: In 2019, ESA and SpaceX coordinated a conjunction between *Aeolus* and *Starlink-44* via manual **email**. A paging glitch in SpaceX's ground system silenced alerts, forcing ESA to maneuver alone. Today's reliance on manual ground passes and emails cannot scale to 100,000 satellites.
- **The Kessler Syndrome**: Critical orbital shells (550 km, 800 km, 1200 km) are near cascade thresholds where runaway debris collisions destroy operational orbits.

---

## 💡 2. What Unique Are We Doing? (Our CSE Invention)

We do not claim to invent raw orbital physics (SGP4 is solved) or raw cryptographic primitives (ECC/SHA is solved). **Our invention is the Protocol Synthesis and Decentralized Multi-Attribute Mechanism**:

1. **First Cross-Operator Bilateral Protocol**: Open application-layer protocol (the "BGP of LEO") enabling independently operated spacecraft to negotiate directly without central ground authority.
2. **Zero-Knowledge Privacy-Preserving State Exchange**: Uses **categorical disclosure + SHA-256 commitment schemes + simulated ZKP range proofs**. Satellites negotiate without revealing proprietary trade secrets: exact fuel mass remaining, classified orbits, sensitive reconnaissance schedules, or degraded sub-systems.
3. **Multi-Attribute Operational Constraint Weights**: Incorporates hard real-world constraints into the game-theoretic cost calculation:
   - **GEO ITU slot allocation** ($\pm 0.05^\circ$ box limit $\implies \text{Weight} = \infty$)
   - **Formation flight disruption** ($3.4\times$ cluster re-acquisition fuel penalty)
   - **Non-maneuverable / derelict debris** ($\implies$ active craft moves immediately)
   - **Crewed spacecraft** (ISS / Crew Dragon $\implies$ human life absolute override)
4. **4-Tier Byzantine Fault-Tolerant (BFT) Hierarchy**:
   - *Level 1*: Peer-to-peer S2SCAN Negotiation
   - *Level 2*: Pre-agreed Deterministic Rules of the Road
   - *Level 3*: Independent Local Autonomous Avoidance Burn
   - *Level 4*: Ground Flight Control Emergency Escalation

---

## 📐 3. The 105+ Variables Database

The protocol evaluates 105+ parameters grouped into 9 operational categories:

| Category | Count | Focus |
|:---|:---:|:---|
| **A. Physical Orbital** | 10 | Altitude, Inclination, Velocity, TCA, Miss Distance, RIC Conjunction Geometry |
| **B. Propulsion & Fuel** | 10 | Usable propellant, Categorical fuel, Specific Impulse (Isp), Thruster type, Delta-V required |
| **C. Mission Status** | 10 | Mission phase, Commercial SLAs, Active imaging lock, Constellation redundancy |
| **D. Class Hard Constraints** | 25 | GEO ITU licenses, Sun-sync LTAN, Formation clusters, Defunct buses, Crewed craft |
| **E. Communication & Trust** | 10 | ISL SNR (dB), RTT latency, Certificate validity, Nonce freshness, Blackout windows |
| **F. Collision Risk** | 10 | Collision Probability ($P_c$), Covariance ellipsoids, Hard-body cross section, Trend rate |
| **G. Post-Maneuver Recovery** | 10 | Drift rate, Re-circularization Delta-V, Solar panel sun angle, Battery SoC |
| **H. Operator & Regulatory** | 10 | Operator nationality, Regulatory authority, Insurance, Bilateral treaties |
| **I. Extreme Edge Cases** | 10 | Dual-defunct craft, Byzantine lying, 3-way conjunctions, Mid-negotiation dropouts |

---

## 🔄 4. The 6-Stage Negotiation Workflow

```
[1. DISCOVER]      Conjunction alert triggered (Pc > 1e-4, TCA < 120s)
      │
[2. AUTHENTICATE]  Mutual Ed25519 challenge-response handshake; anti-replay nonces
      │
[3. EXCHANGE]      Privacy-preserving categorical states & SHA-256 commitments
      │
[4. NEGOTIATE]     Multi-attribute cost weights & Rubinstein alternating-offers
      │
[5. COMMIT]        Two-Phase Consensus Lock; salt reveal & Byzantine fraud verification
      │
[6. VERIFY/EXEC]   Thruster burn execution; post-burn trajectory re-computation (Pc -> 1e-9)
```

---

## 💻 5. Project Architecture & Split

| Component | Frontend Mission Control (`index.html`, `js/`) | Python Backend (`backend/`) |
|:---|:---|:---|
| **Orbital Visualization** | Real-time Canvas radar, Earth body, approaching craft, TCA encounter, post-burn escape path | SGP4/Skyfield TLE propagation engine |
| **Protocol FSM** | Interactive 6-stage stepper with inspectable JSON trace logs | Multi-port asynchronous socket daemon (`asyncio`) |
| **Variables Catalog** | Searchable table with dynamic category filters and impact ratings | Telemetry ingestion and logging pipeline |
| **Cryptography** | WebCrypto SHA-256 commitments, salt verification, Byzantine lie detection | Native Python `cryptography` (Ed25519) and py_ecc ZKP engine |
| **Game Theory** | Interactive coefficient sliders ($\alpha, \beta, \gamma, \delta, \eta$) with live winner assignment | Multi-objective optimization & reinforcement learning |

---

## 🚀 6. Quick Start

### Frontend Simulator Console
Simply open `index.html` in any modern web browser or serve locally:
```bash
python -m http.server 8000
```
Then visit **`http://localhost:8000`** to access:
- **Simulator Console**: Run step-by-step negotiations or trigger automated auto-runs.
- **105+ Variables Explorer**: Search and filter orbital and propulsion attributes.
- **Game Theory Studio**: Tune weighting coefficients and watch the winner update live.
- **Cryptographic Inspector**: Check digital signatures, salt commitments, and tamper detection.
- **Real-World Datasets**: Inspect CelesTrak TLEs and Space-Track CDMs.

### Backend Agent Prototype
Run the Python backend agent model:
```bash
pip install -r backend/requirements.txt
python backend/satellite_agent.py
```

---

## 📚 7. Reference Datasets

- **CelesTrak Starlink Ephemeris TLEs**: Active Starlink constellation elements.
- **Space-Track.org CDMs**: Conjunction Data Messages from the 19th Space Defense Squadron.
- **ESA Kelvins Collision Avoidance Challenge**: 13,000+ real conjunction events from the ESA Space Debris Office.
- **ESA DISCOS**: Spacecraft mass, thruster, and cross-section parameters.

---

## 📄 License
MIT License. Developed for research in autonomous aerospace distributed systems and multi-agent space traffic management.
