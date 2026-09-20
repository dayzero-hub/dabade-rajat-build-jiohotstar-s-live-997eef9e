// Delhivery offline delivery sync — a sync API you can break on purpose.
//
// Three switches, and the third is the one your brief turns on: `failAfterSucceeding` makes the
// server accept a write and THEN report a failure, so a naive retry sends it twice. That is the
// double-send question, and an idempotency key is how you answer it.
import { mockCall, MockApiError } from './client'

export type ParcelStatus = 'assigned' | 'delivered' | 'failed_attempt'

export interface Parcel {
  id: string
  /** Delhivery waybill number, as printed on the label. */
  waybill: string
  consignee: string
  address: string
  pin: string
  /** Cash to collect on delivery, in rupees. 0 = prepaid. */
  codAmountInr: number
  status: ParcelStatus
}

export interface DeliveryUpdate {
  parcelId: string
  status: Exclude<ParcelStatus, 'assigned'>
  /** ISO timestamp from the rider's device — which may be well before it reaches us. */
  recordedAt: string
  note?: string
  /**
   * Your key for this update, stable across retries. The server uses it to recognise a repeat:
   * send the same key twice and the second call is accepted without recording a second delivery.
   */
  idempotencyKey: string
}

/** Flip these from your UI or the console to build the states. */
export const network = {
  /** Every call rejects immediately, the way a rider in a basement sees it. */
  offline: false,
  /** Extra milliseconds on every call, on top of the usual latency. */
  extraDelayMs: 0,
  /** The nasty one: the write lands, then the call reports a failure anyway. */
  failAfterSucceeding: false,
}

export const parcels: Parcel[] = [
  { id: 'p-01', waybill: '3419087654321', consignee: 'Sunita Deshmukh', address: 'Flat 302, Sai Residency, Kharadi',      pin: '411014', codAmountInr: 0,    status: 'assigned' },
  { id: 'p-02', waybill: '3419087654322', consignee: 'Imran Shaikh',    address: '14 Gandhi Road, Camp',                  pin: '411001', codAmountInr: 1299, status: 'assigned' },
  { id: 'p-03', waybill: '3419087654323', consignee: 'Priya Nair',      address: 'B-7, Silver Oak Society, Baner',        pin: '411045', codAmountInr: 0,    status: 'assigned' },
  { id: 'p-04', waybill: '3419087654324', consignee: 'Rakesh Yadav',    address: 'Shop 3, Market Yard',                   pin: '411037', codAmountInr: 640,  status: 'assigned' },
  { id: 'p-05', waybill: '3419087654325', consignee: 'Meena Kulkarni',  address: '21 Tulsi Baug, Shaniwar Peth',          pin: '411030', codAmountInr: 0,    status: 'assigned' },
  { id: 'p-06', waybill: '3419087654326', consignee: 'Abhishek Rao',    address: 'Tower C, 1104, Magarpatta City',        pin: '411028', codAmountInr: 2450, status: 'assigned' },
  { id: 'p-07', waybill: '3419087654327', consignee: 'Farida Bano',     address: '9 Nana Peth, near the masjid',          pin: '411002', codAmountInr: 399,  status: 'assigned' },
  { id: 'p-08', waybill: '3419087654328', consignee: 'Vinod Pawar',     address: 'Row House 4, Sus Road',                 pin: '411021', codAmountInr: 0,    status: 'assigned' },
]

/** What the server has actually recorded, keyed by idempotency key. Inspect it in the console. */
export const recorded = new Map<string, DeliveryUpdate>()

/**
 * Sends one delivery update.
 *
 * - `network.offline` rejects before anything is recorded — safe to retry.
 * - `network.failAfterSucceeding` records it and rejects anyway — NOT safe to retry blindly,
 *   which is the whole point.
 * - A repeated `idempotencyKey` is accepted and recorded once.
 */
export async function syncUpdate(update: DeliveryUpdate, signal?: AbortSignal): Promise<{ accepted: true; duplicate: boolean }> {
  if (network.offline) {
    throw new MockApiError('You are offline. Nothing was sent.', 0)
  }
  return mockCall(() => {
    const duplicate = recorded.has(update.idempotencyKey)
    if (!duplicate) recorded.set(update.idempotencyKey, { ...update })

    if (network.failAfterSucceeding) {
      throw new MockApiError('The update was accepted but the response was lost.', 504)
    }
    return { accepted: true as const, duplicate }
  }, { minLatencyMs: 400 + network.extraDelayMs, maxLatencyMs: 1200 + network.extraDelayMs }, signal)
}

/** How many DISTINCT deliveries the server believes happened. Your double-send check. */
export function recordedCount(parcelId: string): number {
  return [...recorded.values()].filter(u => u.parcelId === parcelId).length
}
