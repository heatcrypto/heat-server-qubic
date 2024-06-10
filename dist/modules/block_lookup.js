"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockLookup = exports.getApprovedTransactionsResponse = void 0;
const heat_server_common_1 = require("heat-server-common");
const INPUT_TYPE_TRANSFER = 0;
const INPUT_TYPE_SEND_MANY = 1;
async function getApprovedTransactionsResponse(context, tickNumber) {
    const { req, protocol, host, logger } = context;
    const url = `${protocol}://${host}/v1/ticks/${tickNumber}/approved-transactions`;
    const json = await req.get(url, null, [200]);
    const data = (0, heat_server_common_1.tryParse)(json, logger);
    return data;
}
exports.getApprovedTransactionsResponse = getApprovedTransactionsResponse;
function extractTransfers(response) {
    const result = [];
    for (const transaction of response.approvedTransactions) {
        if (transaction.inputType == INPUT_TYPE_TRANSFER) {
            result.push(extractStandardTransfer(transaction));
        }
        else {
            const { destId, inputType, inputSize, inputHex } = transaction;
            if (destId ===
                "EAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVWRF" &&
                inputType === INPUT_TYPE_SEND_MANY &&
                inputSize === 1000 &&
                inputHex) {
                result.push(...extractSendManyTransfers(transaction));
            }
        }
    }
    return result;
}
function extractStandardTransfer(transaction) {
    return {
        transactionId: transaction.txId,
        timestamp: null,
        assetType: heat_server_common_1.AssetTypes.NATIVE,
        assetId: "0",
        sender: transaction.sourceId,
        recipient: transaction.destId,
        value: transaction.amount,
    };
}
function extractSendManyTransfers(transaction) {
    return [];
}
async function blockLookup(context, param) {
    try {
        const { blockchain, height } = param;
        const data = await getApprovedTransactionsResponse(context, height);
        const result = {
            blockchain,
            height,
            timestamp: null,
            transfers: extractTransfers(data),
        };
        return {
            value: result,
        };
    }
    catch (e) {
        return {
            error: e.message,
        };
    }
}
exports.blockLookup = blockLookup;
//# sourceMappingURL=block_lookup.js.map