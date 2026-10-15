"""
S2SCAN: Comparison Baseline 2 — Ground-Mediated Coordination Model
Simulates the current real-world status quo (the 2019 ESA-SpaceX email coordination model).
Models radar tracking ingestion, ground station pass latency, operator on-call paging delay,
and manual email communication (typically requiring 15–45 minutes).
Evaluates failure-to-respond rate when TCA < 15 minutes.
"""

from typing import Dict, Any


class BaselineGroundMediatedModel:
    """
    Baseline 2: Ground-Mediated Manual Coordination.
    Models operational delays in ground-station contacts, human ticketing, and operator paging.
    """

    def __init__(self, human_operator_delay_seconds: float = 900.0):
        # 900 seconds = 15 minutes typical minimum response window
        self.ground_latency_seconds = human_operator_delay_seconds

    def evaluate_conjunction(
        self,
        tca_seconds: float,
        sat_a_props: Dict[str, Any],
        sat_b_props: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Evaluates whether ground operations can coordinate in time before TCA.
        """
        # If encounter is within 15 minutes, ground coordination fails to respond before TCA!
        if tca_seconds < self.ground_latency_seconds:
            return {
                "policy": "BASELINE_GROUND_MEDIATED",
                "status": "TIMED_OUT_NO_COORDINATION",
                "latency_seconds": self.ground_latency_seconds,
                "is_successful": False,
                "consequence": "UNCOORDINATED_CLOSE_APPROACH (ESA-Starlink 2019 Incident Model)",
                "assigned_mover": "NONE",
                "delta_v_spent_m_s": 0.0,
                "residual_collision_risk": "UNRESOLVED_HIGH"
            }

        # Otherwise, ground operators resolve and assign the satellite with lower operational burden
        # However, due to delayed burn planning, late burns require 2.5x more delta-v
        cost_a = sat_a_props.get("delta_v_required", 0.45) * (100.0 / max(10, sat_a_props.get("fuel_remaining_pct", 50)))
        cost_b = sat_b_props.get("delta_v_required", 0.45) * (100.0 / max(10, sat_b_props.get("fuel_remaining_pct", 50)))

        assigned = "SAT_A" if cost_a < cost_b else "SAT_B"
        mover_props = sat_a_props if assigned == "SAT_A" else sat_b_props

        # Late execution delta-v penalty factor
        penalty_multiplier = 1.8

        return {
            "policy": "BASELINE_GROUND_MEDIATED",
            "status": "COORDINATED_WITH_DELAY",
            "latency_seconds": self.ground_latency_seconds,
            "is_successful": True,
            "assigned_mover": assigned,
            "mover_id": mover_props.get("satellite_id", assigned),
            "delta_v_spent_m_s": round(mover_props.get("delta_v_required", 0.45) * penalty_multiplier, 3),
            "residual_collision_risk": "RESOLVED_SAFE"
        }


if __name__ == "__main__":
    b2 = BaselineGroundMediatedModel(human_operator_delay_seconds=900.0)
    res_late = b2.evaluate_conjunction(180.0, {"satellite_id": "SAT_A"}, {"satellite_id": "SAT_B"})
    res_early = b2.evaluate_conjunction(3600.0, {"satellite_id": "SAT_A"}, {"satellite_id": "SAT_B"})

    print(f"Late Conjunction (TCA=3 min): {res_late['status']} -> {res_late.get('consequence')}")
    print(f"Early Conjunction (TCA=60 min): {res_early['status']} -> Spent {res_early.get('delta_v_spent_m_s')} m/s")
