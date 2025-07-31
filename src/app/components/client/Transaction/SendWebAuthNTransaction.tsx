"use client";

import { useStoreWallet } from '../ConnectWallet/walletContext';
import { Button, Center } from "@chakra-ui/react";
import { connect } from '@starknet-io/get-starknet';
import { WALLET_API } from '@starknet-io/types-js';
import { validateAndParseAddress, wallet, WalletAccount, constants as SNconstants, num, encode, CallData, CairoOption, CairoOptionVariant, hash, shortString, type BigNumberish, CairoCustomEnum, constants, type Call, type Calldata, type InvokeFunctionResponse, Account, Contract, config } from 'starknet';
import { devnetAddress, devnetPrivK, devnetProvider, myFrontendProviders, ReadyAccountClassHash, addrSTRK } from '@/utils/constants';
import { useFrontendProvider } from '../provider/providerContext';
import { useState } from 'react';
import { utils } from '@scure/starknet';
import { log } from 'console';
import type { WebAuthNUser } from '@/type/types';
import { ReadyAccountAbi } from '@/contracts/ReadyAbi';
import { sha256 } from '@noble/hashes/sha2';
import { useGlobalContext } from '@/app/globalContext';
import { ERC20Abi } from '@/contracts/erc20';


export default function SendWebAuthNTransaction() {
    const [inProgress, setInProgress] = useState<boolean>(false);
    const [pubK, setPubK] = useState<string>("");
    const [webAuthAddress, setWebAuthAddress] = useState<string>("");
    // const myWalletAccount = useStoreWallet(state => state.myWalletAccount);
    config.set("legacyMode",true);
    const account0=new Account(devnetProvider,devnetAddress,devnetPrivK);
    const { webAuthNAccount } = useGlobalContext();

    async function sendTx() {
        if (!!webAuthNAccount && !!account0) {
            setInProgress(true);
            const strkContract = new Contract(ERC20Abi.abi, addrSTRK,account0);
            const balance=await strkContract.balanceOf(webAuthNAccount.address) as bigint;
            console.log("balance new account", webAuthNAccount.address,"=",balance);
            const transferCall = strkContract.populate("transfer", {
                recipient: account0.address,
                amount: 2n * 10n ** 6n,
            });
            console.log("transfer =", transferCall);
            const resp = await webAuthNAccount.execute(transferCall);
            const txR = await webAuthNAccount.waitForTransaction(resp.transaction_hash);
            setInProgress(false);
            console.log("Transfer processed! TxR=", txR);
            if (txR.isSuccess()||txR.isReverted()){
                const bl=txR.value.block_number;
                const resBl= await webAuthNAccount.getBlockWithTxs(bl);
                console.log("tx=",resBl.transactions);
            }
        } else {
            console.log("One account is not initialized.");
            setInProgress(false);
        }
    }


    return (
        <>
            <Center>
                <Button
                    variant="surface"
                    mt={3}
                    ml={4}
                    px={5}
                    fontWeight='bold'
                    onClick={
                        () => sendTx()
                    }
                >
                    Send transaction
                </Button>
            </Center>
            <Center>
                {!!inProgress &&
                    <>
                        Transaction in progress...
                    </>
                }
            </Center>
        </>
    )
}
