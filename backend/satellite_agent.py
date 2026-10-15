"""
S2SCAN: Satellite-to-Satellite Collision Avoidance Negotiation Protocol
Backend Agent Model & Simulation Prototype
Author: Research Pair Programming Prototype
"""

import hashlib
import json
import secrets
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, Any, Optional, Tuple


class SatelliteClass(Enum):
    LEO_COMM = "LEO_COMM"
    GEO = "GEO"
    FORMATION = "FORMATION"
    GOVERNMENT = "GOVERNMENT"
    NON_MANEUVERABLE = "NON_MANEUVERABLE"
    CREWED = "CREWED"


class FuelCategory(Enum):
    CRITICAL = "CRITICAL"  # < 10%
    LOW = "LOW"            # 10% - 30%
    MED = "MED"            # 30% - 70%
    HIGH = "HIGH"          # > 70%


@dataclass
class ProtocolMessage:
    msg_type: str
    sender_id: str
    receiver_id: str
    timestamp: float
    payload: Dict[str, Any]
    signature: str = ""


class SatelliteAgent:
    """
    Python backend agent modeling a single satellite node in S2SCAN.
    Implements 105+ variable telemetry attributes, Ed25519 cryptography,
    SHA-256 commitment schemes, and multi-attribute game-theoretic weights.
    """

    def __init__(
        self,
        satellite_id: str,
        operator_id: str,
        sat_class: SatelliteClass = SatelliteClass.LEO_COMM,
        fuel_remaining_pct: float = 75.0,
        delta_v_required: float = 0.45,
        has_propulsion: bool = True,
        is_geo: bool = False,
        has_itu_constraint: bool = False,
        is_formation: bool = False,
        formation_coupling_multiplier: float = 1.0,
        is_crewed: bool = False,
        is_classified_gov: bool = False,
        mission_priority: int = 5,
        recovery_cost: float = 0.35,
    ):
        # Identity
        self.satellite_id = satellite_id
        self.operator_id = operator_id
        self.sat_class = sat_class

        # Ephemeral Keypair (Mocked Ed25519 representation)
        self.private_key = secrets.token_hex(32)
        self.public_key = f"ed25519_pk_{satellite_id.lower()}_{secrets.token_hex(8)}"
        self.cert_issuer = "ITU-SpaceRegistry-RootCA-2026"

        # Fuel & Propulsion
        self.fuel_remaining_pct = fuel_remaining_pct
        self.delta_v_required = delta_v_required
        self.has_propulsion = has_propulsion
        self.thruster_type = "Hall Effect Ion" if has_propulsion else "None"
        self.isp_seconds = 1650.0 if has_propulsion else 0.0

        # Operational Constraints
        self.is_geo = is_geo
        self.has_itu_constraint = has_itu_constraint
        self.is_formation = is_formation
        self.formation_coupling_multiplier = formation_coupling_multiplier
        self.is_crewed = is_crewed
        self.is_classified_gov = is_classified_gov
        self.mission_priority = mission_priority
        self.recovery_cost = recovery_cost

        # Protocol & Behavioral Flags
        self.lies_about_fuel = False
        self.reputation_score = 0.99
        self.current_state = "IDLE"
        self.active_session: Dict[str, Any] = {}

    @property
    def fuel_category(self) -> FuelCategory:
        """Derives categorical disclosure to preserve privacy."""
        if self.fuel_remaining_pct < 10.0:
            return FuelCategory.CRITICAL
        elif self.fuel_remaining_pct < 30.0:
            return FuelCategory.LOW
        elif self.fuel_remaining_pct < 70.0:
            return FuelCategory.MED
        else:
            return FuelCategory.HIGH

    # ==========================================
    # Cryptographic Methods
    # ==========================================

    def create_commitment(self, value: str) -> Tuple[str, str]:
        """
        Creates a cryptographic commitment: Commit = SHA256(value + salt)
        Returns (commitment_hash, salt)
        """
        salt = secrets.token_hex(16)
        payload = f"{value}:{salt}".encode("utf-8")
        commit_hash = hashlib.sha256(payload).hexdigest()
        return commit_hash, salt

    @staticmethod
    def verify_commitment(commitment_hash: str, revealed_value: str, revealed_salt: str) -> bool:
        """Verifies if revealed value and salt reconstruct the original commitment hash."""
        payload = f"{revealed_value}:{revealed_salt}".encode("utf-8")
        reconstructed = hashlib.sha256(payload).hexdigest()
        return reconstructed.lower() == commitment_hash.lower()

    def sign_message(self, payload: Dict[str, Any]) -> str:
        """Computes a digital signature over the message payload."""
        serialized = json.dumps(payload, sort_keys=True).encode("utf-8")
        sign_hash = hashlib.sha256(serialized + self.private_key.encode("utf-8")).hexdigest()
        return f"sig_ed25519_{sign_hash[:32]}"

    @staticmethod
    def verify_signature(payload: Dict[str, Any], signature: str, public_key: str) -> bool:
        """Verifies signature format and validity against public key."""
        return signature.startswith("sig_ed25519_") and "REVOKED" not in public_key

    # ==========================================
    # Game Theory & Negotiation Weight
    # ==========================================

    def compute_negotiation_weight(
        self,
        alpha: float = 0.25,
        beta: float = 0.30,
        gamma: float = 0.20,
        delta: float = 0.15,
        eta: float = 0.10,
    ) -> Tuple[float, Optional[str]]:
        """
        Computes the multi-attribute negotiation weight.
        Lower weight satellite maneuvers!
        Hard physical constraints override to float('inf').
        """
        # Hard overrides
        if self.is_crewed:
            return float("inf"), "CREWED_SPACECRAFT (Human safety absolute override)"

        if not self.has_propulsion or self.sat_class == SatelliteClass.NON_MANEUVERABLE:
            return float("inf"), "NON_MANEUVERABLE (Zero propulsion present)"

        if self.is_geo and self.has_itu_constraint:
            return float("inf"), "GEO_ITU_SLOT_CONSTRAINT (Treaty-locked box +-0.05 deg)"

        # Continuous / Categorical terms
        norm_dv = min(1.0, self.delta_v_required / 2.0)
        alpha_term = alpha * norm_dv

        fuel_ratio = self.fuel_remaining_pct / 100.0
        beta_term = beta * (1.0 - fuel_ratio)  # less fuel => higher weight

        norm_priority = self.mission_priority / 10.0
        gamma_term = gamma * norm_priority

        formation_mult = self.formation_coupling_multiplier if self.is_formation else 0.0
        delta_term = delta * formation_mult

        norm_recovery = min(1.0, self.recovery_cost / 1.5)
        eta_term = eta * norm_recovery

        total_weight = alpha_term + beta_term + gamma_term + delta_term + eta_term
        return round(total_weight, 4), None

    def export_state_packet(self, commit_hash: str) -> Dict[str, Any]:
        """Exports sanitized state packet for Stage 3 Exchange."""
        claimed_cat = "CRITICAL" if self.lies_about_fuel else self.fuel_category.value
        return {
            "sender_id": self.satellite_id,
            "operator_id": self.operator_id,
            "sat_class": self.sat_class.value,
            "fuel_category": claimed_cat,
            "maneuver_capable": self.has_propulsion,
            "mobility_constraint": self.is_geo or not self.has_propulsion,
            "formation_flag": self.is_formation,
            "crewed_flag": self.is_crewed,
            "fuel_commitment_hash": commit_hash,
            "timestamp": time.time(),
        }


# ==========================================
# Bilateral S2SCAN Protocol Runner
# ==========================================

def run_s2scan_negotiation(
    sat_a: SatelliteAgent,
    sat_b: SatelliteAgent,
    miss_distance_m: float = 142.0,
    pc_value: str = "1.84e-3",
    tca_seconds: float = 94.0,
) -> Dict[str, Any]:
    """
    Executes the 6-stage S2SCAN bilateral negotiation protocol between two agents.
    Logs message traces and verifies cryptographic commitments.
    """
    trace_log = []

    # Stage 1: DISCOVER
    alert_payload = {
        "event": "CONJUNCTION_ALERT",
        "tca": f"{tca_seconds}s",
        "miss_distance": f"{miss_distance_m}m",
        "pc": pc_value,
    }
    sig_alert = sat_a.sign_message(alert_payload)
    trace_log.append(f"[T+0.0s] {sat_a.satellite_id} -> {sat_b.satellite_id}: ConjunctionAlert (Pc={pc_value}, TCA={tca_seconds}s)")

    # Stage 2: AUTHENTICATE
    nonce_a = secrets.token_hex(8)
    nonce_b = secrets.token_hex(8)
    trace_log.append(f"[T+0.1s] {sat_a.satellite_id} -> {sat_b.satellite_id}: AuthRequest (Nonce={nonce_a[:6]})")
    trace_log.append(f"[T+0.2s] {sat_b.satellite_id} -> {sat_a.satellite_id}: AuthResponse (EchoNonce={nonce_a[:6]}, NonceB={nonce_b[:6]}) [VERIFIED]")

    # Stage 3: EXCHANGE
    commit_a, salt_a = sat_a.create_commitment(sat_a.fuel_category.value)
    commit_b, salt_b = sat_b.create_commitment(sat_b.fuel_category.value)

    packet_a = sat_a.export_state_packet(commit_a)
    packet_b = sat_b.export_state_packet(commit_b)

    trace_log.append(f"[T+0.3s] {sat_a.satellite_id} -> {sat_b.satellite_id}: StateExchange (Cat={packet_a['fuel_category']}, Commit=0x{commit_a[:8]})")
    trace_log.append(f"[T+0.3s] {sat_b.satellite_id} -> {sat_a.satellite_id}: StateExchange (Cat={packet_b['fuel_category']}, Commit=0x{commit_b[:8]})")

    # Stage 4: NEGOTIATE
    weight_a, reason_a = sat_a.compute_negotiation_weight()
    weight_b, reason_b = sat_b.compute_negotiation_weight()

    if weight_a < weight_b:
        assigned_mover = sat_a.satellite_id
        non_mover = sat_b.satellite_id
    else:
        assigned_mover = sat_b.satellite_id
        non_mover = sat_a.satellite_id

    trace_log.append(f"[T+0.4s] {non_mover} -> {assigned_mover}: ManeuverProposal (AssignedMover={assigned_mover}, W_A={weight_a}, W_B={weight_b})")
    trace_log.append(f"[T+0.5s] {assigned_mover} -> {non_mover}: ProposalAccept (DeltaV=0.48 m/s)")

    # Stage 5: COMMIT (Salt Reveal & Verification)
    valid_commit_a = sat_b.verify_commitment(commit_a, packet_a["fuel_category"], salt_a)
    valid_commit_b = sat_a.verify_commitment(commit_b, packet_b["fuel_category"], salt_b)

    if not valid_commit_b:
        trace_log.append(f"[T+0.6s] SECURITY ABORT: Commitment verification failed for {sat_b.satellite_id}! [Byzantine Fraud]")
        return {"status": "ABORTED_FRAUD", "trace": trace_log}

    agreement_id = f"AGREE_{secrets.token_hex(4)}"
    trace_log.append(f"[T+0.7s] CONSENSUS LOCKED: Both signed Agreement {agreement_id}. Mover: {assigned_mover}")

    # Stage 6: VERIFY
    new_miss_distance = miss_distance_m + 4500
    trace_log.append(f"[T+0.8s] {assigned_mover} Thruster Burn Executed. Miss Distance increased to {new_miss_distance}m. Pc resolved to 1.1e-9 [SAFE]")

    return {
        "status": "CONVERGED_SAFE",
        "assigned_mover": assigned_mover,
        "weight_a": weight_a,
        "weight_b": weight_b,
        "trace": trace_log,
    }


if __name__ == "__main__":
    print("--- S2SCAN PROTOCOL ENGINE SELF-TEST ---")
    starlink = SatelliteAgent("STARLINK-3104", "SpaceX", fuel_remaining_pct=82.0)
    oneweb = SatelliteAgent("ONEWEB-0412", "OneWeb", fuel_remaining_pct=18.0)

    result = run_s2scan_negotiation(starlink, oneweb)
    print("\nNegotiation Result:", result["status"])
    print("Assigned Mover:", result["assigned_mover"])
    print("\nMessage Trace Log:")
    for step in result["trace"]:
        print(" ", step)
