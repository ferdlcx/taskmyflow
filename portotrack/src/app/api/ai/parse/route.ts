/**
 * PortoTrack — Gemini AI Parse API Route
 *
 * Server-side proxy untuk fitur Smart Import.
 * Menerima teks mentah (screenshot / copypaste riwayat transaksi),
 * mengirim ke Gemini API dengan structured output schema,
 * dan mengembalikan array transaksi yang sudah di-parse.
 *
 * POST /api/ai/parse
 * Body: { text: string }
 * Response: { success: true, data: SmartImportRow[] }
 */

import type { SmartImportRow } from '@/lib/types';

/** Schema JSON untuk structured output Gemini */
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    transactions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'Simbol ticker aset (contoh: BTC, ETH)',
          },
          type: {
            type: 'string',
            enum: ['buy', 'sell'],
            description: 'Tipe transaksi: buy atau sell',
          },
          quantity: {
            type: 'number',
            description: 'Jumlah koin/token yang dibeli/dijual',
          },
          price_usd: {
            type: 'number',
            description: 'Harga per unit dalam USD',
          },
          price_idr: {
            type: 'number',
            description: 'Harga per unit dalam IDR (0 jika tidak tersedia)',
          },
          fee_usd: {
            type: 'number',
            description: 'Biaya transaksi dalam USD (0 jika tidak tersedia)',
          },
          txn_date: {
            type: 'string',
            description: 'Tanggal transaksi dalam format ISO 8601 (YYYY-MM-DD)',
          },
          source_name: {
            type: 'string',
            description: 'Nama exchange/platform (contoh: Binance, Tokocrypto)',
          },
          notes: {
            type: 'string',
            description: 'Catatan tambahan dari konteks teks',
          },
          confidence: {
            type: 'number',
            description: 'Tingkat kepercayaan parsing (0.0 sampai 1.0)',
          },
        },
        required: [
          'symbol',
          'type',
          'quantity',
          'price_usd',
          'price_idr',
          'fee_usd',
          'txn_date',
          'source_name',
          'notes',
          'confidence',
        ],
      },
    },
  },
  required: ['transactions'],
};

/** System prompt untuk Gemini */
const SYSTEM_PROMPT = `Kamu adalah asisten AI untuk PortoTrack, aplikasi pelacak portofolio kripto.
Tugasmu adalah mengekstrak informasi transaksi kripto dari teks yang diberikan pengguna.

Teks bisa berupa:
- Screenshot riwayat transaksi dari exchange (Binance, Tokocrypto, Indodax, dll)
- Catatan manual pengguna
- Pesan chat tentang transaksi
- CSV atau tabel yang di-copypaste

Aturan:
1. Ekstrak setiap transaksi sebagai object terpisah.
2. Jika harga dalam IDR, konversi ke USD dengan kurs perkiraan ATAU set price_usd = 0 dan isi price_idr.
3. Jika tanggal tidak jelas, gunakan tanggal hari ini.
4. Jika sumber tidak disebutkan, tulis "Unknown".
5. Beri confidence score berdasarkan seberapa yakin kamu dengan parsing.
6. Selalu gunakan simbol ticker uppercase (BTC, ETH, dll).`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text } = body as { text?: string };

    // Validasi input
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return Response.json(
        { success: false, error: 'Teks tidak boleh kosong' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[AI Parse] GEMINI_API_KEY belum diatur');
      return Response.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Panggil Gemini API dengan structured output
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            parts: [
              {
                text: `Parse transaksi kripto dari teks berikut:\n\n${text}`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.1,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error(`[AI Parse] Gemini API error ${geminiRes.status}:`, errText);
      return Response.json(
        {
          success: false,
          error: `Gemini API error: ${geminiRes.status}`,
        },
        { status: 502 }
      );
    }

    const geminiData = await geminiRes.json();

    // Ekstrak teks respons dari Gemini
    const responseText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      console.error('[AI Parse] Tidak ada respons dari Gemini:', geminiData);
      return Response.json(
        { success: false, error: 'Gemini tidak memberikan respons' },
        { status: 502 }
      );
    }

    // Parse JSON dari respons Gemini
    const parsed = JSON.parse(responseText) as {
      transactions: SmartImportRow[];
    };

    return Response.json({
      success: true,
      data: parsed.transactions || [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[AI Parse] Error:', message);
    return Response.json(
      { success: false, error: `Gagal memproses: ${message}` },
      { status: 500 }
    );
  }
}
