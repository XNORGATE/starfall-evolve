// src/services/blockchainApi.ts
export interface BlockchainStats {
  total_blocks: number;
  active_block_id: string;
  active_block_number: number;
}

export interface ActiveBlock {
  id: string;
  full_hash: string;
  number: number;
  created_at: string;
  block_type: string;
  repo_url?: string;
  deployment_id?: string;
}

export interface BlockchainStatusResponse {
  success: boolean;
  blockchain_stats: BlockchainStats;
  active_block: ActiveBlock | null;
  error?: string;
}

export interface DeploymentResponse {
  status: 'deployed' | 'quarantined' | 'deploy_failed' | 'deploy_exception';
  block_hash?: string;
  deployment_url?: string;
  deployment_type?: string;
  ai?: any;
  static?: any;
  error?: string;
}

export interface ValidationResponse {
  success: boolean;
  valid: boolean;
  repo_url: string;
  error?: string;
}

export interface DeploymentHistoryItem {
  id: string;
  full_hash: string;
  number: number;
  created_at: string;
  block_type: string;
  repo_url?: string;
  deployment_id?: string;
  is_active: boolean;
}

export interface DeploymentHistoryResponse {
  success: boolean;
  history: DeploymentHistoryItem[];
  error?: string;
}

class BlockchainApiService {
  // Point the frontend to the Django backend API
  private baseUrl = 'http://127.0.0.1:8000/api';
  private isMonitoringActive = false;
  private activeMonitoringId: string | null = null;

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      ...options,
    };

    try {
      console.log(`Making request to: ${url}`);
      console.log(`Request options:`, defaultOptions);

      const response = await fetch(url, defaultOptions);

      console.log(`Response status: ${response.status}`);
      console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error ${response.status} for ${url}:`, errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`Success response from ${url}:`, data);
      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      // Return mock data for demo purposes since Django backend won't be running
      return this.getMockResponse<T>(endpoint);
    }
  }

  private getMockResponse<T>(endpoint: string): T {
    // Mock responses for demo purposes when Django backend is not available
    switch (endpoint) {
      case '/status/':
        return {
          success: true,
          blockchain_stats: {
            total_blocks: 5,
            active_block_id: 'block_001',
            active_block_number: 5
          },
          active_block: {
            id: 'block_001',
            full_hash: 'a1b2c3d4e5f6',
            number: 5,
            created_at: new Date().toISOString(),
            block_type: 'deployment',
            repo_url: 'https://github.com/example/repo',
            deployment_id: 'deploy_001'
          }
        } as T;
      
      case '/history/':
        return {
          success: true,
          history: [
            {
              id: 'deploy_001',
              full_hash: 'a1b2c3d4e5f6',
              number: 5,
              created_at: new Date().toISOString(),
              block_type: 'deployment',
              repo_url: 'https://github.com/example/repo',
              deployment_id: 'deploy_001',
              is_active: true
            }
          ]
        } as T;
      
      default:
        return { success: false, error: 'Mock response not implemented' } as T;
    }
  }

  async getBlockchainStatus(): Promise<BlockchainStatusResponse> {
    // Django endpoint: GET /api/status/
    return this.makeRequest<BlockchainStatusResponse>('/status/');
  }

  async validateRepository(repoUrl: string): Promise<ValidationResponse> {
    // Django endpoint: POST /api/validate/
    return this.makeRequest<ValidationResponse>('/validate/', {
      method: 'POST',
      body: JSON.stringify({ repo_url: repoUrl })
    });
  }

  async deployRepository(repoUrl: string, commitHash?: string): Promise<DeploymentResponse> {
    // Django endpoint: POST /api/deploy/
    return this.makeRequest<DeploymentResponse>('/deploy/', {
      method: 'POST',
      body: JSON.stringify({ repo_url: repoUrl, commit_hash: commitHash })
    });
  }

  async getDeploymentHistory(): Promise<DeploymentHistoryResponse> {
    // Django endpoint: GET /api/history/
    return this.makeRequest<DeploymentHistoryResponse>('/history/');
  }

  async getDeploymentDetails(deploymentId: string): Promise<DeploymentResponse> {
    // Django endpoint example (if implemented): GET /api/deployment/<id>/
    // Fallback: return not found to avoid misleading UI states
    return { status: 'deploy_failed', error: 'Not implemented' };
  }

  // Real-time monitoring
  async startBlockchainMonitoring(callback: (status: BlockchainStatusResponse) => void): Promise<() => void> {
    // Generate a unique ID for this monitoring instance
    const monitoringId = `monitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (this.isMonitoringActive) {
      console.warn(`Blockchain monitoring already active (ID: ${this.activeMonitoringId}). Ignoring new start request (ID: ${monitoringId})`);
      return () => {}; // Return a no-op function
    }

    this.isMonitoringActive = true;
    this.activeMonitoringId = monitoringId;
    console.log(`Starting blockchain monitoring (ID: ${monitoringId})`);

    let isMonitoring = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const monitor = async () => {
      if (!isMonitoring || !this.isMonitoringActive || this.activeMonitoringId !== monitoringId) {
        console.log(`Stopping monitor loop for ${monitoringId}`);
        return;
      }

      try {
        console.log(`Making blockchain API request (Monitor ID: ${monitoringId})`);
        const status = await this.getBlockchainStatus();
        callback(status);
      } catch (error) {
        console.error(`❌ Blockchain monitoring error (ID: ${monitoringId}):`, error);
        callback({
          success: false,
          blockchain_stats: { total_blocks: 0, active_block_id: '', active_block_number: 0 },
          active_block: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      if (isMonitoring && this.isMonitoringActive && this.activeMonitoringId === monitoringId) {
        timeoutId = setTimeout(monitor, 15000); // Check every 15 seconds
      }
    };

    monitor(); // Start immediately

    return () => {
      console.log(`Cleanup called for monitoring (ID: ${monitoringId})`);
      isMonitoring = false;
      if (this.activeMonitoringId === monitoringId) {
        this.isMonitoringActive = false;
        this.activeMonitoringId = null;
        console.log(`Global monitoring flag cleared (ID: ${monitoringId})`);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
        console.log(`Timeout cleared for monitoring (ID: ${monitoringId})`);
      }
    };
  }

  async validateWithAgents(repoUrl: string): Promise<{
    success: boolean;
    validation?: {
      verdict: string;
      valid: boolean;
      ai_score: number;
      consensus_score: number;
      top_reason: string;
      agent_count: number;
      validation_summary?: {
        total_agents: number;
        passed_agents: number;
        failed_agents: number;
      };
    };
    error?: string;
  }> {
    // Skip connectivity test for now due to /api/status/ endpoint issues
    console.log('Skipping server connectivity test, proceeding to agents validation...');

    // Django endpoint: POST /api/agents-validate/
    return this.makeRequest('/agents-validate/', {
      method: 'POST',
      body: JSON.stringify({ repo_url: repoUrl }),
    });
  }
}

export const blockchainApi = new BlockchainApiService();
export default blockchainApi;