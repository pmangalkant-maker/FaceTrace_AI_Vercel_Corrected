import type {
  Case,
  Sighting,
  User,
  ImageAnalysisResult,
  DatabaseStats,
  AuditLogItem,
  NotificationItem,
} from '../types';

const TOKEN_KEY = 'facetrace_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  let data: any = null;

  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMessage = data?.error || data?.detail || `HTTP ${response.status}: Request failed`;
    throw new Error(errorMessage);
  }

  return data as T;
}

export const api = {
  // Auth
  async login(credentials: { email: string; password: string }) {
    const res = await request<{ token: string; user: User; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    setStoredToken(res.token);
    return res;
  },

  async register(payload: {
    email: string;
    password: string;
    full_name: string;
    role?: string;
    organization?: string;
    phone?: string;
  }) {
    const res = await request<{ token: string; user: User; message: string }>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    setStoredToken(res.token);
    return res;
  },

  async demoLogin(role: 'admin' | 'case_manager' | 'public') {
    const res = await request<{ token: string; user: User; message: string }>(
      '/api/auth/demo-login',
      {
        method: 'POST',
        body: JSON.stringify({ role }),
      }
    );
    setStoredToken(res.token);
    return res;
  },

  async getMe() {
    return request<{ user: User }>('/api/auth/me');
  },

  logout() {
    setStoredToken(null);
  },

  // Cases
  async getCases(params: {
    q?: string;
    status?: string;
    gender?: string;
    age_min?: string;
    age_max?: string;
    country?: string;
    state?: string;
    city?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.status && params.status !== 'all') query.set('status', params.status);
    if (params.gender && params.gender !== 'all') query.set('gender', params.gender);
    if (params.age_min) query.set('age_min', params.age_min);
    if (params.age_max) query.set('age_max', params.age_max);
    if (params.country && params.country !== 'all') query.set('country', params.country);
    if (params.state) query.set('state', params.state);
    if (params.city) query.set('city', params.city);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    return request<{
      cases: Case[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/api/cases?${query.toString()}`);
  },

  async getCaseById(id: string) {
    return request<{ case: Case }>(`/api/cases/${id}`);
  },

  async createCase(caseData: any) {
    return request<{ message: string; case_id: string; case_number: string }>('/api/cases', {
      method: 'POST',
      body: JSON.stringify(caseData),
    });
  },

  async updateCase(id: string, updates: Partial<Case>) {
    return request<{ message: string }>(`/api/cases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async updateCaseStatus(id: string, status: string, resolution_notes?: string) {
    return request<{ message: string }>(`/api/cases/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, resolution_notes }),
    });
  },

  async deleteCase(id: string) {
    return request<{ message: string }>(`/api/cases/${id}`, {
      method: 'DELETE',
    });
  },

  // Sightings
  async getCaseSightings(caseId: string) {
    return request<{ sightings: Sighting[] }>(`/api/sightings/case/${caseId}`);
  },

  async reportSighting(data: {
    case_id: string;
    sighting_date: string;
    city: string;
    state: string;
    country: string;
    location_notes: string;
    description: string;
    photo_url?: string;
    photo_analysis?: any;
    submitter_name: string;
    submitter_contact: string;
    consent_accuracy: boolean;
  }) {
    return request<{ message: string; sighting_id: string; status: string }>('/api/sightings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getPendingSightings() {
    return request<{ sightings: Sighting[] }>('/api/sightings/pending');
  },

  async moderateSighting(
    id: string,
    action: 'verified_by_moderator' | 'dismissed' | 'forwarded_to_police',
    moderator_notes?: string
  ) {
    return request<{ message: string }>(`/api/sightings/${id}/moderate`, {
      method: 'PATCH',
      body: JSON.stringify({ status: action, moderator_notes }),
    });
  },

  // Image Analysis
  async uploadAndAnalyzeImage(file: File) {
    const formData = new FormData();
    formData.append('photo', file);

    return request<{
      url: string;
      filename: string;
      had_exif_stripped: boolean;
      analysis: ImageAnalysisResult;
    }>('/api/image/analyze', {
      method: 'POST',
      body: formData,
    });
  },

  async analyzeImageUrl(image_url: string) {
    return request<{ analysis: ImageAnalysisResult }>('/api/image/analyze-url', {
      method: 'POST',
      body: JSON.stringify({ image_url }),
    });
  },

  // Admin
  async getAdminStats() {
    return request<{ stats: DatabaseStats }>('/api/admin/stats');
  },

  async getAuditLogs(params: { action?: string; entity_type?: string; page?: number } = {}) {
    const query = new URLSearchParams();
    if (params.action) query.set('action', params.action);
    if (params.entity_type) query.set('entity_type', params.entity_type);
    if (params.page) query.set('page', params.page.toString());

    return request<{
      logs: AuditLogItem[];
      total: number;
      page: number;
      totalPages: number;
    }>(`/api/admin/audit-logs?${query.toString()}`);
  },

  async getAdminUsers() {
    return request<{ users: User[] }>('/api/admin/users');
  },

  async updateUserRole(id: string, role: string, is_verified?: boolean) {
    return request<{ message: string }>(`/api/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role, is_verified }),
    });
  },

  // Notifications
  async getNotifications() {
    return request<{ notifications: NotificationItem[]; unread_count: number }>(
      '/api/notifications'
    );
  },

  async markNotificationRead(id: string) {
    return request<{ message: string }>(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  async markAllNotificationsRead() {
    return request<{ message: string }>('/api/notifications/mark-all-read', {
      method: 'POST',
    });
  },
};
