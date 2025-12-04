"use client";

import { useGlobalContext } from "@/app/globalContext";
import { Center, Text } from "@chakra-ui/react";
import { DisplayConnected } from "../DisplayConnected";
import { DevnetProvider } from "starknet-devnet";
import { useEffect } from "react";
import { devnetUrl } from "@/app/utils/constants";

/**
 * Ensure each 10s that Starknet Devnet is running locally
 * @returns 
 */
export default function ConnectDevnet() {
    const { devnetConnected, setDevnetConnected } = useGlobalContext();
    const l2DevnetProvider = new DevnetProvider({
        url: devnetUrl,
        timeout: 40_000,
    });


    async function testDevnet() {
        console.log("testDevnet...");
        setDevnetConnected(await l2DevnetProvider.isAlive());
    }

    useEffect(() => {
        testDevnet();
        const tim = setInterval(
            () => testDevnet()
            , 10_000 //ms
        );
        console.log("startTimer", tim);

        return () => {
            clearInterval(tim);
            console.log("stopTimer", tim)
        }
    }
        , []);

    return (
        <>
            {!devnetConnected ? <>
                <Center>
                    <Text
                        pt={4}
                        color="red"
                        fontWeight='bold'
                        fontSize={"2xl"}
                    >
                        Starknet-Devnet v0.6.1 not running!
                    </Text>
                </Center>
            </> : <>
                <>
                    <Center>
                        <Text
                            pt={4}
                            color="Black"
                            fontWeight="bold"
                            fontSize={"1xl"}
                        >
                            Connected to Starknet-Devnet v0.6.1
                        </Text>
                    </Center>
                    <DisplayConnected></DisplayConnected>
                </>
            </>
            }
        </>
    );
}