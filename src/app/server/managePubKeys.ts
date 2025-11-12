"use server";

import type { UserStorage } from "@/app/type/types";
import { json } from "starknet";
import fs from "fs";


export async function storeUser(data: UserStorage): Promise<boolean> {
    console.log("store User...");
    try {
        const stored = json.parse(fs.readFileSync("./src/app/server/pubKeysStorage.json").toString("ascii")) as UserStorage[];
        // const stored:UserStorage[]=[];
        stored.push(data);
        fs.writeFileSync("./src/app/server/pubKeysStorage.json", json.stringify(stored, undefined, 2));
        return true;
    } catch (error) {
        console.error("Error storing user:", error);
        return false;
    }
}

export async function getPrivKey(id: string): Promise<UserStorage> {
    // "id": "7m874c2KRBTFbaV2Z0SPMg"
    // const pubKeyExample = "0x5e09ec0d31c9d9ca8889d730489eb02bf316515642f6a1547437b3cffdd89cee";
    // const userName = "toto1";
    console.log("get userName=", id);
    const stored = json.parse(fs.readFileSync("./src/app/server/pubKeysStorage.json").toString("ascii")) as UserStorage[];
    const filtered = stored.find((user) => user.id === id);
    if (filtered === undefined) {
        throw new Error("User not found in server!");
    }
    console.log("getPrivKey...", filtered);
    return filtered;
}
