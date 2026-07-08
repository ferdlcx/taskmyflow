import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { coinId, symbol, name } = body as { coinId: string; symbol: string; name: string };
    
    if (!coinId) {
      return Response.json({ success: false, error: 'coinId is required' }, { status: 400 });
    }

    // Ambil API Key dari header atau env
    const clientKey = request.headers.get('x-gemini-key');
    const apiKey = clientKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json({ success: false, error: 'Gemini API Key tidak dikonfigurasi' }, { status: 400 });
    }

    // Kirim permintaan prediksi ke Gemini
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const prompt = `Analisis koin kripto berikut:
Nama: ${name}
Simbol: ${symbol}
CoinGecko ID: ${coinId}

Tugas:
1. Berikan penjelasan singkat fundamental koin ini dalam 2-3 kalimat.
2. Prediksikan tren pergerakannya secara garis besar (bullish/bearish/sideways) berdasarkan sentimen pasar terkini secara logis.
3. Berikan saran manajemen risiko singkat (2-3 poin).

Gunakan bahasa Indonesia yang santai tapi profesional. Berikan format markdown bersih tanpa block code JSON. Mulai dengan judul yang menarik.`;

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error(`[AI Predict] Gemini API error ${geminiRes.status}:`, errText);
      return Response.json({ success: false, error: `Gemini API Error: ${geminiRes.status}` }, { status: 502 });
    }

    const geminiData = await geminiRes.json();
    const responseText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      return Response.json({ success: false, error: 'Gemini tidak memberikan jawaban' }, { status: 502 });
    }

    return Response.json({ success: true, prediction: responseText });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ success: false, error: msg }, { status: 500 });
  }
}
