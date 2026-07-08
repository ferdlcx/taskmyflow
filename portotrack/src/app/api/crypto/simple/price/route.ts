import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get('ids');
  const vs_currencies = searchParams.get('vs_currencies');

  if (!ids || !vs_currencies) {
    return NextResponse.json({});
  }

  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${vs_currencies}`, {
      next: { revalidate: 60 } // Cache 60 detik
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'CoinGecko API Error' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Crypto Simple Price API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
