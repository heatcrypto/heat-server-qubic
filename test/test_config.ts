import { MonitoredRequest, CallContext, createLogger } from 'heat-server-common';

/// Qubic
export const testConfig = {
  protocol: 'https',
  host: 'qubic.tulipfox.com'
}

export function createContext(label?: string) {
  let { host, protocol } = testConfig;
  let logger = createLogger()
  let context: CallContext = {
    host,
    protocol,
    logger,
    req: new MonitoredRequest(logger, label ? label : '')
  }
  return context
}

