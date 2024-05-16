"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.networkStatus = exports.getTickDataResponse = exports.getLatestTickResponse = void 0;
const heat_server_common_1 = require("heat-server-common");
async function getLatestTickResponse(context) {
    const { req, protocol, host, logger } = context;
    const url = `${protocol}://${host}/v1/latestTick`;
    const json = await req.get(url);
    const data = (0, heat_server_common_1.tryParse)(json, logger);
    return data;
}
exports.getLatestTickResponse = getLatestTickResponse;
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
        const latestTick = await getLatestTickResponse(context);
        const tickData = await getTickDataResponse(context, latestTick.latestTick);
        const timestamp = parseInt(tickData.tickData.timestamp);
        return {
            value: {
                lastBlockTime: new Date(timestamp),
                lastBlockHeight: latestTick.latestTick,
                lastBlockId: `${latestTick.latestTick}`,
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