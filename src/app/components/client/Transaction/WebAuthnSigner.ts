import { SignerType, type WebAuthNSignature, type WebAuthNUser } from '@/app/type/types';
import { hex2Uint8Array } from '@/app/utils/encode';
import {
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
import {
  extractClientDataJsonOutro,
  getMessageHash,
  getTransactionSignature,
  getYParity,
  normalizeSecp256r1Signature,
  parseASN1Signature,
  signerTypeToCustomEnum
} from '../../../utils/WebAuthnUtils';


/**
 * Signer implementation using WebAuthn for signing.
 * 
 */
export class WebAuthnSigner implements SignerInterface {
  /**  WebAuthn attestation object */
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
    console.log("txHash calculated=", msgHash);
    const challenge = hex2Uint8Array(encode.removeHexPrefix(num.toHex64(msgHash)));
    console.log("Challenge =", challenge);
    console.log("this.attestation=", this.attestation);
    const rawSignature: AuthenticatorAssertionResponse = await getTransactionSignature(this.attestation, challenge);
    console.log("Raw WebAuthN signature:", rawSignature, "\n", encode.buf2hex(new Uint8Array(rawSignature.signature)), encode.arrayBufferToString(rawSignature.signature));
    // extraction of useful data
    const authenticatorData = new Uint8Array(rawSignature.authenticatorData);
    const clientDataJson = new Uint8Array(rawSignature.clientDataJSON);
    const flags = authenticatorData[32];
    console.log("flags", flags);
    const signCount = Number(BigInt(encode.addHexPrefix(encode.buf2hex(authenticatorData.slice(33, 37)))));
    console.log("signCount", signCount);
    console.log("clientDataJson", new TextDecoder().decode(clientDataJson));
    const clientDataJsonOutro = extractClientDataJsonOutro(clientDataJson);
    console.log("clientDataJsonOutro=", clientDataJsonOutro, new TextDecoder().decode(clientDataJsonOutro));
    let { r: rRaw, s: sRaw } = parseASN1Signature(rawSignature.signature);
    const { r, s } = normalizeSecp256r1Signature({ r0: rRaw, s0: sRaw });
    const yParity = getYParity(getMessageHash(authenticatorData, clientDataJson), BigInt(await this.getPubKey()), r, s);
    // Building of signature data requested by the Starknet contract
    const webauthnSignature: WebAuthNSignature = {
      client_data_json_outro: Array.from(clientDataJsonOutro),
      flags,
      sign_count: signCount,
      ec_signature: {
        r: uint256.bnToUint256(r),
        s: uint256.bnToUint256(s),
        y_parity: yParity,
      }
    };
    console.log("WebauthN signed, signature is:", webauthnSignature);
    // Building of signer data requested by the Starknet contract in the signature
    const signer = {
      origin: this.attestation.origin,
      rp_id_hash: uint256.bnToUint256(this.attestation.rp_id_hash),
      pubkey: uint256.bnToUint256(this.attestation.pubKey),
    }
    console.log("signer =", signer);
    // Building of final signature CallData, that will be sent to the Starknet contract
    const finalSignature = CallData.compile([[
      signerTypeToCustomEnum(SignerType.Webauthn, { signer, signature: webauthnSignature }),
    ]]);
    console.log({ finalSignature });
    return finalSignature;
  }
}


