"use server";

import type { UserStorage } from "@/app/type/types";
import { createClient } from "@libsql/client";

function getClient() {
    return createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });
}

export async function storePubK(data: UserStorage): Promise<boolean> {
    const client = getClient();
    try {
        await client.execute({
            sql: "INSERT OR REPLACE INTO users (id, userName, pubKey) VALUES (?, ?, ?)",
            args: [data.id, data.userName, data.pubKey],
        });
        return true;
    } catch (error: any) {
        console.error("Error storing user:", error);
        return false;
    }
}

export async function getPubK(id: string): Promise<UserStorage> {
    const client = getClient();
    const result = await client.execute({
        sql: "SELECT userName, pubKey FROM users WHERE id = ?",
        args: [id],
    });
    if (result.rows.length === 0) {
        throw new Error("User not found in server!");
    }
    const row = result.rows[0];
    return { id, userName: row.userName as string, pubKey: row.pubKey as string };
}
