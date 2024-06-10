"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionStatus = void 0;
const heat_server_common_1 = require("heat-server-common");
const network_status_1 = require("./network_status");
async function getTransactionStatusResponse(context, txId) {
    const { req, protocol, host, logger } = context;
    const url = `${protocol}://${host}/v1/transactions/${txId}`;
    const json = await req.get(url, null, [200]);
    const transaction = (0, heat_server_common_1.tryParse)(json, logger);
    return transaction;
}
async function getTransactionStatusResult(context, txId) {
    const transactionStatus = await getTransactionStatusResponse(context, txId);
    const tickStatus = await (0, network_status_1.geStatusResponse)(context);
    const confirmations = tickStatus.lastProcessedTick.tickNumber - transactionStatus.transaction.tickNumber;
    return {
        confirmations,
        isAccepted: true,
    };
}
async function transactionStatus(context, param) {
    try {
        const { transactionId } = param;
        const transactionStatus = await getTransactionStatusResult(context, transactionId);
        if (transactionStatus) {
            return {
                value: transactionStatus
            };
        }
        return {
            value: {
                isAccepted: false,
                confirmations: 0,
            },
        };
    }
    catch (e) {
        return {
            error: e.message,
        };
    }
}
exports.transactionStatus = transactionStatus;
//# sourceMappingURL=transaction_status.js.map