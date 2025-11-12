"use client";

import CreateUser from "./ConnectWallet/CreateUser";
import { useGlobalContext } from "@/app/globalContext";
import SendWebAuthNTransaction from "./Transaction/SendWebAuthNTransaction";


export function DisplayConnected() {
    const { webAuthNAccount } = useGlobalContext();

    return (
        <>
            <CreateUser></CreateUser>
            {!!webAuthNAccount &&
                <SendWebAuthNTransaction></SendWebAuthNTransaction>
            }
        </>
    )
}