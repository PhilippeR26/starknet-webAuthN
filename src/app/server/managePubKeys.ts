"use server";

import { createClient } from '@supabase/supabase-js'
import type { UserStorage } from "@/app/type/types";


export async function storePubK(data: UserStorage): Promise<boolean> {
    console.log("store User...");
    console.log("DATABASE_URL=", process.env.DATABASE_URL);
    console.log("SUPABASE_KEY=", process.env.SUPABASE_KEY);

    // connect to database
    const supabase = createClient(process.env.DATABASE_URL ?? "", process.env.SUPABASE_KEY ?? "", {});
    // connect an authorized database user
    const { data: dataUser } = await supabase.auth.signInWithPassword({
        email: process.env.SUPABASE_USER_EMAIL??"",
        password: process.env.SUPABASE_USER_PWD??"",
    });
    console.log("dataUser=", dataUser.user);
    // store data
    const { error } = await supabase
        .from('webauthnUsers')
        .insert(data);
    if (error) {
        console.error("Error storing user:", error);
        return false;
    }
    return true;
}

export async function getPubK(id: string): Promise<UserStorage> {
    console.log("get userName=", id);
    console.log("DATABASE_URL=", process.env.DATABASE_URL);
    console.log("SUPABASE_KEY=", process.env.SUPABASE_KEY);
    // connect to database
    const supabase = createClient(process.env.DATABASE_URL ?? "", process.env.SUPABASE_KEY ?? "");
    // read database
    const { data: filtered, error } = await supabase.from("webauthnUsers").select().eq("id", id);
    if (filtered == null || filtered.length == 0) {
        throw new Error("User not found in server!");
    }
    if (error) {
        throw new Error("Error reading user:", error);
    }
    console.log("getPubK...", filtered[0]);
    return filtered[0] as Promise<UserStorage>;
}
