import { SignerType, WebAuthNUser } from "@/app/type/types";
import { findInUint8Array } from "@/app/utils/encode";
import { p256 } from "@noble/curves/nist.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { ECDSASigValue } from "@peculiar/asn1-ecc";
import { AsnParser } from "@peculiar/asn1-schema";
import { CairoCustomEnum, constants, encode, num, type BigNumberish } from "starknet";

/**
 * Ask to the user to sign the hash of the transaction
 * @param attestation 
 * @param challenge 
 * @returns 
 */
export async function getTransactionSignature(attestation: WebAuthNUser, challenge: Uint8Array<ArrayBuffer>) {
  console.log("challengeBuffer calculation...");
  let idBuffer: Uint8Array<ArrayBuffer>;
  if (typeof attestation.credentialId === 'object' && attestation.credentialId !== null) {
    // persistent context is converting Uint8array to an object.
    // So, it has to be converted back.
    idBuffer = Uint8Array.from(Object.values(attestation.credentialId));
  } else {
    idBuffer = attestation.credentialId;
  }
  const credentialParameters: CredentialRequestOptions = {
    publicKey: {
      rpId: attestation.rpId,
      challenge: challenge,
      allowCredentials: [{
        id: idBuffer,
        type: "public-key",
        transports: ["internal"]
      }],
      userVerification: 'required',
      timeout: 300000,
    },
  };
  console.log("credential.get =", credentialParameters);
  const credential = await navigator.credentials.get(credentialParameters);
  if (!credential) {
    throw new Error("No credential");
  }
  const assertion = credential as PublicKeyCredential;
  console.log("assertion=",assertion);
  console.log("assertion.response=",assertion.response as AuthenticatorAssertionResponse);
  return assertion.response as AuthenticatorAssertionResponse;
}

/**
 * Extract the end of ClientDataJson 
 * @param clientDataJson - Json from the credential.get  
 * Example :  
 * // {"type":"webauthn.get","challenge":"AUBfrBApoxcuxJatuD821SzIW75QQOrydQq7PoNaHes","origin":"http://localhost:5173","crossOrigin":false,"other_keys_can_be_added_here":"do not compare clientDataJSON against a template. See https://goo.gl/yabPex"}

 * @returns the end of the input. From previous example, response is : ,"crossOrigin":false,"other_keys_can_be_added_here":"do not compare clientDataJSON against a template. See https://goo.gl/yabPex"
 */
export function extractClientDataJsonOutro(clientDataJson: Uint8Array): Uint8Array {
  const originKey = new TextEncoder().encode('"origin":"');
  const keyIndex = findInUint8Array(originKey, clientDataJson);
  if (keyIndex === -1) {
    return new Uint8Array();
  }
  const valueStart = keyIndex + originKey.length;
  console.log("extract Json-valueStart =", valueStart);
  // scan forward to the next '"' marking the end of the origin value
  let i = valueStart;
  while (i < clientDataJson.length && clientDataJson[i] !== 0x22 /* '"' */) {
    i++;
  }
  if (i >= clientDataJson.length) {
    return new Uint8Array();
  }
  console.log("extract Json-i=", i);
  const outro = clientDataJson.slice(i + 1);
  console.log("outro=", new TextDecoder().decode(outro));
  // If outro is just '}', treat as empty per spec
  if (outro.length === 1 && outro[0] === 0x7d /* '}' */) {
    return new Uint8Array();
  }
  return outro;
}


/**
 * In WebAuthn, EC2 signatures are wrapped in ASN.1 structure so we need to peel r and s apart.
 *
 * See https://www.w3.org/TR/webauthn-2/#sctn-signature-attestation-types
 */
export function parseASN1Signature(asn1Signature: BufferSource): { r: bigint; s: bigint } {
  const signature = AsnParser.parse(asn1Signature, ECDSASigValue);
  console.log("parseASN1Signature", signature);
  let r = new Uint8Array(signature.r);
  let s = new Uint8Array(signature.s);
  const shouldRemoveLeadingZero = (bytes: Uint8Array): boolean => bytes[0] === 0x0 && (bytes[1] & (1 << 7)) !== 0;
  if (shouldRemoveLeadingZero(r)) {
    r = r.slice(1);
  }
  if (shouldRemoveLeadingZero(s)) {
    s = s.slice(1);
  }
  return { r: BigInt(encode.addHexPrefix(encode.buf2hex(r))), s: BigInt(encode.addHexPrefix(encode.buf2hex(s))) };
};

/**
 * Google authenticator can provide a high-s Secp256r1 (p256) signature, that is rejected by the Starknet account.
 * This function normalizes the s value to be in the lower half of the curve order.
 * @param { r0, s0 } - non normalized signature (without parity)
 * @returns normalized signature (without parity)
 */
export function normalizeSecp256r1Signature({ r0, s0 }: { r0: bigint, s0: bigint }): { r: bigint, s: bigint } {
  const p256N = BigInt('0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551');
  const halfOrder = p256N / 2n;
  const normalizedS = s0 > halfOrder ? p256N - s0 : s0;
  const normalizedSig = { r: r0, s: normalizedS };
  return normalizedSig;
}

export function getMessageHash(authenticatorData: Uint8Array, clientDataJson: Uint8Array): Uint8Array {
  const clientDataHash = sha256(clientDataJson);
  const message = encode.concatenateArrayBuffer([authenticatorData, clientDataHash]);
  return sha256(message);
};

/**
 * Get the parity of a signature
 * @param messageHash 
 * @param pubkey 
 * @param r 
 * @param s 
 * @returns true if Odd
 */
export function getYParity(messageHash: Uint8Array, pubkey: bigint, r: bigint, s: bigint): boolean {
  console.log("pubKey for y_parity=", num.toHex(pubkey));
  const signature = new p256.Signature(r, s);
  const recoveredEven = signature.addRecoveryBit(0).recoverPublicKey(messageHash);
  console.log("recoveredEven=", num.toHex(recoveredEven.x));
  if (pubkey === recoveredEven.x) {
    return false;
  }
  const recoveredOdd = signature.addRecoveryBit(1).recoverPublicKey(messageHash);
  console.log("recoveredOdd=", num.toHex(recoveredOdd.x));

  if (pubkey === recoveredOdd.x) {
    return true;
  }
  throw new Error("Could not determine y_parity");
};

// Cairo type : "argent::signer::signer_signature::Signer"
export function signerTypeToCustomEnum(signerType: SignerType, value: any): CairoCustomEnum {
  const contents = {
    Starknet: undefined,
    Secp256k1: undefined,
    Secp256r1: undefined,
    Eip191: undefined,
    Webauthn: undefined,
  };
  if (signerType === SignerType.Starknet) {
    contents.Starknet = value;
  } else if (signerType === SignerType.Secp256k1) {
    contents.Secp256k1 = value;
  } else if (signerType === SignerType.Secp256r1) {
    contents.Secp256r1 = value;
  } else if (signerType === SignerType.Eip191) {
    contents.Eip191 = value;
  } else if (signerType === SignerType.Webauthn) {
    contents.Webauthn = value;
  } else {
    throw new Error(`Unknown SignerType`);
  }
  return new CairoCustomEnum(contents);
}

/**
 * max salt is smaller than uint256. So, upper bits are removed
 * @param pubK 
 * @returns 
 */
export function calculateSalt(pubK: BigNumberish): bigint {
  return BigInt(pubK) & constants.MASK_250
}

