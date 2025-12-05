"use client";

import ManageUser from "./ConnectWallet/ManageUser";
import { useGlobalContext } from "@/app/globalContext";
import SendWebAuthNTransaction from "./Transaction/SendWebAuthNTransaction";


export function DisplayConnected() {
    const { webAuthNAccount } = useGlobalContext();
    
    return (
        <>
            <ManageUser></ManageUser>
            {!!webAuthNAccount &&
                <SendWebAuthNTransaction></SendWebAuthNTransaction>
            }
        </>
    )
}