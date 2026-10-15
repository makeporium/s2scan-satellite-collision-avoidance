"""
S2SCAN: Comparison Baseline 1 — Random Assignment Model
Simulates a naive decision policy: upon conjunction alert, arbitrarily assign
maneuver duty to either Satellite A or B via a 50/50 pseudo-random coin toss.
Measures failure rate, fuel wastage, and hard-constraint violations (GEO, Defunct).
"""

import random
from typing import Dict, Any, List


class BaselineRandomModel:
    """
    Baseline 1: Random Mover Selection.
    Evaluates what happens when no negotiation occurs and responsibility is picked blindly.
    """

    def __init__(self, seed: int = 42):
        self.rng = random.Random(seed)

    def evaluate_conjunction(
        self,
        sat_a_props: Dict[str, Any],
        sat_b_props: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Executes a single conjunction assignment using random selection.
        """
        picked = "SAT_A" if self.rng.random() < 0.5 else "SAT_B"
        mover_props = sat_a_props if picked == "SAT_A" else sat_b_props
        other_props = sat_b_props if picked == "SAT_A" else sat_a_props

        # Check for catastrophic mistakes
        violation = None
        is_safe = True

        if mover_props.get("is_crewed", False):
            violation = "CREWED_SPACECRAFT_BURDENED"
            is_safe = False
        elif mover_props.get("is_geo", False):
            violation = "GEO_ITU_SLOT_VIOLATION"
            is_safe = False
        elif not mover_props.get("has_propulsion", True):
            violation = "NON_MANEUVERABLE_OBJECT_ASSIGNED"
            is_safe = False
        elif mover_props.get("fuel_remaining_pct", 50.0) < 20.0:
            violation = "DEPLETED_FUEL_SATELLITE_BURDENED"

        # Calculate fuel delta-v cost
        dv_spent = mover_props.get("delta_v_required", 0.50) if is_safe else 0.0

        return {
            "policy": "BASELINE_RANDOM",
            "assigned_mover": picked,
            "mover_id": mover_props.get("satellite_id", picked),
            "is_safe": is_safe,
            "constraint_violation": violation,
            "delta_v_spent_m_s": dv_spent,
            "latency_seconds": 0.05  # Instantaneous, but unintelligent
        }


if __name__ == "__main__":
    b1 = BaselineRandomModel()
    sample_a = {"satellite_id": "GEO-COMMSAT-1", "is_geo": True, "fuel_remaining_pct": 60.0}
    sample_b = {"satellite_id": "STARLINK-2290", "is_geo": False, "fuel_remaining_pct": 80.0}

    runs = [b1.evaluate_conjunction(sample_a, sample_b) for _ in range(10)]
    violations = sum(1 for r in runs if r["constraint_violation"] is not None)
    print(f"Random Baseline Test: {violations}/10 runs produced dangerous constraint violations!")
