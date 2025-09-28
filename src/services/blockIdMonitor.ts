// src/services/blockIdMonitor.ts
interface BlockInfo {
  block_id: string;
  block_hash: string;
  block_number: number;
  created_at: string;
  is_active: boolean;
  block_type: string;
  timestamp: string;
  changed: boolean;
}

interface BlockStatusResponse {
  success: boolean;
  block_info?: BlockInfo;
  error?: string;
}

type BlockChangeCallback = (blockInfo: BlockInfo) => void;

class BlockIdMonitorService {
  private baseUrl = 'http://127.0.0.1:8000/api';
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private callbacks: BlockChangeCallback[] = [];
  private currentBlockId: string | null = null;

  /**
   * Start monitoring Block ID changes
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      console.warn('Block ID monitoring already active');
      return;
    }

    this.isMonitoring = true;
    console.log('Starting Block ID monitoring...');

    // Poll every 5 seconds for Block ID changes
    this.monitoringInterval = setInterval(() => {
      this.checkBlockStatus();
    }, 5000);

    // Check immediately
    this.checkBlockStatus();
  }

  /**
   * Stop monitoring Block ID changes
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('⏹️ Block ID monitoring stopped');
  }

  /**
   * Subscribe to Block ID changes
   */
  subscribe(callback: BlockChangeCallback): () => void {
    this.callbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index !== -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Check current block status
   */
  private async checkBlockStatus(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/block-status/`);
      const data: BlockStatusResponse = await response.json();

      if (data.success && data.block_info) {
        const blockInfo = data.block_info;

        // Check if Block ID has changed
        if (this.currentBlockId !== blockInfo.block_id) {
          console.log(`🔄 Block ID changed: ${this.currentBlockId} → ${blockInfo.block_id}`);
          this.currentBlockId = blockInfo.block_id;
          blockInfo.changed = true;

          // Notify all subscribers
          this.callbacks.forEach(callback => {
            try {
              callback(blockInfo);
            } catch (error) {
              console.error('❌ Error in block change callback:', error);
            }
          });
        }
      } else {
        console.warn('❌ Failed to get block status:', data.error);
      }
    } catch (error) {
      // Use mock data when Django backend is not available
      console.log('Using mock block data (Django backend not available)');
      
      const mockBlockInfo: BlockInfo = {
        block_id: `block_${Math.floor(Math.random() * 1000)}`,
        block_hash: Math.random().toString(36).substring(2, 15),
        block_number: Math.floor(Math.random() * 100),
        created_at: new Date().toISOString(),
        is_active: true,
        block_type: 'deployment',
        timestamp: new Date().toISOString(),
        changed: this.currentBlockId !== `block_${Math.floor(Math.random() * 1000)}`
      };

      if (this.currentBlockId !== mockBlockInfo.block_id) {
        this.currentBlockId = mockBlockInfo.block_id;
        this.callbacks.forEach(callback => callback(mockBlockInfo));
      }
    }
  }

  /**
   * Get current block info manually
   */
  async getCurrentBlockInfo(): Promise<BlockInfo | null> {
    try {
      const response = await fetch(`${this.baseUrl}/block-status/`);
      const data: BlockStatusResponse = await response.json();

      if (data.success && data.block_info) {
        return data.block_info;
      }

      return null;
    } catch (error) {
      console.error('❌ Error getting current block info:', error);
      return null;
    }
  }
}

export const blockIdMonitor = new BlockIdMonitorService();
export default blockIdMonitor;