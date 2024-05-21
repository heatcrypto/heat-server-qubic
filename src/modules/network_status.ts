import {
  NetworkStatusParam,
  NetworkStatusResult,
  tryParse,
  CallContext,
  ModuleResponse,
} from "heat-server-common";

export interface LatestTickResponse {
  latestTick: number;
}

export interface TickDataResponse {
  tickData: {
    computorIndex: number;
    epoch: number;
    tickNumber: number;
    timestamp: string /*"1715860924000"*/;
    varStruct: string;
    timeLock: string;
    transactionIds: string[];
    contractFees: [];
    signatureHex: string;
  };
}

export async function getLatestTickResponse(
  context: CallContext
): Promise<LatestTickResponse> {
  const { req, protocol, host, logger } = context;
  const url = `${protocol}://${host}/v1/latestTick`;
  const json = await req.get(url);
  const data: LatestTickResponse = tryParse(json, logger);
  return data;
}

export async function getTickDataResponse(
  context: CallContext,
  tickNumber: number
): Promise<TickDataResponse> {
  const { req, protocol, host, logger } = context;
  const url = `${protocol}://${host}/v1/ticks/${tickNumber}/tick-data`;
  const json = await req.get(url);
  const data: TickDataResponse = tryParse(json, logger);
  return data;
}

export async function networkStatus(
  context: CallContext,
  param: NetworkStatusParam
): Promise<ModuleResponse<NetworkStatusResult>> {
  try {
    const latestTick = await getLatestTickResponse(context);

    // The rpc server/syncer might throw an error when the latest tick has not been procesed yet.
    let timestamp = 0;
    try {
      const tickData = await getTickDataResponse(
        context,
        latestTick.latestTick
      );
      timestamp = parseInt(tickData.tickData.timestamp);
    } catch (e) {
      context.logger.error(e);
    }
    return {
      value: {
        lastBlockTime: new Date(timestamp),
        lastBlockHeight: latestTick.latestTick,
        lastBlockId: `${latestTick.latestTick}`,
      },
    };
  } catch (e) {
    return {
      error: e.message,
    };
  }
}
