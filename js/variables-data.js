// S2SCAN Protocol - 105+ Variables Database across 9 Operational Categories
// Directly mapped from research specifications in the project documentation

export const VARIABLE_CATEGORIES = [
  { id: 'cat_a', name: 'A. Physical Orbital', count: 10, icon: 'globe', desc: 'Kinematics, altitude, relative velocity, and encounter geometry' },
  { id: 'cat_b', name: 'B. Propulsion & Fuel', count: 10, icon: 'flame', desc: 'Propellant budget, thruster specific impulse, and delta-v capability' },
  { id: 'cat_c', name: 'C. Mission Criticality', count: 10, icon: 'satellite', desc: 'Mission phase, commercial SLAs, observation windows, and lifetime' },
  { id: 'cat_d', name: 'D. Satellite Class Constraints', count: 25, icon: 'shield-alert', desc: 'GEO ITU slots, Earth Obs nadir lock, Formation re-acquisition, Non-maneuverable bus, Crewed vehicles' },
  { id: 'cat_e', name: 'E. Comm & Trust', count: 10, icon: 'radio', desc: 'ISL link SNR, public-key certs, replay counters, and blackout windows' },
  { id: 'cat_f', name: 'F. Collision Risk', count: 10, icon: 'target', desc: 'Pc, covariance ellipsoids, cross-sections, and secondary cascade risks' },
  { id: 'cat_g', name: 'G. Post-Maneuver Recovery', count: 10, icon: 'refresh-cw', desc: 'Drift rate, re-circularization fuel, battery SoC, and thermal limits' },
  { id: 'cat_h', name: 'H. Operator & Commercial', count: 10, icon: 'briefcase', desc: 'Operator jurisdiction, treaties, insurance, and compliance reputation' },
  { id: 'cat_i', name: 'I. Extreme Edge Cases', count: 10, icon: 'alert-triangle', desc: 'Defunct buses, dual-critical fuel, 3-way conjunctions, and spoofing' }
];

export const S2SCAN_VARIABLES = [
  // --- Category A: Physical Orbital Characteristics ---
  {
    id: 1, cat: 'cat_a', name: 'Current Orbital Altitude', unit: 'km',
    why: 'Governs atmospheric drag and energy required for orbital height adjustment',
    satA_val: '550.4 km', satB_val: '551.2 km', weightInfluence: 'Medium'
  },
  {
    id: 2, cat: 'cat_a', name: 'Orbital Inclination', unit: 'deg',
    why: 'In-plane vs out-of-plane maneuvers cost vastly different delta-v',
    satA_val: '53.2°', satB_val: '53.0°', weightInfluence: 'High'
  },
  {
    id: 3, cat: 'cat_a', name: 'Eccentricity', unit: 'scalar',
    why: 'Elliptical orbits have asymmetric maneuver efficiency depending on true anomaly',
    satA_val: '0.00014 (Near-circular)', satB_val: '0.00021 (Near-circular)', weightInfluence: 'Low'
  },
  {
    id: 4, cat: 'cat_a', name: 'Right Ascension of Ascending Node (RAAN)', unit: 'deg',
    why: 'Defines orbital plane orientation in space inertial frame',
    satA_val: '142.15°', satB_val: '142.30°', weightInfluence: 'Medium'
  },
  {
    id: 5, cat: 'cat_a', name: 'Argument of Perigee', unit: 'deg',
    why: 'Locates closest approach point within the orbit ellipse',
    satA_val: '88.4°', satB_val: '94.1°', weightInfluence: 'Low'
  },
  {
    id: 6, cat: 'cat_a', name: 'Current Orbital Velocity', unit: 'km/s',
    why: 'Higher orbital velocity demands higher impulsive thrust for vector redirection',
    satA_val: '7.59 km/s', satB_val: '7.58 km/s', weightInfluence: 'Medium'
  },
  {
    id: 7, cat: 'cat_a', name: 'Time to Closest Approach (TCA)', unit: 'sec',
    why: 'Available decision and burn window; earlier burns require 10x less delta-v',
    satA_val: '94.2 s', satB_val: '94.2 s', weightInfluence: 'Critical'
  },
  {
    id: 8, cat: 'cat_a', name: 'Miss Distance at TCA', unit: 'm',
    why: 'Primary indicator of encounter severity; <500m triggers automated emergency',
    satA_val: '142 m', satB_val: '142 m', weightInfluence: 'Critical'
  },
  {
    id: 9, cat: 'cat_a', name: 'Relative Velocity at Encounter', unit: 'km/s',
    why: 'Dictates destructive kinetic energy and secondary debris cloud generation',
    satA_val: '10.84 km/s', satB_val: '10.84 km/s', weightInfluence: 'High'
  },
  {
    id: 10, cat: 'cat_a', name: 'Conjunction Geometry (RIC Frame)', unit: 'vector',
    why: 'Determines whether radial, in-track, or cross-track burn is most fuel-optimal',
    satA_val: 'Radial: +42m, In-Track: -120m, Cross: +64m', satB_val: 'Radial: -42m, In-Track: +120m, Cross: -64m', weightInfluence: 'High'
  },

  // --- Category B: Propulsion & Fuel ---
  {
    id: 11, cat: 'cat_b', name: 'Remaining Usable Propellant Mass', unit: 'kg',
    why: 'Internal ground truth for fuel budget; never shared directly to protect privacy',
    satA_val: '18.4 kg (Hidden)', satB_val: '4.1 kg (Hidden)', weightInfluence: 'Critical'
  },
  {
    id: 12, cat: 'cat_b', name: 'Propellant Category (Disclosed)', unit: 'enum',
    why: 'Categorical state shared publicly in S2SCAN: LOW, MED, HIGH, or CRITICAL',
    satA_val: 'HIGH (Disclosed)', satB_val: 'LOW (Disclosed)', weightInfluence: 'Critical'
  },
  {
    id: 13, cat: 'cat_b', name: 'Specific Impulse (Isp)', unit: 's',
    why: 'Thruster fuel conversion efficiency; electric propulsion (1500s) vs chemical (300s)',
    satA_val: '1650 s (Hall Effect)', satB_val: '220 s (Cold Gas)', weightInfluence: 'High'
  },
  {
    id: 14, cat: 'cat_b', name: 'Thruster Propulsion Type', unit: 'enum',
    why: 'Governs impulsive burn duration vs continuous low-thrust spiral',
    satA_val: 'Krypton Ion Hall Thruster', satB_val: 'Monopropellant Hydrazine', weightInfluence: 'High'
  },
  {
    id: 15, cat: 'cat_b', name: 'Maximum Thrust Force', unit: 'N',
    why: 'Limits acceleration rate; low-thrust systems cannot execute rapid late burns',
    satA_val: '0.080 N', satB_val: '1.20 N', weightInfluence: 'High'
  },
  {
    id: 16, cat: 'cat_b', name: 'Avoidance Maneuver Delta-V Required', unit: 'm/s',
    why: 'Actual physical delta-v to increase miss distance beyond safety threshold',
    satA_val: '0.48 m/s', satB_val: '0.52 m/s', weightInfluence: 'Critical'
  },
  {
    id: 17, cat: 'cat_b', name: 'Minimum Impulse Bit (Minimum Delta-V)', unit: 'm/s',
    why: 'Some thrusters cannot produce micro-burns without orbital overshoot',
    satA_val: '0.005 m/s', satB_val: '0.050 m/s', weightInfluence: 'Medium'
  },
  {
    id: 18, cat: 'cat_b', name: 'Thruster Health Status', unit: 'enum',
    why: 'Degraded valves or power converter anomalies prevent safe burn commitment',
    satA_val: 'NOMINAL (100% Health)', satB_val: 'DEGRADED (Chamber 2 offline)', weightInfluence: 'High'
  },
  {
    id: 19, cat: 'cat_b', name: 'Remaining Lifetime Maneuver Budget', unit: 'count',
    why: 'Design lifetime burn cycle limit (e.g. valve thermal cycle fatigue)',
    satA_val: '1420 burns remaining', satB_val: '48 burns remaining', weightInfluence: 'Medium'
  },
  {
    id: 20, cat: 'cat_b', name: 'Fuel-to-Mission-Life Depletion Ratio', unit: '%/month',
    why: 'How many months of planned revenue-generating mission life this burn burns',
    satA_val: '0.12 months equivalent', satB_val: '3.80 months equivalent', weightInfluence: 'High'
  },

  // --- Category C: Mission Status & Criticality ---
  {
    id: 21, cat: 'cat_c', name: 'Mission Type', unit: 'enum',
    why: 'Broadband communication vs Earth observation vs Navigation vs Human Crew',
    satA_val: 'LEO Commercial Broadband', satB_val: 'Earth Observation / Climate Synthetic Aperture Radar', weightInfluence: 'High'
  },
  {
    id: 22, cat: 'cat_c', name: 'Mission Phase', unit: 'enum',
    why: 'LEOP vs Operational vs End-of-Life; EOL craft can absorb more maneuver risk',
    satA_val: 'Fully Operational (Year 2/5)', satB_val: 'Operational (Year 4/5)', weightInfluence: 'High'
  },
  {
    id: 23, cat: 'cat_c', name: 'Remaining Operational Lifetime', unit: 'months',
    why: 'Impending de-orbit spacecraft should yield before high-lifetime assets',
    satA_val: '36 months', satB_val: '12 months', weightInfluence: 'Medium'
  },
  {
    id: 24, cat: 'cat_c', name: 'Data Collection Active Window', unit: 'bool',
    why: 'Maneuver attitude slew interrupts active optical imaging or radar pass',
    satA_val: 'False (Constellation routing)', satB_val: 'True (Disaster zone imaging active)', weightInfluence: 'Critical'
  },
  {
    id: 25, cat: 'cat_c', name: 'Customer SLA Commitment Level', unit: 'enum',
    why: 'Financial or governmental penalty for service disruption',
    satA_val: 'Tier-2 Consumer Mesh (Reroutable)', satB_val: 'Tier-1 Defense/Emergency First Responder', weightInfluence: 'High'
  },
  {
    id: 26, cat: 'cat_c', name: 'Constellation Redundancy in Slot', unit: 'bool',
    why: 'If neighbor satellite can assume packet load, disruption cost is lower',
    satA_val: 'True (Neighbor Starlink at 50km)', satB_val: 'False (Single specialized sensor)', weightInfluence: 'High'
  },
  {
    id: 27, cat: 'cat_c', name: 'Upcoming Ground Contact Window', unit: 'sec',
    why: 'Maneuvering during ground station pass cuts downlink telemetry transfer',
    satA_val: 'In 42 minutes', satB_val: 'In 3 minutes (TDRSS relay)', weightInfluence: 'Medium'
  },
  {
    id: 28, cat: 'cat_c', name: 'Payload Operational Status', unit: 'enum',
    why: 'Instruments requiring cryo-cooling or settling cannot tolerate rapid acceleration',
    satA_val: 'RF Phased Array Active', satB_val: 'Cryocooled Infrared Detector Active', weightInfluence: 'Medium'
  },
  {
    id: 29, cat: 'cat_c', name: 'Time Since Last Orbital Maneuver', unit: 'hours',
    why: 'Thermal settling and star tracker recalibration recovery requirements',
    satA_val: '74 hours', satB_val: '2.4 hours (System warm)', weightInfluence: 'Low'
  },
  {
    id: 30, cat: 'cat_c', name: 'Pre-Scheduled Maintenance Window', unit: 'bool',
    why: 'If a station-keeping burn is already planned, it can be combined for 0 extra fuel',
    satA_val: 'False', satB_val: 'False', weightInfluence: 'High'
  },

  // --- Category D: Satellite Class Hard Constraints (25 variables) ---
  {
    id: 31, cat: 'cat_d', name: 'GEO Slot Assignment', unit: 'deg E/W',
    why: 'Geostationary satellites are legally locked to an ITU slot; cannot wander freely',
    satA_val: 'N/A (LEO Orbit)', satB_val: 'N/A (LEO Orbit)', weightInfluence: 'Critical'
  },
  {
    id: 32, cat: 'cat_d', name: 'GEO Station-Keeping Box Limit', unit: '± deg',
    why: 'Exceeding ±0.05° creates RF interference with adjacent orbital slots',
    satA_val: 'N/A', satB_val: 'N/A', weightInfluence: 'Critical'
  },
  {
    id: 33, cat: 'cat_d', name: 'ITU License Treaty Constraint Flag', unit: 'bool',
    why: 'Violating ITU allocation constitutes international treaty breach (Weight = ∞)',
    satA_val: 'False', satB_val: 'False', weightInfluence: 'Critical'
  },
  {
    id: 34, cat: 'cat_d', name: 'Earth Obs Ground Target Tracking Lock', unit: 'bool',
    why: 'Spacecraft currently slewing body for stereo ground target capture',
    satA_val: 'False', satB_val: 'True (Tracking target)', weightInfluence: 'High'
  },
  {
    id: 35, cat: 'cat_d', name: 'Sun-Synchronous LTAN Constraint', unit: 'hours',
    why: 'Local Time of Ascending Node must remain stable within tight solar tolerance',
    satA_val: 'N/A (53° inclined)', satB_val: '10:30 AM LTAN (Strict SSO)', weightInfluence: 'High'
  },
  {
    id: 36, cat: 'cat_d', name: 'Nadir Pointing Accuracy Tolerance', unit: 'arcsec',
    why: 'Maneuver thruster misalignment disturbs tight pointing mirrors',
    satA_val: '±120 arcsec', satB_val: '±5 arcsec', weightInfluence: 'Medium'
  },
  {
    id: 37, cat: 'cat_d', name: 'Payload Sun Blindness Hazard', unit: 'bool',
    why: 'Maneuvering in certain directions points optical sensors directly at Sun',
    satA_val: 'False', satB_val: 'True (Maneuver Vector 3 restricted)', weightInfluence: 'High'
  },
  {
    id: 38, cat: 'cat_d', name: 'Sensor Calibration Status', unit: 'bool',
    why: 'Maneuver invalidates a multi-hour cross-calibration session',
    satA_val: 'Nominal', satB_val: 'Calibrating radiometric baseline', weightInfluence: 'Low'
  },
  {
    id: 39, cat: 'cat_d', name: 'Optical Instrument Aperture Cover State', unit: 'enum',
    why: 'Thruster plume can contaminate delicate lenses if cover is open',
    satA_val: 'No optics', satB_val: 'Cover Open (Plume hazard)', weightInfluence: 'High'
  },
  {
    id: 40, cat: 'cat_d', name: 'Payload Thermal Cycle Interruption Cost', unit: 'USD',
    why: 'Shutting down sensor for burn costs cooldown cycle restart time',
    satA_val: '$0', satB_val: '$45,000 equivalent downtime', weightInfluence: 'Medium'
  },
  {
    id: 41, cat: 'cat_d', name: 'Formation Flying Cluster Membership', unit: 'bool',
    why: 'Satellite is part of an active multi-spacecraft distributed aperture/formation',
    satA_val: 'False', satB_val: 'True (Member of 3-sat cluster)', weightInfluence: 'Critical'
  },
  {
    id: 42, cat: 'cat_d', name: 'Formation Geometry Type', unit: 'enum',
    why: 'Leader-Follower vs Cartwheel vs In-Plane Swarm vs Hill-Clohessy-Wiltshire ellipse',
    satA_val: 'None', satB_val: 'Projected Circular Orbit (PCO)', weightInfluence: 'High'
  },
  {
    id: 43, cat: 'cat_d', name: 'Inter-Satellite Separation Target Distance', unit: 'm',
    why: 'Precision baseline (e.g. 250m) must be maintained to prevent internal crash',
    satA_val: 'None', satB_val: '250 m ± 2 m', weightInfluence: 'High'
  },
  {
    id: 44, cat: 'cat_d', name: 'Formation Coherence Constraint', unit: 'bool',
    why: 'If this satellite moves alone, it breaks baseline coherence for all 3 craft',
    satA_val: 'False', satB_val: 'True (High coherence required)', weightInfluence: 'Critical'
  },
  {
    id: 45, cat: 'cat_d', name: 'Formation Maneuver Coupling Multiplier', unit: 'scalar',
    why: 'Maneuvering Satellite B forces craft B2 and B3 to burn fuel to re-acquire (3x cost)',
    satA_val: '1.0x (Solo)', satB_val: '3.4x (Multi-spacecraft penalty)', weightInfluence: 'Critical'
  },
  {
    id: 46, cat: 'cat_d', name: 'Formation Re-acquisition Fuel Cost', unit: 'm/s',
    why: 'Fuel burned later just to steer back into formation slot',
    satA_val: '0.0 m/s', satB_val: '1.45 m/s extra', weightInfluence: 'High'
  },
  {
    id: 47, cat: 'cat_d', name: 'Time to Re-acquire Formation', unit: 'hours',
    why: 'Scientific downtime while navigating back into tight baseline',
    satA_val: '0 hrs', satB_val: '18.5 hrs', weightInfluence: 'High'
  },
  {
    id: 48, cat: 'cat_d', name: 'Active Propulsion System Present', unit: 'bool',
    why: 'Hard physical capability flag; if False, satellite CANNOT move under any condition',
    satA_val: 'True', satB_val: 'True', weightInfluence: 'Critical'
  },
  {
    id: 49, cat: 'cat_d', name: 'Attitude Control Only Bus (Zero Translational Thrust)', unit: 'bool',
    why: 'Reaction wheels and magnetorquers can only turn spacecraft, cannot change orbit',
    satA_val: 'False', satB_val: 'False', weightInfluence: 'Critical'
  },
  {
    id: 50, cat: 'cat_d', name: 'Dead / Defunct Satellite Status', unit: 'bool',
    why: 'Unresponsive or derelict object; protocol assigns 100% burden to other party',
    satA_val: 'False', satB_val: 'False', weightInfluence: 'Critical'
  },
  {
    id: 51, cat: 'cat_d', name: 'Deployable Drag Sail Active', unit: 'bool',
    why: 'Passive de-orbit sail in progress; high surface area, cannot thruster-maneuver',
    satA_val: 'False', satB_val: 'False', weightInfluence: 'High'
  },
  {
    id: 52, cat: 'cat_d', name: 'Human Crew Onboard (Crewed Spacecraft)', unit: 'bool',
    why: 'Absolute safety priority; overrides all economic and fuel optimization (Weight = ∞)',
    satA_val: 'False', satB_val: 'False', weightInfluence: 'Critical'
  },
  {
    id: 53, cat: 'cat_d', name: 'Government Classified / Defense Asset Flag', unit: 'bool',
    why: 'Requires ground sovereign authorization; cannot share automated trajectory',
    satA_val: 'False', satB_val: 'False', weightInfluence: 'Critical'
  },
  {
    id: 54, cat: 'cat_d', name: 'Sovereign Right-of-Way Jurisdiction', unit: 'enum',
    why: 'Treaty-level right-of-way assignment between national space administrations',
    satA_val: 'Commercial Open Registry', satB_val: 'Commercial Open Registry', weightInfluence: 'Medium'
  },
  {
    id: 55, cat: 'cat_d', name: 'Autonomous Maneuver Authority Level', unit: 'enum',
    why: 'AUTONOMOUS_APPROVED vs GROUND_CONFIRM_REQUIRED vs RESTRICTED',
    satA_val: 'FULL_AUTONOMY', satB_val: 'AUTONOMOUS_WITH_LOG', weightInfluence: 'High'
  },

  // --- Category E: Communication & Trust Variables ---
  {
    id: 56, cat: 'cat_e', name: 'ISL Link Quality (SNR)', unit: 'dB',
    why: 'Signal-to-noise ratio over optical or S-band crosslink',
    satA_val: '18.4 dB (Strong)', satB_val: '18.2 dB (Strong)', weightInfluence: 'High'
  },
  {
    id: 57, cat: 'cat_e', name: 'Current Communication Topology', unit: 'enum',
    why: 'Direct S2S crosslink vs Relay via 3rd satellite vs Ground loop',
    satA_val: 'Direct Inter-Satellite Link (CCSDS Proximity-1)', satB_val: 'Direct Inter-Satellite Link (CCSDS Proximity-1)', weightInfluence: 'High'
  },
  {
    id: 58, cat: 'cat_e', name: 'Round-Trip Communication Latency', unit: 'ms',
    why: 'Affects protocol timeout timers and deadline for agreement',
    satA_val: '12.4 ms', satB_val: '12.4 ms', weightInfluence: 'Medium'
  },
  {
    id: 59, cat: 'cat_e', name: 'Historical Negotiation Reputation Score', unit: '0.0 - 1.0',
    why: 'Trust score based on past compliance with signed maneuver commitments',
    satA_val: '0.98 (High trust)', satB_val: '0.96 (High trust)', weightInfluence: 'High'
  },
  {
    id: 60, cat: 'cat_e', name: 'Public-Key Certificate Validity Status', unit: 'bool',
    why: 'Root of trust; verifiable against ITU/SpaceRegistry public cert authorities',
    satA_val: 'VALID (Ed25519 Cert #9401)', satB_val: 'VALID (Ed25519 Cert #1048)', weightInfluence: 'Critical'
  },
  {
    id: 61, cat: 'cat_e', name: 'Time Since Last Cryptographic Contact', unit: 'sec',
    why: 'Freshness of session authentication keys',
    satA_val: '0.2 s', satB_val: '0.2 s', weightInfluence: 'Medium'
  },
  {
    id: 62, cat: 'cat_e', name: 'Protocol Version Compatibility', unit: 'semver',
    why: 'Ensures schema compatibility between S2SCAN v1.0 and v2.0 implementations',
    satA_val: 'S2SCAN v1.2', satB_val: 'S2SCAN v1.2', weightInfluence: 'High'
  },
  {
    id: 63, cat: 'cat_e', name: 'Message Integrity Signature Status', unit: 'bool',
    why: 'Ed25519 / HMAC signature verification on inbound alert and proposals',
    satA_val: 'PASSED (0 bit corruption)', satB_val: 'PASSED (0 bit corruption)', weightInfluence: 'Critical'
  },
  {
    id: 64, cat: 'cat_e', name: 'Commitment Scheme Verification Status', unit: 'bool',
    why: 'Checks whether disclosed values match the SHA-256 commitment hash sent earlier',
    satA_val: 'VERIFIED (Hash match)', satB_val: 'VERIFIED (Hash match)', weightInfluence: 'Critical'
  },
  {
    id: 65, cat: 'cat_e', name: 'Communication Blackout Window Countdown', unit: 'sec',
    why: 'Time remaining before line-of-sight is lost due to Earth limb occlusion',
    satA_val: '380 s remaining', satB_val: '380 s remaining', weightInfluence: 'High'
  },

  // --- Category F: Collision Risk Assessment Variables ---
  {
    id: 66, cat: 'cat_f', name: 'Probability of Collision (Pc)', unit: 'scientific',
    why: 'NASA/ESA threshold trigger; Pc > 1e-4 triggers mandatory automated negotiation',
    satA_val: '1.84 × 10⁻³', satB_val: '1.84 × 10⁻³', weightInfluence: 'Critical'
  },
  {
    id: 67, cat: 'cat_f', name: 'Uncertainty in Pc Calculation', unit: '± %',
    why: 'Error bounds based on covariance matrix condition number',
    satA_val: '± 8.2%', satB_val: '± 8.5%', weightInfluence: 'Medium'
  },
  {
    id: 68, cat: 'cat_f', name: 'Position Covariance Ellipsoid (1-Sigma)', unit: 'm³',
    why: 'Spatial uncertainty volume; overlapping ellipsoids dictate collision cross-section',
    satA_val: 'Radial: 12m, In-Track: 45m, Cross: 18m', satB_val: 'Radial: 15m, In-Track: 55m, Cross: 22m', weightInfluence: 'High'
  },
  {
    id: 69, cat: 'cat_f', name: 'Velocity Covariance Uncertainty', unit: 'mm/s',
    why: 'Velocity vector error propagates quadratically into future miss distance error',
    satA_val: '± 1.4 mm/s', satB_val: '± 1.8 mm/s', weightInfluence: 'Medium'
  },
  {
    id: 70, cat: 'cat_f', name: 'Combined Hard-Body Cross-Sectional Area', unit: 'm²',
    why: 'Physical collision cross section; solar panels + main bus area',
    satA_val: '12.4 m²', satB_val: '8.6 m²', weightInfluence: 'High'
  },
  {
    id: 71, cat: 'cat_f', name: 'Secondary Debris Cloud Generation Risk', unit: 'score',
    why: 'Potential to spawn hundreds of fragments endangering the orbital shell',
    satA_val: 'CRITICAL (High velocity encounter)', satB_val: 'CRITICAL (High velocity encounter)', weightInfluence: 'High'
  },
  {
    id: 72, cat: 'cat_f', name: 'Third-Party Satellites at Secondary Risk', unit: 'count',
    why: 'Avoidance maneuver must not steer into a 3rd satellite trajectory',
    satA_val: '0 objects in 20km escape corridor', satB_val: '0 objects in 20km escape corridor', weightInfluence: 'Critical'
  },
  {
    id: 73, cat: 'cat_f', name: 'Conjunction Prediction Time Horizon', unit: 'hours',
    why: 'Conjunction detected at 24h vs 1h; affects confidence and urgency',
    satA_val: '1.5 hours', satB_val: '1.5 hours', weightInfluence: 'High'
  },
  {
    id: 74, cat: 'cat_f', name: 'Data Source of Conjunction Notice', unit: 'enum',
    why: 'US Space Force 19th SDS CDM vs Onboard GNSS/Lidar vs Commercial SSA',
    satA_val: 'Onboard Lidar + GNSS State Cross-check', satB_val: 'Space-Track CDM #849102', weightInfluence: 'Medium'
  },
  {
    id: 75, cat: 'cat_f', name: 'Pc Evolution Trend Rate (dPc/dt)', unit: 'trend',
    why: 'Is risk climbing or resolving as newer tracking updates arrive?',
    satA_val: 'Steeply Increasing (Risk escalation)', satB_val: 'Steeply Increasing (Risk escalation)', weightInfluence: 'High'
  },

  // --- Category G: Post-Maneuver & Strategic Variables ---
  {
    id: 76, cat: 'cat_g', name: 'Post-Maneuver Orbital Drift Rate', unit: 'km/day',
    why: 'Rate at which spacecraft departs its assigned constellation plane',
    satA_val: '1.2 km/day', satB_val: '4.8 km/day', weightInfluence: 'Medium'
  },
  {
    id: 77, cat: 'cat_g', name: 'Re-Circularization / Return Delta-V Cost', unit: 'm/s',
    why: 'Fuel burned later to restore original nominal orbit',
    satA_val: '0.45 m/s', satB_val: '0.50 m/s', weightInfluence: 'High'
  },
  {
    id: 78, cat: 'cat_g', name: 'Next Scheduled Routine Station-Keeping Burn', unit: 'hours',
    why: 'Opportunity to absorb avoidance vector into already planned burn',
    satA_val: 'In 36 hours', satB_val: 'In 120 hours', weightInfluence: 'Medium'
  },
  {
    id: 79, cat: 'cat_g', name: 'Slot / Station Re-Acquisition Time', unit: 'hours',
    why: 'Total downtime before satellite returns to service',
    satA_val: '2.5 hours', satB_val: '12.0 hours', weightInfluence: 'Medium'
  },
  {
    id: 80, cat: 'cat_g', name: 'Allowed Thruster Firing Windows', unit: 'window',
    why: 'Orbital physics constraints on where burns can physically occur',
    satA_val: 'T-60s to T-15s', satB_val: 'T-75s to T-30s', weightInfluence: 'High'
  },
  {
    id: 81, cat: 'cat_g', name: 'Ground Sovereign Exclusion Zones Overflight', unit: 'bool',
    why: 'Certain nations forbid satellite thrust vector changes over sovereign airspace',
    satA_val: 'False (Over Pacific Ocean)', satB_val: 'False (Over Pacific Ocean)', weightInfluence: 'Low'
  },
  {
    id: 82, cat: 'cat_g', name: 'Sun-Aspect Angle Thrust Constraint', unit: 'deg',
    why: 'Thruster firing requires vehicle attitude rotation; solar arrays must receive power',
    satA_val: 'Solar angle within 30° margin', satB_val: 'Solar angle within 45° margin', weightInfluence: 'Medium'
  },
  {
    id: 83, cat: 'cat_g', name: 'Thruster Thermal Heat Limits', unit: 'deg C',
    why: 'Consecutive burns risk overheating propulsion manifold',
    satA_val: '42° C (Nominal)', satB_val: '58° C (Within margin)', weightInfluence: 'Medium'
  },
  {
    id: 84, cat: 'cat_g', name: 'Eclipse / Shadow Status during TCA', unit: 'bool',
    why: 'Operating on battery storage during orbital night limits high-power Hall thrusters',
    satA_val: 'False (Full Sunlight)', satB_val: 'False (Full Sunlight)', weightInfluence: 'High'
  },
  {
    id: 85, cat: 'cat_g', name: 'Battery State of Charge (SoC)', unit: '%',
    why: 'Electric propulsion draws 1.5 kW; low battery cannot sustain required burn duration',
    satA_val: '94% (Full power available)', satB_val: '78% (Sufficient)', weightInfluence: 'High'
  },

  // --- Category H: Operator & Commercial Context ---
  {
    id: 86, cat: 'cat_h', name: 'Operator Nationality / Jurisdiction', unit: 'country',
    why: 'Governing regulatory framework and space situational liability',
    satA_val: 'United States (FCC Jurisdiction)', satB_val: 'European Union (ESA Jurisdiction)', weightInfluence: 'Low'
  },
  {
    id: 87, cat: 'cat_h', name: 'Governing Regulatory Space Authority', unit: 'agency',
    why: 'FCC / ESA / UKSA / CNSA space traffic coordination standards',
    satA_val: 'FCC Part 25 Orbital Rules', satB_val: 'EU Space Law Framework', weightInfluence: 'Medium'
  },
  {
    id: 88, cat: 'cat_h', name: 'Commercial In-Orbit Insurance Coverage', unit: 'bool',
    why: 'Insured satellites have clear claims liability paths; uninsured cannot take risks',
    satA_val: 'Self-insured Constellation', satB_val: 'Commercial Third-Party Underwritten', weightInfluence: 'Low'
  },
  {
    id: 89, cat: 'cat_h', name: 'Commercial SLA Breach Penalty Cost', unit: 'USD',
    why: 'Downtime cost paid to enterprise customers if throughput dropped',
    satA_val: '$2,000 / hr', satB_val: '$18,000 / hr', weightInfluence: 'High'
  },
  {
    id: 90, cat: 'cat_h', name: 'Autonomous Maneuver Authority Policy', unit: 'enum',
    why: 'Does onboard flight computer have legal mandate to fire without ground signoff?',
    satA_val: 'APPROVED (Autonomous Onboard)', satB_val: 'APPROVED (Autonomous Onboard)', weightInfluence: 'Critical'
  },
  {
    id: 91, cat: 'cat_h', name: 'Pre-Existing Bilateral Coordination Agreement', unit: 'bool',
    why: 'Formal operator-to-operator data sharing agreement already in place',
    satA_val: 'True (S2SCAN Consortium Member)', satB_val: 'True (S2SCAN Consortium Member)', weightInfluence: 'High'
  },
  {
    id: 92, cat: 'cat_h', name: 'Dispute Arbitration Forum', unit: 'treaty',
    why: 'Arbitration jurisdiction (e.g. PCA Optional Rules for Outer Space Disputes)',
    satA_val: 'Permanent Court of Arbitration (PCA)', satB_val: 'Permanent Court of Arbitration (PCA)', weightInfluence: 'Low'
  },
  {
    id: 93, cat: 'cat_h', name: 'Post-Conjunction Maneuver Liability Tier', unit: 'tier',
    why: 'Who is liable if an avoidance maneuver inadvertently triggers a secondary close pass?',
    satA_val: 'Tier-1 Mutual Waiver', satB_val: 'Tier-1 Mutual Waiver', weightInfluence: 'Medium'
  },
  {
    id: 94, cat: 'cat_h', name: 'Historical Regulatory Compliance Score', unit: '0.0 - 1.0',
    why: 'Track record of abiding by 25-year (now 5-year) post-mission de-orbit rules',
    satA_val: '0.99', satB_val: '0.99', weightInfluence: 'Low'
  },
  {
    id: 95, cat: 'cat_h', name: 'Shared Constellation Fleet Membership', unit: 'bool',
    why: 'If satellites belong to same operator, internal scheduling solves conflict',
    satA_val: 'False (Cross-Operator Bilateral)', satB_val: 'False (Cross-Operator Bilateral)', weightInfluence: 'High'
  },

  // --- Category I: Extreme Edge Cases & Fail-safes ---
  {
    id: 96, cat: 'cat_i', name: 'Both Satellites Non-Maneuverable', unit: 'state',
    why: 'Neither can move; protocol must immediately broadcast emergency ground alert',
    satA_val: 'False (Can maneuver)', satB_val: 'False (Can maneuver)', weightInfluence: 'Critical'
  },
  {
    id: 97, cat: 'cat_i', name: 'Both Satellites Low / Critical on Fuel', unit: 'state',
    why: 'Both have depleted tanks; protocol executes shared split burn (0.24m/s each)',
    satA_val: 'False (A has high fuel)', satB_val: 'False (B has low fuel)', weightInfluence: 'Critical'
  },
  {
    id: 98, cat: 'cat_i', name: 'Three-Way Conjunction Geometry', unit: 'state',
    why: 'A, B, and C all converge simultaneously; bilateral protocol extends to triad consensus',
    satA_val: 'False (Pairwise)', satB_val: 'False (Pairwise)', weightInfluence: 'High'
  },
  {
    id: 99, cat: 'cat_i', name: 'Asymmetric Threat Perception Conflict', unit: 'state',
    why: 'A measures Pc = 1e-3, B measures Pc = 1e-6; protocol takes the conservative max',
    satA_val: 'Consistent (ΔPc < 5%)', satB_val: 'Consistent (ΔPc < 5%)', weightInfluence: 'High'
  },
  {
    id: 100, cat: 'cat_i', name: 'Satellite in Final 48h De-Orbit Phase', unit: 'state',
    why: 'Re-entry spacecraft should absorb maneuver cost to protect active orbiters',
    satA_val: 'False', satB_val: 'False', weightInfluence: 'High'
  },
  {
    id: 101, cat: 'cat_i', name: 'Communication Restored After Partial Agreement', unit: 'state',
    why: 'A accepted proposal, B never got confirmation; BFT rollback state required',
    satA_val: 'Clean Link', satB_val: 'Clean Link', weightInfluence: 'Critical'
  },
  {
    id: 102, cat: 'cat_i', name: 'Cryptographic Spoofing Attempt Detected', unit: 'state',
    why: 'Forged public key or replayed signature; protocol immediately aborts to Rule-of-Road',
    satA_val: 'Signature Valid', satB_val: 'Signature Valid', weightInfluence: 'Critical'
  },
  {
    id: 103, cat: 'cat_i', name: 'Formation Satellite vs Solitary Satellite', unit: 'state',
    why: 'Solitary satellite must move because formation disruption cost has 3x multiplier',
    satA_val: 'Solitary (Starlink)', satB_val: 'Formation Cluster Member', weightInfluence: 'Critical'
  },
  {
    id: 104, cat: 'cat_i', name: 'Adjacent GEO Slot Boundary Encroachment', unit: 'state',
    why: 'Physical avoidance burn risks entering adjacent leased spectrum slot',
    satA_val: 'False', satB_val: 'False', weightInfluence: 'Critical'
  },
  {
    id: 105, cat: 'cat_i', name: 'Crewed Spacecraft Encounter (e.g. ISS / Dragon)', unit: 'state',
    why: 'Human lives onboard; automated zero-tolerance rule: non-crewed satellite yields unconditionally',
    satA_val: 'Uncrewed Bus', satB_val: 'Uncrewed Bus', weightInfluence: 'Critical'
  }
];
