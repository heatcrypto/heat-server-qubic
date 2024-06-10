import {
  EventLookupParam,
  EventLookupResult,
  tryParse,
  SourceTypes,
  CallContext,
  ModuleResponse,
  createEventData,
  buildEventReceive,
  AssetTypes,
  buildEventSend,
} from "heat-server-common";

const TYPE_PAYMENT = 0;

export interface TransferTransactionsPerTickResponse {
  transferTransactionsPerTick: Array<{
    tickNumber: number;
    identity: string;
    transactions: Array<{
      sourceId: string;
      destId: string;
      amount: string;
      tickNumber: number;
      inputType: number;
      inputSize: number;
      inputHex: string;
      signatureHex: string;
      txId: string;
    }>;
  }>;
}

export interface FlatTransfer {
  tickNumber: number;
  sender: string;
  recipient: string;
  amount: string;
  txId: string;
  type: number;
  timestamp: number;
  confirmations: number;
}

// v1/identities/YROXPGAQMWOWTEFEWUVTGPVUOECCTXZYGMOXHHRBHGCYPOGSYVZLYLOECDZA/transfer-transactions?startTick=13960216&endTick=13960691

async function getTransferTransactionsPerTickResponse(
  context: CallContext,
  addrXpub: string,
  startTick: number,
  endTick: number
) {
  const { req, protocol, host, logger } = context;
  const url = `${protocol}://${host}/v1/identities/${addrXpub}/transfer-transactions?startTick=${startTick}&endTick=${endTick}`;
  const json = await req.get(url, null, [200]);
  const data: TransferTransactionsPerTickResponse = tryParse(json, logger);
  return data;
}

async function getTransfers(
  context: CallContext,
  addrXpub: string,
  startTick: number,
  endTick: number
): Promise<Array<FlatTransfer>> {
  const data = await getTransferTransactionsPerTickResponse(
    context,
    addrXpub,
    startTick,
    endTick
  );
  if (data) {
    const result: Array<FlatTransfer> = [];
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

export async function eventLookup(
  context: CallContext,
  param: EventLookupParam
): Promise<ModuleResponse<Array<EventLookupResult>>> {
  try {
    const { blockchain, assetType, assetId, addrXpub, from, to, minimal } =
      param;
    if (from > 0) {
      return {
        value: [],
      };
    }

    const data = await getTransfers(context, addrXpub, 1, 999999999);

    let value;
    // Go after minimal result
    if (minimal) {
      value = data.map((x) => x.txId);
    }
    // Go after FULL result
    else {
      value = [];
      for (let i = 0; i < data.length; i++) {
        let txData = data[i];
        let events = getEventsFromTransaction(txData, addrXpub);
        events.forEach((event) => {
          event.data = createEventData(event);
        });
        value.push({
          timestamp: txData.timestamp,
          sourceId: txData.txId,
          sourceType: SourceTypes.TRANSACTION,
          confirmations: txData.confirmations,
          events,
        });
      }
    }
    return {
      value,
    };
  } catch (e) {
    return {
      error: e.message,
    };
  }
}

function getEventsFromTransaction(txData: FlatTransfer, _addrXpub) {
  try {
    const isIncoming = txData.recipient == _addrXpub;
    const addrXpub = isIncoming ? txData.sender : txData.recipient;
    const publicKey = "";
    const alias = "";
    const events: any[] = [];
    switch (txData.type) {
      case TYPE_PAYMENT:
        if (isIncoming) {
          const event = buildEventReceive(
            { addrXpub, publicKey, alias },
            AssetTypes.NATIVE,
            "0",
            txData.amount,
            0
          );
          events.push(event);
        } else {
          const event = buildEventSend(
            { addrXpub, publicKey, alias },
            AssetTypes.NATIVE,
            "0",
            txData.amount,
            0
          );
          events.push(event);
        }
        break;
    }

    return events;
  } catch (e) {
    this.logger.error(e);
    throw e;
  }
}
