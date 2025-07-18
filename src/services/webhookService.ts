// n8n Webhook Service for Yumi HRD
export interface WebhookPayload {
  intent: string;
  message: string;
  timestamp: string;
  userId?: string;
  nama?: string;
  shift?: 'morning' | 'middle' | 'afternoon';
  type?: 'attendance' | 'query' | 'general';
}

export interface WebhookResponse {
  success: boolean;
  message: string;
  data?: any;
  timestamp: string;
}

export class WebhookService {
  private static instance: WebhookService;
  private readonly webhookUrl = 'https://n8n-xkfibcwlmidh.ceri.sumopod.my.id/webhook/15460674-e749-4037-a7aa-c8ddafab944e';
  private readonly timeout = 10000; // 10 seconds timeout

  static getInstance(): WebhookService {
    if (!WebhookService.instance) {
      WebhookService.instance = new WebhookService();
    }
    return WebhookService.instance;
  }

  // Health check function
  async healthCheck(): Promise<{ healthy: boolean; message: string; responseTime?: number }> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for health check
      
      // Build URL with query parameters for GET request
      const healthCheckUrl = new URL(this.webhookUrl);
      healthCheckUrl.searchParams.append('intent', 'health_check');
      healthCheckUrl.searchParams.append('message', 'Health check from Yumi HRD');
      healthCheckUrl.searchParams.append('timestamp', new Date().toISOString());
      
      const response = await fetch(healthCheckUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Yumi-HRD/1.0'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        return {
          healthy: true,
          message: 'Webhook server tersedia',
          responseTime
        };
      } else {
        return {
          healthy: false,
          message: `Server bermasalah (HTTP ${response.status})`,
          responseTime
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            healthy: false,
            message: 'Server tidak merespons (timeout)',
            responseTime
          };
        } else if (error.message.includes('Failed to fetch')) {
          return {
            healthy: false,
            message: 'Tidak dapat terhubung ke server',
            responseTime
          };
        }
      }
      
      return {
        healthy: false,
        message: 'Server tidak tersedia',
        responseTime
      };
    }
  }

  async sendToWebhook(payload: WebhookPayload, retryCount: number = 0): Promise<WebhookResponse> {
    const maxRetries = 2;
    
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      // Build URL with query parameters for GET request
      const webhookUrl = new URL(this.webhookUrl);
      
      // Add all payload fields as query parameters
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          webhookUrl.searchParams.append(key, String(value));
        }
      });
      
      const response = await fetch(webhookUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Yumi-HRD/1.0'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        // Handle specific HTTP errors with more user-friendly messages
        if (response.status === 500) {
          console.warn(`n8n server error (500) - switching to offline mode`);
          throw new Error(`Server bermasalah: n8n workflow mengalami error internal. Sistem beralih ke mode offline untuk memastikan pengalaman tetap lancar.`);
        } else if (response.status === 404) {
          console.warn(`n8n webhook not found (404) - switching to offline mode`);
          throw new Error(`Webhook tidak ditemukan: URL endpoint mungkin salah atau sudah kedaluwarsa. Sistem beralih ke mode offline.`);
        } else if (response.status === 429) {
          console.warn(`n8n rate limit exceeded (429) - switching to offline mode`);
          throw new Error(`Terlalu banyak permintaan: Server membatasi akses. Sistem beralih ke mode offline sementara.`);
        } else if (response.status === 502 || response.status === 503) {
          console.warn(`n8n server unavailable (${response.status}) - switching to offline mode`);
          throw new Error(`Server tidak tersedia: Layanan sedang maintenance. Sistem beralih ke mode offline.`);
        } else {
          console.warn(`n8n unknown error (${response.status}) - switching to offline mode`);
          throw new Error(`Error HTTP ${response.status}: ${response.statusText}. Sistem beralih ke mode offline.`);
        }
      }

      // Check if response has content and is JSON
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      // Get response text first to check if it's empty
      const responseText = await response.text();
      
      let data: any = {};
      
      if (responseText && responseText.trim()) {
        try {
          // Only try to parse JSON if response has content
          if (isJson) {
            data = JSON.parse(responseText);
          } else {
            // If not JSON, treat as plain text response
            data = { message: responseText };
          }
        } catch (parseError) {
          console.warn('Failed to parse JSON response:', parseError);
          // If JSON parsing fails, treat as plain text
          data = { message: responseText };
        }
      } else {
        // Empty response - webhook might not return data
        console.warn('Webhook returned empty response');
        data = { message: 'Webhook processed successfully but returned no data' };
      }

      return {
        success: true,
        message: data.message || 'Success',
        data: data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Webhook error:', error);
      
      let errorMessage = 'Unknown error';
      let shouldRetry = false;
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Server tidak merespons - timeout setelah 10 detik. Menggunakan mode offline.';
          shouldRetry = retryCount < maxRetries;
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Tidak dapat terhubung ke server - periksa koneksi internet Anda.';
          shouldRetry = retryCount < maxRetries;
        } else if (error.message.includes('Server bermasalah') || error.message.includes('n8n workflow')) {
          errorMessage = 'Server n8n sedang bermasalah - sistem beralih ke mode offline sementara.';
          shouldRetry = retryCount < maxRetries;
        } else if (error.message.includes('Server tidak tersedia')) {
          errorMessage = 'Server sedang maintenance - menggunakan mode offline.';
          shouldRetry = retryCount < maxRetries;
        } else {
          errorMessage = error.message;
          shouldRetry = retryCount < maxRetries && !error.message.includes('tidak ditemukan');
        }
      }
      
      // Retry logic for transient errors (but not for 500 errors as they indicate server-side config issues)
      if (shouldRetry && !error.message.includes('500') && !error.message.includes('error internal')) {
        console.log(`Retrying webhook request (${retryCount + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
        return this.sendToWebhook(payload, retryCount + 1);
      }
      
      return {
        success: false,
        message: errorMessage,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Process attendance via webhook
  async processAttendance(nama: string, shift: 'morning' | 'middle' | 'afternoon'): Promise<WebhookResponse> {
    const payload: WebhookPayload = {
      intent: 'absensi',
      message: `Absensi ${nama} untuk shift ${shift}`,
      timestamp: new Date().toISOString(),
      nama,
      shift,
      type: 'attendance'
    };

    return await this.sendToWebhook(payload);
  }

  // Query data via webhook
  async queryData(query: string, type: 'attendance' | 'rewards' | 'general' = 'general'): Promise<WebhookResponse> {
    const payload: WebhookPayload = {
      intent: 'query',
      message: query,
      timestamp: new Date().toISOString(),
      type
    };

    return await this.sendToWebhook(payload);
  }

  // Send general message to n8n for processing
  async sendMessage(message: string, userId?: string): Promise<WebhookResponse> {
    const payload: WebhookPayload = {
      intent: 'chat',
      message,
      timestamp: new Date().toISOString(),
      userId,
      type: 'general'
    };

    return await this.sendToWebhook(payload);
  }
}