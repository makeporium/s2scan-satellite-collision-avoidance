# S2SCAN: Autonomous Satellite-to-Satellite Collision Avoidance Protocol
## Comprehensive Technical Guide, Mathematical Formulas & Next Steps

---

## 1. Project Overview (In Simple Plain English)

### The Real-World Problem:
Imagine two high-speed cars approaching a blind four-way intersection at **27,000 km/h (7.5 km per second)**.
- There are **no traffic lights** and **no police officers** in space.
- Both cars have **tinted windows**: they are owned by commercial competitors (like SpaceX vs. OneWeb) or rival countries. Neither wants to reveal their remaining fuel, exact orbital plan, or operational secrets.
- Today, the way space collision avoidance works is broken: ground radars on Earth spot a potential crash days or hours in advance, and humans coordinate over **manual emails and phone calls**.
- In 2019, the European Space Agency (ESA) almost crashed into a SpaceX Starlink satellite. ESA sent urgent emails, but an internal software glitch in SpaceX's ground paging system silenced the alerts! ESA had to fire their thrusters alone. With over **18,000 active satellites** in orbit today and **100,000 projected by 2030**, humans sending emails from Earth cannot keep up.

### What S2SCAN Does:
S2SCAN (Satellite-to-Satellite Collision Avoidance Negotiation Protocol) is an autonomous software layer that runs directly onboard satellites. When two spacecraft are on a collision course:
1. They communicate directly via laser or radio cross-links in space (in milliseconds).
2. They prove their identities cryptographically without contacting ground stations.
3. They exchange high-level capability summaries **without revealing trade secrets** (using cryptographic commitment schemes).
4. They run a fair **game-theoretic weighting formula** that calculates who should move.
5. They lock the decision using a distributed two-phase commit, verify that nobody lied, execute the thruster burn, and clear the danger.

---

## 2. Complete Glossary of Terms (Zero-Jargon Explanations)

Below is the plain-English explanation for every single technical term used across the project:

| Term | Simple Meaning | Real-World Analogy |
|:---|:---|:---|
| **Conjunction** | When two satellites are predicted to pass dangerously close to each other. | Two airplanes flying on intersecting flight paths. |
| **TCA (Time of Closest Approach)** | The exact countdown second at which the two satellites will reach their closest encounter point. | "In 94 seconds, we will be at the danger point." |
| **Miss Distance** | The predicted physical distance between the two satellites at TCA. | "They are projected to miss by only 142 meters." At 27,000 km/h, 142 meters is razor-thin. |
| **Pc (Collision Probability)** | The statistical probability of a direct crash (e.g., 0.00184, or 1 in 543). If Pc > 0.0001 (1 in 10,000), space agencies require an immediate maneuver. | A weather forecast predicting an 80% chance of rain at 3 PM. |
| **Delta-V (Δv)** | The change in velocity (measured in meters per second, m/s). It represents the amount of thruster push needed to change orbit. | Stepping on the gas pedal to steer around an obstacle. |
| **ISL (Inter-Satellite Link)** | Direct optical laser or radio cross-link communication between two satellites in space, without bouncing signals to Earth. | A walkie-talkie link between two drivers. |
| **Covariance Ellipsoid** | A 3D "uncertainty egg" around a satellite. Radar cannot pinpoint a satellite down to the exact millimeter; it knows the satellite is somewhere inside this 3D egg. | The blue accuracy circle surrounding your location pin on Google Maps. |
| **TLE (Two-Line Element)** | A standard 2-line text format created by NORAD that encodes an object's orbit (altitude, inclination, speed, shape). | A digital flight ticket containing orbital coordinates. |
| **CDM (Conjunction Data Message)** | An official digital warning message published by space surveillance radar networks (like the US Space Force 19th Space Defense Squadron). | An emergency air traffic control conflict alert. |
| **ITU GEO Slot** | An internationally licensed orbital "parking spot" in geostationary orbit granted by the UN's International Telecommunication Union. | A permanent, expensive reserved parking bay you are legally forbidden from leaving. |
| **Commitment Scheme** | A cryptographic method where you commit to a secret value in advance by sharing its hash, and reveal it later. This guarantees you cannot change your story. | Putting your bid inside a sealed envelope and placing it on the table before an auction starts. |
| **Zero-Knowledge Proof (ZKP)** | A cryptographic technique that lets one party prove a statement is true without revealing the secret details. | Proving you are over 18 without showing your birthdate, full name, or address. |
| **Nash Bargaining & Rubinstein Model** | Mathematical game theory models that determine how two rational actors split a cost fairly when both want to save fuel, but both die if neither moves. | Two roommates deciding who cleans the kitchen: the one who cooked less does it, but if both refuse, the house burns down. |
| **Byzantine Fault Tolerance (BFT)** | How a system stays safe even when a participant crashes, loses connection, or actively lies/cheats. | A contract with an automatic fallback penalty clause if the other party turns out to be fraudulent. |

---

## 3. The Core Mathematical Formulas (Clean Plain-Text Display)

Here are the exact mathematical formulas used by S2SCAN. They are formatted in clean code blocks and Unicode so they render clearly in any text or markdown viewer:

### Formula 1: The Multi-Attribute Negotiation Weight Formula

For any satellite (Satellite i), its total burden to maneuver is defined as `Weight(i)`:

```
Weight(i) = [ α × (Δv_Cost_i / Max_Δv) ]
          + [ β × (1 - Fuel_Remaining_i / Max_Fuel) ]
          + [ γ × (Mission_Priority_i / 10) ]
          + [ δ × Formation_Disruption_Cost_i ]
          + [ ε × Mobility_Constraint_i ]
          + [ ζ × Sovereignty_Flag_i ]
          + [ η × (Recovery_Cost_i / Max_Recovery) ]
```

#### Meaning of Each Component:
- `α (Alpha = 0.25)`: Fuel burn required. If the maneuver needs very little Δv (e.g. 0.4 m/s), this term is small. Cheaper to move.
- `β (Beta = 0.30)`: Fuel depletion penalty. If the satellite has 80% fuel, `(1 - 0.80) = 0.20` (low weight). If the satellite has only 15% fuel, `(1 - 0.15) = 0.85` (high weight, protected from moving!).
- `γ (Gamma = 0.20)`: Mission priority (scale 1 to 10). High-priority science payloads or defense satellites get a higher weight to protect them from unnecessary maneuvers.
- `δ (Delta = 0.15)`: Formation flight disruption. A solitary satellite has multiplier `1.0`. A satellite flying in a 3-spacecraft cluster has multiplier `3.4×`, because moving one forces all three to re-acquire formation later.
- `ε (Epsilon = 100.0)`: Hard mobility constraint. Geostationary (GEO) satellites and unpropulsive debris get set to `INFINITY`.
- `ζ (Zeta = 50.0)`: Government sovereignty flag. Escalates to bilateral ground review if classified.
- `η (Eta = 0.10)`: Post-maneuver recovery cost. Fuel required later to re-circularize the orbit back to nominal track.

#### The Golden Decision Rule:
```
Assigned_Mover = Satellite with the MINIMUM Weight

If Weight(A) < Weight(B)  ==> Satellite A maneuvers; Satellite B holds nominal orbit.
If Weight(B) < Weight(A)  ==> Satellite B maneuvers; Satellite A holds nominal orbit.
```

---

### Formula 2: Hard Constraint Overrides (Zero Negotiation Delay)

Certain physical and legal realities completely override the continuous cost calculation:

```
Case 1: Crewed Spacecraft (ISS, Crew Dragon)
        Weight(Crewed) = INFINITY
        ==> The uncrewed commercial satellite MUST yield unconditionally. Human life takes absolute priority.

Case 2: Non-Maneuverable / Defunct Object (Space Debris, dead CubeSat)
        Weight(Defunct) = INFINITY
        ==> Defunct object cannot fire thrusters. Active satellite takes 100% responsibility immediately.

Case 3: Geostationary (GEO) Satellite in ITU Slot
        Weight(GEO) = INFINITY
        ==> Leaving the licensed ±0.05° box violates international treaties. Crossing LEO/GTO craft maneuvers.
```

---

### Formula 3: The Cryptographic Commitment Scheme (Anti-Cheat Math)

To prevent a competitor from lying about their fuel (e.g. claiming they are almost empty when they actually have plenty of fuel), S2SCAN uses a **SHA-256 Hash Commitment**:

```
[Phase 1 - Commitment Generation]:
Secret_Salt     = 16-byte random cryptographic nonce (e.g. "9f8a3c2e1b4d5e6f")
Commitment_Hash = SHA256( Disclosed_Category + ":" + Secret_Salt )

Example:
Category        = "HIGH"
Payload         = "HIGH:9f8a3c2e1b4d5e6f"
Commitment_Hash = "0xa79c8154e38b2910c841..."
```

Satellite B sends only `Commitment_Hash` during Stage 3. It **does not send the salt yet**.

```
[Phase 2 - Salt Reveal & Verification in Stage 5]:
Satellite B reveals: Secret_Salt = "9f8a3c2e1b4d5e6f"
Satellite A computes:
    Calculated_Hash = SHA256( Claimed_Category + ":" + Revealed_Salt )

Verification Rule:
    If Calculated_Hash == Commitment_Hash:
        STATUS = VERIFIED_HONEST (Consensus Locked)
    Else:
        STATUS = BYZANTINE_FRAUD_DETECTED (Transaction Aborted, Fallback Triggered)
```

---

### Formula 4: Rubinstein Alternating Offers Time-Decay Discount Factor

In game theory, time pressure forces rational actors to agree quickly:

```
Discount_Factor(t) = exp( -λ / (TCA - t) )

Where:
  TCA = Time of Closest Approach (e.g. 94 seconds)
  t   = Current elapsed time
  λ   = Urgency decay constant (λ = 15.0)
```

As the clock ticks toward TCA, `(TCA - t)` shrinks toward zero, causing the delay penalty to explode exponentially. Because waiting to burn fuel at the last second requires **10× higher Δv**, both satellites are mathematically incentivized to converge within **1 to 2 message rounds**.

---

### Formula 5: 3D Collision Probability (Foster 1992 Formulation)

Space situational awareness calculates collision probability `Pc` by integrating the overlapping 3D Gaussian position uncertainty ellipsoids in the encounter plane (the B-plane):

```
Pc = ( 1 / (2 × π × σ_x × σ_y × sqrt(1 - ρ²)) )
     × Integral_over_Collision_CrossSection [
         exp( - ( (x/σ_x)² + (y/σ_y)² - 2ρ(x/σ_x)(y/σ_y) ) / (2(1 - ρ²)) ) dx dy
       ]

Where:
  σ_x, σ_y = 1-sigma positional uncertainty standard deviations
  ρ        = Cross-correlation coefficient
  Collision_CrossSection = Combined hard-body physical radius (R_A + R_B)
```

When `Pc > 10^-4` (1 in 10,000), S2SCAN is automatically triggered.

---

## 4. The 105+ Variables Database (Organized by 9 Categories)

The protocol evaluates 105+ parameters grouped into 9 operational categories (all viewable and searchable in the frontend database tab):

```
┌────────────────────────────────────────────────────────────────────────┐
│                        S2SCAN 105+ VARIABLES                           │
├─────────────────────────┬──────────────────────┬───────────────────────┤
│ Cat A: Physical Orbital │ Cat B: Propulsion    │ Cat C: Mission Status │
│ (10 variables)          │ (10 variables)       │ (10 variables)        │
│ • Altitude & Drag       │ • Propellant mass    │ • Mission type/phase  │
│ • Inclination           │ • Categorical fuel   │ • Lifetime remaining  │
│ • Eccentricity & RAAN   │ • Specific impulse   │ • Active sensor lock  │
│ • True anomaly          │ • Thruster type/Isp  │ • Commercial SLA      │
│ • Velocity & TCA        │ • Max thrust force   │ • Constellation backup│
│ • Miss dist at TCA      │ • Required Delta-V   │ • Downlink window     │
│ • Relative velocity     │ • Min impulse bit    │ • Thermal settling    │
│ • Conjunction geometry  │ • Burn life budget   │ • Scheduled burns     │
├─────────────────────────┼──────────────────────┼───────────────────────┤
│ Cat D: Satellite Class  │ Cat E: Comm & Trust  │ Cat F: Collision Risk │
│ (25 hard constraints)   │ (10 variables)       │ (10 variables)        │
│ • GEO ITU slot license  │ • ISL SNR ratio (dB) │ • Collision Prob (Pc) │
│ • Station-keeping box   │ • Topology (S2S/Relay│ • Covariance ellipsoid│
│ • Earth Obs nadir lock  │ • RTT latency (ms)   │ • Velocity uncertainty│
│ • Formation coherence   │ • Reputation score   │ • Hard-body cross-sec │
│ • Cluster re-acq cost   │ • X.509/Ed25519 cert │ • Secondary debris risk│
│ • 3.4x penalty coupling │ • Nonce freshness    │ • 3rd-party sats risk │
│ • Non-maneuverable bus  │ • Protocol version   │ • CDM source          │
│ • Dead/defunct object   │ • Sig integrity      │ • Pc trend rate       │
│ • Crewed spacecraft     │ • Blackout countdown │ • Prediction horizon  │
├─────────────────────────┼──────────────────────┼───────────────────────┤
│ Cat G: Post-Maneuver    │ Cat H: Operator/SLA  │ Cat I: Edge Cases     │
│ (10 variables)          │ (10 variables)       │ (10 variables)        │
│ • Orbital drift rate    │ • Operator country   │ • Both unmaneuverable │
│ • Re-circularization    │ • Regulatory body    │ • Both fuel-critical  │
│ • Future planned burns  │ • Insurance status   │ • 3-way conjunction   │
│ • Slot re-acquisition   │ • SLA penalty / hr   │ • Asymmetric threat   │
│ • Firing windows        │ • Autonomous mandate │ • Final 48h de-orbit  │
│ • Airspace zones        │ • Bilateral treaties │ • Replay spoofing     │
│ • Sun angle & thermal   │ • Dispute forum      │ • Formation vs single │
│ • Eclipse & battery SoC │ • Fleet membership   │ • Crewed craft alert  │
└─────────────────────────┴──────────────────────┴───────────────────────┘
```

---

## 5. The 6-Stage Negotiation Workflow

```
[Stage 1: DISCOVER]
  • Collision alert triggered (Pc > 1e-4, Miss Distance < 500m).
  • Satellite A broadcasts signed ConjunctionAlert packet.
        │
[Stage 2: AUTHENTICATE]
  • Mutual public-key handshake using Ed25519 digital signatures.
  • Anti-replay nonces (Nonce_A, Nonce_B) create authenticated Session ID.
        │
[Stage 3: STATE EXCHANGE (Zero-Knowledge Privacy)]
  • Broad categories shared: FuelCategory = HIGH/MED/LOW/CRITICAL.
  • Cryptographic commitment: Commit = SHA256(Category + Salt).
  • Simulated ZKP: proves satellite has fuel >= req_dv without sharing numbers.
        │
[Stage 4: NEGOTIATE (Game Theory)]
  • Both calculate Weight(A) and Weight(B).
  • Lower weight satellite is assigned the maneuver duty.
  • ManeuverProposal sent -> ProposalAccept returned.
        │
[Stage 5: COMMIT (Consensus Lock & Anti-Cheat Audit)]
  • Both reveal their secret salts.
  • Cryptographic verification checks if revealed salt matches original commitment.
  • If cheating detected -> BYZANTINE_FRAUD_ALERT -> Abort to Fallback.
  • If honest -> Distributed Two-Phase Commit locks agreement.
        │
[Stage 6: VERIFY / EXECUTE]
  • Thruster burn executed (Δv = 0.48 m/s).
  • Miss distance expands from 142m to 4,792m; Pc drops from 1.8e-3 to 1.1e-9.
  • Conjunction cleared safely!
```

---

## 6. Frontend vs. Backend: What Is Built vs. What Is Next

### What Is Running in the Frontend Client Right Now (`index.html`, `js/`):
- **Live Canvas Radar Display**: Renders Earth, orbital planes, approaching spacecraft, TCA encounter sphere, and the green post-burn escape path.
- **Interactive Protocol Stepper**: Lets you step through stages 1 to 6 manually or auto-run with message logs and JSON packet inspection.
- **Full 105+ Variables Database**: Searchable, filterable table showing units, sample values for both craft, and research weight influences.
- **Game Theory Studio**: Interactive sliders (`α, β, γ, δ, η`) that update the winner live.
- **WebCrypto Engine**: Real browser SHA-256 hashing, salt generation, and tamper detection.
- **Scenario Presets**: Standard LEO, GEO ITU constraint, Formation 3.4× penalty, Defunct craft, Byzantine lying satellite, 30% ISL packet drop, and Crewed vehicle override.

### What Is NOT Implemented in the Backend Yet (To Be Built in Python):
1. **Real SGP4 / Skyfield Ephemeris Propagator**: Fetching live Starlink TLE files from CelesTrak and computing minute-by-minute orbital coordinates across 200+ satellites.
2. **True Peer-to-Peer Socket Daemon (`asyncio`)**: Running independent satellite processes on separate local network ports (e.g. `localhost:8001` vs `localhost:8002`) exchanging real UDP/TCP packets.
3. **Native Python Cryptography**: Using Python's `cryptography` library for Ed25519 keys and `py_ecc` for real zero-knowledge range proofs.
4. **Comparison Baseline Models**:
   - `baseline_random.py`: Randomly picks a satellite to move without negotiation (showing fuel waste and mistakes).
   - `baseline_ground.py`: Simulates today's 15-minute ground email delay (showing how often maneuvers fail to happen in time).
5. **Monte Carlo Batch Test Harness**: Automated script executing 1,000+ conjunctions across varying seeds and loss rates (0% to 30%), logging results to CSV for your research paper.
6. **FastAPI WebSocket Bridge**: Connecting the Python daemon to stream live telemetry into the frontend dashboard.

---

## 7. Why Has No One Ever Built This Before?

1. **The Commercial & Military Trust Dilemma**: SpaceX, OneWeb, Amazon Kuiper, and defense agencies refuse to give competitors direct access to their internal satellite telemetry or thruster commands. S2SCAN solves this because **categorical disclosure and commitment schemes require zero trust and zero sensitive data sharing**.
2. **Legacy Satellites Were "Dumb Relays"**: Until recently, satellites lacked onboard edge compute power and optical inter-satellite links (ISLs). They had to rely on ground station passes every 90 minutes.
3. **Proprietary Islands**: SpaceX built collision avoidance inside Starlink, but it only works between two Starlink satellites. It cannot talk to an ESA satellite or a Planet Labs imager. S2SCAN is the first open, cross-operator protocol standard.

---

## 8. What is the Actual Innovation and Invention?

You do not need to invent a new law of gravity or a new encryption cipher. In Computer Science, **combining distinct fields to solve a previously open problem is an invention of an Application-Layer Protocol**:

```
                       OUR CSE INVENTION (S2SCAN)
               ┌────────────────────────────────────────┐
               │  Distributed Systems (2-Phase Commit)  │
               │                   +                    │
               │  Network Security (Ed25519 & Nonces)   │
               │                   +                    │
               │  Applied Crypto (Commit-Reveal & ZKP)  │
               │                   +                    │
               │  Game Theory (Nash Bargaining Weights) │
               │                   +                    │
               │  Fault Tolerance (4-Tier BFT Fallback) │
               └────────────────────────────────────────┘
```

---

## 9. Next Steps: Actionable Roadmap

Here is the exact step-by-step roadmap to take this project from the current working prototype to a published research paper:

```
[Phase 1: DONE ✓]
  • Complete Frontend Mission Control Simulator built & verified
  • Python backend agent model starter implemented in backend/satellite_agent.py
  • Code repository created and pushed to GitHub (makeporium/s2scan-satellite-collision-avoidance)

[Phase 2: NEXT IMMEDIATE STEPS - Backend Orbital Pipeline]
  1. Install Skyfield and SGP4 dependencies:
     pip install -r backend/requirements.txt
  2. Write celestrak_loader.py:
     Fetch 200 real Starlink TLEs from celestrak.org and propagate orbits over 24 hours.
  3. Generate ground_truth_conjunctions.csv:
     Find all real pairs that pass within 5 km.

[Phase 3: Protocol Network Engine & Baseline Comparison]
  4. Build p2p_socket_engine.py:
     Two asyncio nodes exchanging S2SCAN packets over local ports with 0-30% packet drop simulation.
  5. Implement baseline_random.py and baseline_ground.py:
     Compare S2SCAN performance against naive random picking and 15-minute manual email delay.

[Phase 4: Monte Carlo Experiments & Paper Writing]
  6. Run 1,000 Monte Carlo test iterations and export CSV metrics.
  7. Plot graphs: Latency vs Packet Loss, Fuel Saved vs Baselines, Detection Rate of Cheating Satellites.
  8. Write the research paper draft using the 5 Research Questions (RQ1 to RQ5) for submission to IEEE Aerospace or AIAA SciTech.
```

---

## 10. Summary of Files in Workspace

- [index.html](file:///c:/Users/astro/Desktop/College%20Ayush/PRJ/index.html): Mission Control Simulator Dashboard (open in browser at `http://localhost:8000`).
- [js/orbit-visualizer.js](file:///c:/Users/astro/Desktop/College%20Ayush/PRJ/js/orbit-visualizer.js): Real-time Canvas radar engine.
- [js/negotiation-fsm.js](file:///c:/Users/astro/Desktop/College%20Ayush/PRJ/js/negotiation-fsm.js): 6-stage protocol state machine runner.
- [js/game-theory.js](file:///c:/Users/astro/Desktop/College%20Ayush/PRJ/js/game-theory.js): Multi-attribute weight calculation and Nash bargaining engine.
- [js/crypto-engine.js](file:///c:/Users/astro/Desktop/College%20Ayush/PRJ/js/crypto-engine.js): WebCrypto SHA-256 commitments, salt verification, and ZKP simulator.
- [js/variables-data.js](file:///c:/Users/astro/Desktop/College%20Ayush/PRJ/js/variables-data.js): Full database of all 105+ operational variables.
- [backend/satellite_agent.py](file:///c:/Users/astro/Desktop/College%20Ayush/PRJ/backend/satellite_agent.py): Verified Python backend agent model and protocol runner.
- [backend/README_BACKEND.md](file:///c:/Users/astro/Desktop/College%20Ayush/PRJ/backend/README_BACKEND.md): Backend architectural specification and task list.
- [S2SCAN_COMPLETE_GUIDE.md](file:///c:/Users/astro/Desktop/College%20Ayush/PRJ/S2SCAN_COMPLETE_GUIDE.md): This comprehensive standalone guide.
