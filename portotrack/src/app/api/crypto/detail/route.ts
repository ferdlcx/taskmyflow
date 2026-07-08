import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ data: null });
  }

  try {
    const res = await fetch(`https://api.coincap.io/v2/assets/${id}`, {
      headers: {
        'Accept-Encoding': 'gzip'
      }
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'CoinCap API Error' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Crypto Detail API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
