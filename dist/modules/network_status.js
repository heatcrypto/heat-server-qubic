"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.networkStatus = exports.getTickDataResponse = exports.geStatusResponse = void 0;
const heat_server_common_1 = require("heat-server-common");
async function geStatusResponse(context) {
    const { req, protocol, host, logger } = context;
    const url = `${protocol}://${host}/v1/status`;
    const json = await req.get(url);
    const data = (0, heat_server_common_1.tryParse)(json, logger);
    return data;
}
exports.geStatusResponse = geStatusResponse;
async function getTickDataResponse(context, tickNumber) {
    const { req, protocol, host, logger } = context;
    const url = `${protocol}://${host}/v1/ticks/${tickNumber}/tick-data`;
    const json = await req.get(url);
    const data = (0, heat_server_common_1.tryParse)(json, logger);
    return data;
}
exports.getTickDataResponse = getTickDataResponse;
async function networkStatus(context, param) {
    try {
        const status = await geStatusResponse(context);
        let timestamp = 0;
        try {
            const tickData = await getTickDataResponse(context, status.lastProcessedTick.tickNumber);
            timestamp = parseInt(tickData.tickData.timestamp);
        }
        catch (e) {
            context.logger.error(e);
        }
        return {
            value: {
                lastBlockTime: new Date(timestamp),
                lastBlockHeight: status.lastProcessedTick.tickNumber,
                lastBlockId: `${status.lastProcessedTick.tickNumber}`,
            },
        };
    }
    catch (e) {
        return {
            error: e.message,
        };
    }
}
exports.networkStatus = networkStatus;
//# sourceMappingURL=network_status.js.map