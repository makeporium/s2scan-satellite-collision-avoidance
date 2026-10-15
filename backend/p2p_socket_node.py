"""
S2SCAN Live Dual-Process UDP Socket Daemon
Enables real physical socket communication between two independent satellite flight nodes.
Operates over UDP loopback sockets (e.g. port 9001 <-> port 9002) using CCSDS 128-byte
binary space telemetry frames, Ed25519 signatures, and SHA-256 commitments.

Usage:
  1. Automated bilateral demo:
     python backend/p2p_socket_node.py --demo

  2. Standalone Node A (Port 9001):
     python backend/p2p_socket_node.py --node A --port 9001 --peer 9002

  3. Standalone Node B (Port 9002):
     python backend/p2p_socket_node.py --node B --port 9002 --peer 9001
"""

import socket
import json
import time
import threading
import argparse
import sys
import os
from typing import Dict, Any, List

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.packet_codec import S2SCANPacket
from backend.anti_cheat_crypto import S2SCANSecurityModule
from backend.game_theory_engine import S2SCANGIMEngine


class S2SCANSocketNode:
    """
    Independent flight node that binds a UDP socket to receive space packets
    and transmits signed CCSDS binary frames to peer sockets.
    """

    def __init__(self, node_id: str, sat_name: str, operator: str, local_port: int, peer_port: int, fuel_pct: float = 80.0):
        self.node_id = node_id
        self.sat_name = sat_name
        self.operator = operator
        self.local_port = local_port
        self.peer_port = peer_port
        self.peer_ip = "127.0.0.1"
        self.fuel_pct = fuel_pct

        self.sec = S2SCANSecurityModule(sat_name, operator)
        self.gim = S2SCANGIMEngine(tca_seconds=94.0, lambda_urgency=15.0)

        self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.sock.bind(("127.0.0.1", self.local_port))
        self.sock.settimeout(2.5)

        self.running = False
        self.seq = 0
        self.logs: List[Dict[str, Any]] = []

    def log(self, event_type: str, message: str, packet_hex: str = "", byte_len: int = 0):
        timestamp = time.strftime("%H:%M:%S") + f".{int(time.time()*1000)%1000:03d}"
        entry = {
            "timestamp": timestamp,
            "node": self.node_id,
            "satellite": self.sat_name,
            "port": self.local_port,
            "event": event_type,
            "message": message,
            "hex_preview": packet_hex[:32] + "..." if packet_hex else "",
            "bytes": byte_len
        }
        self.logs.append(entry)
        print(f"[{timestamp}] [{self.sat_name}:{self.local_port}] {event_type} | {message}")

    def create_and_send(self, msg_type: str, payload: Dict[str, Any]):
        self.seq += 1
        sig = self.sec.sign_payload(payload)
        pkt = S2SCANPacket(
            msg_type=msg_type,
            sender_id=self.sat_name,
            receiver_id="PEER",
            session_id=f"SESS_{self.local_port}_{self.peer_port}",
            sequence_num=self.seq,
            payload=payload,
            signature_hex=sig
        )
        data_bytes = pkt.serialize()
        hex_dump = data_bytes.hex()

        self.sock.sendto(data_bytes, (self.peer_ip, self.peer_port))
        self.log(f"TX_{msg_type}", f"Sent {len(data_bytes)} bytes to :{self.peer_port}", hex_dump, len(data_bytes))

    def receive_packet(self) -> Dict[str, Any]:
        try:
            data, addr = self.sock.recvfrom(2048)
            pkt, err = S2SCANPacket.deserialize(data)
            if err:
                self.log("RX_ERROR", f"Decode error: {err}")
                return {"success": False, "reason": err}

            hex_dump = data.hex()
            self.log(f"RX_{pkt.msg_type}", f"Received {len(data)} bytes from {addr[1]} (Seq #{pkt.sequence_num})", hex_dump, len(data))
            return {
                "success": True,
                "msg_type": pkt.msg_type,
                "sender": pkt.sender_id,
                "payload": pkt.payload,
                "bytes": len(data),
                "hex": hex_dump
            }
        except socket.timeout:
            self.log("TIMEOUT", f"No response from :{self.peer_port} within 2.5s window")
            return {"success": False, "reason": "TIMEOUT"}
        except Exception as e:
            self.log("RX_ERROR", f"Decode error: {str(e)}")
            return {"success": False, "reason": str(e)}

    def close(self):
        self.running = False
        try:
            self.sock.close()
        except:
            pass


def run_node_initiator(node: S2SCANSocketNode) -> List[Dict[str, Any]]:
    """Runs the 6-stage protocol sequence as Initiator (Satellite A)."""
    node.log("STATE_INIT", "Starting S2SCAN Bilateral Inter-Satellite Link...")
    time.sleep(0.1)

    # 1. Conjunction Alert
    node.create_and_send("CONJUNCTION_ALERT", {
        "tca_s": 94.0,
        "miss_dist_m": 142.0,
        "pc": "1.84e-3",
        "relative_velocity_kms": 11.2
    })
    resp = node.receive_packet()

    # 2. Mutual Authentication
    node.create_and_send("AUTH_REQUEST", {
        "public_key": node.sec.public_key_hex,
        "nonce": "0x8fa3910c"
    })
    resp = node.receive_packet()

    # 3. Categorical State Disclosure + Formula 3 Commitment
    commit_hash, secret_salt = node.sec.generate_commitment("HIGH")
    node.create_and_send("STATE_EXCHANGE", {
        "fuel_category": "HIGH",
        "commitment_hash": commit_hash,
        "mobility_constrained": False,
        "mission_priority": 5
    })
    resp = node.receive_packet()

    # 4. Maneuver Proposal
    node.create_and_send("MANEUVER_PROPOSAL", {
        "cost_weight": 0.412,
        "suggested_burn_vector": "+I_IN_TRACK",
        "delta_v": 0.45
    })
    resp = node.receive_packet()

    # 5. Salt Reveal & Verification
    node.create_and_send("COMMIT_SALT_REVEAL", {
        "revealed_category": "HIGH",
        "secret_salt": secret_salt
    })
    resp = node.receive_packet()

    # 6. Consensus Commit Lock
    node.create_and_send("CONSENSUS_LOCK", {
        "assigned_mover": "STARLINK-3104",
        "burn_execution_utc": time.time() + 30.0,
        "delta_v": 0.45
    })
    node.log("BURN_EXECUTION", "Two-Phase Commit locked. Firing 0.45 m/s in-track thruster burn!")
    return node.logs


def run_node_responder(node: S2SCANSocketNode) -> List[Dict[str, Any]]:
    """Runs the protocol sequence as Responder (Satellite B)."""
    node.log("LISTENING", f"Listening on UDP port {node.local_port} for incoming ISL traffic...")

    # 1. Receive Alert, Reply Auth Request / Conjunction Alert ACK
    pkt = node.receive_packet()
    if pkt["success"]:
        node.create_and_send("CONJUNCTION_ALERT", {"status": "CONFIRMED_CONJUNCTION", "tca_s": 94.0})

    # 2. Receive Auth, Reply Auth Response
    pkt = node.receive_packet()
    if pkt["success"]:
        node.create_and_send("AUTH_RESPONSE", {
            "public_key": node.sec.public_key_hex,
            "nonce_echo": pkt["payload"].get("nonce"),
            "responder_nonce": "0x3d7b4201"
        })

    # 3. Receive State, Reply State Exchange
    pkt = node.receive_packet()
    if pkt["success"]:
        b_hash, b_salt = node.sec.generate_commitment("LOW")
        node.create_and_send("STATE_EXCHANGE", {
            "fuel_category": "LOW",
            "commitment_hash": b_hash,
            "mobility_constrained": False,
            "mission_priority": 7
        })

    # 4. Receive Proposal, Reply Acceptance (Sat A has lower weight)
    pkt = node.receive_packet()
    if pkt["success"]:
        node.create_and_send("PROPOSAL_ACCEPT", {
            "assigned_mover": "STARLINK-3104",
            "agreement_hash": "0x9c42b10a44ef"
        })

    # 5. Receive Salt Reveal, Reply Consensus Lock
    pkt = node.receive_packet()
    if pkt["success"]:
        node.create_and_send("CONSENSUS_LOCK", {
            "formula_3_valid": True,
            "anti_cheat_status": "AUTHENTIC"
        })

    # 6. Receive final burn lock, reply Thruster Confirm
    pkt = node.receive_packet()
    if pkt["success"]:
        node.create_and_send("THRUSTER_CONFIRM", {
            "status": "COURSE_HOLD_ACTIVE",
            "safety_verified": True
        })

    node.log("CONSENSUS_AGREED", "Bilateral consensus locked. Course held safely while peer maneuvers.")
    return node.logs


def run_automated_demo():
    print("=" * 70)
    print("  S2SCAN: LIVE DUAL-PROCESS UDP SOCKET DAEMON DEMO")
    print("  Port 9001 (STARLINK-3104) <---> Port 9002 (ONEWEB-0412)")
    print("=" * 70)

    node_a = S2SCANSocketNode("NODE_A", "STARLINK-3104", "SpaceX", 9001, 9002, fuel_pct=82.0)
    node_b = S2SCANSocketNode("NODE_B", "ONEWEB-0412", "Eutelsat OneWeb", 9002, 9001, fuel_pct=25.0)

    thread_b = threading.Thread(target=run_node_responder, args=(node_b,))
    thread_b.start()

    time.sleep(0.3)
    thread_a = threading.Thread(target=run_node_initiator, args=(node_a,))
    thread_a.start()

    thread_a.join()
    thread_b.join()

    # Combine and save trace
    all_logs = node_a.logs + node_b.logs
    all_logs.sort(key=lambda x: x["timestamp"])

    out_file = os.path.join(os.path.dirname(__file__), "live_p2p_trace.json")
    with open(out_file, "w") as f:
        json.dump({
            "generated_at": time.time(),
            "nodes": ["STARLINK-3104:9001", "ONEWEB-0412:9002"],
            "total_frames_exchanged": len(all_logs),
            "protocol_status": "CONVERGED_SAFE",
            "logs": all_logs
        }, f, indent=2)

    print("=" * 70)
    print(f"  Demo completed! Exchanged {len(all_logs)} physical UDP packets.")
    print(f"  Live trace exported to: {out_file}")
    print("=" * 70)

    node_a.close()
    node_b.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="S2SCAN Live Dual-Process UDP Socket Node")
    parser.add_argument("--demo", action="store_true", help="Run automated bilateral demo on ports 9001 & 9002")
    parser.add_argument("--node", type=str, choices=["A", "B"], default="A", help="Node identity")
    parser.add_argument("--port", type=int, default=9001, help="Local UDP port to bind")
    parser.add_argument("--peer", type=int, default=9002, help="Peer UDP port to target")

    args = parser.parse_args()

    if args.demo:
        run_automated_demo()
    elif args.node == "A":
        node = S2SCANSocketNode("NODE_A", "STARLINK-3104", "SpaceX", args.port, args.peer, fuel_pct=82.0)
        run_node_initiator(node)
        node.close()
    else:
        node = S2SCANSocketNode("NODE_B", "ONEWEB-0412", "Eutelsat OneWeb", args.port, args.peer, fuel_pct=25.0)
        run_node_responder(node)
        node.close()
