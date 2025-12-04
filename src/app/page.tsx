"use server";

import Image from 'next/image'
import styles from './page.module.css'
import { Center } from '@chakra-ui/react';

import starknetjsImg from "../public/Images/StarkNet-JS_logo.png";
import webAuthnImg from "../public/Images/WebAuthn.png";
import LowerBanner from './components/client/LowerBanner';
import ConnectDevnet from './components/client/ConnectWallet/ConnectDevnet';

export default async function Page() {
    return (
            <div>
                <p className={styles.bgText}>
                    Test webAuthN with Starknet.js v8.9.1<br></br>
                    Ready account v0.5.0
                </p>
                <Center>
                    <Image src={webAuthnImg} alt='webAuthN' width={150} />
                    <Image src={starknetjsImg} alt='starknet.js' width={150} />
                </Center>
                <ConnectDevnet></ConnectDevnet>
                <LowerBanner></LowerBanner>
            </div >
    )
}


