import { num, type BigNumberish } from "starknet";

export function shortHex64(value:BigNumberish):string{
    const goodLenString=num.toHex64(value);
    return goodLenString?.slice(0, 7)+"..."+goodLenString.slice(-5);
}