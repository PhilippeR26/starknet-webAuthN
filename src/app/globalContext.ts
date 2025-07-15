"use client";
import type { Account } from "starknet";
import { create } from "zustand";
interface GlobalState {
    webAuthNAccount: Account | undefined,
    setWebAuthNAccount: (webAuthNAccount: Account) => void,
}

export const useGlobalContext = create<GlobalState>()(set => ({
    webAuthNAccount: undefined,
    setWebAuthNAccount: (webAuthNAccount: Account) => { set(_state => ({ webAuthNAccount })) }
}));
