"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenDiscovery = exports.getOwnedAssetsResponse = void 0;
const heat_server_common_1 = require("heat-server-common");
const balance_lookup_1 = require("./balance_lookup");
const lodash_1 = require("lodash");
async function getOwnedAssetsResponse(context, addrXpub) {
    const { req, protocol, host, logger } = context;
    const url = `${protocol}://${host}/v1/assets/${addrXpub}/owned`;
    const json = await req.get(url);
    const data = (0, heat_server_common_1.tryParse)(json, logger);
    return data;
}
exports.getOwnedAssetsResponse = getOwnedAssetsResponse;
async function tokenDiscovery(context, param) {
    try {
        const { req, protocol, host, logger } = context;
        const { addrXpub, assetType } = param;
        if (assetType != heat_server_common_1.AssetTypes.NATIVE) {
            throw new Error("Only NATIVE token type is supported");
        }
        const balanceData = await (0, balance_lookup_1.getBalanceResponse)(context, addrXpub);
        const value = [];
        value.push({
            assetId: "0",
            assetType: heat_server_common_1.AssetTypes.NATIVE,
            value: (balanceData === null || balanceData === void 0 ? void 0 : balanceData.balance.balance) || "0",
            exists: balanceData.balance.latestIncomingTransferTick != 0 ||
                balanceData.balance.latestOutgoingTransferTick != 0,
        });
        const assetsData = await getOwnedAssetsResponse(context, addrXpub);
        if (assetsData && !(0, lodash_1.isEmpty)(assetsData.ownedAssets)) {
            assetsData.ownedAssets.forEach((assetData) => {
                const assetId = `${assetData.data.issuedAsset.name}:${assetData.data.issuedAsset.issuerIdentity}`;
                value.push({
                    assetId,
                    assetType: heat_server_common_1.AssetTypes.TOKEN_TYPE_1,
                    value: assetData.data.numberOfUnits || "0",
                    exists: true,
                });
            });
        }
        return {
            value,
        };
    }
    catch (e) {
        return {
            error: e.message,
        };
    }
}
exports.tokenDiscovery = tokenDiscovery;
//# sourceMappingURL=token_discovery.js.map