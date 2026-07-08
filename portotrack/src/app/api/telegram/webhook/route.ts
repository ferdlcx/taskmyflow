/**
 * PortoTrack — Telegram Webhook Handler
 *
 * Menerima update dari Telegram Bot via webhook.
 * Mendukung perintah:
 *   /portfolio — Lihat ringkasan portofolio
 *   /price <simbol> — Cek harga aset
 *   /help — Daftar perintah
 *
 * POST /api/telegram/webhook
 * (Dipanggil oleh Telegram ketika ada pesan masuk)
 */

/** Tipe update dari Telegram (simplified) */
interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
    };
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text?: string;
  };
}

/**
 * Kirim pesan balasan ke Telegram.
 */
async function sendTelegramMessage(
  chatId: number,
  text: string
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    }),
  });
}

/**
 * Handle perintah yang masuk.
 */
async function handleCommand(
  chatId: number,
  command: string,
  _args: string
): Promise<void> {
  const authorizedChatId = process.env.TELEGRAM_CHAT_ID;

  // Verifikasi bahwa pesan berasal dari chat yang terotorisasi
  if (authorizedChatId && String(chatId) !== authorizedChatId) {
    await sendTelegramMessage(chatId, '⛔ Akses ditolak.');
    return;
  }

  switch (command) {
    case '/start':
    case '/help':
      await sendTelegramMessage(
        chatId,
        `🤖 <b>PortoTrack Bot</b>\n\n` +
          `Perintah tersedia:\n` +
          `/portfolio — Ringkasan portofolio\n` +
          `/price &lt;simbol&gt; — Cek harga aset\n` +
          `/help — Tampilkan bantuan ini`
      );
      break;

    case '/portfolio':
      // TODO: Implementasi query portofolio dari Supabase
      await sendTelegramMessage(
        chatId,
        `📊 <b>Ringkasan Portofolio</b>\n\n` +
          `Fitur ini akan segera tersedia.\n` +
          `Data akan ditarik dari database PortoTrack.`
      );
      break;

    case '/price':
      if (!_args) {
        await sendTelegramMessage(
          chatId,
          '❓ Penggunaan: /price BTC\nContoh: /price ETH'
        );
        return;
      }
      // TODO: Implementasi query harga dari CoinGecko
      await sendTelegramMessage(
        chatId,
        `💰 Harga <b>${_args.toUpperCase()}</b>:\n\n` +
          `Fitur ini akan segera tersedia.`
      );
      break;

    default:
      await sendTelegramMessage(
        chatId,
        `❓ Perintah tidak dikenal: ${command}\nKetik /help untuk bantuan.`
      );
  }
}

export async function POST(request: Request) {
  try {
    const update = (await request.json()) as TelegramUpdate;

    // Hanya proses pesan teks
    if (!update.message?.text) {
      return Response.json({ ok: true });
    }

    const chatId = update.message.chat.id;
    const text = update.message.text.trim();

    // Parse perintah dan argumen
    if (text.startsWith('/')) {
      const [command, ...argParts] = text.split(' ');
      const args = argParts.join(' ');
      await handleCommand(chatId, command.toLowerCase(), args);
    } else {
      // Pesan non-perintah — abaikan atau balas generik
      await sendTelegramMessage(
        chatId,
        'Ketik /help untuk melihat daftar perintah.'
      );
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error('[Telegram Webhook] Error:', err);
    // Selalu return 200 ke Telegram agar tidak retry terus
    return Response.json({ ok: true });
  }
}
