// src/lib/auth.ts
interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user?: {
    role: string;
    id: number;
    name: string;
    email: string;
    nik?: string;
    no_telp?: string;
    created_at?: string;
    updated_at?: string;
  };
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    nik?: string;
    no_telp?: string;
    created_at: string;
    updated_at: string;
  };
  message: string;
}

// Fungsi untuk memeriksa apakah token kedaluwarsa
export function isTokenExpired(): boolean {
  if (typeof window === 'undefined') return true;
  
  const expiresAt = localStorage.getItem("expires_at");
  if (!expiresAt) return true;
  
  return Date.now() > parseInt(expiresAt);
}

// Fungsi untuk mendapatkan peran pengguna saat ini
export function getUserRole(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem("user_role");
}

// Fungsi untuk mendapatkan ID pengguna saat ini
export function getUserId(): number | null {
  if (typeof window === 'undefined') return null;
  const userId = localStorage.getItem("user_id");
  return userId ? parseInt(userId) : null;
}

// Fungsi untuk mendapatkan token akses yang valid (menyegarkan jika diperlukan)
export async function getAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  
  // Jika token masih valid, kembalikan
  if (!isTokenExpired()) {
    return localStorage.getItem("access_token");
  }
  
  // Coba untuk menyegarkan token
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) {
    // Tidak ada token refresh yang tersedia, pengguna perlu login lagi
    clearAuthTokens();
    return null;
  }
  
  try {
    // Gunakan rute API lokal kita, bukan eksternal
    const response = await fetch("/api/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    
    if (!response.ok) {
      // Token refresh tidak valid atau kedaluwarsa
      clearAuthTokens();
      return null;
    }
    
    const data: RefreshTokenResponse = await response.json();
    
    // Perbarui token di penyimpanan
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    
    // Perbarui waktu kedaluwarsa
    const expiresAt = Date.now() + data.expires_in * 1000;
    localStorage.setItem("expires_at", expiresAt.toString());
    
    // Simpan peran pengguna dan data lain jika tersedia
    if (data.user) {
      if (data.user.role) {
        localStorage.setItem("user_role", data.user.role);
      }
      if (data.user.id) {
        localStorage.setItem("user_id", data.user.id.toString());
      }
      localStorage.setItem("user_data", JSON.stringify(data.user));
    }
    
    return data.access_token;
  } catch (error) {
    console.error("Error menyegarkan token:", error);
    clearAuthTokens();
    return null;
  }
}

// Fungsi untuk menghapus semua token autentikasi (untuk logout)
export function clearAuthTokens(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("expires_at");
  localStorage.removeItem("user_role");
  localStorage.removeItem("user_id");
  localStorage.removeItem("user_data");
}

// Fungsi untuk menyimpan data pengguna setelah login
export function storeAuthData(loginResponse: LoginResponse): void {
  if (typeof window === 'undefined') return;
  
  // Simpan tokens
  localStorage.setItem("access_token", loginResponse.access_token);
  localStorage.setItem("refresh_token", loginResponse.refresh_token);
  
  // Hitung dan simpan waktu kedaluwarsa
  const expiresAt = Date.now() + loginResponse.expires_in * 1000;
  localStorage.setItem("expires_at", expiresAt.toString());
  
  // Simpan data user
  if (loginResponse.user) {
    localStorage.setItem("user_role", loginResponse.user.role);
    localStorage.setItem("user_id", loginResponse.user.id.toString());
    localStorage.setItem("user_data", JSON.stringify(loginResponse.user));
  }
}

// Fungsi untuk menyimpan data pengguna
export function storeUserData(userData: any): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem("user_data", JSON.stringify(userData));
  
  // Update individual fields if they exist
  if (userData.role) {
    localStorage.setItem("user_role", userData.role);
  }
  if (userData.id) {
    localStorage.setItem("user_id", userData.id.toString());
  }
}

// Fungsi untuk mendapatkan data pengguna
export function getUserData(): any {
  if (typeof window === 'undefined') return null;
  
  const userData = localStorage.getItem("user_data");
  if (!userData) return null;
  
  try {
    return JSON.parse(userData);
  } catch (error) {
    console.error("Error mengurai data pengguna:", error);
    return null;
  }
}

// Fungsi untuk memeriksa apakah pengguna terautentikasi
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  const accessToken = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");
  
  // User is authenticated if they have either a valid access token or a refresh token
  return !!(accessToken || refreshToken);
}

// Fungsi untuk memeriksa apakah user adalah relawan
export function isVolunteer(): boolean {
  const role = getUserRole();
  return role === "relawan" || role === "volunteer";
}

// Fungsi untuk memeriksa apakah user adalah admin
export function isAdmin(): boolean {
  const role = getUserRole();
  return role === "admin";
}

// Fungsi untuk memeriksa apakah user adalah mahasiswa
export function isStudent(): boolean {
  const role = getUserRole();
  return role === "user" || role === "student";
}

// Fungsi untuk mendapatkan header authorization
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  
  if (!token) {
    throw new Error("No valid access token available");
  }
  
  return {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
    "Accept": "application/json",
  };
}

// Fungsi untuk membuat authenticated fetch request
export async function authenticatedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
  
  // If unauthorized, try to refresh token once
  if (response.status === 401) {
    const newToken = await getAccessToken();
    if (newToken) {
      const retryHeaders = {
        "Authorization": `Bearer ${newToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...options.headers,
      };
      
      return fetch(url, {
        ...options,
        headers: retryHeaders,
      });
    } else {
      // If refresh failed, clear tokens and redirect to login
      clearAuthTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
      throw new Error("Authentication required");
    }
  }
  
  return response;
}

// Fungsi utility untuk handle API errors
export function handleApiError(error: any): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'object' && error?.message) {
    return error.message;
  }
  
  return "Terjadi kesalahan yang tidak terduga";
}

// Fungsi untuk validasi role access
export function validateRoleAccess(allowedRoles: string[]): boolean {
  const userRole = getUserRole();
  if (!userRole) return false;
  
  return allowedRoles.includes(userRole);
}

// Fungsi untuk redirect berdasarkan role
export function redirectBasedOnRole(): string {
  const role = getUserRole();
  
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "relawan":
    case "volunteer":
      return "/volunteer/dashboard";
    case "user":
    case "student":
      return "/student/emergency";
    default:
      return "/auth/login";
  }
}