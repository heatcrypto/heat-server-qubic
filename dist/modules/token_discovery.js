"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenDiscovery = exports.assetDiscovery = void 0;
const heat_server_common_1 = require("heat-server-common");
const balance_lookup_1 = require("./balance_lookup");
const token = `
eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJJZCI6ImEzMzJiZTZmLTdkNGMtNDk4Ny05ZjBiLWJlODAzMGE5MmIwZCIsInN1YiI6Imd1ZXN0QHF1YmljLmxpIiwianRpIjoiYzhmYWZiNmYtNDU0MS00NjFiLWJjMTctNjFmY2ZlYzAzZjJjIiwiUHVibGljIjoiIiwibmJmIjoxNzE2MTE5Mzk4LCJleHAiOjE3MTYyMDU3OTgsImlhdCI6MTcxNjExOTM5OCwiaXNzIjoiaHR0cHM6Ly9xdWJpYy5saS8iLCJhdWQiOiJodHRwczovL3F1YmljLmxpLyJ9.uC9Kq8J1aIDf4SxdxFgbS_MT8GmpyGO0YjSOtPRuLTkb4fQfNbtVbD2ozTVkGhn_eSSluJVLgaI-Cvv_AI_Cbg
`.trim();
async function assetDiscovery(context, address) {
    const uri = `https://api.qubic.li/Wallet/Assets`;
    const { req, protocol, host, logger } = context;
    const json = await req.post(uri, {
        body: JSON.stringify([address]),
        headers: {
            "Content-Type": "application/json",
            'Authorization': 'Bearer ' + token
        },
    });
    const data = (0, heat_server_common_1.tryParse)(json, logger);
    return data;
}
exports.assetDiscovery = assetDiscovery;
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