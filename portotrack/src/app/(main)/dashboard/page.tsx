'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Plus, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Eye, EyeOff } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { batchFetchPrices, getTrendingCoins } from '@/lib/coingecko';

// ─── Helpers ───────────────────────────────────────────

function formatCurrency(amount: number, currency: string = 'IDR') {
  if (currency === 'IDR') {
    return 'Rp ' + Math.abs(amount).toLocaleString('id-ID');
  }
  return '$' + Math.abs(amount).toLocaleString('en-US');
}

// ─── Dashboard Page ────────────────────────────────────

export default function DashboardPage() {
  const [currency, setCurrency] = useState('IDR');
  const [manualKurs, setManualKurs] = useState(16100);
  const [hideBalance, setHideBalance] = useState(false);
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, number>>({});
  const [trendingCoins, setTrendingCoins] = useState<any[]>([]);
  const [usdRate, setUsdRate] = useState<number>(16100);
  
  // Real DB Data
  const fiatHoldings = useLiveQuery(() => db.fiat_holdings.toArray()) || [];
  const transactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const assets = useLiveQuery(() => db.assets.toArray()) || [];
  const tasks = useLiveQuery(() => db.garapan_tasks.filter(t => !t.deleted_at && !t.is_completed).toArray()) || [];

  // Load settings
  useEffect(() => {
    const savedCurrency = localStorage.getItem('portotrack_currency') || 'IDR';
    const savedKurs = Number(localStorage.getItem('portotrack_kurs')) || 16100;
    setCurrency(savedCurrency);
    setManualKurs(savedKurs);
    setUsdRate(savedKurs);

    // Fetch live USD/IDR rate
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(res => res.json())
      .then(data => {
        if (data?.rates?.IDR) {
          setUsdRate(data.rates.IDR);
        }
      })
      .catch(err => console.error('Failed to fetch live USD rate', err));
  }, []);

  // Calculate Fiat (always stored in IDR)
  const { bankTotal, debtTotal } = useMemo(() => {
    let bank = 0;
    let debt = 0;
    fiatHoldings.forEach(f => {
      if (f.type === 'bank') bank += f.amount;
      if (f.type === 'debt') debt += f.amount;
    });
    return { bankTotal: bank, debtTotal: debt };
  }, [fiatHoldings]);

  // Calculate Crypto in USD/USDT
  useEffect(() => {
    if (assets.length === 0) return;
    const fetchPrices = async () => {
      const ids = assets.map(a => a.coingecko_id);
      const prices = await batchFetchPrices(ids);
      const priceMap: Record<string, number> = {};
      prices.forEach(p => {
        priceMap[p.coingecko_id] = p.price_usd; // Always USD
      });
      setCryptoPrices(priceMap);
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, [assets]);

  // Fetch Trending Coins
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const data = await getTrendingCoins();
        if (data && data.coins) {
          setTrendingCoins(data.coins.slice(0, 5));
        }
      } catch (err) {
        console.error("Gagal mengambil koin trending", err);
      }
    };
    fetchTrending();
  }, []);

  const { cryptoTotal, pnlAmount, pnlPercent } = useMemo(() => {
    let totalValue = 0;
    let totalCost = 0;
    
    // Group transactions by asset
    const holdingsMap: Record<string, { qty: number, cost: number }> = {};
    transactions.forEach(t => {
      if (!holdingsMap[t.asset_id]) holdingsMap[t.asset_id] = { qty: 0, cost: 0 };
      if (t.type === 'buy') {
        holdingsMap[t.asset_id].qty += t.quantity;
        holdingsMap[t.asset_id].cost += (t.quantity * t.price_usd);
      } else {
        const avgCost = holdingsMap[t.asset_id].cost / holdingsMap[t.asset_id].qty;
        holdingsMap[t.asset_id].qty -= t.quantity;
        holdingsMap[t.asset_id].cost -= (t.quantity * (avgCost || 0));
      }
    });

    Object.entries(holdingsMap).forEach(([assetId, data]) => {
      if (data.qty <= 0) return;
      const asset = assets.find(a => a.id === assetId);
      if (asset && cryptoPrices[asset.coingecko_id]) {
        totalValue += data.qty * cryptoPrices[asset.coingecko_id];
        totalCost += data.cost;
      } else {
        totalValue += data.cost;
        totalCost += data.cost;
      }
    });

    const pnl = totalValue - totalCost;
    const pnlPct = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
    return { cryptoTotal: totalValue, pnlAmount: pnl, pnlPercent: pnlPct };
  }, [transactions, assets, cryptoPrices]);

  // Convert Net Worth
  // bankTotal & debtTotal are in IDR. cryptoTotal is in USD.
  const netWorthIDR = bankTotal + debtTotal + (cryptoTotal * usdRate);
  const netWorthUSD = cryptoTotal + ((bankTotal + debtTotal) / usdRate);
  const netWorth = currency === 'IDR' ? netWorthIDR : netWorthUSD;

  const isProfit = pnlAmount >= 0;

  const displayCurrency = (amount: number, cur: string) => {
    return hideBalance ? '***' : formatCurrency(amount, cur);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-black">Beranda</h1>
        </div>
        <Link
          href="/smart-import"
          className="flex items-center gap-2 px-5 py-2.5 bg-accent-emerald text-black text-sm font-bold border-2 border-black shadow-[4px_4px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-[2px_2px_0px_#000] transition-all"
        >
          <Plus className="w-5 h-5" />
          SMART IMPORT
        </Link>
      </div>

      {/* Main Net Worth Card */}
      <div className="brutalist-card p-6 md:p-8 bg-accent-amber">
        <div className="flex items-center justify-between mb-2">
          <p className="text-black font-bold uppercase text-sm border-2 border-black bg-white px-2 py-1 shadow-[2px_2px_0px_#000]">Total Kekayaan Bersih</p>
          <button onClick={() => setHideBalance(!hideBalance)} className="p-1 hover:bg-black/10 transition-colors border-2 border-black bg-white shadow-[2px_2px_0px_#000]">
            {hideBalance ? <EyeOff className="w-5 h-5 text-black" /> : <Eye className="w-5 h-5 text-black" />}
          </button>
        </div>
        <h2 className="text-4xl md:text-6xl font-black text-black mb-6 tracking-tighter">
          {displayCurrency(netWorth, currency)}
        </h2>
        
        {/* Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t-2 border-black pt-6">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-black uppercase text-black">Aset Crypto (USD)</span>
            <span className="text-xl font-black text-black bg-white border-2 border-black px-2 py-1 shadow-[2px_2px_0px_#000] inline-block w-fit">
              {displayCurrency(cryptoTotal, 'USD')}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-black uppercase text-black">Bank / E-Wallet (IDR)</span>
            <span className="text-xl font-black text-black bg-white border-2 border-black px-2 py-1 shadow-[2px_2px_0px_#000] inline-block w-fit">
              {displayCurrency(bankTotal, 'IDR')}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-black uppercase text-black">Utang & Piutang (IDR)</span>
            <span className="text-xl font-black text-black bg-white border-2 border-black px-2 py-1 shadow-[2px_2px_0px_#000] inline-block w-fit">
              {displayCurrency(debtTotal, 'IDR')}
            </span>
          </div>
        </div>
      </div>

      {/* Snapshot Finansial & Tugas Hari Ini */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Snapshot Finansial */}
        <div className="brutalist-card p-6 flex flex-col gap-5 bg-white">
          <h3 className="text-lg font-black uppercase text-black border-b-2 border-black pb-2">Kinerja Portofolio Crypto</h3>
          <div className="flex flex-col gap-4">
            <div className={`p-4 border-2 border-black shadow-[2px_2px_0px_#000] ${isProfit ? 'bg-accent-emerald/20' : 'bg-accent-rose/20'}`}>
              <p className="text-xs font-bold uppercase text-black mb-1">Unrealized PnL</p>
              <p className={`text-2xl font-black ${isProfit ? 'text-emerald-700' : 'text-rose-700'}`}>
                {isProfit ? '+' : '-'}{displayCurrency(pnlAmount, currency)}
              </p>
              <p className={`text-sm font-bold ${isProfit ? 'text-emerald-700' : 'text-rose-700'}`}>
                ({isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%)
              </p>
            </div>
            {/* You can add more stats here in the future */}
          </div>
        </div>

        {/* Tugas & Deadline Hari Ini */}
        <div className="brutalist-card p-6 flex flex-col gap-5 bg-white">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <h3 className="text-lg font-black uppercase text-black">Tugas Garapan</h3>
            <Link href="/garapan" className="text-xs font-bold uppercase text-black hover:underline">Lihat Semua</Link>
          </div>
          <div className="flex flex-col gap-3 flex-1">
            {tasks.slice(0, 4).map(d => (
              <div key={d.id} className="flex items-center justify-between p-3 border-2 border-black bg-bg-secondary shadow-[2px_2px_0px_#000]">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 border-2 border-black bg-accent-amber" />
                  <span className="text-sm font-bold text-black">{d.title}</span>
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="flex-1 flex items-center justify-center font-bold text-black border-2 border-dashed border-black p-4">
                SEMUA TUGAS SELESAI
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Trending Coins */}
      <div className="brutalist-card p-6 flex flex-col gap-5 bg-white">
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <h3 className="text-lg font-black uppercase text-black flex items-center gap-2">
            🔥 Trending Coins / Memes
          </h3>
          <span className="text-xs font-bold uppercase text-text-muted">Top 5 Pencarian CoinGecko</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {trendingCoins.length === 0 ? (
            <div className="col-span-full p-4 border-2 border-dashed border-black text-center font-bold text-text-muted">Memuat data trending...</div>
          ) : (
            trendingCoins.map(({ item }) => (
              <div key={item.id} className="p-3 border-2 border-black bg-bg-primary shadow-[2px_2px_0px_#000] hover:-translate-y-1 hover:shadow-[4px_4px_0px_#000] transition-all flex flex-col gap-2 cursor-pointer">
                <div className="flex items-center gap-2">
                  <img src={item.thumb} alt={item.name} className="w-6 h-6 border-2 border-black rounded-full" />
                  <span className="font-black text-black truncate">{item.symbol}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-black">Rank #{item.market_cap_rank}</span>
                  <span className={`text-xs font-black px-1 border-2 border-black ${item.data.price_change_percentage_24h?.usd >= 0 ? 'bg-accent-emerald text-black' : 'bg-accent-rose text-white'}`}>
                    {item.data.price_change_percentage_24h?.usd >= 0 ? '+' : ''}{item.data.price_change_percentage_24h?.usd?.toFixed(1) || 0}%
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom spacer for mobile nav */}
      <div className="h-8" />
    </div>
  );
}
