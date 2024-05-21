import {
  TokenDiscoveryParam,
  TokenDiscoveryResult,
  CallContext,
  ModuleResponse,
  AssetTypes,
  tryParse,
} from "heat-server-common";
import { getBalanceResponse } from "./balance_lookup";

const token = `
eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJJZCI6ImEzMzJiZTZmLTdkNGMtNDk4Ny05ZjBiLWJlODAzMGE5MmIwZCIsInN1YiI6Imd1ZXN0QHF1YmljLmxpIiwianRpIjoiYzhmYWZiNmYtNDU0MS00NjFiLWJjMTctNjFmY2ZlYzAzZjJjIiwiUHVibGljIjoiIiwibmJmIjoxNzE2MTE5Mzk4LCJleHAiOjE3MTYyMDU3OTgsImlhdCI6MTcxNjExOTM5OCwiaXNzIjoiaHR0cHM6Ly9xdWJpYy5saS8iLCJhdWQiOiJodHRwczovL3F1YmljLmxpLyJ9.uC9Kq8J1aIDf4SxdxFgbS_MT8GmpyGO0YjSOtPRuLTkb4fQfNbtVbD2ozTVkGhn_eSSluJVLgaI-Cvv_AI_Cbg
`.trim()

export async function assetDiscovery(context: CallContext, address: string) {
  const uri = `https://api.qubic.li/Wallet/Assets`
  const { req, protocol, host, logger } = context;
  const json = await req.post(uri, {
    body: JSON.stringify([address]),
    headers: {
      "Content-Type": "application/json",
      'Authorization': 'Bearer ' + token
    },
  })
  const data = tryParse(json, logger);
  return data
}

export async function tokenDiscovery(
  context: CallContext,
  param: TokenDiscoveryParam
): Promise<ModuleResponse<Array<TokenDiscoveryResult>>> {
  try {
    const { req, protocol, host, logger } = context;
    const { addrXpub, assetType } = param;
    if (assetType != AssetTypes.NATIVE) {
      throw new Error("Only NATIVE token type is supported");
    }
    const data = await getBalanceResponse(context, addrXpub);
    const value = [];
    value.push({
      assetId: "0",
      assetType: AssetTypes.NATIVE,
      value: data?.balance.balance || "0",
      exists:
        data.balance.latestIncomingTransferTick != 0 ||
        data.balance.latestOutgoingTransferTick != 0,
    });

    return {
      value,
    };
  } catch (e) {
    return {
      error: e.message,
    };
  }
}
