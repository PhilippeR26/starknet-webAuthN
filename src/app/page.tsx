"use server";

import Image from 'next/image'
import styles from './page.module.css'
import { Center } from '@chakra-ui/react';

import starknetjsImg from "../public/Images/StarkNet-JS_logo.png";
import webAuthnImg from "../public/Images/WebAuthn.png";
import { DisplayConnected } from './components/client/DisplayConnected';
import LowerBanner from './components/client/LowerBanner';

export default async function Page() {

    return (
            <div>
                <p className={styles.bgText}>
                    Test webAuthN with starknet.js v7.6.2
                </p>
                <Center>
                    <Image src={webAuthnImg} alt='webAuthN' width={150} />
                    <Image src={starknetjsImg} alt='starknet.js' width={150} />
                </Center>
                <p className={styles.bgText}>
                    Please connect to Sepolia Testnet network
                </p>
                <div>
                    <DisplayConnected></DisplayConnected>

                </div>
                <LowerBanner></LowerBanner>
            </div >
    )
}


