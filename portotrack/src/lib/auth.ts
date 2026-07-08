/**
 * PortoTrack — Auth Utilities (Client-side)
 *
 * Autentikasi berbasis PIN.
 * Token sesi disimpan di localStorage setelah login berhasil.
 */

const SESSION_KEY = 'portotrack_auth_token';

/**
 * Ambil token sesi dari localStorage.
 * @returns Token string atau null jika belum login
 */
export function getSession(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_KEY);
}

/**
 * Simpan token sesi ke localStorage.
 * @param token - Token yang diterima dari API login
 */
export function setSession(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, token);
}

/**
 * Hapus token sesi (logout).
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Cek apakah pengguna sudah terautentikasi.
 * @returns true jika token sesi ada
 */
export function isAuthenticated(): boolean {
  return getSession() !== null;
}

/**
 * Login ke API dengan PIN.
 * Mengirim POST ke /api/auth/login dan menyimpan token jika berhasil.
 *
 * @param pin - PIN yang dimasukkan pengguna
 * @returns Object dengan status dan pesan error (jika gagal)
 */
export async function login(
  pin: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });

    const data = await res.json();

    if (res.ok && data.success && data.token) {
      setSession(data.token);
      return { success: true };
    }

    return { success: false, error: data.error || 'PIN salah' };
  } catch {
    return { success: false, error: 'Gagal terhubung ke server' };
  }
}

/**
 * Logout — hapus sesi dan redirect ke halaman login.
 */
export function logout(): void {
  clearSession();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}
