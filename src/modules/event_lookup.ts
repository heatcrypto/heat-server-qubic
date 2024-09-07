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
  buildEventFee,
} from "heat-server-common";
import { isBoolean, isNumber } from "lodash";
import {
  QubicTransactionsResponse,
  QubicTransactionsWrapper,
} from "./event_lookup_interfaces";
import { LRUCache } from "../utils";
import BigNumber from 'bignumber.js'

// LRU cache for tracking pagination between requests
interface PaginationCache {
  nextEndTick: number | null;
  nextTxnIndexStart: number | null;
}
const cacheSizeLimit = 1000;
const paginationCache = new LRUCache<string, PaginationCache>(cacheSizeLimit);

async function getAssetTransactions(
  context: CallContext,
  filter: {
    addrXpub: string;
    assetIssuer: string;
    assetName: string;
    endTick: number;
    txnIndexStart: number;
    maxTransactions: number;
    includeFailedTransactions: boolean;
  }
) {
  const { req, protocol, host, logger } = context;
  const { addrXpub, assetIssuer, assetName, endTick, txnIndexStart } = filter;
  const maxTransactions = isNumber(filter.maxTransactions)
    ? filter.maxTransactions
    : 100;
  const includeFailedTransactions = isBoolean(filter.includeFailedTransactions)
    ? filter.includeFailedTransactions
    : true;

  let url = `${protocol}://${host}/v2/identities/${addrXpub}/${assetIssuer}/${assetName}/asset-transactions?maxTransactions=${maxTransactions}&includeFailedTransactions=${includeFailedTransactions}`;
  url += `${isNumber(endTick) ? `&endTick=${endTick}` : ""}`;
  url += `${isNumber(txnIndexStart) ? `&txnIndexStart=${txnIndexStart}` : ""}`;
  const json = await req.get(url, null, [200]);
  const data: QubicTransactionsResponse = tryParse(json, logger);
  return data;
}

const createRequestIdForCache = (addrXpub, assetType, assetId) =>
  `${addrXpub}:${assetType}:${assetId}`;
const getAssetIssuerAndAssetName = (
  assetType: AssetTypes,
  assetId: string
): { assetIssuer: string; assetName: string } => {
  if (assetType == AssetTypes.NATIVE) {
    return {
      assetIssuer: "0",
      assetName: "0",
    };
  } else if (assetType == AssetTypes.TOKEN_TYPE_1) {
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

export async function eventLookup(
  context: CallContext,
  param: EventLookupParam
): Promise<ModuleResponse<Array<EventLookupResult>>> {
  try {
    const { blockchain, assetType, assetId, addrXpub, from, to, minimal } =
      param;
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
    if (
      !data ||
      !isNumber(data.nextEndTick) ||
      !isNumber(data.nextTxnIndexStart)
    ) {
      return {
        error: "Invalid response",
      };
    }

    // remember pagination postion for next request
    paginationCache.set(requestId, {
      nextEndTick: data.nextEndTick,
      nextTxnIndexStart: data.nextTxnIndexStart,
    });

    let value;
    // Go after minimal result
    if (minimal) {
      value = data.transactions.map((wrapper) => wrapper.transaction.txId);
    }
    // Go after FULL result
    else {
      value = [];
      for (let i = 0; i < data.transactions.length; i++) {
        let txnWrapper = data.transactions[i];
        let events = getEventsFromTransaction(context, txnWrapper, addrXpub);
        events.forEach((event) => {
          event.data = createEventData(event);
        });
        const confirmations =
          data.currentTick - txnWrapper.transaction.tickNumber;
        value.push({
          timestamp: parseInt(txnWrapper.timestamp),
          sourceId: txnWrapper.transaction.txId,
          sourceType: SourceTypes.TRANSACTION,
          confirmations,
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

function getEventsFromTransaction(
  context: CallContext,
  tx: QubicTransactionsWrapper,
  _addrXpub
) {
  try {
    const { logger } = context;
    const events: any[] = [];
    // txn is incoming if we are NOT the sender
    const isIncoming = tx.transaction.sourceId != _addrXpub;
    switch (tx.transactionType) {
      case "NATIVE_TRANSFER": {
        // Incoming Qubic payment has RECEIVE event
        if (isIncoming) {
          const event = buildEventReceive(
            { addrXpub: tx.transaction.sourceId, publicKey: "", alias: "" },
            AssetTypes.NATIVE,
            "0",
            tx.transaction.amount,
            0
          );
          events.push(event);
        }
        // Outgoing Qubic payment has SEND event
        else {
          const event = buildEventSend(
            { addrXpub: tx.transaction.destId, publicKey: "", alias: "" },
            AssetTypes.NATIVE,
            "0",
            tx.transaction.amount,
            0
          );
          events.push(event);
        }
        break;
      }
      case "QUTIL_SEND_MANY": {
        if (!tx.qutilSendMany) {
          logger.warn(
            `EVENT_LOOKUP invalid response, QUTIL_SEND_MANY missing "qutilSendMany" for ${tx.transaction.txId}`
          );
          break;
        }
        // Incoming SENDMANY has one or more RECEIVE events
        if (isIncoming) {
          for (const transfer of tx.qutilSendMany.transfers) {
            if (transfer.destId == _addrXpub) {
              const event = buildEventReceive(
                { addrXpub: tx.transaction.sourceId, publicKey: "", alias: "" },
                AssetTypes.NATIVE,
                "0",
                transfer.amount,
                0
              );
              events.push(event);
            }
          }
        }
        // Outgoing SENDMANY has many SEND events + 1 Fee event
        else {
          let total = new BigNumber(0);
          for (const transfer of tx.qutilSendMany.transfers) {
            total = total.plus(new BigNumber(transfer.amount))
            const event = buildEventSend(
              { addrXpub: transfer.destId, publicKey: "", alias: "" },
              AssetTypes.NATIVE,
              "0",
              transfer.amount,
              0
            );
            events.push(event);
          }

          let transactionAmount = new BigNumber(tx.transaction.amount)
          let totalFee = transactionAmount.minus(total)
          const event = buildEventFee(totalFee.toString(), AssetTypes.NATIVE, "0");
          events.push(event);
        }
        break;
      }
      case "QX_ASSET_TRANSFER": {
        if (!tx.qxAssetTransfer) {
          logger.warn(
            `EVENT_LOOKUP invalid response, QX_ASSET_TRANSFER missing "qxAssetTransfer" for ${tx.transaction.txId}`
          );
          break;
        }
        const assetId = `${tx.qxAssetTransfer.assetName}:${tx.qxAssetTransfer.assetIssuer}`;
        // Incoming ASSET_TRANSFER has one RECEIVE event
        if (isIncoming) {
          const event = buildEventReceive(
            { addrXpub: tx.transaction.sourceId, publicKey: "", alias: "" },
            AssetTypes.TOKEN_TYPE_1,
            assetId,
            tx.qxAssetTransfer.amount,
            0
          );
          events.push(event);
        }
        // Outgoing ASSET_TRANSFER has one SEND event and one FEE event
        else {
          const event = buildEventSend(
            { addrXpub: tx.qxAssetTransfer.destId, publicKey: "", alias: "" },
            AssetTypes.TOKEN_TYPE_1,
            assetId,
            tx.qxAssetTransfer.amount,
            0
          );
          events.push(event);
          events.push(
            buildEventFee(tx.transaction.amount, AssetTypes.NATIVE, "0")
          );
        }
        break;
      }
    }

    return events;
  } catch (e) {
    this.logger.error(e);
    throw e;
  }
}
