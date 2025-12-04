import { encode } from "starknet";

export function extractPubKey(fullPubKey:ArrayBuffer):string {
 let pubKeyX: string; // u256
    const fullPublicK = new Uint8Array(fullPubKey);
    switch (true) {
      case fullPublicK.length == 32:
        pubKeyX = encode.addHexPrefix(encode.buf2hex(fullPublicK));
        break;
      case fullPublicK.length == 65 && fullPublicK[0] === 0x04:
        // Uncompressed format (0x04 + X + Y) - extract X only
        pubKeyX = encode.addHexPrefix(encode.buf2hex(fullPublicK.slice(1, 33))); // Skip 0x04, take X (32 bytes)
        break;
      case fullPublicK.length > 65:
        // SPKI format: find the 0x04 marker and extract X
        const idx = fullPublicK.findIndex((byte) => byte === 0x04);
        if (idx !== -1 && idx + 65 <= fullPublicK.length) {
          const uncompressedKey = fullPublicK.slice(idx, idx + 65);
          pubKeyX = encode.addHexPrefix(encode.buf2hex(uncompressedKey.slice(1, 33))); // Extract X only
        } else {
          throw new Error(`Unable to parse SPKI public key. Length: ${fullPublicK.length}`);
        }
        break;
      case fullPublicK.length === 91:
        // COSE format: extract X-coordinate using simple slice approach
        // This is a simplified approach - in practice you might need proper COSE parsing
        pubKeyX = encode.addHexPrefix(encode.buf2hex(fullPublicK.slice(-64, -32))); // Extract X-coordinate
        break;
      default:
        throw new Error(
          `Invalid public key length: expected 32, 65, 91, or >65 bytes, got ${fullPublicK.length}`
        );
    }
    return pubKeyX;
}