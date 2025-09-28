import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  const [showPrivateKeyModal, setShowPrivateKeyModal] = useState(false);
  const [deploymentResults, setDeploymentResults] = useState<{
    url: string;
    blockId: string;
  } | null>(null);

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
    // Show private key warning modal first
    setShowPrivateKeyModal(true);
  }

  async function proceedWithPublish() {
    try {
      setShowPrivateKeyModal(false);
      setStatus("publishing");
      setToast("");
      
      // Simulate publishing delay
      await sleep(3000);
      
      // Mock successful publish response
      const mockUrl = `https://hackertiger-${Math.random().toString(36).substring(2, 8)}.decentralized.app`;
      const mockBlockId = `0x${Math.random().toString(16).substring(2, 15)}${Math.random().toString(16).substring(2, 15)}`;
      
      const deploymentResults = {
        url: mockUrl,
        blockId: mockBlockId
      };
      
      setDeploymentResults(deploymentResults);
      
      // Store deployment in localStorage
      const deployment = {
        id: crypto.randomUUID(),
        url: mockUrl,
        blockId: mockBlockId,
        repoUrl: githubUrl,
        createdAt: new Date().toISOString(),
        status: "active" as const
      };
      
      const existingDeployments = JSON.parse(localStorage.getItem("starfall-deployments") || "[]");
      const updatedDeployments = [deployment, ...existingDeployments];
      localStorage.setItem("starfall-deployments", JSON.stringify(updatedDeployments));
      
      setStatus("ready");
      setToast(`Successfully deployed to blockchain!`);
      
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
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white overflow-hidden">
        {/* Enhanced background effects */}
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-r from-orange-600/30 to-amber-600/30 blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-r from-fuchsia-600/20 to-purple-600/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-gradient-to-r from-orange-500/10 to-amber-500/10 blur-2xl" />
        </div>

        <div className="relative">
          {/* Hero Section */}
          <div className="container mx-auto px-6 pt-20 pb-12">
            <div className="text-center max-w-4xl mx-auto">
              {/* Brand Header */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <div>
                  <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                    HackerTiger
                  </h1>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="h-1 w-8 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full" />
                    <span className="text-xs uppercase tracking-widest text-orange-300/80 font-medium">Blockchain Hosting</span>
                    <span className="h-1 w-8 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Hero Text */}
              <div className="mb-12">
                <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                  <span className="bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                    Deploy once,
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-orange-300 via-amber-300 to-orange-400 bg-clip-text text-transparent">
                    evolve forever
                  </span>
                </h2>
                <p className="text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
                  Deploy once, Evolve forever. 
                  <span className="text-orange-300"> Zero downtime, infinite possibilities.</span>
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-3 gap-6 mb-16 max-w-3xl mx-auto">
                <div className="group p-6 rounded-2xl border border-white/5 bg-white/5 backdrop-blur hover:bg-white/10 transition-all duration-300">
                  <div className="text-2xl mb-3 group-hover:scale-110 transition-transform">⚡</div>
                  <h3 className="font-semibold text-orange-300 mb-2">Lightning Fast</h3>
                  <p className="text-sm text-white/60">Deploy in seconds with our optimized blockchain infrastructure</p>
                </div>
                <div className="group p-6 rounded-2xl border border-white/5 bg-white/5 backdrop-blur hover:bg-white/10 transition-all duration-300">
                  <div className="text-2xl mb-3 group-hover:scale-110 transition-transform">🔒</div>
                  <h3 className="font-semibold text-orange-300 mb-2">Ultra Secure</h3>
                  <p className="text-sm text-white/60">Your code will be scanned by AI agent to prevent data leak or any security threat</p>
                </div>
                <div className="group p-6 rounded-2xl border border-white/5 bg-white/5 backdrop-blur hover:bg-white/10 transition-all duration-300">
                  <div className="text-2xl mb-3 group-hover:scale-110 transition-transform">🚀</div>
                  <h3 className="font-semibold text-orange-300 mb-2">Auto Scale</h3>
                  <p className="text-sm text-white/60">Handles millions of users without breaking a sweat</p>
                </div>
              </div>

              {/* CTA Section */}
              <div className="max-w-md mx-auto">
                <div className="rounded-3xl border border-orange-400/20 bg-gradient-to-br from-orange-500/10 to-amber-500/10 backdrop-blur p-8 shadow-2xl shadow-orange-500/20">
                  <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-orange-300 to-amber-300 bg-clip-text text-transparent">
                    Ready to Transform Your Deployment?
                  </h3>
                  
                  <button
                    onClick={handleGoogle}
                    disabled={authLoading}
                    className="group w-full inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-4 text-lg font-semibold shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 disabled:opacity-50 transform hover:scale-105"
                  >
                    <svg width="20" height="20" viewBox="0 0 48 48">
                      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C33.412,6.053,28.973,4,24,4C12.955,4,4,12.955,4,24 s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,19.001,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C33.412,6.053,28.973,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                      <path fill="#4CAF50" d="M24,44c4.874,0,9.292-1.865,12.636-4.915l-5.842-4.942C28.78,35.523,26.497,36,24,36 c-5.202,0-9.619-3.33-11.283-7.967l-6.537,5.036C9.48,39.556,16.227,44,24,44z"/>
                      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.236-2.231,4.166-4.106,5.582 c0.001-0.001,0.002-0.001,0.003-0.002l5.842,4.942C36.727,39.611,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                    </svg>
                    Start Your Journey
                    <span className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">→</span>
                  </button>

                  {toast && (
                    <div className="mt-4 rounded-2xl border border-orange-400/20 bg-orange-500/10 p-3 text-sm text-orange-100">
                      {toast}
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t border-white/10">
                    <button
                      onClick={handleTestMode}
                      className="w-full text-sm text-white/50 hover:text-orange-300 transition-colors duration-300"
                    >
                      → Try Demo Mode (No Login Required)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom accent */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-400/50 to-transparent" />
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
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white text-sm font-bold">
              🐅
            </span>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">HackerTiger</h1>
            <span className="ml-2 rounded-full border border-orange-400/30 bg-orange-400/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-orange-300">Beta</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/70">Welcome, {user.name}</span>
            <Link 
              to="/deployments"
              className="text-sm text-white/70 hover:text-white transition"
            >
              My Deployments
            </Link>
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
        <section className="mx-auto max-w-3xl rounded-3xl border border-orange-400/20 bg-gradient-to-br from-orange-500/5 to-amber-500/5 backdrop-blur p-8 shadow-2xl shadow-orange-500/10">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent mb-2">Link your repository</h2>
            <p className="text-white/60">Only your URL is sent. Keys, IPFS, and blockchain stay on the server.</p>
          </div>

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

        {/* Deployment Results Grid */}
        {deploymentResults && (
          <section className="mx-auto mt-6 max-w-3xl">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Deployment URL Card */}
              <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-orange-400">
                      <path d="M12 2l8 5v10l-8 5-8-5V7l8-5z" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M8 12l4-4 4 4" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold">Deployment URL</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sky-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                    <span className="font-mono text-sm break-all">{deploymentResults.url}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
                    <span className="text-emerald-400 text-sm font-medium">Live static</span>
                  </div>
                </div>
              </div>

              {/* Blockchain Block ID Card */}
              <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-purple-400">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.5"/>
                      <circle cx="12" cy="12" r="1" fill="currentColor"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold">Blockchain Block ID</h3>
                </div>
                <div className="font-mono text-sm text-white/80 break-all">
                  {deploymentResults.blockId}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Private Key Warning Modal */}
        {showPrivateKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur">
            <div className="max-w-md w-full rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-6 shadow-2xl">
              <div className="text-center mb-6">
                <div className="h-16 w-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-yellow-400">
                    <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <h2 className="text-xl font-semibold mb-2">Private Key Generated</h2>
                <p className="text-white/70 text-sm mb-4">
                  A unique private key has been generated for your deployment. 
                </p>
              </div>
              
              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4 mb-6">
                <div className="font-mono text-sm text-center text-yellow-400 mb-2">
                  pk_7f9e2a1b8c3d4e5f6789abc...
                </div>
                <p className="text-xs text-white/60 text-center">
                  ⚠️ Please remember this key carefully. You'll need it to manage your deployment.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPrivateKeyModal(false)}
                  className="flex-1 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-medium text-white/70 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={proceedWithPublish}
                  className="flex-1 rounded-2xl bg-sky-400 px-4 py-3 text-sm font-medium text-black hover:brightness-95 transition"
                >
                  I've Noted It, Deploy
                </button>
              </div>
            </div>
          </div>
        )}

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