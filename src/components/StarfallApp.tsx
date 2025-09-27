import React, { useState, useEffect } from "react";
import { signInWithGoogle, signOutUser, onAuthStateChanged } from "@/lib/firebase";

/**
 * Self‑Evolved Web Host — Frontend Shell (UI‑only, no secrets)
 * Scope per request: FRONTEND does ONLY
 *   1) Google OAuth (Firebase Auth)
 *   2) GitHub repo URL input + validation + submit to backend validator
 * All crypto, keygen, IPFS, blockchain live on BACKEND.
 *
 * Replace placeholder endpoints with your server routes:
 *   - Firebase Auth for Google login
 *   - POST /api/validate { url, token?, userEmail }
 *   - POST /api/publish  { url, token?, userEmail }
 */

// ---- Small helpers ----
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function StarfallApp() {
  // Auth state
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [testMode, setTestMode] = useState(false);
  
  // Form state
  const [githubUrl, setGithubUrl] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [isPrivateRepo, setIsPrivateRepo] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | validating | ready | error | publishing
  const [verdict, setVerdict] = useState<any>(null); // { ok, score, reasons }
  const [toast, setToast] = useState("");

  const disabled = !githubUrl || status === "validating" || status === "publishing" || (isPrivateRepo && !githubToken);

  // Check auth status on mount and listen for changes
  useEffect(() => {
    if (testMode) {
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || 'User',
          uid: firebaseUser.uid
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        setUser(null);
        localStorage.removeItem('user');
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [testMode]);

  // Auto-validate GitHub URL when it changes
  useEffect(() => {
    const autoValidate = async () => {
      if (githubUrl && githubUrl.includes('github.com') && status === "idle") {
        // Add small delay to avoid rapid API calls
        const timeoutId = setTimeout(() => {
          handleValidate();
        }, 1000);
        
        return () => clearTimeout(timeoutId);
      }
    };

    autoValidate();
  }, [githubUrl, githubToken]);

  async function handleGoogle() {
    try {
      setAuthLoading(true);
      setToast("");
      
      const result = await signInWithGoogle();
      
      if (result.success) {
        setToast("Successfully logged in with Google!");
        // User state will be updated by the auth listener
      } else {
        setToast(result.error || "Google login failed. Please try again.");
      }
    } catch (error: any) {
      setToast("Google login failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  function handleTestMode() {
    setTestMode(true);
    setUser({
      email: "test@example.com",
      name: "Test User"
    });
    setAuthLoading(false);
    setToast("Test mode activated!");
  }

  async function handleLogout() {
    if (testMode) {
      // Reset test mode
      setTestMode(false);
      setUser(null);
      setGithubUrl("");
      setGithubToken("");
      setIsPrivateRepo(false);
      setStatus("idle");
      setVerdict(null);
      setToast("");
      return;
    }

    try {
      const result = await signOutUser();
      if (result.success) {
        // Reset all form state
        setGithubUrl("");
        setGithubToken("");
        setIsPrivateRepo(false);
        setStatus("idle");
        setVerdict(null);
        setToast("");
      } else {
        setToast("Logout failed. Please try again.");
      }
    } catch (error: any) {
      setToast("Logout failed. Please try again.");
    }
  }

  async function validateGitHubRepo(url: string, token?: string) {
    try {
      // Extract owner/repo from URL
      const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) throw new Error("Invalid GitHub URL format");
      
      const [, owner, repo] = match;
      const cleanRepo = repo.replace(/\.git$/, "");
      
      // Check if repo exists and is accessible
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `token ${token}`;
      }
      
      const response = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`, {
        headers
      });
      
      if (response.status === 404) {
        // 404 could mean either the repo doesn't exist or it's private and we don't have access
        if (!token) {
          // Try to determine if it might be a private repo by checking if the user exists
          const userResponse = await fetch(`https://api.github.com/users/${owner}`);
          if (userResponse.ok) {
            // User exists, so repo is likely private
            return {
              isPrivate: true,
              isValid: false,
              requiresToken: true,
              repoData: null
            };
          } else {
            throw new Error("Repository or user not found");
          }
        } else {
          throw new Error("Repository not found or access denied");
        }
      }
      
      if (!response.ok) {
        throw new Error("Failed to access repository");
      }
      
      const repoData = await response.json();
      return {
        isPrivate: repoData.private,
        isValid: true,
        repoData
      };
    } catch (error: any) {
      throw new Error(error.message || "Repository validation failed");
    }
  }

  async function handleValidate() {
    try {
      setStatus("validating");
      setToast("");
      
      // First validate GitHub repo access
      const repoValidation = await validateGitHubRepo(githubUrl.trim(), githubToken || undefined);
      
      // Check if repo requires access token (likely private)
      if (repoValidation.requiresToken && !githubToken) {
        setIsPrivateRepo(true);
        setStatus("idle");
        setToast("This repository appears to be private. Please provide a GitHub access token to access it.");
        return;
      }
      
      // Reset private repo flag since we got a successful response
      setIsPrivateRepo(false);
      
      // Check if repo is confirmed private but we have a token
      if (repoValidation.isPrivate && !githubToken) {
        setIsPrivateRepo(true);
        setStatus("idle");
        setToast("This is a private repository. Please provide a GitHub access token.");
        return;
      }

      // Simulate validation delay
      await sleep(2000);
      
      // Mock validation response based on repo data
      const mockValidation = {
        ok: true,
        score: 0.85,
        reasons: ["Repository structure looks good", "Contains valid project files", repoValidation.isPrivate ? "Private repository accessible with token" : "Public repository accessible"]
      };

      setVerdict(mockValidation);
      setStatus(mockValidation.ok ? "ready" : "error");
      setToast(mockValidation.ok ? "Repository validated successfully!" : mockValidation.reasons[0]);
      
    } catch (e: any) {
      setStatus("error");
      setToast(e.message || "Something went wrong");
      // Don't automatically assume it's private based on error messages
    }
  }

  async function handlePublish() {
    try {
      setStatus("publishing");
      setToast("");
      
      // Simulate publishing delay
      await sleep(3000);
      
      // Mock successful publish response
      const mockCID = "Qm" + Math.random().toString(36).substring(2, 15);
      setToast(`Published ✓  CID: ${mockCID}`);
      setStatus("ready");
      
    } catch (e: any) {
      setStatus("error");
      setToast(e.message || "Publish error");
    }
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white flex items-center justify-center">
        <div className="flex items-center gap-2 text-white/70">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          Loading...
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
        {/* Glow background accents */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-fuchsia-600/20 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl" />
        </div>

        <div className="relative flex min-h-screen items-center justify-center px-4">
          <div className="mx-auto max-w-md">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 3l7 4v10l-7 4-7-4V7l7-4z" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </span>
                <h1 className="text-2xl font-semibold tracking-tight">Self‑Evolved Host</h1>
              </div>
              <h2 className="text-xl font-medium mb-2">Welcome to the Future</h2>
              <p className="text-white/70 text-sm">
                Authenticate with Google to access blockchain hosting for your repositories.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-2xl">
              <button
                onClick={handleGoogle}
                disabled={authLoading}
                className="group w-full inline-flex items-center justify-center gap-3 rounded-2xl bg-white text-black px-6 py-4 text-base font-medium shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.18)] transition disabled:opacity-50"
              >
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C33.412,6.053,28.973,4,24,4C12.955,4,4,12.955,4,24 s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,19.001,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C33.412,6.053,28.973,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                  <path fill="#4CAF50" d="M24,44c4.874,0,9.292-1.865,12.636-4.915l-5.842-4.942C28.78,35.523,26.497,36,24,36 c-5.202,0-9.619-3.33-11.283-7.967l-6.537,5.036C9.48,39.556,16.227,44,24,44z"/>
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.236-2.231,4.166-4.106,5.582 c0.001-0.001,0.002-0.001,0.003-0.002l5.842,4.942C36.727,39.611,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                </svg>
                Continue with Google
                <span className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition text-sm">→</span>
              </button>

              {toast && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/10 p-3 text-sm text-white/90">
                  {toast}
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-white/10">
                <button
                  onClick={handleTestMode}
                  className="w-full text-sm text-white/50 hover:text-white/70 transition"
                >
                  → Use Test Mode (Skip Google Login)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main app interface when logged in
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
            <span className="text-sm text-white/70">Welcome, {user.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-white/70 hover:text-white transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 pb-16">
        {/* Stepper */}
        <ol className="mx-auto my-6 flex max-w-3xl items-center justify-between text-xs text-white/70">
          <li className="flex items-center gap-2"><span className="h-5 w-5 rounded-full bg-emerald-500 text-black grid place-items-center">✓</span> Connected Google</li>
          <div className="h-px flex-1 bg-gradient-to-r from-white/10 via-white/30 to-white/10 mx-2" />
          <li className="flex items-center gap-2"><span className="h-5 w-5 rounded-full bg-sky-500 text-black grid place-items-center">2</span> Paste GitHub URL</li>
          <div className="h-px flex-1 bg-gradient-to-r from-white/10 via-white/30 to-white/10 mx-2" />
          <li className="flex items-center gap-2"><span className="h-5 w-5 rounded-full bg-fuchsia-500 text-black grid place-items-center">3</span> Request Validate / Publish</li>
        </ol>

        {/* Card */}
        <section className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-2xl">
          <h2 className="text-xl font-semibold tracking-tight">Link your repository</h2>
          <p className="mt-1 text-sm text-white/70">Only your URL is sent. Keys, IPFS, and blockchain stay on the server.</p>

          <div className="mt-4 space-y-3">
            <div className="flex gap-2">
              <input
                type="url"
                inputMode="url"
                placeholder="https://github.com/owner/repo"
                value={githubUrl}
                onChange={(e) => {
                  setGithubUrl(e.target.value);
                  setIsPrivateRepo(false);
                  setStatus("idle");
                  setVerdict(null);
                  setToast("");
                }}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm placeholder-white/40 outline-none focus:ring-2 focus:ring-white/30"
              />
              {status === "validating" && (
                <div className="flex items-center justify-center px-4 py-3 rounded-2xl bg-emerald-400/20">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                </div>
              )}
            </div>

            {/* GitHub Token Input for Private Repos */}
            {isPrivateRepo && (
              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-yellow-400">
                    <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                  <span className="text-sm font-medium text-yellow-400">Private Repository Detected</span>
                </div>
                <p className="text-xs text-white/70 mb-3">
                  This repository is private. Please provide a GitHub personal access token to validate it.
                </p>
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm placeholder-white/40 outline-none focus:ring-2 focus:ring-yellow-400/50"
                />
                <p className="text-xs text-white/50 mt-2">
                  <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline">
                    Generate a personal access token →
                  </a>
                </p>
              </div>
            )}
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
        © {new Date().getFullYear()} Self‑Evolved Host — Connected as {user.email}
      </footer>
    </div>
  );
}