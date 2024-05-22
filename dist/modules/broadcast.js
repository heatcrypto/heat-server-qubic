"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcast = void 0;
const heat_server_common_1 = require("heat-server-common");
const lodash_1 = require("lodash");
const bundle_cjs_1 = require("heat-wallet-qubic/dist/bundle.cjs");
async function broadcastTransaction(context, transactionHex) {
    const { req, protocol, host, logger } = context;
    const url = `${protocol}://${host}/v1/broadcast-transaction`;
    const json = await req.post(url, {
        body: JSON.stringify({ encodedTransaction: hexToBase64(transactionHex) }),
    });
    const data = (0, heat_server_common_1.tryParse)(json, logger);
    return data;
}
async function broadcast(context, param) {
    try {
        const { req, protocol, host, logger } = context;
        const { transactionHex } = param;
        const data = await broadcastTransaction(context, transactionHex);
        if ((0, lodash_1.isObjectLike)(data) && (0, lodash_1.isNumber)(data.peersBroadcasted)) {
            await (0, bundle_cjs_1.qubicReady)();
            const transactionId = (0, bundle_cjs_1.getTransactionId)({ transactionAsHex: transactionHex });
            return {
                value: {
                    transactionId: transactionId,
                    coinSpecificResult: {
                        peersBroadcasted: data.peersBroadcasted
                    }
                },
            };
        }
        else {
            return {
                value: {
                    errorMessage: 'Failed',
                },
            };
        }
    }
    catch (e) {
        return {
            error: e.message,
        };
    }
}
exports.broadcast = broadcast;
function hexToBase64(hexString) {
    const byteArray = new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    let binaryString = '';
    byteArray.forEach((byte) => {
        binaryString += String.fromCharCode(byte);
    });
    return btoa(binaryString);
}
//# sourceMappingURL=broadcast.js.map