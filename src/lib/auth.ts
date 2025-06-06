// src/lib/auth.ts
interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user?: {
    role: string;
    // properti pengguna lainnya
  };
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
    
    // Simpan peran pengguna jika tersedia
    if (data.user && data.user.role) {
      localStorage.setItem("user_role", data.user.role);
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
  localStorage.removeItem("user_data");
}

// Fungsi untuk menyimpan data pengguna
export function storeUserData(userData: any): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem("user_data", JSON.stringify(userData));
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
  
  return !!localStorage.getItem("access_token");
}