import type { WebAuthNSignature, WebAuthNUser } from '@/type/types';
import { findInArray, hex2Buf } from '@/utils/encode';
import {
  cairo,
  CairoCustomEnum,
  Call,
  DeclareSignerDetails,
  DeployAccountSignerDetails,
  InvocationsSignerDetails,
  Signature,
  TypedData,
  uint256,
  V2DeclareSignerDetails,
  V2DeployAccountSignerDetails,
  V2InvocationsSignerDetails,
  V3DeclareSignerDetails,
  V3DeployAccountSignerDetails,
  V3InvocationsSignerDetails,
} from 'starknet';
import { ETransactionVersion2, ETransactionVersion3 } from 'starknet';
import { CallData } from 'starknet';
import { ec } from 'starknet';
import { encode } from 'starknet';
import {
  hash
} from 'starknet';
import { num } from 'starknet';
import { stark } from 'starknet';
import { transaction } from 'starknet';
import { typedData as starknetTypedData } from 'starknet';
import { SignerInterface } from 'starknet';
import { p256 as secp256r1 } from "@noble/curves/p256";
import { ECDSASigValue } from "@peculiar/asn1-ecc";
import { AsnParser } from "@peculiar/asn1-schema";
import { sha256 } from '@noble/hashes/sha2';


async function getBrowserSignature(attestation: WebAuthNUser, challenge: Uint8Array) {
  const credential = await navigator.credentials.get({
    publicKey: {
      rpId: attestation.rpId,
      challenge,
      allowCredentials: [{
        id: attestation.credentialId,
        type: "public-key",
        transports: ["internal"]
      }],
      userVerification: "required",
      // timeout: 60000,
    },
  });
  if (!credential) {
    throw new Error("No credential");
  }

  const assertion = credential as PublicKeyCredential;
  return assertion.response as AuthenticatorAssertionResponse;
}

export class WebAuthnSigner implements SignerInterface {
  protected attestation: WebAuthNUser;

  constructor(webAuthnAttestation: WebAuthNUser) {
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
    if (Object.values(ETransactionVersion2).includes(details.version as any)) {
      const det = details as V2InvocationsSignerDetails;
      msgHash = hash.calculateInvokeTransactionHash({
        ...det,
        senderAddress: det.walletAddress,
        compiledCalldata,
        version: det.version,
      });
    } else if (Object.values(ETransactionVersion3).includes(details.version as any)) {
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

    if (Object.values(ETransactionVersion2).includes(details.version as any)) {
      const det = details as V2DeployAccountSignerDetails;
      msgHash = hash.calculateDeployAccountTransactionHash({
        ...det,
        salt: det.addressSalt,
        constructorCalldata: compiledConstructorCalldata,
        version: det.version,
      });
    } else if (Object.values(ETransactionVersion3).includes(details.version as any)) {
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

    if (Object.values(ETransactionVersion2).includes(details.version as any)) {
      const det = details as V2DeclareSignerDetails;
      msgHash = hash.calculateDeclareTransactionHash({
        ...det,
        version: det.version,
      });
    } else if (Object.values(ETransactionVersion3).includes(details.version as any)) {
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
    /**
     * In WebAuthn, EC2 signatures are wrapped in ASN.1 structure so we need to peel r and s apart.
     *
     * See https://www.w3.org/TR/webauthn-2/#sctn-signature-attestation-types
     */
    const parseASN1Signature = (asn1Signature: BufferSource) => {
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

    const getMessageHash = (authenticatorData: Uint8Array, clientDataJson: Uint8Array) => {
      const clientDataHash = sha256(clientDataJson);
      const message = encode.concatenateArrayBuffer([authenticatorData, clientDataHash]);
      return sha256(message);
    };

    const getYParity = (messageHash: Uint8Array, pubkey: bigint, r: bigint, s: bigint) => {
      const signature = new secp256r1.Signature(r, s);
      const recoveredEven = signature.addRecoveryBit(0).recoverPublicKey(messageHash);
      if (pubkey === recoveredEven.x) {
        return false;
      }
      const recoveredOdd = signature.addRecoveryBit(1).recoverPublicKey(messageHash);
      if (pubkey === recoveredOdd.x) {
        return true;
      }
      throw new Error("Could not determine y_parity");
    };

    const challenge = hex2Buf(`${encode.removeHexPrefix(num.toHex64(msgHash))}00`);
    console.log({ challenge });
    const browserSignature = await getBrowserSignature(this.attestation, challenge);
    console.log("Browser signature:", browserSignature);
    const authenticatorData = new Uint8Array(browserSignature.authenticatorData);
    const clientDataJson = new Uint8Array(browserSignature.clientDataJSON);
    const flags = authenticatorData[32];
    const signCount = Number(BigInt(encode.addHexPrefix(encode.buf2hex(authenticatorData.slice(33, 37)))));
    console.log("clientDataJson", new TextDecoder().decode(clientDataJson));
    console.log("flags", flags);
    console.log("signCount", signCount);
    const crossOriginText = new TextEncoder().encode('"crossOrigin":false');
    const crossOriginIndex = findInArray(crossOriginText, clientDataJson);
    let clientDataJsonOutro = clientDataJson.slice(crossOriginIndex + crossOriginText.length);
    console.log(clientDataJsonOutro);
    if (clientDataJsonOutro.length == 1) {
      clientDataJsonOutro = new Uint8Array();
    }
    let { r, s } = parseASN1Signature(browserSignature.signature);
    let yParity = getYParity(getMessageHash(authenticatorData, clientDataJson), BigInt(await this.getPubKey()), r, s);
    const signature: WebAuthNSignature = {
      cross_origin: false,
      client_data_json_outro: Array.from(clientDataJsonOutro),
      flags,
      sign_count: signCount,
      ec_signature: {
        r: uint256.bnToUint256(r),
        s: uint256.bnToUint256(s),
        y_parity: yParity,
      },
      sha256_implementation: new CairoCustomEnum({
        Cairo0: {},
        Cairo1: undefined,
      }),
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
    console.log({ signer });

    console.log("WebauthnOwner signed, signature is:", signature);
    const finalSignature = CallData.compile([
      signerTypeToCustomEnum(SignerType.Webauthn, { signer, signature }),
    ]);
    console.log({ finalSignature });
    return finalSignature;

    throw new Error("Temporary end of code.......");
    return ec.starkCurve.sign(msgHash, "0x1234");
  }
}


