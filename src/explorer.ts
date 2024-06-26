import { RateLimiterClass, ExplorerMiddleware, ExplorerBase, CreateCoreOptions, MonitoredRequestFactory } from 'heat-server-common'
import { balanceLookup } from './modules/balance_lookup';
import { eventLookup } from './modules/event_lookup';
import { networkStatus } from './modules/network_status';
import { transactionStatus } from './modules/transaction_status'
import { ModuleProvider } from 'heat-server-common/dist/types/module_provider.interface';
import { addressExistsLookup } from './modules/address_exists_lookup';
import { tokenDiscovery } from './modules/token_discovery';
import { broadcast } from './modules/broadcast';
import { blockLookup } from './modules/block_lookup';

/* ------------------- Configuration Start ------------------- */

// Must provide an id for this explorer
const ID = "qubic"

// Must list all exposed/implemented modules 
const modules: ModuleProvider = {
  balanceLookup,
  tokenDiscovery,
  eventLookup,
  networkStatus,
  transactionStatus,
  addressExistsLookup,
  broadcast,
  blockLookup,
}

/* ------------------- Configuration End --------------------- */

export class Explorer extends ExplorerBase {
  constructor(
    protocol: string,
    public host: string,
    public rateLimiter: RateLimiterClass,
    apiKey?: string,
    middleWare?: ExplorerMiddleware,
    createCoreOptions?: CreateCoreOptions,
    monitoredRequestFactory?: MonitoredRequestFactory
  ) {
    super(ID, protocol, host, modules, middleWare, createCoreOptions, monitoredRequestFactory)
  }
}