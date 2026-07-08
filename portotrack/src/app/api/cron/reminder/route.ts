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

    // Cek apakah menit saat ini masuk ke jendela 10 menit setelah target global
    const isGlobalTime1 = currentMinutes >= targetMinutes1 && currentMinutes < targetMinutes1 + 10;
    const isGlobalTime2 = targetMinutes2 !== null && currentMinutes >= targetMinutes2 && currentMinutes < targetMinutes2 + 10;

    // A. Tarik semua proyek harian yang aktif dari Supabase
    const { data: activeProjects, error: projError } = await supabase
      .from('projects')
      .select('*')
      .eq('status', 'active')
      .eq('is_daily', 1)
      .is('deleted_at', null);

    if (projError) {
      console.error('[Cron] Supabase project error:', projError);
      return NextResponse.json({ error: projError.message }, { status: 500 });
    }

    const projectsToNotify: any[] = [];

    // B. Cek jam pengingat masing-masing proyek harian
    if (activeProjects && activeProjects.length > 0) {
      for (const p of activeProjects) {
        const pDesc = p.description || '';
        const match = pDesc.match(/^\[Reminder:\s*([0-9]{2}:[0-9]{2})\]/);
        const pReminderTime = match ? match[1] : null;

        if (pReminderTime) {
          const pMinutes = timeToMinutes(pReminderTime);
          // Cek apakah jam saat ini cocok dengan jam pengingat proyek ini (+10 menit window)
          if (currentMinutes >= pMinutes && currentMinutes < pMinutes + 10) {
            // Cek apakah tugas harian untuk proyek ini hari ini belum selesai
            const { data: task } = await supabase
              .from('garapan_tasks')
              .select('*')
              .eq('project_id', p.id)
              .eq('date', todayStr)
              .eq('is_completed', false)
              .is('deleted_at', null)
              .maybeSingle();

            if (task) {
              projectsToNotify.push({ project: p, task });
            }
          }
        }
      }
    }

    // C. Tarik semua tugas harian hari ini yang belum selesai (untuk notifikasi global)
    const { data: tasks, error: taskError } = await supabase
      .from('garapan_tasks')
      .select('*')
      .eq('date', todayStr)
      .eq('is_completed', false)
      .is('deleted_at', null);

    if (taskError) {
      console.error('[Cron] Supabase tasks error:', taskError);
      return NextResponse.json({ error: taskError.message }, { status: 500 });
    }

    // D. Evaluasi apakah harus mengirim notifikasi
    const shouldSendGlobal = (isGlobalTime1 || isGlobalTime2) && tasks && tasks.length > 0;
    const shouldSendSpecific = projectsToNotify.length > 0;

    if (!shouldSendGlobal && !shouldSendSpecific) {
      return NextResponse.json({ 
        success: true, 
        message: `No reminders triggered. Current WIB: ${currentHourMin}. Pending daily tasks: ${tasks?.length || 0}.` 
      });
    }

    // E. Kirim pesan notifikasi
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    // 1. Kirim notifikasi spesifik proyek
    if (shouldSendSpecific) {
      for (const item of projectsToNotify) {
        const specificMessage = `⏰ <b>Pengingat Misi Harian: ${item.project.platform}</b>\n\nAnda belum menyelesaikan misi harian untuk proyek ini!\n\nKeterangan: ${parseNotes(item.project.description)}\nDeadline: ${item.project.target_date}\n\nJangan lupa dikerjakan dan dicentang di aplikasi!`;
        
        await fetch(telegramUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: specificMessage,
            parse_mode: 'HTML'
          })
        });
      }
    }

    // 2. Kirim notifikasi ringkasan global
    if (shouldSendGlobal) {
      const taskListStr = tasks.map((t: any, idx: number) => `${idx + 1}. <b>${t.title}</b>`).join('\n');
      let globalMessage = '';

      if (isGlobalTime1) {
        globalMessage = `📋 <b>Pengingat Tugas Harian (Ke-1)</b>\n\nBerikut adalah daftar garapan harian yang belum selesai hari ini:\n\n${taskListStr}\n\nSemangat garapnya! Jangan lupa selesaikan misinya.`;
      } else if (isGlobalTime2) {
        globalMessage = `⚠️ <b>Pengingat Tugas Harian (Ke-2)</b>\n\nAnda masih memiliki tugas harian yang belum diselesaikan hari ini!\n\n${taskListStr}\n\nSegera selesaikan sebelum berganti hari!`;
      }

      await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: globalMessage,
          parse_mode: 'HTML'
        })
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Notification processing completed. Specific sent: ${projectsToNotify.length}, Global sent: ${shouldSendGlobal ? 1 : 0}` 
    });

  } catch (err) {
    console.error('[Cron] Runtime error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

// Helpers untuk uraikan description proyek
function parseNotes(desc: string) {
  if (!desc) return '';
  return desc.replace(/^\[Reminder:\s*[0-9]{2}:[0-9]{2}\]\s*/, '');
}

// Helper: Ubah "HH:MM" menjadi total menit dari tengah malam
function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}
