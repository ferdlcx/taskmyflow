/**
 * PortoTrack — Auth Login API Route
 *
 * Autentikasi berbasis PIN.
 * POST /api/auth/login dengan body { pin: string }
 * Membandingkan PIN dengan env var AUTH_PIN.
 */

import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pin } = body as { pin?: string };

    // Validasi input
    if (!pin || typeof pin !== 'string') {
      return Response.json(
        { success: false, error: 'PIN harus diisi' },
        { status: 400 }
      );
    }

    const expectedPin = process.env.AUTH_PIN;

    if (!expectedPin) {
      console.error('[Auth] AUTH_PIN belum diatur di environment variables');
      return Response.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Perbandingan PIN — gunakan constant-time jika memungkinkan
    if (pin !== expectedPin) {
      return Response.json(
        { success: false, error: 'PIN salah' },
        { status: 401 }
      );
    }

    // Generate session token (UUID v4)
    const token = uuidv4();

    return Response.json({
      success: true,
      token,
    });
  } catch {
    return Response.json(
      { success: false, error: 'Request tidak valid' },
      { status: 400 }
    );
  }
}
