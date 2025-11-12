"use client";

import { useEffect, useState } from 'react';
import { Contract, shortString } from "starknet";
import { Text, Center, Spinner } from "@chakra-ui/react";
import styles from '../../../page.module.css'
import { erc20Abi } from "../../../contracts/abis/ERC20abi"
import { myFrontendProviders } from '@/app/utils/constants';
import { useFrontendProvider } from '../provider/providerContext';


type Props = { tokenAddress: string, accountAddress: string };

export default function GetBalance({ tokenAddress, accountAddress }: Props) {

    // block context
    const [balance, setBalance] = useState<number | undefined>(undefined);
    const [decimals, setDecimals] = useState<number>(18)
    const [symbol, setSymbol] = useState<string>("");
    const [counter, setCounter] = useState<bigint>(0n);

    const myProviderIndex = useFrontendProvider(state => state.currentFrontendProviderIndex);
    const myProvider = myFrontendProviders[myProviderIndex];
    const contract = new Contract({ abi: erc20Abi, address: tokenAddress, providerOrAccount: myProvider });

    useEffect(() => {
        contract.call("decimals")
            .then((resp: any) => {
                console.log("resDecimals=", resp);
                setDecimals(Number(resp));
            })
            .catch((e: any) => { console.log("error getDecimals=", e) });

        contract.symbol()
            .then((resp: any) => {
                const res2 = shortString.decodeShortString(resp);
                console.log("ressymbol=", res2);
                setSymbol(res2);
            })
            .catch((e: any) => { console.log("error getSymbol=", e) });
    }
        , []);

    useEffect(() => {
        contract.balanceOf(accountAddress)
            .then((resp: any) => {
                const res3 = Number(resp);
                console.log("res3=", resp);
                setBalance(res3 / Math.pow(10, decimals));
                // console.log({counter});
            }
            )
            .catch((e: any) => { console.log("error balanceOf=", e) });
    }
        , [counter, decimals]); // balance updated each 24s

    useEffect(() => {
        const tim = setInterval(() => {
            setCounter((prevCount) => prevCount + 1n);
            // console.log("timerId=", tim);
        }
            , 24_000 //ms
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
            {
                typeof balance == "undefined" ? (
                    <>
                        <Center>
                            <Spinner color="blue" size="sm" mr={4} />
                            Fetching data ...
                        </Center>
                    </>
                ) : (
                    <>
                        <Text className={styles.text1}>Balance = {balance} {symbol} </Text>
                    </>
                )
            }
        </>

    )
}