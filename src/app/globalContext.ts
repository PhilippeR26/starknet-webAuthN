"use client";
import type { Account } from "starknet";
import { create } from "zustand";
interface GlobalState {
    webAuthNAccount: Account | undefined,
    setWebAuthNAccount: (webAuthNAccount: Account | undefined) => void,
    devnetConnected: boolean,
    setDevnetConnected: (devnetConnected: boolean) => void,
}

export const useGlobalContext = create<GlobalState>()(set => ({
    webAuthNAccount: undefined,
    setWebAuthNAccount: (webAuthNAccount: Account | undefined) => { set(_state => ({ webAuthNAccount })) },
    devnetConnected: false,
    setDevnetConnected: (devnetConnected: boolean) => { set(_state => ({ devnetConnected })) }
}));
