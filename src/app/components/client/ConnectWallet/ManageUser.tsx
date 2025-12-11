"use client";

import { Button, Center, Field, Group, Input, Spinner, VStack, Text } from "@chakra-ui/react";
import { encode, CallData, CairoOption, CairoOptionVariant, hash, shortString, type BigNumberish, CairoCustomEnum, constants, type Call, type Calldata, type InvokeFunctionResponse, Account, Contract, config, num } from 'starknet';
import { ReadyAccountClassHash, addrSTRK, addrETH, myFrontendProviders } from '@/app/utils/constants';
import { useEffect, useState } from 'react';
import type { WebAuthNUser } from '@/app/type/types';
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
import { useFrontendProvider } from "../provider/providerContext";
import { createAccount } from "@/app/server/sponsorAccount";
import { calculateAccountAddress } from "@/app/utils/account";
import { Copy } from "lucide-react";
import { Toaster, toaster } from "@/components/ui/toaster";
import { shortHex64 } from "@/app/utils/format";

interface FormValues {
  accountName: string
}
export default function ManageUser() {
  const [pubKX, setPubKX] = useState<string>("");
  const [accountName, setAccountName] = useState<string>("account");
  const [deployInProgress, setDeployInProgress] = useState<boolean>(false);
  const { userAttestation, setUserAttestation } = useStore(usePersistentContext);
  const { webAuthNAccount, setWebAuthNAccount } = useGlobalContext();
  const { currentFrontendProviderIndex } = useFrontendProvider();
  const myFrontendProvider = myFrontendProviders[currentFrontendProviderIndex];


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

  async function handleCopyAddress() {
    try {
      await navigator.clipboard.writeText(num.toHex64(webAuthNAccount!.address));
      toaster.create({
        description: "Address copied to clipboard",
        type: "success",
        duration: 5000,
      })
      console.log('Address copied to clipboard');
    } catch (err) {
      console.error('Failed to copy address: ', err);
    }
  }

  async function handleCopyPubK() {
    try {
      await navigator.clipboard.writeText(userAttestation!.pubKey.toString());
      toaster.create({
        description: "Public key copied to clipboard",
        type: "success",
        duration: 5000,
      })
      console.log('pubK copied to clipboard');
    } catch (err) {
      console.error('Failed to copy pubK: ', err);
    }
  }

  async function deployAccount(webAuthnAttestation: WebAuthNUser) {
    try {
      const address = await createAccount(webAuthnAttestation); // from backend
      const strkContract = new Contract({ abi: ERC20Abi.abi, address: addrSTRK, providerOrAccount: myFrontendProvider });
      console.log("Balance of new account (", address, ") =\n", await strkContract.balanceOf(address), "STRK\n");
      const webAuthnSigner = new WebAuthnSigner(webAuthnAttestation);
      const webAuthnAccount = new Account({ provider: myFrontendProvider, address, signer: webAuthnSigner });
      setWebAuthNAccount(webAuthnAccount);
    } catch (err: any) {
      console.log("Problem during account deployment:", err);
      return;
    }
  }

  async function createUser(userName: string) {
    console.log("Create key...", userName);
    const origin = window.location.origin;
    const rpId = window.location.hostname
    console.log("rpId=", rpId );
    const id = randomBytes(32);
    const challenge: Uint8Array = randomBytes(32);
    const creation: CredentialCreationOptions = {
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
          // RS256 is normally added, but here it's voluntarily removed.
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
    }
    console.log("credential.create=", creation);
    const attestation: Credential | null = (await navigator.credentials.create(creation)) ;
    if (attestation==null) {
      throw new Error("No attestation");
    }
    console.log("attestation created:", JSON.stringify(attestation));
    // console.log("attestation JSON=", attestation.toJSON());
    if (attestation.type!=="public-key") {
      throw new Error("Not a public key attestation");
    }
    // *** if attestation.type == "public-key" then response type is `PublicKeyCredential`
    const AttestationIdText = attestation.id;
    const attestationRawId =new TextEncoder().encode(attestation.id) ;
    const attestationResponse:AuthenticatorResponse=(attestation as PublicKeyCredential).response;
    console.log("attestationResponse json =",JSON.stringify(attestationResponse));
    console.log("attestationResponse =",attestationResponse);
    console.log("attestationResponse clientDataJSON =",(attestationResponse as AuthenticatorAttestationResponse).clientDataJSON);
    console.log("attestationResponse attestationObject =",(attestationResponse as AuthenticatorAttestationResponse).attestationObject);
     const fullPubKey = (attestationResponse as AuthenticatorAttestationResponse).getPublicKey();
    // const fullPubKey = (attestation.response as AuthenticatorResponse).clientDataJSON;
    if (fullPubKey==null) {
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
    const rpId = window.location.hostname
    console.log({ rpId });
    try {
      const request: CredentialRequestOptions = {
        mediation: "optional",
        publicKey: {
          challenge: new Uint8Array(32),
          userVerification: "preferred",
        },
      }
      const credential = (await navigator.credentials.get(request)) as Credential;
      if (!credential) {
        throw new Error("No credential");
      }
      console.log("Credential created:", credential.id );
      // console.log("credential JSON=", credential.toJSON());
      const credentialIdText:string = credential.id;
      const credentialRawId:Uint8Array = new TextEncoder().encode(credential.id);
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
      const webAuthnAccount = new Account({ provider: myFrontendProvider, address: newAddress, signer: webAuthnSigner });
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
            <Toaster></Toaster>
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
              <Center>  address = {!!webAuthNAccount && shortHex64(webAuthNAccount!.address)}
                <Copy
                  color="steelblue"
                  style={{ marginLeft: "5px" }}
                  size={14}
                  onClick={handleCopyAddress}
                />
              </Center>
              <Center>  public key = {shortHex64(userAttestation.pubKey)}
                <Copy
                  color="steelblue"
                  style={{ marginLeft: "5px" }}
                  size={14}
                  onClick={handleCopyPubK}
                />
              </Center>
            </VStack>
          </Center>
        </>
      }
    </>
  )
}
