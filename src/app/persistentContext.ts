"use client";
import type { WebAuthNUser } from "@/app/type/types";
import type { Account } from "starknet";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GlobalState {
    userAttestation: WebAuthNUser | undefined,
    setUserAttestation: (userAttestation: WebAuthNUser| undefined) => void,
}

export const usePersistentContext = create(
    persist<GlobalState>(
        (set, get) => (
            {
                userAttestation: undefined,
                setUserAttestation: (userAttestation: WebAuthNUser| undefined) => { set(state => ({ userAttestation })) }
            }
        ),
        {name: "userAttestation"}
    )
);
