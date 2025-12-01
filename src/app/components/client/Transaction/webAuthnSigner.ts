import type { WebAuthNSignature, WebAuthNUser } from '@/app/type/types';
import { findInArray, hex2Uint8Array, typedArrayToArrayBuffer as typedArrayToArrayBuffer } from '@/app/utils/encode';
import {
  CairoCustomEnum,
  Call,
  DeclareSignerDetails,
  DeployAccountSignerDetails,
  InvocationsSignerDetails,
  Signature,
  TypedData,
  uint256,
  V3DeclareSignerDetails,
  V3DeployAccountSignerDetails,
  V3InvocationsSignerDetails,
  typedData as starknetTypedData,
  SignerInterface,
  num,
  stark,
  transaction,
  hash,
  encode,
  CallData,
} from 'starknet';
import { ETransactionVersion3 } from "@starknet-io/types-js";
import { p256 } from "@noble/curves/nist.js";
import { ECDSASigValue } from "@peculiar/asn1-ecc";
import { AsnParser } from "@peculiar/asn1-schema";
import { sha256 } from '@noble/hashes/sha2.js';
import { extractClientDataJsonOutro } from './SendWebAuthNTransaction';


// const requestSignature = async (
// 	attestation: WebauthnAttestation,
// 	challenge: Uint8Array
// ): Promise<AuthenticatorAssertionResponse> => {
// 	const credential = await navigator.credentials.get({
// 		publicKey: {
// 			rpId: attestation.rpId,
// 			challenge,
// 			allowCredentials: [
// 				{
// 					id: attestation.credentialId,
// 					type: 'public-key',
// 					transports: ['internal']
// 				}
// 			],
// 			userVerification: WEBAUTHN_CONFIG.AUTHENTICATOR_SELECTION.userVerification,
// 			timeout: TIMEOUTS.WEBAUTHN_GET
// 		}
// 	});

async function getBrowserSignature(attestation: WebAuthNUser, challenge: Uint8Array<ArrayBuffer>) {
  console.log("challengeBuffer calculation...");
  let idBuffer: Uint8Array<ArrayBuffer>;
  if (typeof attestation.credentialId === 'object' && attestation.credentialId !== null) {
    // persistent context is converting Uint8array to an object.
    // So, it has to be converted.
    idBuffer = Uint8Array.from(Object.values(attestation.credentialId));
  } else {
    // idBuffer = typedArrayToBuffer(attestation.credentialId);
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
  console.log("credential.get=", credentialParameters);

  const credential = await navigator.credentials.get(credentialParameters);
  if (!credential) {
    throw new Error("No credential");
  }

  const assertion = credential as PublicKeyCredential;
  return assertion.response as AuthenticatorAssertionResponse;
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
 * Google authenticator can provide a high-s Secp256r1 (p256) signature, that is rejected by the account.
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

export class WebAuthnSigner implements SignerInterface {
  public attestation: WebAuthNUser;

  constructor(webAuthnAttestation: WebAuthNUser) {
    console.log("signer constructor. attestation=", webAuthnAttestation);
    this.attestation = webAuthnAttestation;
  }

  public async getPubKey(): Promise<string> {
    return num.toHex(this.attestation.pubKey);
  }

  public async signMessage(typedData: TypedData, accountAddress: string): Promise<Signature> {
    const msgHash = starknetTypedData.getMessageHash(typedData, accountAddress);
    return this.signRaw(msgHash);
  }
  public async signTransaction(
    transactions: Call[],
    details: InvocationsSignerDetails
  ): Promise<Signature> {
    const compiledCalldata = transaction.getExecuteCalldata(transactions, details.cairoVersion);
    let msgHash;

    // TODO: How to do generic union discriminator for all like this
    if (Object.values(ETransactionVersion3).includes(details.version as any)) {
      const det = details as V3InvocationsSignerDetails;
      msgHash = hash.calculateInvokeTransactionHash({
        ...det,
        senderAddress: det.walletAddress,
        compiledCalldata,
        version: det.version,
        nonceDataAvailabilityMode: stark.intDAM(det.nonceDataAvailabilityMode),
        feeDataAvailabilityMode: stark.intDAM(det.feeDataAvailabilityMode),
      });
    } else {
      throw Error('unsupported signTransaction version');
    }

    return this.signRaw(msgHash as string);
  }

  public async signDeployAccountTransaction(
    details: DeployAccountSignerDetails
  ): Promise<Signature> {
    const compiledConstructorCalldata = CallData.compile(details.constructorCalldata);
    /*     const version = BigInt(details.version).toString(); */
    let msgHash;

    if (Object.values(ETransactionVersion3).includes(details.version as any)) {
      const det = details as V3DeployAccountSignerDetails;
      msgHash = hash.calculateDeployAccountTransactionHash({
        ...det,
        salt: det.addressSalt,
        compiledConstructorCalldata,
        version: det.version,
        nonceDataAvailabilityMode: stark.intDAM(det.nonceDataAvailabilityMode),
        feeDataAvailabilityMode: stark.intDAM(det.feeDataAvailabilityMode),
      });
    } else {
      throw Error('unsupported signDeployAccountTransaction version');
    }

    return this.signRaw(msgHash as string);
  }

  public async signDeclareTransaction(
    // contractClass: ContractClass,  // Should be used once class hash is present in ContractClass
    details: DeclareSignerDetails
  ): Promise<Signature> {
    let msgHash;

    if (Object.values(ETransactionVersion3).includes(details.version as any)) {
      const det = details as V3DeclareSignerDetails;
      msgHash = hash.calculateDeclareTransactionHash({
        ...det,
        version: det.version,
        nonceDataAvailabilityMode: stark.intDAM(det.nonceDataAvailabilityMode),
        feeDataAvailabilityMode: stark.intDAM(det.feeDataAvailabilityMode),
      });
    } else {
      throw Error('unsupported signDeclareTransaction version');
    }

    return this.signRaw(msgHash as string);
  }

  protected async signRaw(msgHash: string): Promise<Signature> {


    // *** main
    console.log("txHash calculated=", msgHash);
    const challenge = hex2Uint8Array(encode.removeHexPrefix(num.toHex64(msgHash)));
    console.log("Challenge =", challenge);

    // const hex2buf = (hex: string) =>
    //   Uint8Array.from(
    //     hex
    //       .replace(/^0x/, '')
    //       .match(/.{1,2}/g)!
    //       .map((byte) => parseInt(byte, 16))
    //   );
    // const normalizeTransactionHash = (transactionHash: string) =>
    //   transactionHash.replace(/^0x/, '').padStart(64, '0');
    // const challenge2 = hex2buf(normalizeTransactionHash(msgHash));
    // console.log("Challenge2 =", challenge2);


    console.log("this.attestation=", this.attestation);
    const browserSignature = await getBrowserSignature(this.attestation, challenge);
    console.log("Browser signature:", browserSignature, "\n", encode.buf2hex(new Uint8Array(browserSignature.signature)), encode.arrayBufferToString(browserSignature.signature));
    const authenticatorData = new Uint8Array(browserSignature.authenticatorData);
    const clientDataJson = new Uint8Array(browserSignature.clientDataJSON);
    const flags = authenticatorData[32];
    const signCount = Number(BigInt(encode.addHexPrefix(encode.buf2hex(authenticatorData.slice(33, 37)))));
    console.log("clientDataJson", new TextDecoder().decode(clientDataJson));
    console.log("flags", flags);
    console.log("signCount", signCount);
    // const crossOriginText = new TextEncoder().encode('"origin":"');
    // const crossOriginIndex = findInArray(crossOriginText, clientDataJson);
    // let clientDataJsonOutro = clientDataJson.slice(crossOriginIndex + crossOriginText.length);
    // if (clientDataJsonOutro.length == 1) {
    //   clientDataJsonOutro = new Uint8Array();
    // }
    const clientDataJsonOutro = extractClientDataJsonOutro(clientDataJson);
    console.log("clientDataJsonOutro=", clientDataJsonOutro, new TextDecoder().decode(clientDataJsonOutro));
    let { r: rRaw, s: sRaw } = parseASN1Signature(browserSignature.signature);
    const { r, s } = normalizeSecp256r1Signature({ r0: rRaw, s0: sRaw });
    let yParity = getYParity(getMessageHash(authenticatorData, clientDataJson), BigInt(await this.getPubKey()), r, s);
    const signature: WebAuthNSignature = {
      client_data_json_outro: Array.from(clientDataJsonOutro),
      flags,
      sign_count: signCount,
      ec_signature: {
        r: uint256.bnToUint256(r),
        s: uint256.bnToUint256(s),
        y_parity: yParity,
      }
    };
    // "argent::signer::signer_signature::SignerSignature"
    // type wanSignerSignature={

    // };
    //     const signerSignature=new CairoCustomEnum({Webauthn:cairo.tuple(,)})
    enum SignerType {
      Starknet,
      Secp256k1,
      Secp256r1,
      Eip191,
      Webauthn,
    }


    // "argent::signer::signer_signature::Signer"
    function signerTypeToCustomEnum(signerType: SignerType, value: any): CairoCustomEnum {
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

    const signer = {
      origin: this.attestation.origin,
      rp_id_hash: uint256.bnToUint256(this.attestation.rp_id_hash),
      pubkey: uint256.bnToUint256(this.attestation.pubKey),
    }
    console.log("signer=", signer);

    console.log("WebauthnOwner signed, signature is:", signature);
    const finalSignature = CallData.compile([[
      signerTypeToCustomEnum(SignerType.Webauthn, { signer, signature }),
    ]]);
    console.log({ finalSignature });
    return finalSignature;
  }
}


