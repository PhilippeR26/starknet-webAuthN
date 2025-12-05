"use server";

import Image from 'next/image'
import styles from './page.module.css'
import { Center } from '@chakra-ui/react';

import starknetjsImg from "../public/Images/StarkNet-JS_logo.png";
import webAuthnImg from "../public/Images/WebAuthn.png";
import LowerBanner from './components/client/LowerBanner';
import { DisplayConnected } from './components/client/DisplayConnected';

export default async function Page() {
    return (
            <div>
                <p className={styles.bgText}>
                    Test webAuthN with Starknet.js v9.0.0β3<br></br>
                    Ready account v0.5.0 in Starknet Sepolia network
                </p>
                <Center>
                    <Image src={webAuthnImg} alt='webAuthN' width={150} />
                    <Image src={starknetjsImg} alt='starknet.js' width={150} />
                </Center>
                <DisplayConnected></DisplayConnected>
                <LowerBanner></LowerBanner>
            </div >
    )
}


