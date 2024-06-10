import {
  TokenDiscoveryParam,
  TokenDiscoveryResult,
  CallContext,
  ModuleResponse,
  AssetTypes,
  tryParse,
} from "heat-server-common";
import { getBalanceResponse } from "./balance_lookup";
import { isEmpty } from 'lodash'

// const token = `
// eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJJZCI6ImEzMzJiZTZmLTdkNGMtNDk4Ny05ZjBiLWJlODAzMGE5MmIwZCIsInN1YiI6Imd1ZXN0QHF1YmljLmxpIiwianRpIjoiYzhmYWZiNmYtNDU0MS00NjFiLWJjMTctNjFmY2ZlYzAzZjJjIiwiUHVibGljIjoiIiwibmJmIjoxNzE2MTE5Mzk4LCJleHAiOjE3MTYyMDU3OTgsImlhdCI6MTcxNjExOTM5OCwiaXNzIjoiaHR0cHM6Ly9xdWJpYy5saS8iLCJhdWQiOiJodHRwczovL3F1YmljLmxpLyJ9.uC9Kq8J1aIDf4SxdxFgbS_MT8GmpyGO0YjSOtPRuLTkb4fQfNbtVbD2ozTVkGhn_eSSluJVLgaI-Cvv_AI_Cbg
// `.trim()

// export async function assetDiscovery(context: CallContext, address: string) {
//   const uri = `https://api.qubic.li/Wallet/Assets`
//   const { req, protocol, host, logger } = context;
//   const json = await req.post(uri, {
//     body: JSON.stringify([address]),
//     headers: {
//       "Content-Type": "application/json",
//       'Authorization': 'Bearer ' + token
//     },
//   })
//   const data = tryParse(json, logger);
//   return data
// }

export interface OwnedAssetsResponse {
  ownedAssets: Array<{
    data: {
      ownerIdentity: string,
      type: number,
      padding: number,
      managingContractIndex: number,
      issuanceIndex: number,
      numberOfUnits: string,
      issuedAsset: {
        issuerIdentity: string,
        type: number,
        name: string,
        numberOfDecimalPlaces: number,
        unitOfMeasurement: number[]
      }
    },
    info: {
      tick: number,
      universeIndex: number,
    }
  }>      
}

export async function getOwnedAssetsResponse(context: CallContext, addrXpub: string): Promise<OwnedAssetsResponse> {
  const { req, protocol, host, logger } = context
  const url = `${protocol}://${host}/v1/assets/${addrXpub}/owned`;
  const json = await req.get(url, null, [200]);
  const data: OwnedAssetsResponse = tryParse(json, logger);
  console.log(JSON.stringify(data, null, 2))
  return data;
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
    const balanceData = await getBalanceResponse(context, addrXpub);
    const value = [];
    value.push({
      assetId: "0",
      assetType: AssetTypes.NATIVE,
      value: balanceData?.balance.balance || "0",
      exists:
        balanceData.balance.latestIncomingTransferTick != 0 ||
        balanceData.balance.latestOutgoingTransferTick != 0,
    });
    const assetsData = await getOwnedAssetsResponse(context, addrXpub)
    if (assetsData && !isEmpty(assetsData.ownedAssets)) {
      assetsData.ownedAssets.forEach((assetData) => {

        /// Asset ID is [NAME]:[ISSUER IDENTITY]
        const assetId = `${assetData.data.issuedAsset.name}:${assetData.data.issuedAsset.issuerIdentity}`
        value.push({
          assetId,
          assetType: AssetTypes.TOKEN_TYPE_1,
          value: assetData.data.numberOfUnits || "0",
          exists: true,
        });
      })
    }
    return {
      value,
    };
  } catch (e) {
    return {
      error: e.message,
    };
  }
}
