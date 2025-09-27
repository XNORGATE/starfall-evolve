import React, { useState } from "react";

/**
 * Self‑Evolved Web Host — Frontend Shell (UI‑only, no secrets)
 * Scope per request: FRONTEND does ONLY
 *   1) Google OAuth (redirect to backend)
 *   2) GitHub repo URL input + submit to backend validator
 * All crypto, keygen, IPFS, blockchain live on BACKEND.
 *
 * Replace placeholder endpoints with your server routes:
 *   - GET  /api/auth/google (OAuth redirect)
 *   - POST /api/validate { url }
 *   - POST /api/publish  { url }  (optional trigger)
 */

// ---- Small helpers ----
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function StarfallApp() {
  const [githubUrl, setGithubUrl] = useState("");
  const [status, setStatus] = useState("idle"); // idle | validating | ready | error | publishing
  const [verdict, setVerdict] = useState(null); // { ok, score, reasons }
  const [toast, setToast] = useState("");

  const disabled = !githubUrl || status === "validating" || status === "publishing";

  async function handleGoogle() {
    // Real app: redirect to your backend OAuth endpoint
    window.location.href = "/api/auth/google";
  }

  async function handleValidate() {
    try {
      setStatus("validating");
      setToast("");
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: githubUrl.trim() }),
      });
      if (!res.ok) throw new Error("Validator unavailable");
      const data = await res.json();
      setVerdict(data);
      setStatus(data.ok ? "ready" : "error");
      if (!data.ok) setToast(data?.reasons?.[0] || "Validation failed");
    } catch (e: any) {
      setStatus("error");
      setToast(e.message || "Something went wrong");
    }
  }

  async function handlePublish() {
    try {
      setStatus("publishing");
      setToast("");
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: githubUrl.trim() }),
      });
      if (!res.ok) throw new Error("Publish failed");
      const data = await res.json();
      setToast(`Published ✓  CID: ${data?.cid ?? "(pending)"}`);
      setStatus("ready");
    } catch (e: any) {
      setStatus("error");
      setToast(e.message || "Publish error");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
      {/* Glow background accents */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl" />
      </div>

      <header className="relative">
        <div className="mx-auto max-w-6xl px-4 py-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3l7 4v10l-7 4-7-4V7l7-4z" stroke="currentColor" strokeWidth="1.5"/></svg>
            </span>
            <h1 className="text-lg font-semibold tracking-tight">Self‑Evolved Host</h1>
            <span className="ml-2 rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/70">MVP</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleGoogle}
              className="group inline-flex items-center gap-2 rounded-2xl bg-white text-black px-3 py-2 text-sm font-medium shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.18)] transition"
            >
              <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C33.412,6.053,28.973,4,24,4C12.955,4,4,12.955,4,24 s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,19.001,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C33.412,6.053,28.973,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c4.874,0,9.292-1.865,12.636-4.915l-5.842-4.942C28.78,35.523,26.497,36,24,36 c-5.202,0-9.619-3.33-11.283-7.967l-6.537,5.036C9.48,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.236-2.231,4.166-4.106,5.582 c0.001-0.001,0.002-0.001,0.003-0.002l5.842,4.942C36.727,39.611,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
              Continue with Google
              <span className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition text-xs">→</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 pb-16">
        {/* Stepper */}
        <ol className="mx-auto my-6 flex max-w-3xl items-center justify-between text-xs text-white/70">
          <li className="flex items-center gap-2"><span className="h-5 w-5 rounded-full bg-emerald-500 text-black grid place-items-center">1</span> Connect Google</li>
          <div className="h-px flex-1 bg-gradient-to-r from-white/10 via-white/30 to-white/10 mx-2" />
          <li className="flex items-center gap-2"><span className="h-5 w-5 rounded-full bg-sky-500 text-black grid place-items-center">2</span> Paste GitHub URL</li>
          <div className="h-px flex-1 bg-gradient-to-r from-white/10 via-white/30 to-white/10 mx-2" />
          <li className="flex items-center gap-2"><span className="h-5 w-5 rounded-full bg-fuchsia-500 text-black grid place-items-center">3</span> Request Validate / Publish</li>
        </ol>

        {/* Card */}
        <section className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-2xl">
          <h2 className="text-xl font-semibold tracking-tight">Link your repository</h2>
          <p className="mt-1 text-sm text-white/70">Only your URL is sent. Keys, IPFS, and blockchain stay on the server.</p>

          <div className="mt-4 flex gap-2">
            <input
              type="url"
              inputMode="url"
              placeholder="https://github.com/owner/repo"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm placeholder-white/40 outline-none focus:ring-2 focus:ring-white/30"
            />
            <button
              onClick={handleValidate}
              disabled={disabled}
              className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${disabled ? "bg-white/10 text-white/40" : "bg-emerald-400 text-black hover:brightness-95"}`}
            >
              Validate
            </button>
          </div>

          {/* Status area */}
          <div className="mt-4">
            {status === "idle" && (
              <p className="text-sm text-white/60">Awaiting input…</p>
            )}
            {status === "validating" && (
              <div className="flex items-center gap-2 text-sm text-white/80">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Running AI checks…
              </div>
            )}
            {verdict && (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="text-xs text-white/50">Verdict</div>
                  <div className={`mt-1 inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs ${verdict.ok ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${verdict.ok ? "bg-emerald-400" : "bg-rose-400"}`} />
                    {verdict.ok ? "Valid" : "Rejected"}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="text-xs text-white/50">AI score</div>
                  <div className="mt-1 text-base font-medium">{Number(verdict.score ?? 0).toFixed(2)}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="text-xs text-white/50">Top reason</div>
                  <div className="mt-1 text-sm text-white/80">{verdict?.reasons?.[0] ?? "—"}</div>
                </div>
              </div>
            )}

            {toast && (
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/10 p-3 text-sm text-white/90">
                {toast}
              </div>
            )}
          </div>

          {/* Primary actions */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              onClick={handlePublish}
              disabled={status !== "ready"}
              className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${status === "ready" ? "bg-sky-400 text-black hover:brightness-95" : "bg-white/10 text-white/40"}`}
            >
              Request Publish
            </button>
            <span className="text-xs text-white/50">Backend will handle IPFS + blockchain. No secrets in the browser.</span>
          </div>
        </section>

        {/* FAQ mini */}
        <section className="mx-auto mt-6 max-w-3xl text-sm text-white/70">
          <details className="group rounded-2xl border border-white/10 bg-white/5 p-4">
            <summary className="cursor-pointer list-none font-medium text-white">
              Why only URL + Google on the frontend?
              <span className="ml-2 text-xs text-white/40 group-open:hidden">(tap to expand)</span>
            </summary>
            <div className="mt-2 text-white/70">
              To avoid secret leakage. All key derivation, permutations, and on‑chain ops are server‑side.
            </div>
          </details>
        </section>
      </main>

      <footer className="relative mx-auto max-w-6xl px-4 pb-10 text-center text-xs text-white/40">
        © {new Date().getFullYear()} Self‑Evolved Host — UI shell
      </footer>
    </div>
  );
}
