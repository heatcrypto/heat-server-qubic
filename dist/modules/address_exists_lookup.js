"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addressExistsLookup = void 0;
const balance_lookup_1 = require("./balance_lookup");
async function addressExistsLookup(context, param) {
    try {
        const { blockchain, addrXpub } = param;
        const data = await (0, balance_lookup_1.getBalanceResponse)(context, addrXpub);
        if (data) {
            return {
                value: {
                    exists: data.balance.latestIncomingTransferTick != 0 || data.balance.latestOutgoingTransferTick != 0
                },
            };
        }
        else {
            return {
                error: `Unregognized response: ${JSON.stringify(data)}`
            };
        }
    }
    catch (e) {
        return {
            error: e.message,
        };
    }
}
exports.addressExistsLookup = addressExistsLookup;
//# sourceMappingURL=address_exists_lookup.js.map