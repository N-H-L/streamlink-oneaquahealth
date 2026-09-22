// The demo store has to behave like a FHIR server for the operations StreamLink uses, otherwise
// the app would work in the demo and break against a real server (or the other way round).
import { describe, expect, it } from "vitest";
import { NS } from "./constants";
import type { Bundle } from "./fhir";
import { LocalStore, RemoteStore, memoryPersistence } from "./store";

const tx = (entry: Bundle["entry"]): Bundle => ({ resourceType: "Bundle", type: "transaction", entry });
const loc = (code: string) => ({ resourceType: "Location", identifier: [{ system: NS.site, value: code }], name: `Site ${code}`, status: "active", mode: "instance" });

describe("LocalStore", () => {
  it("resolves urn:uuid references inside a transaction", async () => {
    const s = new LocalStore();
    const r = await s.transaction(tx([
      { fullUrl: "urn:uuid:a", resource: loc("C1") as any, request: { method: "POST", url: "Location" } },
      {
        fullUrl: "urn:uuid:b",
        resource: { resourceType: "Observation", status: "final", code: { text: "x" }, subject: { reference: "urn:uuid:a" } } as any,
        request: { method: "POST", url: "Observation" },
      },
    ]));
    const obs = (await s.search("Observation"))[0];
    expect(obs.subject.reference).toBe(r.locations["urn:uuid:a"]);
    expect(obs.subject.reference).toMatch(/^Location\/.+/);
  });

  it("ifNoneExist creates once and reuses afterwards", async () => {
    const s = new LocalStore();
    const entry = (): Bundle["entry"] => [{
      fullUrl: "urn:uuid:a", resource: loc("C1") as any,
      request: { method: "POST", url: "Location", ifNoneExist: `identifier=${NS.site}|C1` },
    }];
    const first = await s.transaction(tx(entry()));
    const second = await s.transaction(tx(entry()));
    expect(await s.search("Location")).toHaveLength(1);
    expect(second.locations["urn:uuid:a"]).toBe(first.locations["urn:uuid:a"]);
  });

  it("PUT updates in place and bumps the version", async () => {
    const s = new LocalStore();
    const { locations } = await s.transaction(tx([{ fullUrl: "urn:uuid:a", resource: loc("C1") as any, request: { method: "POST", url: "Location" } }]));
    const id = locations["urn:uuid:a"].split("/")[1];
    await s.transaction(tx([{ fullUrl: `${s.base}/Location/${id}`, resource: { ...loc("C1"), name: "Renamed" } as any, request: { method: "PUT", url: `Location/${id}` } }]));
    const after = await s.read("Location", id);
    expect(after!.name).toBe("Renamed");
    expect(after!.meta!.versionId).toBe("2");
    expect(await s.search("Location")).toHaveLength(1);
  });

  it("searches by identifier, tag, status and reference, including comma-OR", async () => {
    const s = new LocalStore();
    await s.transaction(tx([
      { fullUrl: "urn:uuid:a", resource: { ...loc("C1"), meta: { tag: [{ system: "http://t", code: "demo" }] } } as any, request: { method: "POST", url: "Location" } },
      { fullUrl: "urn:uuid:b", resource: loc("C2") as any, request: { method: "POST", url: "Location" } },
      { fullUrl: "urn:uuid:c", resource: { resourceType: "Observation", status: "preliminary", code: { text: "x" }, subject: { reference: "urn:uuid:a" } } as any, request: { method: "POST", url: "Observation" } },
      { fullUrl: "urn:uuid:d", resource: { resourceType: "Observation", status: "final", code: { text: "y" }, subject: { reference: "urn:uuid:b" } } as any, request: { method: "POST", url: "Observation" } },
    ]));
    const [a, b] = [(await s.search("Location", { identifier: `${NS.site}|C1` }))[0], (await s.search("Location", { identifier: `${NS.site}|C2` }))[0]];
    expect(await s.search("Location", { _tag: "http://t|demo" })).toHaveLength(1);
    expect(await s.search("Observation", { status: "final" })).toHaveLength(1);
    expect(await s.search("Observation", { subject: `Location/${a.id}` })).toHaveLength(1);
    expect(await s.search("Observation", { subject: `Location/${a.id},Location/${b.id}` })).toHaveLength(2);
    expect(await s.search("Observation", { subject: "Location/none" })).toHaveLength(0);
  });

  it("persists across instances and can be reset", async () => {
    const p = memoryPersistence();
    const s1 = new LocalStore(p);
    await s1.transaction(tx([{ fullUrl: "urn:uuid:a", resource: loc("C1") as any, request: { method: "POST", url: "Location" } }]));
    expect(await new LocalStore(p).search("Location")).toHaveLength(1);
    s1.reset();
    expect(await new LocalStore(p).search("Location")).toHaveLength(0);
  });

  it("rejects anything that is not a transaction bundle", async () => {
    await expect(new LocalStore().transaction({ resourceType: "Bundle", type: "collection", entry: [] })).rejects.toThrow(/transaction/i);
  });
});

describe("RemoteStore", () => {
  const bundle = (entries: any[]) => ({ resourceType: "Bundle", type: "searchset", entry: entries.map((resource) => ({ resource })) });

  it("maps transaction responses back to the request fullUrls", async () => {
    const fetchImpl = (async (_url: string, init: any) => {
      const req = JSON.parse(init.body);
      return new Response(JSON.stringify({
        resourceType: "Bundle", type: "transaction-response",
        entry: req.entry.map((_: any, i: number) => ({ response: { status: "201", location: `Location/${i + 10}/_history/1` } })),
      }), { status: 200 });
    }) as unknown as typeof fetch;
    const s = new RemoteStore("https://example.org/fhir", "test", fetchImpl);
    const r = await s.transaction(tx([{ fullUrl: "urn:uuid:a", resource: loc("C1") as any, request: { method: "POST", url: "Location" } }]));
    expect(r.locations["urn:uuid:a"]).toBe("Location/10");
    expect(s.base).toBe("https://example.org/fhir");
  });

  it("follows paging, returns only the requested type, and bypasses server-side search caching", async () => {
    let calls = 0;
    const seenHeaders: any[] = [];
    const fetchImpl = (async (url: string, init: any) => {
      calls++;
      seenHeaders.push(init?.headers);
      if (calls === 1) {
        const b: any = bundle([{ resourceType: "Location", id: "1" }, { resourceType: "OperationOutcome" }]);
        b.link = [{ relation: "next", url: "https://example.org/fhir/Location?page=2" }];
        return new Response(JSON.stringify(b), { status: 200 });
      }
      expect(url).toContain("page=2");
      return new Response(JSON.stringify(bundle([{ resourceType: "Location", id: "2" }])), { status: 200 });
    }) as unknown as typeof fetch;
    const s = new RemoteStore("https://example.org/fhir", "test", fetchImpl);
    const found = await s.search("Location");
    expect(found.map((r) => r.id)).toEqual(["1", "2"]);
    expect(seenHeaders.every((h) => h["Cache-Control"] === "no-cache")).toBe(true);
  });

  it("turns server errors into a readable message and 404 reads into null", async () => {
    const fail = (async () => new Response(JSON.stringify({ resourceType: "OperationOutcome", issue: [{ diagnostics: "bad reference" }] }), { status: 400 })) as unknown as typeof fetch;
    await expect(new RemoteStore("https://example.org/fhir", "t", fail).search("Location")).rejects.toThrow(/400.*bad reference/);
    const missing = (async () => new Response("", { status: 404 })) as unknown as typeof fetch;
    expect(await new RemoteStore("https://example.org/fhir", "t", missing).read("Location", "x")).toBeNull();
  });

  it("reports an unreachable server instead of throwing a raw network error", async () => {
    const dead = (async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof fetch;
    await expect(new RemoteStore("https://example.org/fhir", "t", dead).search("Location")).rejects.toThrow(/Could not reach the FHIR server/);
  });
});
