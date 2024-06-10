import {
  tryParse,
  CallContext,
  ModuleResponse,
  BlockLookupParam,
  BlockLookupResult,
  BlockLookupTransfer,
  AssetTypes,
} from "heat-server-common";
// import { qubicReady } from "heat-wallet-qubic/dist/bundle.cjs";

const INPUT_TYPE_TRANSFER = 0;
const INPUT_TYPE_SEND_MANY = 1;

export interface ApprovedTransactionsResponse {
  approvedTransactions: Array<TransactionObject>;
}

interface TransactionObject {
  sourceId: string;
  destId: string;
  amount: string;
  tickNumber: number;
  // type 0 is normal transfer, type 1 multi transfer
  inputType: number;
  inputSize: number;
  inputHex: string;
  signatureHex: string;
  txId: string;
}

export async function getApprovedTransactionsResponse(
  context: CallContext,
  tickNumber: number
): Promise<ApprovedTransactionsResponse> {
  const { req, protocol, host, logger } = context;
  const url = `${protocol}://${host}/v1/ticks/${tickNumber}/approved-transactions`;
  const json = await req.get(url, null, [200]);
  const data: ApprovedTransactionsResponse = tryParse(json, logger);
  return data;
}

function extractTransfers(
  response: ApprovedTransactionsResponse
): Array<BlockLookupTransfer> {
  const result: Array<BlockLookupTransfer> = [];
  for (const transaction of response.approvedTransactions) {
    if (transaction.inputType == INPUT_TYPE_TRANSFER) {
      result.push(extractStandardTransfer(transaction));
    } else {
      const { destId, inputType, inputSize, inputHex } = transaction;
      if (
        destId ===
          "EAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVWRF" &&
        inputType === INPUT_TYPE_SEND_MANY &&
        inputSize === 1000 &&
        inputHex
      ) {
        result.push(...extractSendManyTransfers(transaction));
      }
    }
  }
  return result;
}

function extractStandardTransfer(
  transaction: TransactionObject
): BlockLookupTransfer {
  return {
    transactionId: transaction.txId,
    timestamp: null,
    assetType: AssetTypes.NATIVE,
    assetId: "0",
    sender: transaction.sourceId,
    recipient: transaction.destId,
    value: transaction.amount,
  };
}

// Not supported yet
function extractSendManyTransfers(
  transaction: TransactionObject
): Array<BlockLookupTransfer> {
  return [];
}

export async function blockLookup(
  context: CallContext,
  param: BlockLookupParam
): Promise<ModuleResponse<BlockLookupResult>> {
  try {
    const { blockchain, height } = param;
    const data = await getApprovedTransactionsResponse(context, height);
    // await qubicReady() /* Enable when we need to parse SendMany */
    const result: BlockLookupResult = {
      blockchain,
      height,
      timestamp: null,
      transfers: extractTransfers(data),
    };
    return {
      value: result,
    };
  } catch (e) {
    return {
      error: e.message,
    };
  }
}
