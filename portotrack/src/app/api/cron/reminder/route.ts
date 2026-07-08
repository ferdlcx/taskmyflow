import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Vercel Cron berjalan secara serverless.
// Endpoint ini dipanggil setiap 10 menit oleh Vercel Scheduler.
export async function GET(request: Request) {
  // 1. Validasi Auth Cron dari Vercel
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Baca Env Kredensial
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const reminderTime1 = process.env.TELEGRAM_REMINDER_TIME_1 || '08:00';
  const reminderTime2 = process.env.TELEGRAM_REMINDER_TIME_2 || '';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!botToken || !chatId || !supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Missing configurations/env variables' }, { status: 500 });
  }

  try {
    // 3. Inisialisasi Supabase Client Server-side
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 4. Hitung Waktu Lokal Indonesia (WIB - Asia/Jakarta)
    const nowWib = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const currentHourMin = nowWib.toTimeString().slice(0, 5); // "HH:MM"
    const todayStr = nowWib.toISOString().split('T')[0]; // "YYYY-MM-DD"

    const currentMinutes = timeToMinutes(currentHourMin);
    const targetMinutes1 = timeToMinutes(reminderTime1);
    const targetMinutes2 = reminderTime2 ? timeToMinutes(reminderTime2) : null;

    // Cek apakah menit saat ini masuk ke jendela 10 menit setelah target
    const isTime1 = currentMinutes >= targetMinutes1 && currentMinutes < targetMinutes1 + 10;
    const isTime2 = targetMinutes2 !== null && currentMinutes >= targetMinutes2 && currentMinutes < targetMinutes2 + 10;

    if (!isTime1 && !isTime2) {
      return NextResponse.json({ success: true, message: `Not reminder time yet. Current WIB: ${currentHourMin}` });
    }

    // 5. Tarik tugas harian yang belum selesai untuk hari ini dari Supabase
    const { data: tasks, error } = await supabase
      .from('garapan_tasks')
      .select('*')
      .eq('date', todayStr)
      .eq('is_completed', false)
      .is('deleted_at', null);

    if (error) {
      console.error('[Cron] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ success: true, message: 'All tasks completed or empty for today!' });
    }

    // 6. Siapkan Pesan Notifikasi Telegram
    const taskListStr = tasks.map((t, idx) => `${idx + 1}. <b>${t.title}</b>`).join('\n');
    let message = '';

    if (isTime1) {
      message = `📋 <b>Pengingat Tugas Harian (Ke-1)</b>\n\nBerikut adalah daftar garapan harian yang belum selesai hari ini:\n\n${taskListStr}\n\nSemangat garapnya! Jangan lupa selesaikan misinya.`;
    } else if (isTime2) {
      message = `⚠️ <b>Pengingat Tugas Harian (Ke-2)</b>\n\nAnda masih memiliki tugas harian yang belum diselesaikan hari ini!\n\n${taskListStr}\n\nSegera selesaikan sebelum berganti hari!`;
    }

    // 7. Kirim Notifikasi via Telegram Bot API
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const data = await res.json();
    if (data.ok) {
      return NextResponse.json({ success: true, message: 'Notification sent successfully via Vercel Cron!' });
    } else {
      return NextResponse.json({ error: data.description || 'Failed to send Telegram message' }, { status: 500 });
    }
  } catch (err) {
    console.error('[Cron] Runtime error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

// Helper: Ubah "HH:MM" menjadi total menit dari tengah malam
function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}
