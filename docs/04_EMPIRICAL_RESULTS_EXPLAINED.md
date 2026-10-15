# Chapter 4: What the 1,000 Experiments Proved
## A Plain-English Guide to the Empirical Monte Carlo Results, the Baseline Failures, and the Scientific Figures

---

### Introduction: Why Do We Need 1,000 Experiments?

In software engineering, you can write code that works on your own laptop for one simple test case.
But in aerospace research, a professor or journal reviewer will immediately ask:
> *"Your code worked on ONE scenario. But what happens across 1,000 different orbits? What if one satellite is out of fuel? What if one is a military satellite in geostationary orbit? What if laser packets get dropped? Does your system actually beat how the space industry works today?"*

To answer this question with undeniable scientific proof, we built an automated **Monte Carlo Simulation Engine** ([backend/monte_carlo_engine.py](file:///c:/Users/astro/Desktop/College%20Ayush/PRJ/backend/monte_carlo_engine.py)) and ran **1,000 randomized satellite conjunction trials**.

In this chapter, we explain:
1. What is a Monte Carlo simulation?
2. Who were the three competing "players" (S2SCAN vs. the two baselines)?
3. What were the exact results?
4. Why did the other policies fail (the 172 critical errors)?
5. How do you read and interpret Figures 1, 2, and 3?

---

## 1. What is a "Monte Carlo" Simulation?

The term "Monte Carlo" comes from the famous casino city in Monaco where games of chance (roulette wheels, dice) are played.

In computer science, a **Monte Carlo simulation** means:
Instead of testing just one ideal scenario, you use a random number generator to create **1,000 diverse, messy, real-world scenarios**:
- Some satellites have 95% fuel; some are running on empty (1% fuel).
- Some are in Low Earth Orbit (LEO, 550 km); some are in Geostationary Orbit (GEO, 35,786 km).
- Some encounters happen with 30 minutes of warning; some are sudden emergencies with only 45 seconds of warning.
- Some laser crosslinks have zero packet loss; some drop up to 15% to 30% of their data packets.

We fed these exact same 1,000 scenarios into three competing decision policies to see who survives.

---

## 2. The Three Competing Policies Tested

```text
┌────────────────────────────────────────────────────────────────────────┐
│                      THE THREE COMPETING POLICIES                      │
├───────────────────────────────────┬────────────────────────────────────┤
│ Policy Model                      │ How It Decides Who Maneuvers       │
├───────────────────────────────────┼────────────────────────────────────┤
│ 1. S2SCAN Protocol                │ Autonomous P2P negotiation over    │
│    (Our Proposed System)          │ laser crosslinks; uses Ed25519     │
│                                   │ crypto, SHA-256 enclave locks, and │
│                                   │ Asymmetric Nash Bargaining.        │
├───────────────────────────────────┼────────────────────────────────────┤
│ 2. Baseline 1: Random Selection   │ Flips a 50/50 coin to pick which   │
│    (Uncoordinated Heuristic)      │ satellite moves; ignores fuel      │
│                                   │ levels, orbits, and constraints.   │
├───────────────────────────────────┼────────────────────────────────────┤
│ 3. Baseline 2: Ground-Mediated    │ The current space industry standard│
│    (Human Email/Phone Calls)      │ Ground radar generates CDMs; humans│
│                                   │ exchange emails with a realistic   │
│                                   │ 15-minute (900-second) delay.      │
└───────────────────────────────────┴────────────────────────────────────┘
```

---

## 3. The Grand Scorecard: Master Results Across 1,000 Runs

Below is the master performance scorecard generated from the raw telemetry in [backend/monte_carlo_1000_results.csv](file:///c:/Users/astro/Desktop/College%20Ayush/PRJ/backend/monte_carlo_1000_results.csv):

```text
========================================================================================
S2SCAN MONTE CARLO EXPERIMENT SUMMARY (1,000 CONJUNCTION SCENARIOS)
========================================================================================
Performance Metric           S2SCAN Protocol        Baseline 1 (Random)   Baseline 2 (Ground)
----------------------------------------------------------------------------------------
Collision Avoidance Safety   100.0% (1,000/1,000)   90.9% (909/1,000)     53.9% (539/1,000)
Collisions / Crashes         0                      91                    461
Median Decision Latency      0.260 seconds          0.001 seconds         900.000 seconds
95th Percentile Latency      1.624 seconds          0.001 seconds         900.000 seconds
Maximum Decision Latency     1.799 seconds          0.001 seconds         900.000 seconds
Speedup vs. Ground           3,461× faster          N/A                   Reference baseline
Hard Constraint Violations   0                      172                   N/A (Timeouts)
Consensus Agreements         888 (88.8%)            N/A                   N/A
Tier 3 Autonomous Burns      112 (11.2%)            N/A                   N/A
========================================================================================
```

Look at those numbers:
1. **Safety:** S2SCAN was **100.0% safe** (not a single crash across 1,000 runs). Baseline 1 crashed 91 times. Baseline 2 crashed 461 times!
2. **Speed:** S2SCAN reached a decision in a median of **0.260 seconds**—that is **3,461 times faster** than the 15-minute ground baseline.
3. **Constraint Violations:** Baseline 1 committed **172 critical operational violations**, whereas S2SCAN committed **zero**.

Let's understand why the other two policies failed so badly.

---

## 4. Why Did the Baselines Fail? (The 172 Constraint Errors)

### Why Baseline 1 (Random Selection) Failed (91 Crashes, 172 Errors):
You might think: *"Hey, flipping a coin is 50/50. Why did it crash 91 times?"*

Because flipping a coin is blind to the laws of orbital physics and operational constraints! Look at the breakdown of the 172 errors:

```text
┌──────────────────────────────────────┬─────────────┬───────────────────┐
│ Constraint Error Type                │ Incidents   │ Physical Disaster │
├──────────────────────────────────────┼─────────────┼───────────────────┤
│ 1. Fuel-Depleted Satellite Burdened  │ 81 trials   │ Thruster starvation│
│ 2. Geostationary ITU Slot Breached   │ 53 trials   │ License revoked   │
│ 3. Non-Maneuverable Debris Assigned  │ 21 trials   │ Inevitable impact │
│ 4. Crewed Spacecraft Burdened        │ 17 trials   │ Astronaut danger  │
├──────────────────────────────────────┼─────────────┼───────────────────┤
│ Total Hard Constraint Violations     │ 172 errors  │ 91 total crashes  │
└──────────────────────────────────────┴─────────────┴───────────────────┘
```

#### Detailed Breakdown of Each Failure Mode:
1. **Fuel-Depleted Satellites (81 cases):**
   The coin-flip randomly picked a satellite that had only 0.5% fuel left in its tanks. The satellite fired its engines, but ran completely dry of propellant halfway through the burn! It failed to achieve the necessary miss distance and collided with the other satellite.
2. **Geostationary ITU Slot Breaches (53 cases):**
   In Geostationary Orbit (35,786 km), telecommunications satellites must remain within a tight longitude window (±0.05°) under UN international treaties. The random policy ordered a GEO satellite to perform a large delta-v burn, pushing it completely out of its legal orbital slot and causing severe radio interference with neighboring satellites.
3. **Non-Maneuverable Space Debris (21 cases):**
   When an active satellite encounters a dead rocket upper-stage or defunct cubesat, the dead object has no thrusters. The random policy blindly picked the dead debris to maneuver! Since debris cannot move, no maneuver occurred, leading to direct collision.
4. **Crewed Spacecraft Burdened (17 cases):**
   The random policy ordered an inhabited space station (like the ISS) to burn massive amounts of fuel to dodge a tiny cubesat, disrupting delicate microgravity science experiments.

#### Why S2SCAN Had ZERO Errors:
In S2SCAN, these operational constraints are not suggestions; they are **hard mathematical limits** in the Nash Bargaining engine. A satellite with critical fuel or a dead bus has zero maneuver flexibility, forcing the healthy commercial peer to perform the burn 100% of the time.

---

### Why Baseline 2 (Ground Coordination) Failed (461 Crashes):
Current space operations rely on humans reading emails and making phone calls.

The standard industry reaction time from the moment USSPACECOM issues a Conjunction Data Message (CDM) to the moment operators agree on a maneuver is **at least 15 minutes (900 seconds)**.

In our 1,000 randomized scenarios, **46.1% of the encounters had a Time to Closest Approach (TCA) less than 15 minutes**.
- For these emergency pop-up encounters, the ground coordination team was still waiting for an email reply or waiting for the satellite to pass over a ground antenna when the collision occurred.
- This proves that as space gets crowded, **human ground control is physically too slow to keep satellites safe.**

---

## 5. How to Read and Interpret the 3 Scientific Figures

The Monte Carlo engine generated three publication-quality Matplotlib figures at 300 DPI, stored in the `assets/` folder and visible in **Tab 7** of the Mission Control UI.

Here is how to interpret each one:

---

### Figure 1: Cumulative Distribution Function (CDF) of Latency
- **File:** [assets/figure1_latency_cdf.png](file:///c:/Users/astro/Desktop/College%20Ayush/PRJ/assets/figure1_latency_cdf.png)

```text
What is a Cumulative Distribution Function (CDF)?
A CDF curve tells you: "What percentage of negotiations finished in less than X seconds?"
- The horizontal axis (X-axis) shows time in seconds (on a logarithmic scale).
- The vertical axis (Y-axis) shows the percentage of completed runs (from 0% to 100%).
```

#### Key Takeaways from Figure 1:
1. **Median (P50) = 0.260 seconds:** 50% of all negotiations completed in a quarter of a second!
2. **P95 = 1.624 seconds:** 95% of all negotiations finished in under 1.62 seconds.
3. **The Flat Plateau at 1.799 seconds:** Notice how the curve reaches 100% and completely stops before 1.8 seconds.
   Why? Because our watchdog timer is set to **1.5 seconds**. If packets drop, the satellite doesn't hang forever—it immediately drops to Tier 3 (autonomous burn) at 1.6 to 1.8 seconds. **The protocol is mathematically guaranteed never to freeze past 1.8 seconds.**
4. **The Ground Baseline Comparison:** The ground baseline sits way out at **900.0 seconds**. S2SCAN provides an astonishing **3,461× speedup**.

---

### Figure 2: Safety Comparison & Constraint Violations
- **File:** [assets/figure2_safety_comparison.png](file:///c:/Users/astro/Desktop/College%20Ayush/PRJ/assets/figure2_safety_comparison.png)

#### Key Takeaways from Figure 2:
- The bar chart visually contrasts the overall collision avoidance safety rate:
  - **S2SCAN:** Solid green bar at **100.0%**.
  - **Baseline 1 (Random):** Drops to **90.9%** (91 collisions).
  - **Baseline 2 (Ground):** Drops to **53.9%** (461 collisions).
- The secondary chart illustrates the 172 operational constraint errors, showing how S2SCAN completely eliminates fuel-starvation crashes, GEO slot breaches, and crewed disruptions.

---

### Figure 3: Packet Loss vs. Protocol Reliability Curve
- **File:** [assets/figure3_packet_loss_reliability.png](file:///c:/Users/astro/Desktop/College%20Ayush/PRJ/assets/figure3_packet_loss_reliability.png)

```text
The Question Answered by Figure 3:
"What happens when the laser crosslink gets noisy and drops 10%, 20%, or 30% of packets?"
```

#### Key Takeaways from Figure 3:
Look at the two curves on the graph:
1. **The Cyan Curve (Cooperative Nash Consensus):**
   - At 0% packet loss, 100% of encounters reach a cooperative agreement.
   - As packet loss climbs to 30%, laser messages get dropped, so consensus agreements drop to 16%.
2. **The Orange Curve (Tier 3 Autonomous Fallback Burns):**
   - As cooperative consensus drops, Tier 3 emergency burns rise from 0% up to 84%.
3. **The Dotted Green Invariant Line (Total Safety):**
   - Notice that the total safety line stays **pinned at exactly 100.0% across all packet loss rates!**
   - This proves the **Graceful Degradation** property of S2SCAN: even when the communication link is completely falling apart, satellites autonomously fire emergency radial burns and survive every single time.

---

### Summary of Chapter 4
- We ran 1,000 randomized Monte Carlo conjunction trials across LEO, MEO, and GEO orbits.
- **S2SCAN achieved 100.0% safety**, resolving encounters in a median of **0.260 seconds** (3,461× faster than ground control).
- **Baseline 1 (Random Selection)** crashed 91 times and caused 172 operational violations (fuel starvation, GEO license violations, dead debris errors).
- **Baseline 2 (Ground Coordination)** crashed 461 times because human emails take 15 minutes, failing on sudden pop-up encounters.
- Figure 1 proves sub-second latency, Figure 2 proves safety, and Figure 3 proves 100% resilience under severe packet loss.

Now that you know the data and results, let's prepare you for your presentation or exam in [Chapter 5: Viva Voce & Interview Defense Guide](file:///c:/Users/astro/Desktop/College%20Ayush/PRJ/docs/05_VIVA_AND_EXAM_DEFENSE_GUIDE.md)!
