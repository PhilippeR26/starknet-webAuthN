"use client";

import { Box, Button, Center, Field, Input, Text, VStack } from "@chakra-ui/react";
import { useState } from 'react';
import { useForm } from "react-hook-form";
import QRCode from "react-qr-code";
import { Contract, type GetTransactionReceiptResponse, type RevertedTransactionReceiptResponse, type SuccessfulTransactionReceiptResponse } from 'starknet';
import { addrSTRK, addrETH, SignatureValidationL2Resources } from '@/app/utils/constants';
import { useGlobalContext } from '@/app/globalContext';
import { ERC20Abi } from '@/contracts/erc20';
import { convertAmount } from '@/app/utils/convertAmount';
import GetBalance from '../Contract/GetBalance';

interface FormValues {
    targetAddress: string,
    amount: string
}


export default function SendWebAuthNTransaction() {
    const { webAuthNAccount } = useGlobalContext();
    const [inProgress, setInProgress] = useState<boolean>(false);
    const [destAddress, setDestAddress] = useState<string>("");
    const [amount, setAmount] = useState<string>("");
    const [txR, setTxR] = useState<GetTransactionReceiptResponse | undefined>(undefined);

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
            const estimateFees = await webAuthNAccount.estimateInvokeFee(transferCall, { skipValidate: true });
            const tmpL2amount = estimateFees.resourceBounds.l2_gas.max_amount;
            console.log("Estimate L2 amount=", tmpL2amount);
            estimateFees.resourceBounds.l2_gas.max_amount += SignatureValidationL2Resources;
            console.log("estimateFees2=", estimateFees.resourceBounds.l2_gas.max_amount, "total=", estimateFees.overall_fee, "digits=", estimateFees.overall_fee.toString().length - 1);

            const resp = await webAuthNAccount.execute(transferCall, {
                resourceBounds: estimateFees.resourceBounds,
                skipValidate: true,
            });
            const txR = await webAuthNAccount.waitForTransaction(resp.transaction_hash);
            setTxR(txR);
            setInProgress(false);
            console.log("Transfer processed! TxR=", txR);

            txR.match({
                SUCCEEDED: async (txR: SuccessfulTransactionReceiptResponse) => {
                    console.log('Success =', txR);
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
            _: () => { resp = "Unknown error." },
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
                    <VStack w="500px"px={"3%"}>
                        <Field.Root invalid={errors.targetAddress as any}>
                            <Field.Label htmlFor="encoded" textStyle="xs"> Destination address (0x 64 characters) :</Field.Label>
                            <Input w="90%" minH={50} maxH={500}
                                variant={'subtle'}
                                bg="gray.400"
                                defaultValue={destAddress}
                                fontSize={12}
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
