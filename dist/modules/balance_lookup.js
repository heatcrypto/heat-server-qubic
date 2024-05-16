"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.balanceLookup = exports.getBalanceResponse = void 0;
const heat_server_common_1 = require("heat-server-common");
async function getBalanceResponse(context, addrXpub) {
    const { req, protocol, host, logger } = context;
    const url = `${protocol}://${host}/v1/balances/${addrXpub}`;
    const json = await req.get(url);
    const data = (0, heat_server_common_1.tryParse)(json, logger);
    return data;
}
exports.getBalanceResponse = getBalanceResponse;
async function balanceLookup(context, param) {
    try {
        const { blockchain, assetType, addrXpub, assetId } = param;
        if (assetType != heat_server_common_1.AssetTypes.NATIVE) {
            return {
                error: 'AssetType not supported'
            };
        }
        const data = await getBalanceResponse(context, addrXpub);
        if (data && data.balance) {
            return {
                value: {
                    value: data.balance.balance,
                    exists: data.balance.latestIncomingTransferTick != 0 || data.balance.latestOutgoingTransferTick != 0
                }
            };
        }
        return {
            error: 'Invalid api response',
        };
    }
    catch (e) {
        return {
            error: e.message,
        };
    }
}
exports.balanceLookup = balanceLookup;
//# sourceMappingURL=balance_lookup.js.map