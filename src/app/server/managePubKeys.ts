"use server";

import type { UserStorage } from "@/app/type/types";
import { json } from "starknet";
import fs from "fs";


export async function storePubK(data: UserStorage): Promise<boolean> {
    console.log("store User...");
    try {
        const stored = json.parse(fs.readFileSync("./src/app/server/pubKeysStorage.json").toString("ascii")) as UserStorage[];
        stored.push(data);
        fs.writeFileSync("./src/app/server/pubKeysStorage.json", json.stringify(stored, undefined, 2));
        return true;
    } catch (error) {
        console.error("Error storing user:", error);
        return false;
    }
}

export async function getPubK(id: string): Promise<UserStorage> {
    console.log("get userName=", id);
    const stored = json.parse(fs.readFileSync("./src/app/server/pubKeysStorage.json").toString("ascii")) as UserStorage[];
    const filtered = stored.find((user) => user.id === id);
    if (filtered === undefined) {
        throw new Error("User not found in server!");
    }
    console.log("getPubK...", filtered);
    return filtered;
}
