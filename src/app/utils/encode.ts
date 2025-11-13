/**
 * 
 * @param hex Convert a hex string (without 0x) to an Uint8Array
 * @returns 
 */
export function hex2Uint8Array(hex: string): Uint8Array {
    return new Uint8Array(
        hex
            .match(/.{1,2}/g)!
            .map((byte) => parseInt(byte, 16)),
    );
}

export function findInArray(dataToFind: Uint8Array, arrayToIterate: Uint8Array): number {
    return arrayToIterate.findIndex((_, i) => {
        const slice = arrayToIterate.slice(i, i + dataToFind.length);
        return dataToFind.toString() === slice.toString();
    });
};

export function typedArrayToBuffer(array: Uint8Array): ArrayBuffer {
    console.log("typedArrayToBuffer. input =", array);
    const a = array.buffer.slice(array.byteOffset, array.byteLength + array.byteOffset) as ArrayBuffer;
    console.log("typedArrayToBuffer. output =", a);
    return a
}
