// Offline queue: checks that could not reach the FHIR server are kept on the device and sent later.
import type { CheckInput } from "../core/questions";
import type { FhirStore } from "../core/store";
import type { TrustFlag } from "../core/trust";
import { submitCheck } from "../core/workflow";
import { siteByCode } from "./data";

const KEY = "streamlink.outbox.v1";

export interface Queued {
  siteCode: string;
  input: CheckInput;
  flags: TrustFlag[];
  target: string;
}

export function readOutbox(): Queued[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function write(q: Queued[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(q));
  } catch {
    /* ignore */
  }
}

export function enqueue(item: Queued) {
  write([...readOutbox(), item]);
}

/** Tries to send every queued check; returns how many were sent. */
export async function flushOutbox(store: FhirStore, target: string): Promise<number> {
  const q = readOutbox();
  const keep: Queued[] = [];
  let sent = 0;
  for (const item of q) {
    const site = siteByCode(item.siteCode);
    if (!site || item.target !== target) {
      keep.push(item);
      continue;
    }
    try {
      await submitCheck(store, site, item.input, item.flags);
      sent++;
    } catch {
      keep.push(item);
    }
  }
  write(keep);
  return sent;
}
