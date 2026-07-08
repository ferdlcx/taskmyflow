import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ coins: [] });
  }

  try {
    // Gunakan CoinGecko API v3 via proxy
    const res = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`, {
      next: { revalidate: 3600 } // Cache 1 jam untuk hasil pencarian
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'CoinGecko API Error' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Crypto Search API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
