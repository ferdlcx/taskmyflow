/**
 * PortoTrack — Telegram Notification API
 *
 * Mengirim notifikasi ke chat Telegram pengguna.
 * Digunakan oleh fitur price alert, laporan harian, dsb.
 *
 * POST /api/telegram/notify
 * Body: { message: string, parse_mode?: 'HTML' | 'Markdown' }
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, parse_mode = 'HTML' } = body as {
      message?: string;
      parse_mode?: 'HTML' | 'Markdown';
    };

    // Validasi input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return Response.json(
        { success: false, error: 'Pesan tidak boleh kosong' },
        { status: 400 }
      );
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.error(
        '[Telegram Notify] TELEGRAM_BOT_TOKEN atau TELEGRAM_CHAT_ID belum diatur'
      );
      return Response.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Kirim pesan via Telegram Bot API
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const telegramRes = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode,
        // Nonaktifkan preview link untuk pesan notifikasi
        disable_web_page_preview: true,
      }),
    });

    const telegramData = await telegramRes.json();

    if (!telegramRes.ok || !telegramData.ok) {
      console.error('[Telegram Notify] API error:', telegramData);
      return Response.json(
        {
          success: false,
          error: telegramData.description || 'Gagal mengirim pesan Telegram',
        },
        { status: 502 }
      );
    }

    return Response.json({
      success: true,
      message_id: telegramData.result?.message_id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Telegram Notify] Error:', message);
    return Response.json(
      { success: false, error: `Gagal mengirim notifikasi: ${message}` },
      { status: 500 }
    );
  }
}
