"use client";

import { Center, Button } from "@chakra-ui/react";
import DisplayBlockChain from "./Block/DisplayBlockchain";
import ConnectWallet from "./ConnectWallet/ConnectWallet";
import { useStoreWallet } from "./ConnectWallet/walletContext";
import WalletDisplay, { StateWallet } from "./ConnectWallet/DisplayWallet";
import PlayWithCairo1 from "./Contract/PlayWithCairo1";


export function DisplayConnected() {
    const isConnected = useStoreWallet(state => state.isConnected);
    const addressAccount = useStoreWallet(state => state.address);
    const chainId = useStoreWallet(state => state.chain);
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
                    <Center>
                        <Button
                            variant="surface"
                            ml={4}
                            px={5}
                            fontWeight='bold'
                            onClick={() => {
                                useStoreWallet.setState({ isConnected: false });
                            }}
                        >
                            {addressAccount
                                ? `Your wallet : ${addressAccount?.slice(0, 7)}...${addressAccount?.slice(-4)} is connected`
                                : "No Account"}
                        </Button>
                    </Center>
                    <br />
                    <WalletDisplay walletData={stateWallet} ></WalletDisplay>
                    <DisplayBlockChain ></DisplayBlockChain>
                    <PlayWithCairo1></PlayWithCairo1>
                </>
            )
            }
        </>
    )
}