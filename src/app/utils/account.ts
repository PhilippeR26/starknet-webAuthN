import { CairoCustomEnum, CairoOption, CairoOptionVariant, CallData, hash, type Calldata } from "starknet";
import type { WebAuthNUser } from "../type/types";
import { ReadyAccountAbi } from "@/contracts/ReadyAbi";
import { calculateSalt } from "./WebAuthnUtils";
import { ReadyAccountClassHash } from "./constants";



export function defineConstructor(readyWebAuthUser: WebAuthNUser): Calldata {
    const callDataReady = new CallData(ReadyAccountAbi.abi);
    const ReadyWebAuthn = new CairoCustomEnum({
        Webauthn: {
            origin: readyWebAuthUser.origin,
            rp_id_hash: readyWebAuthUser.rp_id_hash,
            pubkey: readyWebAuthUser.pubKey
        }
    });
    console.log("constructor ReadyWebAuthn=", ReadyWebAuthn);
    const ReadyGuardian = new CairoOption(CairoOptionVariant.None);
    const constructorReadyCallData = callDataReady.compile("constructor", {
        owner: ReadyWebAuthn,
        guardian: ReadyGuardian
    });
    console.log("constructor =", constructorReadyCallData);
    return constructorReadyCallData;
}

export function calculateAccountAddress(ReadySigner: WebAuthNUser): string {
    const constructorReadyCallData = defineConstructor(ReadySigner);
    const salt = calculateSalt(ReadySigner.pubKey);
    console.log("salt=", salt);
    console.log("constructor=", constructorReadyCallData);
    console.log("ReadyAccountClassHash=", ReadyAccountClassHash);
    const accountReadyAddress = hash.calculateContractAddressFromHash(salt, ReadyAccountClassHash, constructorReadyCallData, 0);
    console.log('Precalculated account address=', accountReadyAddress);
    return accountReadyAddress;
}