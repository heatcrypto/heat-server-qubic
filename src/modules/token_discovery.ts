import {
  TokenDiscoveryParam,
  TokenDiscoveryResult,
  CallContext,
  ModuleResponse,
  AssetTypes,
} from "heat-server-common";
import { getBalanceResponse } from "./balance_lookup";

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
