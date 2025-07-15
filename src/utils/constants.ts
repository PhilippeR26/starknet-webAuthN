import { RpcProvider } from "starknet";

export const addrSTRK = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
export const addrETH = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
export const addrTEST = "0x07394cBe418Daa16e42B87Ba67372d4AB4a5dF0B05C6e554D158458Ce245BC10";
export const addrLORDtestnet = "0x019c92fa87f4d5e3bE25C3DD6a284f30282a07e87cd782f5Fd387B82c8142017";
export const addrLORDmainnet = "0x0124aeb495b947201f5faC96fD1138E326AD86195B98df6DEc9009158A533B49";
export const myFrontendProviders: RpcProvider[] = [
    new RpcProvider({ nodeUrl: "https://starknet-mainnet.public.blastapi.io/rpc/v0_8" }),
    new RpcProvider({ nodeUrl: "https://starknet-testnet.public.blastapi.io/rpc/v0_8" }),
    // new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_7"}),
    new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_8" }),
];
export const ReadyAccountClassHash = "0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f";

export const email = "myUser@gmail.com";
export const rpId = "localhost";
export const devnetAddress = "0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691";
export const devnetPrivK = "0x0000000000000000000000000000000071d7bb07b9a64f6f78ac4c816aff4da9";
export const devnetProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc", specVersion: "0.7.1" });
