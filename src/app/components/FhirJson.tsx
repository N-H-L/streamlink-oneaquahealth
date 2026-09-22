import { useState } from "react";

/** Collapsible view of the exact FHIR JSON, with copy and download. */
export function FhirJson({ title, data }: { title: string; data: unknown }) {
  const [open, setOpen] = useState(false);
  const text = JSON.stringify(data, null, 2);
  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: "application/fhir+json" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "streamlink-fhir.json" });
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="fhir">
      <button className="fhir-toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="fhir-tag">FHIR R4</span> {title} <span aria-hidden="true">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <>
          <div className="row fhir-actions">
            <button className="btn ghost small" onClick={() => navigator.clipboard?.writeText(text)}>Copy</button>
            <button className="btn ghost small" onClick={download}>Download</button>
          </div>
          <pre className="json" tabIndex={0}>{text}</pre>
        </>
      )}
    </div>
  );
}
