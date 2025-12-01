"use client";

import { Box, Button, Center, Field, Input, Text, VStack } from "@chakra-ui/react";
import { useState } from 'react';
import { useForm } from "react-hook-form";
import QRCode from "react-qr-code";
import { Contract, config, encode, num, uint256, CairoCustomEnum, type GetTransactionReceiptResponse, type ResourceBoundsBN, type RevertedTransactionReceiptResponse, type SuccessfulTransactionReceiptResponse, CallData, } from 'starknet';
import { addrSTRK, addrETH } from '@/app/utils/constants';
import { useGlobalContext } from '@/app/globalContext';
import { ERC20Abi } from '@/contracts/erc20';
import { convertAmount } from '@/app/utils/convertAmount';
import GetBalance from '../Contract/GetBalance';
import { findInArray, hex2Uint8Array } from "@/app/utils/encode";
import { getMessageHash, getYParity, normalizeSecp256r1Signature, parseASN1Signature } from "./webAuthnSigner";
import type { WebAuthNSignature } from "@/app/type/types";
import { sha256 } from "@noble/hashes/sha2.js";

interface FormValues {
    targetAddress: string,
    amount: string
}

export function extractClientDataJsonOutro(clientDataJson: Uint8Array): Uint8Array {
    const originKey = new TextEncoder().encode('"origin":"');
    const keyIndex = findInArray(originKey, clientDataJson);
    if (keyIndex === -1) {
        return new Uint8Array();
    }
    const valueStart = keyIndex + originKey.length;
    // const valueStart = keyIndex ;
    console.log("extract Json-valueStart=", valueStart);
    // scan forward to the next '"' marking the end of the origin value
    let i = valueStart;
    while (i < clientDataJson.length && clientDataJson[i] !== 0x22 /* '"' */) {
        i++;
    }
    if (i >= clientDataJson.length) {
        return new Uint8Array();
    }
    console.log("extract Json-i=", i);

    // {"type":"webauthn.get","challenge":"AUBfrBApoxcuxJatuD821SzIW75QQOrydQq7PoNaHes","origin":"http://localhost:5173","crossOrigin":false,"other_keys_can_be_added_here":"do not compare clientDataJSON against a template. See https://goo.gl/yabPex"}
    const outro = clientDataJson.slice(i + 1);
    console.log("outro=", new TextDecoder().decode(outro));
    // If outro is just '}', treat as empty per spec
    if (outro.length === 1 && outro[0] === 0x7d /* '}' */) {
        return new Uint8Array();
    }
    return outro;
}


export default function SendWebAuthNTransaction() {
    const [inProgress, setInProgress] = useState<boolean>(false);
    const { webAuthNAccount } = useGlobalContext();
    const [destAddress, setDestAddress] = useState<string>("");
    const [amount, setAmount] = useState<string>("");
    const [txR, setTxR] = useState<GetTransactionReceiptResponse | undefined>(undefined);

    config.set("legacyMode", true);

    const {
        handleSubmit,
        register,
        formState: { errors, isSubmitting, isValid }
    } = useForm<FormValues>();

    

    

    
    
    async function sendTx(values: FormValues) {
        if (!!webAuthNAccount) {
            setTxR(undefined);
            setDestAddress(values.targetAddress);
            const qty = convertAmount(values.amount);
            setAmount(qty.toString());
            setInProgress(true);
            const strkContract = new Contract({ abi: ERC20Abi.abi, address: addrSTRK, providerOrAccount: webAuthNAccount });
            const ethContract = new Contract({ abi: ERC20Abi.abi, address: addrETH, providerOrAccount: webAuthNAccount });
            const balanceSTRK = await strkContract.balanceOf(webAuthNAccount.address) as bigint;
            const balanceETH = await ethContract.balanceOf(webAuthNAccount.address) as bigint;
            console.log("balance new account", webAuthNAccount.address, "=", balanceSTRK, "STRK\n", balanceETH, "ETH");
            const transferCall = strkContract.populate("transfer", {
                recipient: values.targetAddress,
                amount: qty,
            });
            console.log("transfer =", transferCall);
            config.set('resourceBoundsOverhead', {
                l1_gas: {
                    max_amount: 50,
                    max_price_per_unit: 50,
                },
                l2_gas: {
                    max_amount: 500,
                    max_price_per_unit: 50,
                },
                l1_data_gas: {
                    max_amount: 50,
                    max_price_per_unit: 50,
                },
            });
            const resources: ResourceBoundsBN = {
                l2_gas: {
                    max_amount: 1n * 10n * 17n,
                    max_price_per_unit: 1_500_000_000n //0x59682F00
                },
                l1_gas: {
                    max_amount: 1n * 10n * 17n,
                    max_price_per_unit: 1_500_000_000n
                },
                l1_data_gas: {
                    max_amount: 1n * 10n * 17n,
                    max_price_per_unit: 1_500_000_000n
                }
            }
            const estimateFees = await webAuthNAccount.estimateInvokeFee(transferCall, { skipValidate: false, tip:0 });
            console.log("estimateFees=", estimateFees);
            const estimateFees2 = await webAuthNAccount.estimateInvokeFee(transferCall, { skipValidate: true });
            console.log("estimateFees2=", estimateFees2);

            const resp = await webAuthNAccount.execute(transferCall, {
                resourceBounds:estimateFees.resourceBounds, 
                skipValidate: true, 
                tip: 0n 
            });
            const txR = await webAuthNAccount.waitForTransaction(resp.transaction_hash);
            setTxR(txR);
            setInProgress(false);
            console.log("Transfer processed! TxR=", txR);

            txR.match({
                SUCCEEDED: async (txR: SuccessfulTransactionReceiptResponse) => {
                    console.log('Success =', txR);
                    // const bl = (txR as InvokeTransactionReceiptResponse);
                    const resBl = await webAuthNAccount.getBlockWithTxs("latest");
                    console.log("tx=", resBl.transactions);
                },
                _: () => {
                    console.log("One account is not initialized.");
                    setInProgress(false);
                },
            });

        }
    }

    function recoverError(txR: GetTransactionReceiptResponse): string {
        let resp: string = "";
        txR.match({
            REVERTED: (txR: RevertedTransactionReceiptResponse) => {
                resp = txR.execution_status + " " + txR.revert_reason
            },
            _: () => { resp = "" },
        })
        return resp;
    }

    return (
        <>
            <Center pb={2} pt={3}>
                <QRCode
                    value={webAuthNAccount!.address}
                    size={150}
                    level="M"
                />
            </Center>
            <Center>
                <GetBalance tokenAddress={addrSTRK} accountAddress={webAuthNAccount!.address} ></GetBalance>
            </Center>
            <form onSubmit={handleSubmit(sendTx)}>
                <Center>
                    <VStack w="500px">
                        <Field.Root invalid={errors.targetAddress as any}>
                            <Field.Label htmlFor="encoded" textStyle="xs"> Destination address (0x 64 characters) :</Field.Label>
                            <Input w="100%" minH={50} maxH={500}
                                variant={'subtle'}
                                bg="gray.400"
                                defaultValue={destAddress}
                                id="encoded"
                                {...register("targetAddress", {
                                    required: "This is required. Ex: 0x0123..a2c", pattern: /^(0x)?[0-9a-fA-F]{64}$/
                                })}
                            />
                            <Field.ErrorText color={"darkred"}>
                                {errors.targetAddress && errors.targetAddress.message}
                                {errors.targetAddress && errors.targetAddress.type == "pattern" && <span>Not a 64 char hex address</span>}
                            </Field.ErrorText>
                        </Field.Root>
                        <Field.Root invalid={errors.amount as any}>
                            <Field.Label htmlFor="amount0" pt={3} textStyle="xs"> STRK amount :</Field.Label>
                            <Input w="30%"
                                variant={'subtle'}
                                bg="gray.400"
                                defaultValue={amount}
                                id="amount0"
                                {...register("amount", {
                                    required: "This is required. Ex: 0.001",
                                    pattern: /^\d+[\.,]?\d*$/
                                })}
                            />
                            <Field.ErrorText color={"darkred"}>
                                {errors.amount && errors.amount.message}
                                {errors.amount && errors.amount.type == "pattern" && <span>Not a number</span>}
                            </Field.ErrorText>
                        </Field.Root>
                    </VStack>
                </Center>
                <Center>
                    <Button
                        variant="surface"
                        mt={3}
                        ml={4}
                        px={5}
                        fontWeight='bold'
                        loading={isSubmitting}
                        type="submit"
                    >
                        Send transaction
                    </Button>
                </Center>
            </form >
            <Center>
                {!!inProgress &&
                    <>
                        Transaction in progress...
                    </>
                }
            </Center>
            {!!txR && <>
                {txR.isSuccess() ? (
                    <>
                        <Center>
                            <Box
                                bg={"green"}
                                color={"black"}
                                // borderWidth='3px'
                                borderColor='green.800'
                                borderRadius='full'
                                fontWeight={"bold"}
                                padding={2}
                                margin={3}
                            >
                                Accepted in Starknet.
                            </Box>
                        </Center>
                    </>) : (
                    <>
                        <Center>
                            <Box
                                bg={"orange"}
                                color={"darkred"}
                                // borderWidth='4px'
                                borderColor='red'
                                borderRadius='xl'
                                fontWeight={"bold"}
                                padding={2}
                                margin={3}
                            >
                                Rejected by starknet :
                                {recoverError(txR)}
                            </Box>
                        </Center>
                    </>
                )
                }
            </>
            }
            <Text mb={20}></Text>
        </>
    )
}
