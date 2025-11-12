import type { BigNumberish, CairoCustomEnum, Uint256 } from "starknet";

export type WebAuthNUser = {
  userName: string,
  origin: BigNumberish[],
  originText: string,
  rpId: string,
  rp_id_hash: BigNumberish,
  credentialId: Uint8Array,
  pubKey: BigNumberish,
};

export type WebAuthNSignature = {
  cross_origin: boolean,
  client_data_json_outro: BigNumberish[],
  flags: number,
  sign_count: number,
  ec_signature: { r: Uint256; s: Uint256; y_parity: boolean },
  sha256_implementation: CairoCustomEnum;
}

export type UserStorage = {
  id: string,
  userName: string,
  pubKey: string,
}
