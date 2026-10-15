/**
 * S2SCAN [📖 What?] Layman Meaning & Conceptual Inspector
 * Explains technical space traffic management, game theory, and cryptographic terms
 * in plain English, with real-world analogies, standard nominal ranges, and practical reading tips.
 */

export class WhatInspectorSystem {
  constructor() {
    this.modalId = 'modalWhatInspector';
    this.createModalDOM();
  }

  createModalDOM() {
    if (document.getElementById(this.modalId)) return;

    const modal = document.createElement('div');
    modal.id = this.modalId;
    modal.className = 'what-modal-backdrop';
    modal.innerHTML = `
      <div class="what-modal-content">
        <div class="what-modal-header">
          <div class="what-header-title">
            <span class="what-header-badge">CONCEPT EXPLAINER</span>
            <h3 id="whatModalTermTitle">What is this term?</h3>
            <span id="whatModalCategory" class="what-header-cat">Operational Space Domain</span>
          </div>
          <button class="what-close-btn" id="btnWhatClose">&times;</button>
        </div>

        <div class="what-modal-body">
          <!-- Plain English Summary -->
          <div class="what-card-block">
            <div class="what-block-label">PLAIN ENGLISH MEANING (NO JARGON)</div>
            <p class="what-plain-text" id="whatPlainText"></p>
          </div>

          <!-- Real World Everyday Analogy -->
          <div class="what-card-block what-analogy-box">
            <div class="what-block-label">🚗 REAL-WORLD EVERYDAY ANALOGY</div>
            <p class="what-analogy-text" id="whatAnalogyText"></p>
          </div>

          <!-- Numbers & Thresholds -->
          <div class="what-card-block">
            <div class="what-block-label">NOMINAL RANGE VS. DANGER THRESHOLDS</div>
            <div id="whatThresholdsContainer" class="what-thresholds-grid"></div>
          </div>

          <!-- How to read it in this software -->
          <div class="what-card-block what-software-box">
            <div class="what-block-label">🖥️ HOW TO INTERPRET IT IN THIS SIMULATOR</div>
            <p class="what-software-text" id="whatSoftwareText"></p>
          </div>
        </div>

        <div class="what-modal-footer">
          <button class="btn-check-why" id="btnWhatSwitchToWhy">Check Formula & Math Derivation (Why?) ➔</button>
          <button class="btn btn-secondary" id="btnWhatDismiss">Got it</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('btnWhatClose').addEventListener('click', () => this.hide());
    document.getElementById('btnWhatDismiss').addEventListener('click', () => this.hide());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.hide();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        this.hide();
      }
    });
  }

  show(termKey, whySystemRef = null) {
    const data = this.getTermData(termKey);
    if (!data) return;

    document.getElementById('whatModalTermTitle').innerText = data.termTitle;
    document.getElementById('whatModalCategory').innerText = data.category;
    document.getElementById('whatPlainText').innerText = data.plainEnglish;
    document.getElementById('whatAnalogyText').innerText = data.analogy;
    document.getElementById('whatThresholdsContainer').innerHTML = data.thresholdsHtml;
    document.getElementById('whatSoftwareText').innerText = data.softwareTip;

    const btnWhy = document.getElementById('btnWhatSwitchToWhy');
    btnWhy.onclick = () => {
      this.hide();
      if (whySystemRef && data.correspondingWhyTopic) {
        whySystemRef.show(data.correspondingWhyTopic, data.context || {});
      }
    };

    const modal = document.getElementById(this.modalId);
    modal.classList.add('active');
  }

  hide() {
    const modal = document.getElementById(this.modalId);
    if (modal) modal.classList.remove('active');
  }

  getTermData(key) {
    switch (key) {
      case 'collision_probability':
      case 'pc':
        return {
          termTitle: 'Collision Probability (Pc)',
          category: 'Orbital Risk Assessment & Astrodynamics',
          correspondingWhyTopic: 'collision_probability',
          plainEnglish: 'Collision Probability (written as Pc) is a single number between 0 and 1 that represents the mathematical likelihood that two objects in space will physically smash into each other at their closest encounter. Instead of guessing based on distance alone, it combines how close they get with how much radar measurement uncertainty (error clouds) exists in their orbits.',
          analogy: 'Imagine two speedboats passing each other in thick fog. Even if their GPS says they will miss by 30 meters, the GPS in fog might have a 50-meter margin of error! Collision probability measures the exact chance that the error cloud of Boat A overlaps with the error cloud of Boat B.',
          thresholdsHtml: `
            <div class="th-item th-safe">
              <span class="th-val">< 1.0 × 10⁻⁵</span>
              <span class="th-label">NOMINAL SAFE</span>
              <p>Green. Normal orbital operations. No intervention needed.</p>
            </div>
            <div class="th-item th-warn">
              <span class="th-val">10⁻⁵ to 10⁻⁴</span>
              <span class="th-label">YELLOW ALERT</span>
              <p>Heightened tracking. Radar sensors take extra scans.</p>
            </div>
            <div class="th-item th-danger">
              <span class="th-val">> 1.0 × 10⁻⁴</span>
              <span class="th-label">CRITICAL (MANDATORY BURN)</span>
              <p>NASA & ESA safety threshold. Thrusters MUST fire to divert!</p>
            </div>
          `,
          softwareTip: 'In the simulator top HUD, if Pc is highlighted in red (like 1.84e-3), it means the risk is 1-in-543, which is 18 times worse than the critical threshold! The software will automatically highlight that an avoidance maneuver is mandatory.'
        };

      case 'tca':
      case 'time_to_tca':
        return {
          termTitle: 'Time of Closest Approach (TCA)',
          category: 'Orbital Geometry & Encounter Timing',
          correspondingWhyTopic: 'rubinstein_discount',
          plainEnglish: 'TCA stands for "Time of Closest Approach". It is the exact second in universal time (UTC) when the two satellites will reach their absolute minimum separation distance. Before TCA, the satellites are converging; after TCA, they are moving apart.',
          analogy: 'Think of two trains speeding down railroad tracks that cross at an intersection. TCA is the exact millisecond when the front locomotives pass the intersection point.',
          thresholdsHtml: `
            <div class="th-item th-safe">
              <span class="th-val">> 24 Hours</span>
              <span class="th-label">STRATEGIC PLANNING</span>
              <p>Ground teams analyze data and run automated simulations.</p>
            </div>
            <div class="th-item th-warn">
              <span class="th-val">10 min - 2 Hours</span>
              <span class="th-label">TACTICAL TIMEOUT</span>
              <p>Last window for ground stations to upload thruster commands.</p>
            </div>
            <div class="th-item th-danger">
              <span class="th-val">< 120 Seconds</span>
              <span class="th-label">AUTONOMOUS S2SCAN ZONE</span>
              <p>Ground is too slow! Onboard flight computers negotiate peer-to-peer.</p>
            </div>
          `,
          softwareTip: 'The timeline scrub slider lets you drag time from T-94s to T-0s. As TCA approaches zero, required propellant escalates exponentially, which is why S2SCAN completes negotiations in under 2 seconds.'
        };

      case 'rubinstein_discount':
      case 'urgency_discount':
        return {
          termTitle: 'Rubinstein Urgency Discount Factor D(t)',
          category: 'Game Theory & Alternating-Offers Bargaining',
          correspondingWhyTopic: 'rubinstein_discount',
          plainEnglish: 'The Rubinstein Discount Factor D(t) is a mathematical penalty between 0% and 100% that measures how much "bargaining value" is destroyed by wasting time. In space, delaying an avoidance burn by even 30 seconds requires significantly more thruster fuel to dodge the other craft. D(t) makes holding out and stalling extremely expensive for both satellites.',
          analogy: 'Imagine you and a rival are sitting in a taxi whose meter is ticking up by $10 every second while you argue over who pays the fare. The longer you argue, the more money both of you lose. That ticking meter is the Rubinstein discount factor.',
          thresholdsHtml: `
            <div class="th-item th-safe">
              <span class="th-val">85% to 100%</span>
              <span class="th-label">LOW URGENCY (EARLY)</span>
              <p>Plenty of time remaining. Minimal fuel penalty for brief deliberation.</p>
            </div>
            <div class="th-item th-warn">
              <span class="th-val">50% to 84%</span>
              <span class="th-label">MODERATE URGENCY</span>
              <p>Fuel penalty is mounting. Agreement must be reached in next round.</p>
            </div>
            <div class="th-item th-danger">
              <span class="th-val">< 40%</span>
              <span class="th-label">EXTREME CRITICAL PENALTY</span>
              <p>Seconds away from impact! Delaying triples the fuel cost!</p>
            </div>
          `,
          softwareTip: 'In the flight cockpit, move the TCA countdown slider down from 94s to 20s. You will watch D(t) drop from 85% down to 36%, proving that orbital mechanics mathematically forces both satellite AIs to stop haggling immediately.'
        };

      case 'nash_bargaining':
      case 'assigned_mover':
        return {
          termTitle: 'Asymmetric Nash Bargaining Solution',
          category: 'Algorithmic Game Theory & Cooperative Optimization',
          correspondingWhyTopic: 'nash_bargaining',
          plainEnglish: 'The Nash Bargaining Solution is a famous mathematical theorem created by Nobel Laureate John Nash. In S2SCAN, instead of both satellites burning fuel (which is wasteful) or neither moving (which causes a crash), Nash Bargaining calculates which satellite can move with the least overall harm to its mission, fuel balance, and customer commitments.',
          analogy: 'Imagine two roommates deciding who should drive to the grocery store during a snowstorm. Roommate A has a full tank of gas and an SUV, while Roommate B has an almost empty tank and a tiny car. The fair, sensible decision is for Roommate A to drive, because it costs them much less relative effort.',
          thresholdsHtml: `
            <div class="th-item th-safe">
              <span class="th-val">Lower Weight (W)</span>
              <span class="th-label">ASSIGNED MOVER</span>
              <p>Selected craft fires thrusters to divert. Has higher fuel or lower priority.</p>
            </div>
            <div class="th-item th-warn">
              <span class="th-val">Higher Weight (W)</span>
              <span class="th-label">HOLDS COURSE</span>
              <p>Vulnerable craft maintains nominal trajectory to preserve its lifespan.</p>
            </div>
            <div class="th-item th-danger">
              <span class="th-val">Weight = Infinity</span>
              <span class="th-label">HARD OVERRIDE</span>
              <p>GEO satellite with strict ITU license or Crewed vehicle (ISS/Dragon) never yields!</p>
            </div>
          `,
          softwareTip: 'In Tab 1 and Tab 3, whenever you adjust the propellant sliders or classification dropdowns, S2SCAN dynamically solves the Nash equation and reassigns the mover to ensure maximum fleet fairness.'
        };

      case 'crypto_commitment':
      case 'formula_3':
        return {
          termTitle: 'Formula 3: Cryptographic State Commitment',
          category: 'Zero-Knowledge Security & Anti-Cheating Architecture',
          correspondingWhyTopic: 'crypto_commitment',
          plainEnglish: 'A Cryptographic Commitment is the digital equivalent of putting a piece of paper inside a tamper-proof sealed envelope and handing it to your rival. You cannot change what is written inside the envelope, and your rival cannot read it until you open it. Satellite B publishes a hash of its fuel level before negotiations begin, preventing it from lying later.',
          analogy: 'In rock-paper-scissors over text message, you cannot just text your move second after seeing your opponent’s move. You must write your move on paper, lock it in a safe, and give your opponent the safe. Only after both commit do you open the safe.',
          thresholdsHtml: `
            <div class="th-item th-safe">
              <span class="th-val">Stage 3 (Commit)</span>
              <span class="th-label">SEALED HASH</span>
              <p>Peer receives SHA256(Category || Salt). Telemetry remains 100% secret.</p>
            </div>
            <div class="th-item th-warn">
              <span class="th-val">Stage 5 (Reveal)</span>
              <span class="th-label">SALT OPENED</span>
              <p>Peer opens envelope by revealing salt and verifies hash matches.</p>
            </div>
            <div class="th-item th-danger">
              <span class="th-val">Hash Mismatch</span>
              <span class="th-label">FRAUD DETECTED (BYZANTINE)</span>
              <p>Cheater is caught red-handed! Reputation ruined, forced into penal burn.</p>
            </div>
          `,
          softwareTip: 'In Tab 4 (Crypto Inspector), click "Run Byzantine Test in Simulator". You will see how Satellite B attempting to lie about having "CRITICAL" fuel is instantly caught by the cryptographic hash mismatch!'
        };

      case 'burn_vectors':
      case 'delta_v':
        return {
          termTitle: 'Delta-V (Δv) & Maneuver Burn Vectors',
          category: 'Astrodynamics & Propulsion Mechanics',
          correspondingWhyTopic: 'burn_vectors',
          plainEnglish: 'Delta-V (Δv) literally means "change in velocity" measured in meters per second (m/s). It is the universal currency of space travel. Firing thrusters changes the satellite’s speed or direction. The direction you fire (along the track, radial outward, or cross-track) determines how efficiently you shift the orbit to miss the collision.',
          analogy: 'Imagine steering a bicycle. Turning the handlebars slightly while coasting down a hill (In-track) slowly shifts your path wide to miss an obstacle 100 meters ahead with zero effort. But slamming on the brakes at the last second (Radial emergency) requires immense physical force.',
          thresholdsHtml: `
            <div class="th-item th-safe">
              <span class="th-val">+I (In-Track)</span>
              <span class="th-label">HIGHEST EFFICIENCY (8x)</span>
              <p>Burns along flight path. Tiny burn expands miss distance by kilometers.</p>
            </div>
            <div class="th-item th-warn">
              <span class="th-val">+R (Radial)</span>
              <span class="th-label">LATE EMERGENCY</span>
              <p>Burns toward or away from Earth. Quick altitude hop for last-minute dodges.</p>
            </div>
            <div class="th-item th-danger">
              <span class="th-val">+C (Cross-Track)</span>
              <span class="th-label">PLANE CHANGE</span>
              <p>Burns sideways. Most expensive burn; used only if other directions are blocked.</p>
            </div>
          `,
          softwareTip: 'In the cockpit, you can toggle between Radial (+R), In-Track (+I), and Cross-Track (+C) and adjust the Δv slider to see the escape trajectory deflect on the radar screen.'
        };

      case 'three_way_cluster':
        return {
          termTitle: '3-Way Conjunction Cluster (Cascade Avoidance)',
          category: 'Multi-Agent Collision Mitigation',
          correspondingWhyTopic: 'three_way_cluster',
          plainEnglish: 'In dense megaconstellations, a 3-way cluster occurs when two satellites need to avoid each other, but the obvious escape path would steer one of them straight into a third object (like another Starlink satellite or a chunk of space debris). S2SCAN solves this by checking neighbor objects and picking a 3D hybrid burn that clears all hazards simultaneously.',
          analogy: 'Imagine two cars swerving on a crowded highway to avoid hitting each other head-on, but swerving into the right lane would smash into a parked truck. You need an avoidance maneuver that dodges the oncoming car WITHOUT hitting the parked truck.',
          thresholdsHtml: `
            <div class="th-item th-safe">
              <span class="th-val">Cleared Space</span>
              <span class="th-label">NO SECONDARY HAZARD</span>
              <p>Standard bilateral 2-satellite in-track burn is completely safe.</p>
            </div>
            <div class="th-item th-warn">
              <span class="th-val">< 15 km Radius</span>
              <span class="th-label">NEIGHBOR DETECTED</span>
              <p>Third object detected in avoidance corridor; activates spatial constraints.</p>
            </div>
            <div class="th-item th-danger">
              <span class="th-val">Secondary Pc > 10⁻⁵</span>
              <span class="th-label">CASCADE THREAT</span>
              <p>In-track burn forbidden! Solver recalculates a hybrid Radial/Cross-track vector.</p>
            </div>
          `,
          softwareTip: 'Click the "🔺 3-Way Cluster" button in Tab 1. Watch how Satellite C (COSMOS-2251 debris) appears with a red dashed hazard bubble, and how the algorithm automatically routes around it!'
        };

      default:
        return null;
    }
  }
}
