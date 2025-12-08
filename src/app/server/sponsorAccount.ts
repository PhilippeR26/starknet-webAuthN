"use server";

import { Account, CallData, constants, Contract, type Call, type InvokeFunctionResponse, type RpcProvider } from "starknet";
import { addrSTRK, myFrontendProviders, ReadyAccountClassHash } from "../utils/constants";
import type { WebAuthNUser } from "../type/types";
import { calculateAccountAddress, defineConstructor } from "../utils/account";
import { calculateSalt } from "../utils/WebAuthnUtils";
import { ERC20Abi } from "@/contracts/erc20";



export async function createAccount(webAuthnAttestation: WebAuthNUser): Promise<string> {
    const myProvider: RpcProvider = myFrontendProviders[2];
    const account0 = new Account({
        provider: myProvider,
        address: process.env.SPONSOR_ACCOUNT_ADDRESS ?? "MISSING",
        signer: process.env.SPONSOR_ACCOUNT_PRIVATE ?? "MISSING"
    });
    const newAddress = calculateAccountAddress(webAuthnAttestation);
    console.log({ newAddress });
    try {
        await myProvider.getClassAt(newAddress);
        console.warn("Account is already existing.");
        return newAddress;
    } catch { }

    const myCall: Call = {
        contractAddress: constants.UDC.ADDRESS,
        entrypoint: constants.UDC.ENTRYPOINT,
        calldata: CallData.compile({
            classHash: ReadyAccountClassHash,
            salt: calculateSalt(webAuthnAttestation.pubKey),
            unique: "0",
            calldata: defineConstructor(webAuthnAttestation),
        }),
    };
    console.log("Deploy of account in progress...\n", myCall);
    console.log("fund new account...");
    const strkContract = new Contract({ abi: ERC20Abi.abi, address: addrSTRK, providerOrAccount: account0 });
    const transferCallSTRK = strkContract.populate("transfer", {
        recipient: newAddress,
        amount: 15n * 10n ** 17n, // 1.5 STRK
    });
    console.log("transferCallSTRK =", transferCallSTRK);
    const { transaction_hash: txHDepl }: InvokeFunctionResponse = await account0.execute([myCall, transferCallSTRK]);
    console.log("account deployed with txH =", txHDepl);
    await account0.waitForTransaction(txHDepl);
    return newAddress;
}

