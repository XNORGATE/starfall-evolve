import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import blockchainApi from "@/services/blockchainApi";
import type { 
  BlockchainStatusResponse, 
  DeploymentResponse, 
  DeploymentHistoryItem 
} from "@/services/blockchainApi";

interface Deployment {
  id: string;
  url: string;
  blockId: string;
  repoUrl: string;
  createdAt: string;
  status: "active" | "updating" | "deleted";
}

export default function DeploymentManager() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [newRepoUrl, setNewRepoUrl] = useState("");
  const [blockchainStatus, setBlockchainStatus] = useState<BlockchainStatusResponse | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  useEffect(() => {
    loadDeployments();
    loadBlockchainStatus();
  }, []);

  const loadDeployments = async () => {
    try {
      // Load from both localStorage (for local state) and Django API (for backend state)
      const stored = localStorage.getItem("starfall-deployments");
      let localDeployments: Deployment[] = stored ? JSON.parse(stored) : [];

      // Also get deployment history from Django backend
      const historyResult = await blockchainApi.getDeploymentHistory();
      if (historyResult.success) {
        // Merge backend deployments with local ones (avoiding duplicates)
        const backendDeployments = historyResult.history.map((item: DeploymentHistoryItem) => ({
          id: item.deployment_id || item.id,
          url: `http://127.0.0.1:9000/${item.deployment_id || item.id}/`,
          blockId: item.full_hash,
          repoUrl: item.repo_url || 'Unknown Repository',
          createdAt: item.created_at,
          status: item.is_active ? "active" as const : "deleted" as const
        })).filter(d => d.repoUrl !== 'Unknown Repository');

        // Combine and deduplicate by ID
        const allDeployments = [...localDeployments];
        backendDeployments.forEach(backendDep => {
          if (!allDeployments.find(d => d.id === backendDep.id)) {
            allDeployments.push(backendDep);
          }
        });

        setDeployments(allDeployments);
        
        // Update localStorage with merged data
        localStorage.setItem("starfall-deployments", JSON.stringify(allDeployments));
      } else {
        // Fallback to localStorage only
        setDeployments(localDeployments);
      }
    } catch (error) {
      console.error("Failed to load deployments:", error);
      // Fallback to localStorage
      const stored = localStorage.getItem("starfall-deployments");
      setDeployments(stored ? JSON.parse(stored) : []);
    }
  };

  const loadBlockchainStatus = async () => {
    try {
      const status = await blockchainApi.getBlockchainStatus();
      setBlockchainStatus(status);
    } catch (error) {
      console.error("Failed to load blockchain status:", error);
    }
  };

  const handleDeploy = async () => {
    if (!newRepoUrl.trim()) {
      toast.error("Please enter a repository URL");
      return;
    }

    if (!newRepoUrl.includes("github.com")) {
      toast.error("Please enter a valid GitHub repository URL");
      return;
    }

    setIsDeploying(true);
    try {
      // First validate the repository
      const validationResult = await blockchainApi.validateRepository(newRepoUrl);
      
      if (!validationResult.success || !validationResult.valid) {
        toast.error(`Repository validation failed: ${validationResult.error || 'Unknown error'}`);
        return;
      }

      // Deploy the repository
      const deployResult = await blockchainApi.deployRepository(newRepoUrl);
      
      if (deployResult.status === 'deployed') {
        const newDeployment: Deployment = {
          id: deployResult.block_hash || `deploy_${Date.now()}`,
          url: deployResult.deployment_url || `https://hackertiger-${Math.random().toString(36).substring(2, 8)}.decentralized.app`,
          blockId: deployResult.block_hash || `0x${Math.random().toString(16).substring(2, 15)}${Math.random().toString(16).substring(2, 15)}`,
          repoUrl: newRepoUrl,
          createdAt: new Date().toISOString(),
          status: "active"
        };

        const updatedDeployments = [...deployments, newDeployment];
        setDeployments(updatedDeployments);
        localStorage.setItem("starfall-deployments", JSON.stringify(updatedDeployments));
        
        toast.success(`🚀 Repository deployed successfully!`);
        setNewRepoUrl("");
      } else if (deployResult.status === 'quarantined') {
        toast.error(`⚠️ Repository quarantined due to security concerns: ${deployResult.error || 'AI validation failed'}`);
      } else {
        toast.error(`❌ Deployment failed: ${deployResult.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Deployment error:", error);
      toast.error(`❌ Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleUpdateRepo = (id: string) => {
    const deployment = deployments.find(d => d.id === id);
    if (deployment) {
      setUpdatingId(id);
      setNewRepoUrl(deployment.repoUrl);
    }
  };

  const saveRepoUpdate = async (id: string) => {
    if (!newRepoUrl.includes('github.com')) {
      toast.error("Please enter a valid GitHub repository URL");
      return;
    }

    // Set status to updating
    const updatingDeployments = deployments.map(d => 
      d.id === id ? { ...d, status: "updating" as const } : d
    );
    setDeployments(updatingDeployments);

    try {
      // Deploy updated repository
      const deployResult = await blockchainApi.deployRepository(newRepoUrl);
      
      if (deployResult.status === 'deployed') {
        const newUrl = deployResult.deployment_url || `https://hackertiger-${Math.random().toString(36).substring(2, 8)}.decentralized.app`;
        const newBlockId = deployResult.block_hash || `0x${Math.random().toString(16).substring(2, 15)}${Math.random().toString(16).substring(2, 15)}`;
        
        const updatedDeployments = deployments.map(d => 
          d.id === id 
            ? { 
                ...d, 
                repoUrl: newRepoUrl, 
                url: newUrl,
                blockId: newBlockId,
                status: "active" as const 
              }
            : d
        );
        
        setDeployments(updatedDeployments);
        localStorage.setItem("starfall-deployments", JSON.stringify(updatedDeployments));
        setUpdatingId(null);
        setNewRepoUrl("");
        toast.success("🔄 Repository updated and redeployed successfully!");
      } else {
        // Reset status on failure
        const resetDeployments = deployments.map(d => 
          d.id === id ? { ...d, status: "active" as const } : d
        );
        setDeployments(resetDeployments);
        toast.error(`❌ Update failed: ${deployResult.error || 'Unknown error'}`);
      }
    } catch (error) {
      // Reset status on error
      const resetDeployments = deployments.map(d => 
        d.id === id ? { ...d, status: "active" as const } : d
      );
      setDeployments(resetDeployments);
      toast.error(`❌ Update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setUpdatingId(null);
      setNewRepoUrl("");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this deployment?")) return;
    
    const updatedDeployments = deployments.filter(d => d.id !== id);
    setDeployments(updatedDeployments);
    localStorage.setItem("starfall-deployments", JSON.stringify(updatedDeployments));
    
    toast.success("🗑️ Deployment deleted");
  };

  const cancelUpdate = () => {
    setUpdatingId(null);
    setNewRepoUrl("");
  };

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
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3l7 4v10l-7 4-7-4V7l7-4z" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </span>
              <h1 className="text-lg font-semibold tracking-tight">Self‑Evolved Host</h1>
            </Link>
            <span className="ml-2 rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/70">
              Deployments
            </span>
          </div>
          <Link 
            to="/"
            className="text-sm text-white/70 hover:text-white transition"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 pb-16">
        {/* Blockchain Status */}
        {blockchainStatus && (
          <Card className="mb-8 bg-white/10 border-white/20 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Blockchain Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Total Blocks:</span>
                  <span className="text-white ml-2 font-mono">
                    {blockchainStatus.blockchain_stats.total_blocks}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Active Block:</span>
                  <span className="text-white ml-2 font-mono">
                    #{blockchainStatus.blockchain_stats.active_block_number}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Block Hash:</span>
                  <span className="text-white ml-2 font-mono text-xs">
                    {blockchainStatus.active_block?.full_hash?.substring(0, 12)}...
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Deploy New Repository */}
        <Card className="mb-8 bg-white/10 border-white/20 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Deploy New Repository</CardTitle>
            <CardDescription className="text-gray-300">
              Enter a GitHub repository URL to deploy with AI-powered security validation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                type="url"
                placeholder="https://github.com/username/repository"
                value={newRepoUrl}
                onChange={(e) => setNewRepoUrl(e.target.value)}
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                disabled={isDeploying}
              />
              <Button 
                onClick={handleDeploy}
                disabled={isDeploying || !newRepoUrl.trim()}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8"
              >
                {isDeploying ? "Deploying..." : "Deploy"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">Your Deployments</h2>
          <p className="text-white/70">Manage your blockchain deployments and URLs</p>
        </div>

        {deployments.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-white/40">
                <path d="M12 2l8 5v10l-8 5-8-5V7l8-5z" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">No deployments yet</h3>
            <p className="text-white/60 mb-4">Deploy your first repository to see it here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {deployments.map((deployment) => (
              <div key={deployment.id} className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Repository Info */}
                  <div>
                    <h3 className="font-semibold mb-2">Repository</h3>
                    {updatingId === deployment.id ? (
                      <div className="space-y-3">
                        <input
                          type="url"
                          value={newRepoUrl}
                          onChange={(e) => setNewRepoUrl(e.target.value)}
                          placeholder="https://github.com/owner/repo"
                          className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-sky-400/50"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveRepoUpdate(deployment.id)}
                            className="rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-medium text-black hover:brightness-95 transition"
                          >
                            Update & Redeploy
                          </button>
                          <button
                            onClick={cancelUpdate}
                            className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-sky-400 font-mono break-all">
                            {deployment.repoUrl}
                          </p>
                          <button
                            onClick={() => handleUpdateRepo(deployment.id)}
                            className="ml-2 text-white/40 hover:text-white transition"
                            title="Update Repository"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke="currentColor" strokeWidth="1.5"/>
                              <path d="M3 3v5h5" stroke="currentColor" strokeWidth="1.5"/>
                              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" stroke="currentColor" strokeWidth="1.5"/>
                              <path d="M21 21v-5h-5" stroke="currentColor" strokeWidth="1.5"/>
                            </svg>
                          </button>
                        </div>
                        <p className="text-xs text-white/50">
                          Deployed {new Date(deployment.createdAt).toLocaleDateString()}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Deployment Details */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Deployment URL */}
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-orange-400">
                            <path d="M12 2l8 5v10l-8 5-8-5V7l8-5z" stroke="currentColor" strokeWidth="1.5"/>
                          </svg>
                          <span className="text-sm font-medium">Deployment URL</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${
                            deployment.status === "updating" ? "bg-orange-400 animate-pulse" :
                            deployment.status === "active" ? "bg-emerald-400" : "bg-red-400"
                          }`}></div>
                          <span className={`text-xs font-medium ${
                            deployment.status === "updating" ? "text-orange-400" :
                            deployment.status === "active" ? "text-emerald-400" : "text-red-400"
                          }`}>
                            {deployment.status === "updating" ? "Updating..." : 
                             deployment.status === "active" ? "Live" : "Offline"}
                          </span>
                        </div>
                      </div>
                      
                      <a 
                        href={deployment.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sky-400 font-mono text-sm hover:underline break-all"
                      >
                        {deployment.url}
                      </a>
                    </div>

                    {/* Blockchain Block ID */}
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-purple-400">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                        <span className="text-sm font-medium">Blockchain Block ID</span>
                      </div>
                      <p className="font-mono text-sm text-white/80 break-all">
                        {deployment.blockId}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleDelete(deployment.id)}
                        className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition"
                      >
                        Delete Deployment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
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
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3l7 4v10l-7 4-7-4V7l7-4z" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </span>
              <h1 className="text-lg font-semibold tracking-tight">Self‑Evolved Host</h1>
            </Link>
            <span className="ml-2 rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/70">
              Deployments
            </span>
          </div>
          <Link 
            to="/"
            className="text-sm text-white/70 hover:text-white transition"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">Your Deployments</h2>
          <p className="text-white/70">Manage your blockchain deployments and URLs</p>
        </div>

        {deployments.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-white/40">
                <path d="M12 2l8 5v10l-8 5-8-5V7l8-5z" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">No deployments yet</h3>
            <p className="text-white/60 mb-4">Deploy your first repository to see it here</p>
            <Link 
              to="/"
              className="inline-flex items-center gap-2 rounded-2xl bg-sky-400 text-black px-4 py-2 text-sm font-medium hover:brightness-95 transition"
            >
              Start Deploying
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {deployments.map((deployment) => (
              <div key={deployment.id} className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Repository Info */}
                  <div>
                    <h3 className="font-semibold mb-2">Repository</h3>
                    {updatingId === deployment.id ? (
                      <div className="space-y-3">
                        <input
                          type="url"
                          value={newRepoUrl}
                          onChange={(e) => setNewRepoUrl(e.target.value)}
                          placeholder="https://github.com/owner/repo"
                          className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-sky-400/50"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveRepoUpdate(deployment.id)}
                            className="rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-medium text-black hover:brightness-95 transition"
                          >
                            Update & Redeploy
                          </button>
                          <button
                            onClick={cancelUpdate}
                            className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-sky-400 font-mono break-all">
                            {deployment.repoUrl}
                          </p>
                          <button
                            onClick={() => handleUpdateRepo(deployment.id)}
                            className="ml-2 text-white/40 hover:text-white transition"
                            title="Update Repository"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke="currentColor" strokeWidth="1.5"/>
                              <path d="M3 3v5h5" stroke="currentColor" strokeWidth="1.5"/>
                              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" stroke="currentColor" strokeWidth="1.5"/>
                              <path d="M21 21v-5h-5" stroke="currentColor" strokeWidth="1.5"/>
                            </svg>
                          </button>
                        </div>
                        <p className="text-xs text-white/50">
                          Deployed {new Date(deployment.createdAt).toLocaleDateString()}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Deployment Details */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Deployment URL */}
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-orange-400">
                            <path d="M12 2l8 5v10l-8 5-8-5V7l8-5z" stroke="currentColor" strokeWidth="1.5"/>
                          </svg>
                          <span className="text-sm font-medium">Deployment URL</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
                          <span className="text-emerald-400 text-xs font-medium">
                            {deployment.status === "updating" ? "Updating..." : "Live"}
                          </span>
                        </div>
                      </div>
                      
                      <a 
                        href={deployment.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sky-400 font-mono text-sm hover:underline break-all"
                      >
                        {deployment.url}
                      </a>
                    </div>

                    {/* Blockchain Block ID */}
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-purple-400">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                        <span className="text-sm font-medium">Blockchain Block ID</span>
                      </div>
                      <p className="font-mono text-sm text-white/80 break-all">
                        {deployment.blockId}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleDelete(deployment.id)}
                        className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition"
                      >
                        Delete Deployment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}