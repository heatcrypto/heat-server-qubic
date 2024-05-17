"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Explorer = void 0;
const heat_server_common_1 = require("heat-server-common");
const balance_lookup_1 = require("./modules/balance_lookup");
const event_lookup_1 = require("./modules/event_lookup");
const network_status_1 = require("./modules/network_status");
const transaction_status_1 = require("./modules/transaction_status");
const address_exists_lookup_1 = require("./modules/address_exists_lookup");
const token_discovery_1 = require("./modules/token_discovery");
const ID = "qubic";
const modules = {
    balanceLookup: balance_lookup_1.balanceLookup,
    tokenDiscovery: token_discovery_1.tokenDiscovery,
    eventLookup: event_lookup_1.eventLookup,
    networkStatus: network_status_1.networkStatus,
    transactionStatus: transaction_status_1.transactionStatus,
    addressExistsLookup: address_exists_lookup_1.addressExistsLookup,
};
class Explorer extends heat_server_common_1.ExplorerBase {
    constructor(protocol, host, rateLimiter, apiKey, middleWare) {
        super(ID, protocol, host, modules, middleWare);
        this.host = host;
        this.rateLimiter = rateLimiter;
    }
}
exports.Explorer = Explorer;
//# sourceMappingURL=explorer.js.map