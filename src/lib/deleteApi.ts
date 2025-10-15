// src/lib/deleteApi.ts
// Delete API functions using Next.js proxy routes
import { getAccessToken } from './auth';

// Panic Reports Delete API

export interface DeletePanicResponse {
  success: boolean;
  message: string;
  deleted_panic?: {
    id: number;
    user_name: string;
    status: string;
    created_at: string;
  };
}

export interface BulkDeletePanicRequest extends Record<string, unknown> {
  start_date: string;
  end_date: string;
  status?: 'pending' | 'responded' | 'resolved' | 'cancelled';
}

export interface BulkDeletePanicResponse {
  success: boolean;
  message: string;
  deleted_count: number;
  date_range: {
    start: string;
    end: string;
  };
}

// Reports Delete API

export interface BulkDeleteReportsRequest extends Record<string, unknown> {
  start_date: string;
  end_date: string;
  status?: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  problem_type?: string;
}

export interface BulkDeleteReportsResponse {
  success: boolean;
  message: string;
  deleted_count: number;
  date_range: {
    start: string;
    end: string;
  };
}

// Helper function untuk call Next.js API proxy routes
async function callProxyApi<T>(endpoint: string, method: string, data?: unknown): Promise<T> {
  // Use getAccessToken from auth.ts (handles refresh automatically)
  const token = await getAccessToken();

  if (!token) {
    throw new Error('No access token found. Please login again.');
  }

  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(endpoint, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  return await response.json();
}

// Delete single panic report (via Next.js proxy)
export async function deleteSinglePanicReport(panicId: number): Promise<DeletePanicResponse> {
  return await callProxyApi<DeletePanicResponse>(`/api/admin/panic/${panicId}`, 'DELETE');
}

// Bulk delete panic reports (via Next.js proxy)
export async function bulkDeletePanicReports(data: BulkDeletePanicRequest): Promise<BulkDeletePanicResponse> {
  return await callProxyApi<BulkDeletePanicResponse>('/api/admin/panic/bulk-delete', 'POST', data);
}

// Delete single report (via existing proxy route)
export async function deleteSingleReport(reportId: number): Promise<{ success: boolean; message: string }> {
  return await callProxyApi<{ success: boolean; message: string }>(`/api/reports/${reportId}`, 'DELETE');
}

// Bulk delete reports (via Next.js proxy)
export async function bulkDeleteReports(data: BulkDeleteReportsRequest): Promise<BulkDeleteReportsResponse> {
  return await callProxyApi<BulkDeleteReportsResponse>('/api/admin/reports/bulk-delete', 'POST', data);
}
