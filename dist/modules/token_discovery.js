"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenDiscovery = void 0;
const heat_server_common_1 = require("heat-server-common");
const balance_lookup_1 = require("./balance_lookup");
async function tokenDiscovery(context, param) {
    try {
        const { req, protocol, host, logger } = context;
        const { addrXpub, assetType } = param;
        if (assetType != heat_server_common_1.AssetTypes.NATIVE) {
            throw new Error("Only NATIVE token type is supported");
        }
        const data = await (0, balance_lookup_1.getBalanceResponse)(context, addrXpub);
        const value = [];
        value.push({
            assetId: "0",
            assetType: heat_server_common_1.AssetTypes.NATIVE,
            value: (data === null || data === void 0 ? void 0 : data.balance.balance) || "0",
            exists: data.balance.latestIncomingTransferTick != 0 ||
                data.balance.latestOutgoingTransferTick != 0,
        });
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