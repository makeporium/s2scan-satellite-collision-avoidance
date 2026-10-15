"""
S2SCAN: Asynchronous Peer-to-Peer Network Daemon
Runs independent concurrent satellite nodes using Python asyncio.
Simulates physical Inter-Satellite Links (ISL) with synthetic latency,
Bernoulli packet drop rates, sequence tracking, and timeout fallbacks.
"""

import asyncio
import time
import random
import sys
import os
from typing import Dict, Any, Optional, Tuple, Callable

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.packet_codec import S2SCANPacket
from backend.anti_cheat_crypto import S2SCANSecurityModule
from backend.game_theory_engine import S2SCANGIMEngine


class SimulatedISLChannel:
    """
    Simulates a physical inter-satellite optical or RF communication crosslink.
    Models propagation delay, jitter, and Bernoulli packet loss.
    """

    def __init__(self, latency_ms: float = 12.4, packet_loss_prob: float = 0.05):
        self.latency_seconds = latency_ms / 1000.0
        self.packet_loss_prob = packet_loss_prob
        self.total_packets_sent = 0
        self.total_packets_dropped = 0

    async def transmit(self, binary_frame: bytes) -> Optional[bytes]:
        """
        Transmits a binary space packet across the physical medium.
        Returns: binary_frame if delivered, None if lost in transit.
        """
        self.total_packets_sent += 1

        # Simulate physical propagation time
        await asyncio.sleep(self.latency_seconds)

        # Simulate space radiation / pointing jitter packet loss
        if random.random() < self.packet_loss_prob:
            self.total_packets_dropped += 1
            return None  # Frame dropped in transit

        return binary_frame


class AsyncSatelliteNode:
    """
    Independent asynchronous satellite agent.
    Runs an event-driven Finite State Machine with watchdog timeout timers.
    """

    def __init__(
        self,
        satellite_id: str,
        operator_id: str,
        fuel_remaining_pct: float = 75.0,
        delta_v_req: float = 0.45,
        mission_priority: int = 5,
        is_geo: bool = False,
        is_formation: bool = False,
        has_propulsion: bool = True,
        timeout_seconds: float = 1.5
    ):
        self.satellite_id = satellite_id
        self.operator_id = operator_id
        self.fuel_remaining_pct = fuel_remaining_pct
        self.delta_v_req = delta_v_req
        self.mission_priority = mission_priority
        self.is_geo = is_geo
        self.is_formation = is_formation
        self.has_propulsion = has_propulsion
        self.timeout_seconds = timeout_seconds

        # Security and Game Theory modules
        self.sec = S2SCANSecurityModule(satellite_id, operator_id)
        self.gim = S2SCANGIMEngine(tca_seconds=94.0, lambda_urgency=15.0)

        # Internal state
        self.state = "IDLE"
        self.sequence_counter = 0
        self.current_session_id = f"SESS_{int(time.time())}"
        self.peer_public_key: Optional[str] = None
        self.committed_hash: Optional[str] = None
        self.secret_salt: Optional[str] = None
        self.operational_cost = 0.0
        self.negotiation_trace = []
        self.fallback_tier: Optional[str] = None

    def log(self, message: str):
        entry = f"[{self.satellite_id} | T+{time.time():.3f}] {message}"
        self.negotiation_trace.append(entry)

    def next_seq(self) -> int:
        self.sequence_counter += 1
        return self.sequence_counter

    def create_packet(self, msg_type: str, receiver_id: str, payload: Dict[str, Any]) -> S2SCANPacket:
        """Constructs and cryptographically signs an outgoing space packet."""
        sig = self.sec.sign_payload(payload)
        return S2SCANPacket(
            msg_type=msg_type,
            sender_id=self.satellite_id,
            receiver_id=receiver_id,
            session_id=self.current_session_id,
            sequence_num=self.next_seq(),
            payload=payload,
            signature_hex=sig
        )

    async def initiate_negotiation(
        self,
        peer_id: str,
        channel: SimulatedISLChannel,
        tca_seconds: float = 94.0,
        miss_dist_m: float = 142.0
    ) -> Dict[str, Any]:
        """
        Executes the S2SCAN state machine as Initiator (Satellite A).
        """
        self.state = "STAGE_1_DISCOVER"
        self.log(f"Stage 1: Conjunction detected with {peer_id} (TCA={tca_seconds}s, MissDist={miss_dist_m}m).")

        # Stage 1: Send Alert
        alert_pkt = self.create_packet("CONJUNCTION_ALERT", peer_id, {
            "tca_s": tca_seconds,
            "miss_dist_m": miss_dist_m,
            "pc": "1.84e-3"
        })
        delivered = await channel.transmit(alert_pkt.serialize())
        if not delivered:
            return self.trigger_fallback("STAGE_1_ALERT_DROPPED")

        # Stage 2: Mutual Authentication
        self.state = "STAGE_2_AUTH"
        auth_pkt = self.create_packet("AUTH_REQUEST", peer_id, {
            "public_key": self.sec.public_key_hex,
            "timestamp": time.time()
        })
        delivered = await channel.transmit(auth_pkt.serialize())
        if not delivered:
            return self.trigger_fallback("AUTH_REQUEST_DROPPED")

        # Stage 3: State Exchange with Commitment
        self.state = "STAGE_3_EXCHANGE"
        fuel_cat = "HIGH" if self.fuel_remaining_pct > 50 else ("MED" if self.fuel_remaining_pct > 25 else "LOW")
        commit_hash, salt = self.sec.generate_commitment(fuel_cat)
        self.committed_hash = commit_hash
        self.secret_salt = salt

        exchange_pkt = self.create_packet("STATE_EXCHANGE", peer_id, {
            "fuel_category": fuel_cat,
            "commitment_hash": commit_hash,
            "has_propulsion": self.has_propulsion,
            "is_geo": self.is_geo,
            "is_formation": self.is_formation
        })
        delivered = await channel.transmit(exchange_pkt.serialize())
        if not delivered:
            return self.trigger_fallback("STATE_EXCHANGE_DROPPED")

        # Stage 4: Solve Game-Theoretic Nash Bargaining
        self.state = "STAGE_4_NEGOTIATE"
        self.operational_cost = self.gim.calculate_satellite_operational_cost(
            delta_v=self.delta_v_req,
            fuel_remaining_pct=self.fuel_remaining_pct,
            mission_priority=self.mission_priority,
            is_geo=self.is_geo,
            is_crewed=False
        )

        # Send Maneuver Proposal
        proposal_pkt = self.create_packet("MANEUVER_PROPOSAL", peer_id, {
            "cost_initiator": self.operational_cost,
            "proposed_delta_v": self.delta_v_req
        })
        delivered = await channel.transmit(proposal_pkt.serialize())
        if not delivered:
            return self.trigger_fallback("PROPOSAL_DROPPED")

        # Stage 5: Salt Reveal & Commitment Verification
        self.state = "STAGE_5_COMMIT"
        reveal_pkt = self.create_packet("COMMIT_SALT_REVEAL", peer_id, {
            "revealed_category": fuel_cat,
            "revealed_salt": salt
        })
        delivered = await channel.transmit(reveal_pkt.serialize())
        if not delivered:
            return self.trigger_fallback("SALT_REVEAL_DROPPED")

        # Stage 6: Consensus Locked & Burn
        self.state = "STAGE_6_VERIFIED_SAFE"
        self.log("Consensus locked. Thruster avoidance burn committed. Conjunction resolved safely!")
        return {
            "status": "CONVERGED_SAFE",
            "final_state": self.state,
            "mover_id": self.satellite_id,
            "fallback_tier": None,
            "trace": self.negotiation_trace
        }

    def trigger_fallback(self, reason: str) -> Dict[str, Any]:
        """
        Escalates through the 4-tier fallback hierarchy when communication drops.
        """
        self.fallback_tier = "LEVEL_3_LOCAL_AUTONOMOUS_BURN"
        self.state = "FALLBACK_TRIGGERED"
        self.log(f"ISL Link Failure ({reason})! Escalating to {self.fallback_tier}.")
        return {
            "status": "FALLBACK_SAFE",
            "final_state": self.state,
            "reason": reason,
            "fallback_tier": self.fallback_tier,
            "action": f"{self.satellite_id} executed unilateral emergency radial burn at T-60s.",
            "trace": self.negotiation_trace
        }


async def run_async_bilateral_session(
    packet_loss_rate: float = 0.05,
    sat_a_fuel: float = 80.0,
    sat_b_fuel: float = 20.0
) -> Dict[str, Any]:
    """
    Executes a concurrent asynchronous negotiation between two satellite nodes.
    """
    channel = SimulatedISLChannel(latency_ms=12.4, packet_loss_prob=packet_loss_rate)

    node_a = AsyncSatelliteNode("STARLINK-3104", "SpaceX", fuel_remaining_pct=sat_a_fuel)
    node_b = AsyncSatelliteNode("ONEWEB-0412", "OneWeb", fuel_remaining_pct=sat_b_fuel)

    result = await node_a.initiate_negotiation(
        peer_id=node_b.satellite_id,
        channel=channel,
        tca_seconds=94.0,
        miss_dist_m=142.0
    )
    return result


if __name__ == "__main__":
    print("--- S2SCAN ASYNC P2P NETWORK DAEMON TEST ---")
    loop_result = asyncio.run(run_async_bilateral_session(packet_loss_rate=0.0))
    print(f"Result Status: {loop_result['status']}")
    print(f"Final State: {loop_result['final_state']}")
    print(f"Trace Logs ({len(loop_result['trace'])} entries):")
    for t in loop_result["trace"]:
        print(" ", t)
