/**
 * PortoTrack — Supabase Client
 *
 * Singleton instance untuk berkomunikasi dengan Supabase.
 * Menggunakan env vars NEXT_PUBLIC_* agar bisa dipakai di sisi klien.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[PortoTrack] NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY harus diisi di .env.local'
  );
}

/**
 * Instance Supabase client.
 * Dipakai di sync engine dan komponen klien.
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      // Kita pakai PIN-based auth sendiri, bukan Supabase Auth
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
