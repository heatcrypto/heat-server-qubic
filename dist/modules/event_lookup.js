"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventLookup = void 0;
const heat_server_common_1 = require("heat-server-common");
const lodash_1 = require("lodash");
const utils_1 = require("../utils");
const bignumber_js_1 = require("bignumber.js");
const cacheSizeLimit = 1000;
const paginationCache = new utils_1.LRUCache(cacheSizeLimit);
async function getAssetTransactions(context, filter) {
    const { req, protocol, host, logger } = context;
    const { addrXpub, assetIssuer, assetName, endTick, txnIndexStart } = filter;
    const maxTransactions = (0, lodash_1.isNumber)(filter.maxTransactions)
        ? filter.maxTransactions
        : 100;
    const includeFailedTransactions = (0, lodash_1.isBoolean)(filter.includeFailedTransactions)
        ? filter.includeFailedTransactions
        : true;
    let url = `${protocol}://${host}/v2/identities/${addrXpub}/${assetIssuer}/${assetName}/asset-transactions?maxTransactions=${maxTransactions}&includeFailedTransactions=${includeFailedTransactions}`;
    url += `${(0, lodash_1.isNumber)(endTick) ? `&endTick=${endTick}` : ""}`;
    url += `${(0, lodash_1.isNumber)(txnIndexStart) ? `&txnIndexStart=${txnIndexStart}` : ""}`;
    const json = await req.get(url, null, [200]);
    const data = (0, heat_server_common_1.tryParse)(json, logger);
    return data;
}
const createRequestIdForCache = (addrXpub, assetType, assetId) => `${addrXpub}:${assetType}:${assetId}`;
const getAssetIssuerAndAssetName = (assetType, assetId) => {
    if (assetType == heat_server_common_1.AssetTypes.NATIVE) {
        return {
            assetIssuer: "0",
            assetName: "0",
        };
    }
    else if (assetType == heat_server_common_1.AssetTypes.TOKEN_TYPE_1) {
        const parts = assetId.split(":");
        if (parts.length == 2) {
            return {
                assetName: parts[0],
                assetIssuer: parts[1],
            };
        }
    }
    return null;
};
async function eventLookup(context, param) {
    try {
        const { blockchain, assetType, assetId, addrXpub, from, to, minimal } = param;
        const parsedAssetId = getAssetIssuerAndAssetName(assetType, assetId);
        if (!parsedAssetId) {
            return {
                error: "Invalid assetType and or assetId",
            };
        }
        const requestId = createRequestIdForCache(addrXpub, assetType, assetId);
        if (from === 0) {
            paginationCache.set(requestId, {
                nextEndTick: null,
                nextTxnIndexStart: null,
            });
        }
        let cache = paginationCache.get(requestId);
        if (!cache) {
            cache = { nextEndTick: null, nextTxnIndexStart: null };
            paginationCache.set(requestId, cache);
        }
        const filter = {
            addrXpub,
            assetIssuer: parsedAssetId.assetIssuer,
            assetName: parsedAssetId.assetName,
            endTick: cache.nextEndTick,
            txnIndexStart: cache.nextTxnIndexStart,
            maxTransactions: to - from + 1,
            includeFailedTransactions: true,
        };
        const data = await getAssetTransactions(context, filter);
        if (!data ||
            !(0, lodash_1.isNumber)(data.nextEndTick) ||
            !(0, lodash_1.isNumber)(data.nextTxnIndexStart)) {
            return {
                error: "Invalid response",
            };
        }
        paginationCache.set(requestId, {
            nextEndTick: data.nextEndTick,
            nextTxnIndexStart: data.nextTxnIndexStart,
        });
        let value;
        if (minimal) {
            value = data.transactions.map((wrapper) => wrapper.transaction.txId);
        }
        else {
            value = [];
            for (let i = 0; i < data.transactions.length; i++) {
                let txnWrapper = data.transactions[i];
                let events = getEventsFromTransaction(context, txnWrapper, addrXpub);
                events.forEach((event) => {
                    event.data = (0, heat_server_common_1.createEventData)(event);
                });
                const confirmations = data.currentTick - txnWrapper.transaction.tickNumber;
                value.push({
                    timestamp: parseInt(txnWrapper.timestamp),
                    sourceId: txnWrapper.transaction.txId,
                    sourceType: heat_server_common_1.SourceTypes.TRANSACTION,
                    confirmations,
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
function getEventsFromTransaction(context, tx, _addrXpub) {
    try {
        const { logger } = context;
        const events = [];
        const isIncoming = tx.transaction.sourceId != _addrXpub;
        switch (tx.transactionType) {
            case "NATIVE_TRANSFER": {
                if (isIncoming) {
                    const event = (0, heat_server_common_1.buildEventReceive)({ addrXpub: tx.transaction.sourceId, publicKey: "", alias: "" }, heat_server_common_1.AssetTypes.NATIVE, "0", tx.transaction.amount, 0);
                    events.push(event);
                }
                else {
                    const event = (0, heat_server_common_1.buildEventSend)({ addrXpub: tx.transaction.destId, publicKey: "", alias: "" }, heat_server_common_1.AssetTypes.NATIVE, "0", tx.transaction.amount, 0);
                    events.push(event);
                }
                break;
            }
            case "QUTIL_SEND_MANY": {
                if (!tx.qutilSendMany) {
                    logger.warn(`EVENT_LOOKUP invalid response, QUTIL_SEND_MANY missing "qutilSendMany" for ${tx.transaction.txId}`);
                    break;
                }
                if (isIncoming) {
                    for (const transfer of tx.qutilSendMany.transfers) {
                        if (transfer.destId == _addrXpub) {
                            const event = (0, heat_server_common_1.buildEventReceive)({ addrXpub: tx.transaction.sourceId, publicKey: "", alias: "" }, heat_server_common_1.AssetTypes.NATIVE, "0", transfer.amount, 0);
                            events.push(event);
                        }
                    }
                }
                else {
                    let total = new bignumber_js_1.default(0);
                    for (const transfer of tx.qutilSendMany.transfers) {
                        total = total.plus(new bignumber_js_1.default(transfer.amount));
                        const event = (0, heat_server_common_1.buildEventSend)({ addrXpub: transfer.destId, publicKey: "", alias: "" }, heat_server_common_1.AssetTypes.NATIVE, "0", transfer.amount, 0);
                        events.push(event);
                    }
                    let transactionAmount = new bignumber_js_1.default(tx.transaction.amount);
                    let totalFee = transactionAmount.minus(total);
                    const event = (0, heat_server_common_1.buildEventFee)(totalFee.toString(), heat_server_common_1.AssetTypes.NATIVE, "0");
                    events.push(event);
                }
                break;
            }
            case "QX_ASSET_TRANSFER": {
                if (!tx.qxAssetTransfer) {
                    logger.warn(`EVENT_LOOKUP invalid response, QX_ASSET_TRANSFER missing "qxAssetTransfer" for ${tx.transaction.txId}`);
                    break;
                }
                const assetId = `${tx.qxAssetTransfer.assetName}:${tx.qxAssetTransfer.assetIssuer}`;
                if (isIncoming) {
                    const event = (0, heat_server_common_1.buildEventReceive)({ addrXpub: tx.transaction.sourceId, publicKey: "", alias: "" }, heat_server_common_1.AssetTypes.TOKEN_TYPE_1, assetId, tx.qxAssetTransfer.amount, 0);
                    events.push(event);
                }
                else {
                    const event = (0, heat_server_common_1.buildEventSend)({ addrXpub: tx.qxAssetTransfer.destId, publicKey: "", alias: "" }, heat_server_common_1.AssetTypes.TOKEN_TYPE_1, assetId, tx.qxAssetTransfer.amount, 0);
                    events.push(event);
                    events.push((0, heat_server_common_1.buildEventFee)(tx.transaction.amount, heat_server_common_1.AssetTypes.NATIVE, "0"));
                }
                break;
            }
        }
        return events;
    }
    catch (e) {
        this.logger.error(e);
        throw e;
    }
}
//# sourceMappingURL=event_lookup.js.map