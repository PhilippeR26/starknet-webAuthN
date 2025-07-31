"use client";

import { useStoreWallet } from './walletContext';
import { Button, Center, VStack } from "@chakra-ui/react";
import { connect } from '@starknet-io/get-starknet';
import { WALLET_API } from '@starknet-io/types-js';
import { validateAndParseAddress, wallet, WalletAccount, constants as SNconstants, num, encode, CallData, CairoOption, CairoOptionVariant, hash, shortString, type BigNumberish, CairoCustomEnum, constants, type Call, type Calldata, type InvokeFunctionResponse, Account, Contract, config, json } from 'starknet';
import { devnetAddress, devnetPrivK, devnetProvider, email, myFrontendProviders, ReadyAccountClassHash, rpId, addrSTRK } from '@/utils/constants';
import { useFrontendProvider } from '../provider/providerContext';
import { useEffect, useState } from 'react';
import { utils } from '@scure/starknet';
import { log } from 'console';
import type { WebAuthNUser } from '@/type/types';
import { ReadyAccountAbi } from '@/contracts/ReadyAbi';
import { sha256 } from '@noble/hashes/sha2';
import { useGlobalContext } from '@/app/globalContext';
import { WebAuthnSigner } from '../Transaction/webAuthnSigner';
import { ERC20Abi } from '@/contracts/erc20';
import { usePersistentContext } from '@/app/persistentContext';
import { useStore } from 'zustand'

export default function CreateUser() {
    const [isError, setError] = useState<boolean>(false);
    const [pubK, setPubK] = useState<string>("");
    const [webAuthAddress, setWebAuthAddress] = useState<string>("");
    const { userAttestation, setUserAttestation } = useStore(usePersistentContext, (state) => state);
    // const myWalletAccount = useStoreWallet(state => state.myWalletAccount);
    config.set("legacyMode", true);
    const account0 = new Account(devnetProvider, devnetAddress, devnetPrivK);
    const setWebAuthNAccount = useGlobalContext(state => state.setWebAuthNAccount)


    function calculateSalt(pubK: BigNumberish): bigint {
        return BigInt(pubK) & constants.MASK_250
    }

    function defineConstructor(readyWebAuthConstructor: WebAuthNUser): Calldata {
        const calldataReady = new CallData(ReadyAccountAbi.abi);
        const ReadyWebAuthn = new CairoCustomEnum({
            Webauthn: {
                origin: readyWebAuthConstructor.origin,
                rp_id_hash: readyWebAuthConstructor.rp_id_hash,
                pubkey: readyWebAuthConstructor.pubKey
            }
        });

        const ReadyGuardian = new CairoOption(CairoOptionVariant.None);
        const constructorReadyCallData = calldataReady.compile("constructor", {
            owner: ReadyWebAuthn,
            guardian: ReadyGuardian
        });
        console.log("constructor =", constructorReadyCallData);
        return constructorReadyCallData;
    }

    function calculateAddress(ReadySigner: WebAuthNUser): string {
        const constructorReadyCallData = defineConstructor(ReadySigner);
        const salt = calculateSalt(ReadySigner.pubKey);
        const accountReadyAddress = hash.calculateContractAddressFromHash(salt, ReadyAccountClassHash, constructorReadyCallData, 0);
        console.log('Precalculated account address=', accountReadyAddress);
        return accountReadyAddress;
    }

    async function deployAccount(webAuthnAttestation: WebAuthNUser) {
        const newAddress = calculateAddress(webAuthnAttestation);
        setWebAuthAddress(newAddress);
        try {
            await devnetProvider.getClassAt(newAddress);
            console.error("Account is already existing.");
            return;
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
        try {
            const { transaction_hash: txHDepl }: InvokeFunctionResponse = await account0.execute([myCall]);
            console.log("account deployed with txH =", txHDepl);
            await account0.waitForTransaction(txHDepl);
            const webAuthnSigner = new WebAuthnSigner(webAuthnAttestation);
            const webAuthnAccount = new Account(devnetProvider, newAddress, webAuthnSigner);
            // fund account
            console.log("fund new account...");
            const strkContract = new Contract(ERC20Abi.abi, addrSTRK, account0);
            const transferCall = strkContract.populate("transfer", {
                recipient: webAuthnAccount.address,
                amount: 1n * 10n ** 17n,
            });
            console.log("transferCall =", transferCall);
            const resp = await account0.execute(transferCall);
            console.log("transfer processed! With txH=", resp.transaction_hash);
            const txR = await account0.waitForTransaction(resp.transaction_hash);
            console.log("txR transfer for funding =", txR);
            console.log("Balance of new account (", webAuthnAccount.address, ") =\n", await strkContract.balanceOf(webAuthnAccount.address));
            setWebAuthNAccount(webAuthnAccount);
        } catch (err: any) {
            console.log("Error during account deployment:", err);
            return;
        }

    }

    async function createUser() {
        console.log("Create key...");
        const origin = window.location.origin;
        // const id = utils.randomPrivateKey();
        const id: Uint8Array = encode.utf8ToArray("1");
        const challenge: Uint8Array = utils.randomPrivateKey();
        const credential = (await navigator.credentials.create({
            publicKey: {
                rp: {
                    name: "Starknet WebAuthn",
                    id: rpId,
                },
                user: {
                    id,
                    name: email,
                    displayName: email,
                },
                challenge,
                pubKeyCredParams: [
                    { type: "public-key", alg: -7 }, // ECDSA with SHA-256
                ],
                authenticatorSelection: {
                    userVerification: 'required',
                },
                attestation: "none",
                extensions: { credProps: true },
            }
        })) as PublicKeyCredential;
        if (!credential) {
            throw new Error("No credential");
        }
        console.log("Credential created:", credential);
        const credentialRawId = credential.rawId;
        const fullPubKey = (credential.response as AuthenticatorAttestationResponse).getPublicKey();
        if (fullPubKey === null) {
            throw new Error("No public key in response.");
        }
        const pubKeyX = encode.addHexPrefix(encode.buf2hex(new Uint8Array(fullPubKey.slice(-64, -32)))); // first half is X part of the public key
        console.log("user pubK =", pubKeyX);
        setPubK(pubKeyX);
        console.log("response :", { email, rpId, origin, credentialRawId, pubKey: pubKeyX });
        const webAuthnSigner: WebAuthNUser = {
            email: email,
            origin: CallData.compile(origin.split("").map(shortString.encodeShortString)),
            rpId,
            rp_id_hash: encode.addHexPrefix(encode.buf2hex(sha256(rpId))),
            credentialId: new Uint8Array(credentialRawId),
            pubKey: pubKeyX,
        };
        setUserAttestation(webAuthnSigner);
        console.log({ webAuthnSigner });
        await deployAccount(webAuthnSigner);
    }

    async function deleteAccount() {
        console.log("DeleteAccount...");
        setUserAttestation(undefined);
    }

    useEffect(() => {
        console.log("CreateUser useEffect ...");
        if (!!userAttestation) {
            const newAddress = calculateAddress(userAttestation);
            console.log({newAddress});
        setWebAuthAddress(newAddress);
const webAuthnSigner = new WebAuthnSigner(userAttestation);
            const webAuthnAccount = new Account(devnetProvider, newAddress, webAuthnSigner);
            console.log(webAuthnAccount);
            setWebAuthNAccount(webAuthnAccount);
        } 
    },
        [userAttestation]
    );


    return (
        <>
            {!userAttestation ?
                <>
                    <Center>
                        <Button
                            variant="surface"
                            mt={3}
                            ml={4}
                            px={5}
                            fontWeight='bold'
                            onClick={() => createUser()}
                        >
                            Activate user
                        </Button>
                    </Center>
                </>
                :
                <>
                    <Center>
                        <VStack>
                        Existing account {json.stringify(userAttestation, undefined, 2)}
                        <Button
                            variant="surface"
                            color={"red"}
                            mt={3}
                            ml={4}
                            px={5}
                            fontWeight='bold'
                            onClick={() => deleteAccount()}
                        >
                            Delete Account
                        </Button>
                        </VStack>
                    </Center>
                </>
            }

            <Center>
                WebAuthN account address = {webAuthAddress}
            </Center>
        </>
    )
}
