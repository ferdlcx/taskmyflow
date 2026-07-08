'use client';

import { useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { batchFetchPrices } from '@/lib/coingecko';

export default function PriceWatcher() {
  const watchlist = useLiveQuery(() => db.watchlist.filter(w => !w.deleted_at).toArray()) || [];
  const assets = useLiveQuery(() => db.assets.toArray()) || [];
  const tasks = useLiveQuery(() => db.garapan_tasks.filter(t => !t.deleted_at && !t.is_completed).toArray()) || [];
  
  // Gunakan ref untuk melacak item yang sudah diberi notifikasi agar tidak terkirim berulang kali
  const notifiedItemsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkWatcher = async () => {
      const isTeleEnabled = localStorage.getItem('portotrack_telegram_enabled') === 'true';
      const botToken = localStorage.getItem('portotrack_telegram_token') || '';
      const chatId = localStorage.getItem('portotrack_telegram_chat_id') || '';

      if (!isTeleEnabled || !botToken || !chatId) return;

      const now = new Date();

      // ─── 1. LOGIKA PENGINGAT TUGAS HARIAN ───
      const reminderTime1 = localStorage.getItem('portotrack_telegram_reminder_time') || '08:00';
      const reminderTime2 = localStorage.getItem('portotrack_telegram_reminder_time_2') || '';
      const currentHourMin = now.toTimeString().slice(0, 5); // Format "HH:MM"
      const todayStr = now.toISOString().split('T')[0];

      // Pengingat Pertama (Pagi / Utama)
      if (currentHourMin === reminderTime1 && tasks.length > 0) {
        const lastSentDate1 = localStorage.getItem('portotrack_last_task_reminder_date_1');
        if (lastSentDate1 !== todayStr) {
          localStorage.setItem('portotrack_last_task_reminder_date_1', todayStr);

          const taskListStr = tasks.map((t, idx) => `${idx + 1}. <b>${t.title}</b>`).join('\n');
          const message = `📋 <b>Pengingat Tugas Harian (Ke-1)</b>\n\nBerikut adalah daftar garapan harian yang belum selesai:\n\n${taskListStr}\n\nSemangat garapnya! Jangan lupa selesaikan misinya.`;

          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: message,
              parse_mode: 'HTML'
            })
          }).catch(e => console.error('[PriceWatcher] Gagal mengirim pengingat tugas 1:', e));
        }
      }

      // Pengingat Kedua (Malam / Warning)
      if (reminderTime2 && currentHourMin === reminderTime2 && tasks.length > 0) {
        const lastSentDate2 = localStorage.getItem('portotrack_last_task_reminder_date_2');
        if (lastSentDate2 !== todayStr) {
          localStorage.setItem('portotrack_last_task_reminder_date_2', todayStr);

          const taskListStr = tasks.map((t, idx) => `${idx + 1}. <b>${t.title}</b>`).join('\n');
          const message = `⚠️ <b>Pengingat Tugas Harian (Ke-2)</b>\n\nAnda masih memiliki tugas harian yang belum diselesaikan!\n\n${taskListStr}\n\nSegera selesaikan sebelum deadline!`;

          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: message,
              parse_mode: 'HTML'
            })
          }).catch(e => console.error('[PriceWatcher] Gagal mengirim pengingat tugas 2:', e));
        }
      }

      // ─── 2. LOGIKA TARGET HARGA WATCHLIST ───
      if (watchlist.length === 0 || assets.length === 0) return;

      try {
        const coinIds = watchlist.map(w => {
          const asset = assets.find(a => a.id === w.asset_id);
          return asset?.coingecko_id;
        }).filter(Boolean) as string[];

        if (coinIds.length === 0) return;

        // Ambil harga ter-update
        const prices = await batchFetchPrices(coinIds);

        for (const item of watchlist) {
          const asset = assets.find(a => a.id === item.asset_id);
          if (!asset) continue;

          const priceCache = prices.find(p => p.coingecko_id === asset.coingecko_id);
          if (!priceCache) continue;

          const currentPriceUSD = priceCache.price_usd;
          const targetPriceUSD = item.target_price_usd || null;

          if (targetPriceUSD && targetPriceUSD > 0 && currentPriceUSD >= targetPriceUSD) {
            const notifiedKey = `${item.id}_${targetPriceUSD}`;
            
            if (notifiedItemsRef.current.has(notifiedKey)) continue;

            notifiedItemsRef.current.add(notifiedKey);

            const message = `🎯 <b>Target Jual/Beli Tercapai!</b>\n\nAset: <b>${asset.name} (${asset.symbol})</b>\nHarga Sekarang: <b>$${currentPriceUSD.toLocaleString('en-US')}</b>\nHarga Target: <b>$${targetPriceUSD.toLocaleString('en-US')}</b>\n\nSilakan cek exchange Anda untuk mengeksekusi limit order.`;

            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
              })
            }).catch(e => console.error('[PriceWatcher] Gagal mengirim telegram:', e));
          }
        }
      } catch (err) {
        console.error('[PriceWatcher] Error checking prices:', err);
      }
    };

    // Jalankan pengecekan pertama setelah 5 detik, lalu ulangi setiap 1 menit
    const initialTimeout = setTimeout(checkWatcher, 5000);
    const interval = setInterval(checkWatcher, 60000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [watchlist, assets, tasks]);

  return null; // Komponen ini tersembunyi
}
