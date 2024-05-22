import {
  BroadcastParam,
  BroadcastResult,
  tryParse,
  CallContext,
  ModuleResponse,
} from "heat-server-common";
import { isObjectLike, isNumber } from "lodash";
import { qubicReady, getTransactionId } from "heat-wallet-qubic/dist/bundle.cjs";

interface BroadcastResponse {
  peersBroadcasted: number;
}

async function broadcastTransaction(
  context: CallContext,
  transactionHex: string
) {
  const { req, protocol, host, logger } = context;
  const url = `${protocol}://${host}/v1/broadcast-transaction`;
  const json = await req.post(url, {
    body: JSON.stringify({ encodedTransaction: hexToBase64(transactionHex) }),
  });
  const data: BroadcastResponse = tryParse(json, logger);
  return data;
}

/**
 * @param context 
 * @param param 
 * @returns 
 */
export async function broadcast(
  context: CallContext,
  param: BroadcastParam
): Promise<ModuleResponse<BroadcastResult>> {
  try {
    const { req, protocol, host, logger } = context;
    const { transactionHex } = param;
    const data = await broadcastTransaction(context, transactionHex)
    if (isObjectLike(data) && isNumber(data.peersBroadcasted)) {
      await qubicReady()
      const transactionId = getTransactionId({transactionAsHex: transactionHex})
      return {
        value: {
          transactionId: transactionId,
          coinSpecificResult: {
            peersBroadcasted: data.peersBroadcasted
          }
        },
      };
    } else {
      return {
        value: {
          errorMessage: 'Failed',
        },
      };
    }
  } catch (e) {
    return {
      error: e.message,
    };
  }
}

function hexToBase64(hexString) {
  // Convert the hex string to a byte array
  const byteArray = new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

  // Create a string from the byte array
  let binaryString = '';
  byteArray.forEach((byte) => {
      binaryString += String.fromCharCode(byte);
  });

  // Convert the binary string to a Base64 string
  return btoa(binaryString);
}