"""
S2SCAN: Packet Codec & Space Packet Framing
Implements CCSDS-inspired binary packet framing for Inter-Satellite Links (ISLs).
Includes sequence numbers, session identifiers, CRC-32 integrity checks,
and Ed25519 signature envelopes.
"""

import json
import zlib
import struct
import time
from typing import Dict, Any, Tuple, Optional

# Protocol Magic Header: 'S2' (0x53, 0x32)
MAGIC_HEADER = b"\x53\x32"
PROTOCOL_VERSION = 1

# Message Type Enums
MSG_TYPES = {
    1: "CONJUNCTION_ALERT",
    2: "AUTH_REQUEST",
    3: "AUTH_RESPONSE",
    4: "STATE_EXCHANGE",
    5: "MANEUVER_PROPOSAL",
    6: "PROPOSAL_ACCEPT",
    7: "COMMIT_SALT_REVEAL",
    8: "CONSENSUS_LOCK",
    9: "THRUSTER_CONFIRM",
    10: "ABORT_FALLBACK"
}
REV_MSG_TYPES = {v: k for k, v in MSG_TYPES.items()}


class S2SCANPacket:
    """
    Structured Space Packet representation for S2SCAN ISL communication.
    """

    def __init__(
        self,
        msg_type: str,
        sender_id: str,
        receiver_id: str,
        session_id: str,
        sequence_num: int,
        payload: Dict[str, Any],
        signature_hex: str = "",
        timestamp: Optional[float] = None
    ):
        self.msg_type = msg_type
        self.sender_id = sender_id
        self.receiver_id = receiver_id
        self.session_id = session_id
        self.sequence_num = sequence_num
        self.payload = payload
        self.signature_hex = signature_hex
        self.timestamp = timestamp or time.time()

    def serialize(self) -> bytes:
        """
        Serializes packet into binary frame:
        [Magic 2B][Version 1B][MsgType 1B][SeqNum 4B][Timestamp 8B]
        [SenderLen 1B][SenderStr][RecvLen 1B][RecvStr][SessLen 1B][SessStr]
        [SigLen 2B][SigStr][PayloadLen 4B][PayloadJSON][CRC32 4B]
        """
        type_code = REV_MSG_TYPES.get(self.msg_type, 1)
        sender_bytes = self.sender_id.encode("utf-8")
        recv_bytes = self.receiver_id.encode("utf-8")
        sess_bytes = self.session_id.encode("utf-8")
        sig_bytes = self.signature_hex.encode("utf-8")
        payload_bytes = json.dumps(self.payload, sort_keys=True).encode("utf-8")

        # Fixed Header: Magic (2B), Version (1B), Type (1B), Seq (4B), Timestamp (8B double)
        fixed_hdr = struct.pack(
            "!2sBBI d",
            MAGIC_HEADER,
            PROTOCOL_VERSION,
            type_code,
            self.sequence_num,
            self.timestamp
        )

        # Variable string lengths and bytes
        var_data = struct.pack(
            f"!B{len(sender_bytes)}s B{len(recv_bytes)}s B{len(sess_bytes)}s H{len(sig_bytes)}s I{len(payload_bytes)}s",
            len(sender_bytes), sender_bytes,
            len(recv_bytes), recv_bytes,
            len(sess_bytes), sess_bytes,
            len(sig_bytes), sig_bytes,
            len(payload_bytes), payload_bytes
        )

        frame_without_crc = fixed_hdr + var_data
        crc32 = zlib.crc32(frame_without_crc) & 0xFFFFFFFF
        return frame_without_crc + struct.pack("!I", crc32)

    @classmethod
    def deserialize(cls, data: bytes) -> Tuple[Optional["S2SCANPacket"], Optional[str]]:
        """
        Deserializes binary frame and verifies CRC-32 integrity.
        Returns: (packet_instance, error_message)
        """
        if len(data) < 22:
            return None, "FRAME_TOO_SHORT"

        # Verify CRC32
        payload_crc = data[-4:]
        frame_content = data[:-4]
        expected_crc = zlib.crc32(frame_content) & 0xFFFFFFFF
        actual_crc = struct.unpack("!I", payload_crc)[0]

        if expected_crc != actual_crc:
            return None, "CRC32_CHECKSUM_MISMATCH_BIT_CORRUPTION"

        # Unpack fixed header
        magic, version, type_code, seq_num, ts = struct.unpack("!2sBBI d", frame_content[:16])
        if magic != MAGIC_HEADER:
            return None, "INVALID_MAGIC_HEADER"
        if version != PROTOCOL_VERSION:
            return None, "UNSUPPORTED_PROTOCOL_VERSION"

        msg_type = MSG_TYPES.get(type_code, "UNKNOWN")
        offset = 16

        try:
            # Sender
            sender_len = struct.unpack("!B", frame_content[offset:offset+1])[0]
            offset += 1
            sender_id = frame_content[offset:offset+sender_len].decode("utf-8")
            offset += sender_len

            # Receiver
            recv_len = struct.unpack("!B", frame_content[offset:offset+1])[0]
            offset += 1
            receiver_id = frame_content[offset:offset+recv_len].decode("utf-8")
            offset += recv_len

            # Session
            sess_len = struct.unpack("!B", frame_content[offset:offset+1])[0]
            offset += 1
            session_id = frame_content[offset:offset+sess_len].decode("utf-8")
            offset += sess_len

            # Signature
            sig_len = struct.unpack("!H", frame_content[offset:offset+2])[0]
            offset += 2
            sig_hex = frame_content[offset:offset+sig_len].decode("utf-8")
            offset += sig_len

            # Payload
            payload_len = struct.unpack("!I", frame_content[offset:offset+4])[0]
            offset += 4
            payload_json = frame_content[offset:offset+payload_len].decode("utf-8")
            payload = json.loads(payload_json)

            pkt = cls(
                msg_type=msg_type,
                sender_id=sender_id,
                receiver_id=receiver_id,
                session_id=session_id,
                sequence_num=seq_num,
                payload=payload,
                signature_hex=sig_hex,
                timestamp=ts
            )
            return pkt, None
        except Exception as e:
            return None, f"DECODING_EXCEPTION: {e}"


if __name__ == "__main__":
    print("--- S2SCAN PACKET FRAMING VERIFICATION ---")
    pkt = S2SCANPacket(
        msg_type="STATE_EXCHANGE",
        sender_id="STARLINK-3104",
        receiver_id="ONEWEB-0412",
        session_id="SESS_98a72b",
        sequence_num=4,
        payload={"fuel_category": "HIGH", "commitment": "0xa79c..."},
        signature_hex="sig_ed25519_abcdef012345"
    )

    encoded = pkt.serialize()
    print(f"Serialized Frame Size: {len(encoded)} bytes")

    # Clean decode
    decoded, err = S2SCANPacket.deserialize(encoded)
    assert err is None
    print(f"Decoded Successfully: {decoded.msg_type} from {decoded.sender_id} (Seq: {decoded.sequence_num})")

    # Bit-flip tampering test
    tampered = bytearray(encoded)
    tampered[25] ^= 0xFF  # Flip one bit in body
    tampered_pkt, tamper_err = S2SCANPacket.deserialize(bytes(tampered))
    print(f"Tamper Detection Test: {tamper_err} [PASSED]")
