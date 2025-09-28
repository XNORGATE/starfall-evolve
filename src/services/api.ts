// API service for Django backend integration
const API_BASE_URL = 'http://localhost:8000/api'; // Adjust URL as needed

export interface DeploymentRequest {
  repo_url: string;
  private_token?: string;
}

export interface DeploymentResponse {
  success: boolean;
  deployment_id?: string;
  message: string;
  deployment_url?: string;
}

export interface BlockchainStatus {
  total_blocks: number;
  latest_block: any;
  active_deployments: number;
}

export const apiService = {
  // Deploy repository
  deployRepository: async (data: DeploymentRequest): Promise<DeploymentResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/deploy/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': await getCsrfToken(),
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      console.error('Deployment error:', error);
      throw error;
    }
  },

  // Get blockchain status
  getBlockchainStatus: async (): Promise<BlockchainStatus> => {
    try {
      const response = await fetch(`${API_BASE_URL}/blockchain/status/`);
      return await response.json();
    } catch (error) {
      console.error('Blockchain status error:', error);
      throw error;
    }
  },

  // Get CSRF token
  getCsrfToken: async (): Promise<string> => {
    try {
      const response = await fetch(`${API_BASE_URL}/csrf-token/`);
      const data = await response.json();
      return data.csrf_token;
    } catch (error) {
      console.error('CSRF token error:', error);
      return '';
    }
  },
};

// Helper function to get CSRF token
async function getCsrfToken(): Promise<string> {
  return await apiService.getCsrfToken();
}

export default apiService;