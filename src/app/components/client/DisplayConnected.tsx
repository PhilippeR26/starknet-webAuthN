"use client";

import { Center, Button } from "@chakra-ui/react";
import ConnectWallet from "./ConnectWallet/ConnectWallet";
import { useStoreWallet } from "./ConnectWallet/walletContext";
import WalletDisplay, { StateWallet } from "./ConnectWallet/DisplayWallet";
import CreateUser from "./ConnectWallet/CreateUser";
import { useGlobalContext } from "@/app/globalContext";
import SendWebAuthNTransaction from "./Transaction/SendWebAuthNTransaction";


export function DisplayConnected() {
    const { isConnected, address: addressAccount, chain: chainId } = useStoreWallet();
    const { webAuthNAccount } = useGlobalContext();
    const stateWallet: StateWallet = {
        addressAccount: addressAccount,
        chainId: chainId,
        isConnected: isConnected
    }

    return (
        <>
            {!isConnected ? (
                <>
                    <Center>
                        <ConnectWallet></ConnectWallet>
                    </Center>
                </>
            ) : (
                <>
                    <CreateUser></CreateUser>
                    {!!webAuthNAccount &&
                        <SendWebAuthNTransaction></SendWebAuthNTransaction>
                    }
                </>
            )
            }
        </>
    )
}