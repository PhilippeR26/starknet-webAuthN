// for 18 decimals tokens
export function convertAmount(amount: string): bigint {
    let decimal: string = "";
    if (amount.includes(".")) { decimal = "." };
    if (amount.includes(",")) { decimal = "," };
    if (decimal == "") {
        throw new Error("Wrong format of amount.");
    }
    const decimalPos = amount.indexOf(decimal);
    const left = amount.slice(0, decimalPos); console.log({ left });
    const right = amount.slice(decimalPos + 1); console.log({ right });
    const posValue = right.search(/[1-9]/);; console.log({ posValue });
    let rightValue: bigint = 0n;
    if (posValue != -1) { rightValue = BigInt(right) * 10n ** (17n - BigInt(posValue)) }
    const qty = BigInt(left) * 10n ** 18n + rightValue;
    return qty;
}