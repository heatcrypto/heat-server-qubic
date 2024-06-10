import {
  TransactionStatusParam,
  TransactionStatusResult,
  tryParse,
  CallContext,
  ModuleResponse,
} from "heat-server-common";
import { geStatusResponse } from "./network_status";

interface TransactionStatusResponse {
  transaction: {
    sourceId: string;
    destId: string;
    amount: string;
    tickNumber: number;
    inputType: number;
    inputSize: number;
    inputHex: string;
    signatureHex: string;
    txId: string;
  };
}

async function getTransactionStatusResponse(context: CallContext, txId: string): Promise<TransactionStatusResponse> {
  const { req, protocol, host, logger } = context;
  const url = `${protocol}://${host}/v1/transactions/${txId}`;
  const json = await req.get(url, null, [200]);
  const transaction = tryParse(json, logger);
  return transaction
}

async function getTransactionStatusResult(context: CallContext, txId: string): Promise<TransactionStatusResult> {
  const transactionStatus = await getTransactionStatusResponse(context, txId)
  const tickStatus = await geStatusResponse(context)
  const confirmations = tickStatus.lastProcessedTick.tickNumber - transactionStatus.transaction.tickNumber
  return {
    confirmations,
    isAccepted: true,
  }
}

export async function transactionStatus(
  context: CallContext,
  param: TransactionStatusParam
): Promise<ModuleResponse<TransactionStatusResult>> {
  try {
    const { transactionId } = param;
    const transactionStatus = await getTransactionStatusResult(context, transactionId)
    if (transactionStatus) {
      return {
        value: transactionStatus
      }
    }
    return {
      value: {
        isAccepted: false,
        confirmations: 0,
      },
    };
  } catch (e) {
    return {
      error: e.message,
    };
  }
}
