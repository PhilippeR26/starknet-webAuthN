"use client";

import { Button, Center, Field, Group, Input, Spinner, VStack } from "@chakra-ui/react";
import { encode, CallData, CairoOption, CairoOptionVariant, hash, shortString, type BigNumberish, CairoCustomEnum, constants, type Call, type Calldata, type InvokeFunctionResponse, Account, Contract, config } from 'starknet';
import { devnetAccountAddress, devnetAccountPrivK, devnetProvider, ReadyAccountClassHash, rpId, addrSTRK, addrETH } from '@/app/utils/constants';
import { useEffect, useState } from 'react';
import type { WebAuthNUser } from '@/app/type/types';
import { ReadyAccountAbi } from '@/contracts/ReadyAbi';
import { sha256 } from '@noble/hashes/sha2.js';
import { useGlobalContext } from '@/app/globalContext';
import { WebAuthnSigner } from '../Transaction/WebAuthnSigner';
import { ERC20Abi } from '@/contracts/erc20';
import { usePersistentContext } from '@/app/persistentContext';
import { useStore } from 'zustand'
import { randomBytes, uint8ArrayToArrayBuffer } from '@/app/utils/encode';
import { getPubK, storePubK } from '@/app/server/managePubKeys';
import { useForm } from "react-hook-form";
import { extractPubKey } from "./extractPubKey";
import { calculateSalt } from "../Transaction/WebAuthnUtils";

interface FormValues {
  accountName: string
}
export default function ManageUser() {
  const [pubKX, setPubKX] = useState<string>("");
  const [accountName, setAccountName] = useState<string>("account");
  const [deployInProgress, setDeployInProgress] = useState<boolean>(false);
  const { userAttestation, setUserAttestation } = useStore(usePersistentContext, (state) => state);

  config.set("legacyMode", true);
  const account0 = new Account({ provider: devnetProvider, address: devnetAccountAddress, signer: devnetAccountPrivK });
  const { webAuthNAccount, setWebAuthNAccount } = useGlobalContext((state) => state);

  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting, isValid }
  } = useForm<FormValues>();

  // Create Account button
  async function onCreateAccount(values: FormValues) {
    console.log("submitted form.");
    setAccountName(values.accountName);
    await createUser(values.accountName);
  }

  // Unselect Account button
  async function unloadAccount() {
    console.log("UnloadAccount...");
    setUserAttestation(undefined);
    setWebAuthNAccount(undefined);
  }


  function defineConstructor(readyWebAuthUser: WebAuthNUser): Calldata {
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

  function calculateAccountAddress(ReadySigner: WebAuthNUser): string {
    const constructorReadyCallData = defineConstructor(ReadySigner);
    const salt = calculateSalt(ReadySigner.pubKey);
    console.log("salt=", salt);
    console.log("constructor=", constructorReadyCallData);
    console.log("ReadyAccountClassHash=", ReadyAccountClassHash);
    const accountReadyAddress = hash.calculateContractAddressFromHash(salt, ReadyAccountClassHash, constructorReadyCallData, 0);
    console.log('Precalculated account address=', accountReadyAddress);
    return accountReadyAddress;
  }

  async function deployAccount(webAuthnAttestation: WebAuthNUser) {
    const newAddress = calculateAccountAddress(webAuthnAttestation);
    console.log({ newAddress });
    try {
      await devnetProvider.getClassAt(newAddress);
      console.warn("Account is already existing.");
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
      const { transaction_hash: txHDepl }: InvokeFunctionResponse = await account0.execute(myCall);
      console.log("account deployed with txH =", txHDepl);
      await account0.waitForTransaction(txHDepl);
      const webAuthnSigner = new WebAuthnSigner(webAuthnAttestation);
      const webAuthnAccount = new Account({ provider: devnetProvider, address: newAddress, signer: webAuthnSigner });
      // fund account
      console.log("fund new account...");
      const strkContract = new Contract({ abi: ERC20Abi.abi, address: addrSTRK, providerOrAccount: account0 });
      const ethContract = new Contract({ abi: ERC20Abi.abi, address: addrETH, providerOrAccount: account0 });
      const transferCallSTRK = strkContract.populate("transfer", {
        recipient: webAuthnAccount.address,
        amount: 10n * 10n ** 18n, // 10 STRK
      });
      const transferCallETH = ethContract.populate("transfer", {
        recipient: webAuthnAccount.address,
        amount: 1n * 10n ** 17n, // 0.1 ETH
      });
      console.log("transferCallSTRK&ETH =", transferCallSTRK, transferCallETH);
      const resp = await account0.execute([transferCallSTRK, transferCallETH], { tip: 0n });
      console.log("transfer processed! With txH=", resp.transaction_hash);
      const txR = await account0.waitForTransaction(resp.transaction_hash);
      console.log("txR transfer for funding =", txR);
      console.log("Balance of new account (", webAuthnAccount.address, ") =\n", await strkContract.balanceOf(webAuthnAccount.address), "STRK\n", await ethContract.balanceOf(webAuthnAccount.address), "ETH");
      setWebAuthNAccount(webAuthnAccount);
    } catch (err: any) {
      console.log("Error during account deployment:", err);
      return;
    }

  }

  async function createUser(userName: string) {
    console.log("Create key...");
    const origin = window.location.origin;
    const id = randomBytes(32);
    const challenge: Uint8Array = randomBytes(32);
    const attestation = (await navigator.credentials.create({
      publicKey: {
        rp: {
          name: "Starknet WebAuthn",
          id: rpId,
        },
        user: {
          id: uint8ArrayToArrayBuffer(id),
          name: userName,
          displayName: userName,
        },
        challenge: uint8ArrayToArrayBuffer(challenge),
        pubKeyCredParams: [
          { type: "public-key", alg: -7 }, // ECDSA with SHA-256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          residentKey: "preferred",
          requireResidentKey: false,
          userVerification: "required",
        },
        attestation: "none",
        extensions: { credProps: true },
        timeout: 60000,
      }
    })) as PublicKeyCredential;
    if (!attestation) {
      throw new Error("No attestation");
    }
    console.log("attestation created:", attestation);
    console.log("attestation JSON=", attestation.toJSON());
    const attestationRawId = attestation.rawId;
    const AttestationIdText = attestation.id;
    const fullPubKey = (attestation.response as AuthenticatorAttestationResponse).getPublicKey();
    if (fullPubKey === null) {
      throw new Error("No public key in response.");
    }
    console.log("fullPubKey buffer =", fullPubKey, fullPubKey.byteLength);
    const pubKeyX = extractPubKey(fullPubKey);

    console.log("user pubKX =", pubKeyX);
    setPubKX(pubKeyX);
    // store data in backend
    const resStorage = await storePubK({ id: attestation.id, userName, pubKey: pubKeyX });
    console.log("storage of user Data =", resStorage);
    console.log("response :", { userName, rpId, origin, credentialRawId: attestationRawId, pubKey: pubKeyX });
    const webAuthnUser: WebAuthNUser = {
      userName: userName,
      originText: origin,
      origin: CallData.compile(origin.split("").map(shortString.encodeShortString)),
      rpId,
      rp_id_hash: encode.addHexPrefix(encode.buf2hex(sha256(new TextEncoder().encode(rpId)))),
      credentialId: new Uint8Array(attestationRawId),
      credentialIdText: AttestationIdText,
      pubKey: pubKeyX,
    };
    console.log({ webAuthnSigner: webAuthnUser });
    setDeployInProgress(true);
    await deployAccount(webAuthnUser);
    setUserAttestation(webAuthnUser);
    setDeployInProgress(false);

  }

  async function readUser() {
    console.log("Read key...");
    const origin = window.location.origin;
    // const origin = "http://localhost:3000";
    try {
      const credential = (await navigator.credentials.get({
        mediation: "optional",
        publicKey: {
          challenge: new Uint8Array(32),
          userVerification: "preferred",
        },
      })) as PublicKeyCredential;
      if (!credential) {
        throw new Error("No credential");
      }
      console.log("Credential created:", credential);
      console.log("credential JSON=", credential.toJSON());
      const credentialRawId = credential.rawId;
      const credentialIdText = credential.id;
      // get backend data
      const { pubKey, userName } = await getPubK(credential.id);
      if (pubKey === null) {
        throw new Error("No public key stored in backend.");
      }
      console.log("user pubK =", pubKey);
      setPubKX(pubKey);
      console.log("response :", { userName, rpId, origin, credentialRawId, pubKey: pubKey });
      const webAuthnUser: WebAuthNUser = {
        userName: userName,
        originText: origin,
        origin: CallData.compile(origin.split("").map(shortString.encodeShortString)),
        rpId,
        rp_id_hash: encode.addHexPrefix(encode.buf2hex(sha256(new TextEncoder().encode(rpId)))),
        credentialId: new Uint8Array(credentialRawId),
        credentialIdText,
        pubKey: pubKey,
      };
      setUserAttestation(webAuthnUser);
      console.log({ webAuthnSigner: webAuthnUser });
      setDeployInProgress(true);
      await deployAccount(webAuthnUser); // if necessary
      setDeployInProgress(false);
    } catch (err) {
      console.log(err);
      throw new Error("Error while retrieving credential", { cause: err });
    }
  }

  useEffect(() => {
    console.log("CreateUser useEffect ...");
    // ****************************************************
    // If you need to clear the persistent context, uncomment this line:
    // usePersistentContext.persist.clearStorage(); 
    // ****************************************************
    if (!!userAttestation && !!userAttestation.pubKey) {
      const newAddress = calculateAccountAddress(userAttestation);
      console.log("inputs for address. User:", userAttestation);
      console.log({ newAddress });
      const webAuthnSigner = new WebAuthnSigner(userAttestation);
      const webAuthnAccount = new Account({ provider: devnetProvider, address: newAddress, signer: webAuthnSigner });
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
            <VStack>
              <form onSubmit={handleSubmit(onCreateAccount)}>
                <Group attached>
                  <Field.Root invalid={errors.accountName as any}>
                    <Field.Label textStyle="xs"> New account name:</Field.Label>
                    <Input
                      w="100%"
                      h={8}
                      px={2}
                      mx={0}
                      maxH={50}
                      variant={'subtle'}
                      bg="gray.400"
                      rounded={0}
                      defaultValue={accountName}
                      id="accountN"
                      {...register("accountName", {
                        required: "This is required. Ex: account0",
                        pattern: /.+/
                      })}
                    />
                    <Field.ErrorText color={"darkred"}>
                      {errors.accountName && errors.accountName.message}
                      {errors.accountName && errors.accountName.type == "pattern" && <span>At least one char.</span>}
                    </Field.ErrorText>
                  </Field.Root>
                  <Button
                    variant="surface"
                    mt={isValid ? 5 : 0}
                    mx={0}
                    px={2}
                    h={8}
                    fontWeight='bold'
                    borderWidth={2}
                    borderColor={isValid ? "gray.400" : "red"}
                    loading={isSubmitting}
                    type="submit"
                  >
                    Create account
                  </Button>
                </Group>
              </form>
              {deployInProgress && <>
                <Spinner color="blue" size="sm" mr={4}></Spinner>
                account deployment in progress...
              </>}
            </VStack>
          </Center>
          {!deployInProgress && <>
            <Center>
              or
            </Center>
            <Center>
              <Button
                variant="surface"
                mt={1}
                ml={4}
                px={5}
                fontWeight='bold'
                borderWidth={2}
                borderColor={"gray.400"}
                onClick={() => readUser()}
              >
                Select existing account
              </Button>
            </Center>
          </>
          }
        </>
        :
        <>
          <Center>
            <VStack>
              <Button
                variant="surface"
                color={"red"}
                mt={3}
                ml={4}
                px={5}
                fontWeight='bold'
                onClick={() => unloadAccount()}
              >
                Unselect Account
              </Button>
              <Center> WebAuthN account : </Center>
              <Center> account name = {userAttestation.userName} </Center>
              <Center>  address = {webAuthNAccount?.address}</Center>
              <Center>  public key = {userAttestation.pubKey}
              </Center>
            </VStack>
          </Center>
        </>
      }
    </>
  )
}
