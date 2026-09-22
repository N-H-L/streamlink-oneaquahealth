// One interface, two backends:
//  - RemoteStore: any FHIR R4 server (e.g. the OneAquaHealth sandbox), via the standard REST API.
//  - LocalStore: an in-browser demo store that implements the small subset of FHIR REST
//    behaviour StreamLink uses (transactions with urn:uuid + ifNoneExist, read, search).
//    It is NOT a FHIR server; it exists so the demo works offline and without writing to shared servers.
import type { Bundle, Resource } from "./fhir";

export type SearchParams = Record<string, string>;

export interface TransactionResult {
  /** fullUrl in the request bundle → "Type/id" assigned by the server. */
  locations: Record<string, string>;
}

export interface FhirStore {
  readonly kind: "local" | "remote";
  readonly label: string;
  /** Absolute base used for fullUrl of update entries (FHIR requires absolute fullUrls). */
  readonly base: string;
  transaction(bundle: Bundle): Promise<TransactionResult>;
  read(type: string, id: string): Promise<Resource | null>;
  search(type: string, params?: SearchParams): Promise<Resource[]>;
}

export class FhirError extends Error {
  constructor(message: string, readonly status?: number, readonly outcome?: unknown) {
    super(message);
  }
}

// ---------------------------------------------------------------- remote

export class RemoteStore implements FhirStore {
  readonly kind = "remote" as const;
  get base() {
    return this.baseUrl.replace(/\/$/, "");
  }
  constructor(readonly baseUrl: string, readonly label = baseUrl, private readonly fetchImpl: typeof fetch = fetch.bind(globalThis)) {}

  private async req(url: string, init?: RequestInit): Promise<any> {
    let res: Response;
    try {
      res = await this.fetchImpl(url, {
        ...init,
        headers: { Accept: "application/fhir+json", ...(init?.body ? { "Content-Type": "application/fhir+json" } : {}), ...(init?.headers ?? {}) },
        signal: init?.signal ?? AbortSignal.timeout(20000),
      });
    } catch (e: any) {
      throw new FhirError(`Could not reach the FHIR server (${e?.name === "TimeoutError" ? "timed out" : "network error"}).`);
    }
    const text = await res.text();
    const body = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const diag = body?.issue?.map((i: any) => i.diagnostics).filter(Boolean).join("; ");
      throw new FhirError(`FHIR server returned ${res.status}${diag ? `: ${diag}` : ""}`, res.status, body);
    }
    return body;
  }

  async transaction(bundle: Bundle): Promise<TransactionResult> {
    const resp = await this.req(this.baseUrl, { method: "POST", body: JSON.stringify(bundle) });
    const locations: Record<string, string> = {};
    (resp?.entry ?? []).forEach((e: any, i: number) => {
      const loc: string | undefined = e?.response?.location;
      const full = bundle.entry[i]?.fullUrl;
      if (loc && full) locations[full] = loc.replace(/^.*?\/?([A-Z][A-Za-z]+\/[^/]+)(\/_history\/.*)?$/, "$1");
    });
    return { locations };
  }

  async read(type: string, id: string): Promise<Resource | null> {
    try {
      return await this.req(`${this.baseUrl}/${type}/${encodeURIComponent(id)}`);
    } catch (e) {
      if (e instanceof FhirError && (e.status === 404 || e.status === 410)) return null;
      throw e;
    }
  }

  async search(type: string, params: SearchParams = {}): Promise<Resource[]> {
    const qs = new URLSearchParams({ _count: "100", ...params }).toString();
    let url: string | undefined = `${this.baseUrl}/${type}?${qs}`;
    const out: Resource[] = [];
    for (let page = 0; url && page < 10; page++) {
      // Servers may cache search results (HAPI does, for about a minute). Without this, a search
      // made just after writing can return the pre-write result. See EVIDENCE.md 2026-09-23.
      const b: any = await this.req(url, { headers: { "Cache-Control": "no-cache" } });
      for (const e of b?.entry ?? []) if (e.resource?.resourceType === type) out.push(e.resource);
      url = b?.link?.find((l: any) => l.relation === "next")?.url;
    }
    return out;
  }
}

// ---------------------------------------------------------------- local

type Table = Record<string, Record<string, Resource>>;

/** Search parameter → how to read it from a resource (only what StreamLink queries). */
const REF_PATHS: Record<string, string[]> = {
  subject: ["subject"],
  target: ["target"],
  recipient: ["recipient"],
  "based-on": ["basedOn"],
  "derived-from": ["derivedFrom"],
  about: ["about"],
  performer: ["performer"],
  author: ["author"],
};

function refsAt(r: Resource, path: string): string[] {
  const v = r[path];
  const list = Array.isArray(v) ? v : v ? [v] : [];
  return list.map((x: any) => x?.reference).filter(Boolean);
}

function matches(r: Resource, key: string, value: string): boolean {
  const alternatives = value.split(",");
  return alternatives.some((val) => {
    if (key === "_id") return r.id === val;
    if (key === "status") return r.status === val;
    if (key === "identifier") {
      const [sys, v] = val.includes("|") ? val.split("|") : [undefined, val];
      return (r.identifier ?? []).some((i: any) => (sys === undefined || i.system === sys) && i.value === v);
    }
    if (key === "_tag") {
      const [sys, code] = val.split("|");
      return (r.meta?.tag ?? []).some((t: any) => t.system === sys && t.code === code);
    }
    if (key === "code") {
      const [sys, code] = val.includes("|") ? val.split("|") : [undefined, val];
      return (r.code?.coding ?? []).some((c: any) => (sys === undefined || c.system === sys) && c.code === code);
    }
    const paths = REF_PATHS[key];
    if (paths) return paths.some((p) => refsAt(r, p).includes(val));
    return true; // unknown params (e.g. _count, _sort) are ignored
  });
}

function rewriteRefs(node: any, map: Record<string, string>): any {
  if (Array.isArray(node)) return node.map((n) => rewriteRefs(n, map));
  if (node && typeof node === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(node)) {
      out[k] = k === "reference" && typeof v === "string" && map[v] ? map[v] : rewriteRefs(v, map);
    }
    return out;
  }
  return node;
}

export interface Persistence {
  load(): Table | null;
  save(t: Table): void;
}

export const memoryPersistence = (): Persistence => {
  let t: Table | null = null;
  return { load: () => t, save: (x) => (t = x) };
};

export const localStoragePersistence = (key: string): Persistence => ({
  load() {
    try {
      const s = globalThis.localStorage?.getItem(key);
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  },
  save(t) {
    try {
      globalThis.localStorage?.setItem(key, JSON.stringify(t));
    } catch {
      /* storage full or blocked: keep working in memory */
    }
  },
});

export class LocalStore implements FhirStore {
  readonly kind = "local" as const;
  readonly label = "Demo store in this browser";
  readonly base = "https://demo-store.streamlink.invalid/fhir";
  private table: Table;
  private seq = 0;
  constructor(private readonly persistence: Persistence = memoryPersistence()) {
    this.table = persistence.load() ?? {};
    this.seq = Object.values(this.table).reduce((n, t) => n + Object.keys(t).length, 0);
  }

  private nextId() {
    this.seq += 1;
    return `sl-${Date.now().toString(36)}-${this.seq.toString(36)}`;
  }

  private put(r: Resource) {
    (this.table[r.resourceType] ??= {})[r.id!] = r;
  }

  reset() {
    this.table = {};
    this.persistence.save(this.table);
  }

  async transaction(bundle: Bundle): Promise<TransactionResult> {
    if (bundle.type !== "transaction") throw new FhirError("Only transaction bundles are supported");
    const map: Record<string, string> = {};
    const pending: Resource[] = [];
    const now = new Date().toISOString();
    for (const e of bundle.entry) {
      const r = e.resource;
      if (!r || !e.request) throw new FhirError("Transaction entry needs resource and request");
      if (e.request.method === "POST") {
        if (e.request.ifNoneExist) {
          const params = Object.fromEntries(new URLSearchParams(e.request.ifNoneExist));
          const found = await this.search(r.resourceType, params);
          if (found.length > 1) throw new FhirError("ifNoneExist matched more than one resource", 412);
          if (found.length === 1) {
            if (e.fullUrl) map[e.fullUrl] = `${r.resourceType}/${found[0].id}`;
            continue;
          }
        }
        const id = this.nextId();
        if (e.fullUrl) map[e.fullUrl] = `${r.resourceType}/${id}`;
        pending.push({ ...r, id, meta: { ...r.meta, versionId: "1", lastUpdated: now } });
      } else if (e.request.method === "PUT") {
        const [type, id] = e.request.url.split("/");
        const prev = this.table[type]?.[id];
        const version = String(Number(prev?.meta?.versionId ?? 0) + 1);
        if (e.fullUrl) map[e.fullUrl] = `${type}/${id}`;
        pending.push({ ...r, resourceType: type, id, meta: { ...r.meta, versionId: version, lastUpdated: now } });
      } else {
        throw new FhirError(`Unsupported method ${e.request.method}`);
      }
    }
    for (const r of pending) this.put(rewriteRefs(r, map));
    this.persistence.save(this.table);
    return { locations: map };
  }

  async read(type: string, id: string): Promise<Resource | null> {
    return this.table[type]?.[id] ?? null;
  }

  async search(type: string, params: SearchParams = {}): Promise<Resource[]> {
    const all = Object.values(this.table[type] ?? {});
    const out = all.filter((r) => Object.entries(params).every(([k, v]) => matches(r, k, v)));
    return out.sort((a, b) => String(b.meta?.lastUpdated ?? "").localeCompare(String(a.meta?.lastUpdated ?? "")));
  }

  /** Every resource, for export ("download my data as FHIR"). */
  dump(): Resource[] {
    return Object.values(this.table).flatMap((t) => Object.values(t));
  }
}
