"use server";

import type { DatabaseValue, UserStorage } from "@/app/type/types";
import { Redis } from "@upstash/redis";


export async function storePubK(data: UserStorage): Promise<boolean> {
    console.log("store User...");
    console.log("DATABASE_URL=", process.env.KV_REST_API_URL);
    console.log("DATABASE_KEY=", process.env.KV_REST_API_TOKEN);
    // connect to database
    const redis = new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
    });
    // store data
    const toStore: DatabaseValue = {
        userName: data.userName,
        pubKey: data.pubKey,
    };
    try {
        await redis.set(data.id, JSON.stringify(toStore));
        console.log("Stored user:", data);
        return true;
    } catch (error: any) {
        console.error("Error storing user:", error);
        return false;
    }
}


export async function getPubK(id: string): Promise<UserStorage> {
    console.log("get userName=", id);
    console.log("DATABASE_URL=", process.env.KV_REST_API_URL);
    console.log("DATABASE_KEY=", process.env.KV_REST_API_READ_ONLY_TOKEN);
    // connect to database
    const redis = new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_READ_ONLY_TOKEN,
    });
    // read database
    const res = (await redis.get(id) as DatabaseValue);
    console.log(res);
    if (!res) {
        throw new Error("User not found in server!");
    }
    const user: UserStorage = { id, ...res };
    console.log("getPubK...", user);
    return user;
}
