// for 18 decimals tokens
export function convertAmount(amount: string): bigint {
    const decimals=18n;
    let decimal: string = "";
    if (amount.includes(".")) { decimal = "." };
    if (amount.includes(",")) { decimal = "," };
    if (decimal == "") {
        amount.concat(".0");
        decimal = ".";
    }
    const decimalPos = amount.indexOf(decimal);
    const left = amount.slice(0, decimalPos); 
    const right = amount.slice(decimalPos + 1); 
    const posValue = right.search(/[1-9]/); 
    let rightValue: bigint = 0n;
    if (posValue != -1) { rightValue = BigInt(right) * 10n ** (decimals -1n - BigInt(posValue)) }
    const qty = BigInt(left) * 10n ** decimals + rightValue;
    console.log({qty});
    return qty;
}