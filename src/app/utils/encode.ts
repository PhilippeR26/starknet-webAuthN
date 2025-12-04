/**
 * 
 * @param hex Convert a hex string (without 0x, with even number of characters) to an Uint8Array
 * @returns 
 */
export function hex2Uint8Array(hex: string): Uint8Array<ArrayBuffer> {
    return new Uint8Array(
        hex
            .match(/.{1,2}/g)!
            .map((byte) => parseInt(byte, 16)),
    );
}

export function findInUint8Array(dataToFind: Uint8Array, arrayToIterate: Uint8Array): number {
    return arrayToIterate.findIndex((_, i) => {
        const slice = arrayToIterate.slice(i, i + dataToFind.length);
        return dataToFind.toString() === slice.toString();
    });
};

export function uint8ArrayToArrayBuffer(array: Uint8Array): ArrayBuffer {
    return array.buffer.slice(array.byteOffset, array.byteLength + array.byteOffset) as ArrayBuffer;
}

export function randomBytes(length: number): Uint8Array {
      return new Uint8Array(Array.from({ length }, () => Math.floor(Math.random() * 40)))
    };