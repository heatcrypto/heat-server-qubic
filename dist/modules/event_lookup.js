"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventLookup = void 0;
const heat_server_common_1 = require("heat-server-common");
const TYPE_PAYMENT = 0;
async function getTransferTransactionsPerTickResponse(context, addrXpub, startTick, endTick) {
    const { req, protocol, host, logger } = context;
    const url = `${protocol}://${host}/v1/identities/${addrXpub}/transfer-transactions?startTick=${startTick}&endTick=${endTick}`;
    const json = await req.get(url);
    const data = (0, heat_server_common_1.tryParse)(json, logger);
    return data;
}
async function getTransfers(context, addrXpub, startTick, endTick) {
    const data = await getTransferTransactionsPerTickResponse(context, addrXpub, startTick, endTick);
    if (data) {
        const result = [];
        data.transferTransactionsPerTick.forEach((transferTransaction) => {
            transferTransaction.transactions.forEach((transaction) => {
                result.push({
                    tickNumber: transaction.tickNumber,
                    sender: transaction.sourceId,
                    recipient: transaction.destId,
                    amount: transaction.amount,
                    txId: transaction.txId,
                    type: TYPE_PAYMENT,
                    timestamp: 1,
                    confirmations: 1,
                });
            });
        });
        return result;
    }
    return [];
}
async function eventLookup(context, param) {
    try {
        const { blockchain, assetType, assetId, addrXpub, from, to, minimal } = param;
        if (from > 0) {
            return {
                value: [],
            };
        }
        const data = await getTransfers(context, addrXpub, 1, 999999999);
        let value;
        if (minimal) {
            value = data.map((x) => x.txId);
        }
        else {
            value = [];
            for (let i = 0; i < data.length; i++) {
                let txData = data[i];
                let events = getEventsFromTransaction(txData, addrXpub);
                events.forEach((event) => {
                    event.data = (0, heat_server_common_1.createEventData)(event);
                });
                value.push({
                    timestamp: txData.timestamp,
                    sourceId: txData.txId,
                    sourceType: heat_server_common_1.SourceTypes.TRANSACTION,
                    confirmations: txData.confirmations,
                    events,
                });
            }
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
exports.eventLookup = eventLookup;
function getEventsFromTransaction(txData, _addrXpub) {
    try {
        const isIncoming = txData.recipient == _addrXpub;
        const addrXpub = isIncoming ? txData.sender : txData.recipient;
        const publicKey = "";
        const alias = "";
        const events = [];
        switch (txData.type) {
            case TYPE_PAYMENT:
                if (isIncoming) {
                    const event = (0, heat_server_common_1.buildEventReceive)({ addrXpub, publicKey, alias }, heat_server_common_1.AssetTypes.NATIVE, "0", txData.amount, 0);
                    events.push(event);
                }
                else {
                    const event = (0, heat_server_common_1.buildEventSend)({ addrXpub, publicKey, alias }, heat_server_common_1.AssetTypes.NATIVE, "0", txData.amount, 0);
                    events.push(event);
                }
                break;
        }
        return events;
    }
    catch (e) {
        this.logger.error(e);
        throw e;
    }
}
//# sourceMappingURL=event_lookup.js.map