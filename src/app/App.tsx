import { useEffect, useState } from "react";
import { Logo } from "./components/Icons";
import { flushOutbox, readOutbox } from "./outbox";
import { go, useApp, useRoute } from "./state";
import { Board } from "./views/Board";
import { CheckIn } from "./views/CheckIn";
import { About, Inbox, Settings } from "./views/Pages";
import { SiteRecordView } from "./views/SiteRecordView";

export function App() {
  const app = useApp();
  const [view, arg] = useRoute();
  const [queued, setQueued] = useState(readOutbox().length);

  useEffect(() => {
    const sync = async () => {
      if (!navigator.onLine || readOutbox().length === 0) return;
      const n = await flushOutbox(app.store, app.mode);
      if (n) {
        app.toast(`${n} queued check${n === 1 ? "" : "s"} sent.`);
        app.refresh();
      }
      setQueued(readOutbox().length);
    };
    sync();
    window.addEventListener("online", sync);
    return () => window.removeEventListener("online", sync);
  }, [app.store, app.mode, app.version]); // eslint-disable-line react-hooks/exhaustive-deps

  let page;
  switch (view) {
    case "check": page = <CheckIn key={arg ?? "pick"} siteCode={arg} />; break;
    case "site": page = <SiteRecordView code={arg} />; break;
    case "inbox": page = <Inbox />; break;
    case "about": page = <About />; break;
    case "settings": page = <Settings />; break;
    case "board": page = <Board cityId={arg ?? "CO"} />; break;
    default: page = app.role === "volunteer" ? <CheckIn key="home" /> : <Board cityId="CO" />;
  }

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className="top">
        <button className="brand" onClick={() => go("/")} aria-label="StreamLink home">
          <Logo />
          <span>StreamLink</span>
        </button>
        <nav aria-label="Main">
          <button className={view === "board" || (!view && app.role === "coordinator") ? "nav-on" : ""} onClick={() => go("/board/CO")}>Board</button>
          <button className={view === "check" || (!view && app.role === "volunteer") ? "nav-on" : ""} onClick={() => go("/check")}>Check a stream</button>
          <button className={view === "inbox" ? "nav-on" : ""} onClick={() => go("/inbox")}>Messages</button>
          <button className={view === "about" ? "nav-on" : ""} onClick={() => go("/about")}>About</button>
        </nav>
        <div className="top-right">
          <div className="role" role="group" aria-label="View as">
            <button aria-pressed={app.role === "volunteer"} onClick={() => app.update({ role: "volunteer" })}>Volunteer</button>
            <button aria-pressed={app.role === "coordinator"} onClick={() => app.update({ role: "coordinator" })}>Coordinator</button>
          </div>
          <button className={`store-pill ${app.mode}`} onClick={() => go("/settings")} title="Where records are stored">
            {app.mode === "oah" ? "OAH FHIR sandbox · live" : "Demo store"}
          </button>
        </div>
      </header>
      {queued > 0 && <div className="banner">{queued} check{queued === 1 ? "" : "s"} waiting to be sent (offline).</div>}
      <main id="main">{page}</main>
      <footer className="foot">
        <span>StreamLink: a prototype for the OneAquaHealth IEEE Global Hackathon 2026. Records use HL7 FHIR R4 and the OneAquaHealth IG.</span>
        <span>Demo checks and lab results are synthetic and labelled as such.</span>
      </footer>
      <div className="toasts" aria-live="polite">
        {app.toasts.map((t) => <div key={t.id} className={`toast toast-${t.tone}`}>{t.text}</div>)}
      </div>
    </>
  );
}
