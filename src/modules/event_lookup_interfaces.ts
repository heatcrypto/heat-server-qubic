export interface QubicTransactionsResponse {
  currentTick: number;
  nextEndTick: number;
  nextTxnIndexStart: number;
  transactions: Array<QubicTransactionsWrapper>;
}

export interface QubicTransactionsWrapper {
  transactionType: "QUTIL_SEND_MANY" | "NATIVE_TRANSFER" | "QX_ASSET_TRANSFER";
  transaction: QubicTransaction;
  timestamp: string;
  moneyFlew: boolean;
  qutilSendMany?: QubicSendManyPayload;
  qxAssetTransfer?: QubicQxAssetTransferPayload;
}

export interface QubicTransaction {
  sourceId: string;
  destId: string;
  amount: string;
  tickNumber: number;
  inputType: number;
  inputSize: number;
  inputHex: string;
  signatureHex: string;
  txId: string;
}

export interface QubicSendManyPayload {
  sourceId: string;
  tickNumber: number;
  transfers: Array<{ destId: string; amount: string }>;
}

export interface QubicQxAssetTransferPayload {
  assetIssuer: string;
  assetName: string;
  sourceId: string;
  destId: string;
  amount: string;
}
