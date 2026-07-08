'use client';

import { useState, useMemo, useEffect } from 'react';
import { Plus, X, Search, Wallet, Coins, Landmark, TrendingUp, TrendingDown, Trash2, Eye, EyeOff, Target, Sparkles, List, Edit, Check } from 'lucide-react';
import { searchCoins, batchFetchPrices } from '@/lib/coingecko';
import type { CoinSearchResult, Asset } from '@/lib/types';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

type SortKey = 'value' | 'pnl' | 'name';
type TabKey = 'crypto' | 'fiat';

function formatCurrency(amount: number) {
  return 'Rp ' + Math.abs(amount).toLocaleString('id-ID');
}

export default function HoldingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('crypto');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('value');
  const [hideBalance, setHideBalance] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<'IDR' | 'USD'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('portotrack_display_currency') as 'IDR' | 'USD') || 'IDR';
    }
    return 'IDR';
  });

  // Live Queries
  const transactions = useLiveQuery(() => db.transactions.filter(t => !t.deleted_at).toArray()) || [];
  const sources = useLiveQuery(() => db.sources.filter(s => !s.deleted_at).toArray()) || [];
  const assets = useLiveQuery(() => db.assets.toArray()) || [];
  const priceCache = useLiveQuery(() => db.price_cache.toArray()) || [];
  const fiatHoldingsRaw = useLiveQuery(() => db.fiat_holdings.filter(f => !f.deleted_at).toArray()) || [];
  const watchlist = useLiveQuery(() => db.watchlist.filter(w => !w.deleted_at).toArray()) || [];

  // USD Rate
  const [usdRate, setUsdRate] = useState<number | null>(null);
  useEffect(() => {
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(res => res.json())
      .then(data => {
        if (data?.rates?.IDR) setUsdRate(data.rates.IDR);
      })
      .catch(err => console.error('Failed to fetch USD rate', err));
  }, []);

  // Modals
  const [showAdd, setShowAdd] = useState(false);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<CoinSearchResult[]>([]);
  
  const [showFiatBankModal, setShowFiatBankModal] = useState(false);
  const [showFiatDebtModal, setShowFiatDebtModal] = useState(false);
  
  const [showAddTxnModal, setShowAddTxnModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const [showManualAssetModal, setShowManualAssetModal] = useState(false);
  const [txnPrice, setTxnPrice] = useState<string>('');

  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetAsset, setTargetAsset] = useState<Asset | null>(null);

  // Audit & Predict states
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditAsset, setAuditAsset] = useState<any>(null);
  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState('');
  const [predictionAsset, setPredictionAsset] = useState<any>(null);

  // Edit Txn states
  const [editingTxnId, setEditingTxnId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<string>('');
  const [editPrice, setEditPrice] = useState<string>('');

  const handleStartEditTxn = (txn: any) => {
    setEditingTxnId(txn.id);
    setEditQty(txn.quantity.toString());
    setEditPrice(txn.price_usd.toString());
  };

  const handleSaveEditTxn = async (txnId: string) => {
    const qty = Number(editQty);
    const price = Number(editPrice);
    if (isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) {
      alert('Masukkan jumlah dan harga yang valid!');
      return;
    }
    await db.transactions.update(txnId, {
      quantity: qty,
      price_usd: price,
      updated_at: new Date().toISOString(),
      sync_status: 'pending'
    });
    setEditingTxnId(null);
  };

  const handleDeleteTxn = async (txnId: string) => {
    if (confirm('Hapus transaksi ini?')) {
      await db.transactions.update(txnId, {
        deleted_at: new Date().toISOString(),
        sync_status: 'pending'
      });
      setEditingTxnId(null);
    }
  };

  const handleDeleteEntireHolding = async (h: any) => {
    if (confirm(`Hapus seluruh riwayat transaksi untuk ${h.name} di ${h.sourceName}? Koin ini akan dihapus dari portfolio.`)) {
      const txns = await db.transactions
        .filter(t => t.source_id === h.sourceId && t.asset_id === h.assetId && !t.deleted_at)
        .toArray();
      
      for (const t of txns) {
        await db.transactions.update(t.id, {
          deleted_at: new Date().toISOString(),
          sync_status: 'pending'
        });
      }
    }
  };

  const handleAIPredict = async (asset: any) => {
    setPredictionAsset(asset);
    setPredicting(true);
    setPredictionResult('');
    setShowPredictionModal(true);

    try {
      const savedKey = localStorage.getItem('portotrack_gemini_key') || '';
      const res = await fetch('/api/ai/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': savedKey
        },
        body: JSON.stringify({
          coinId: asset.asset?.coingecko_id,
          symbol: asset.symbol,
          name: asset.name
        })
      });

      const data = await res.json();
      if (data.success) {
        setPredictionResult(data.prediction);
      } else {
        setPredictionResult(`Gagal menganalisis: ${data.error}`);
      }
    } catch (e) {
      setPredictionResult(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setPredicting(false);
    }
  };

  // ─── ACTIONS ─────────────────────────────────────────

  // Auto-search (Debounce)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        setSearching(true);
        searchCoins(query).then(res => {
          setResults(res);
          setSearching(false);
        }).catch(err => {
          console.error(err);
          setSearching(false);
        });
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleSelectCoin = async (r: CoinSearchResult) => {
    let asset = await db.assets.where('coingecko_id').equals(r.id).first();
    if (!asset) {
      asset = {
        id: crypto.randomUUID(),
        coingecko_id: r.id,
        symbol: r.symbol.toUpperCase(),
        name: r.name,
        icon_url: r.thumb,
        created_at: new Date().toISOString()
      };
      await db.assets.add(asset);
    }
    setSelectedAsset(asset);
    setShowAdd(false);
    
    // Auto-fill harga realtime jika tersedia
    setTxnPrice('');
    try {
      const prices = await batchFetchPrices([r.id]);
      if (prices.length > 0 && prices[0].price_usd > 0) {
        setTxnPrice(prices[0].price_usd.toString());
      }
    } catch (e) {
      console.error(e);
    }

    setShowAddTxnModal(true);
  };

  const handleAddTxn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAsset) return;
    
    const formData = new FormData(e.currentTarget);
    const sourceName = formData.get('sourceName') as string;
    
    // Find or create source
    let source = await db.sources.filter(s => s.name.toLowerCase() === sourceName.toLowerCase()).first();
    if (!source) {
      source = {
        id: crypto.randomUUID(),
        user_id: 'local_user',
        name: sourceName,
        type: 'cex',
        icon_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        sync_status: 'pending'
      };
      await db.sources.add(source);
    }

    const qty = Number(formData.get('quantity'));
    const priceUsd = Number(formData.get('price_usd'));
    const type = formData.get('type') as 'buy' | 'sell';

    await db.transactions.add({
      id: crypto.randomUUID(),
      user_id: 'local_user',
      asset_id: selectedAsset.id,
      source_id: source.id,
      type,
      quantity: qty,
      price_usd: priceUsd,
      price_idr: 0,
      fee_usd: 0,
      txn_date: new Date().toISOString(),
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      sync_status: 'pending'
    });

    const currentPrice = await db.price_cache.get(selectedAsset.coingecko_id);
    if (!currentPrice || currentPrice.price_usd === 0) {
       await db.price_cache.put({
         coingecko_id: selectedAsset.coingecko_id,
         price_usd: priceUsd,
         price_idr: 0,
         fetched_at: new Date().toISOString()
       });
    }

    setShowAddTxnModal(false);
    setSelectedAsset(null);
    setTxnPrice('');
  };

  const handleAddManualAsset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const symbol = (formData.get('symbol') as string).toUpperCase();
    const name = formData.get('name') as string;
    
    const asset = {
      id: crypto.randomUUID(),
      coingecko_id: `manual_${crypto.randomUUID()}`,
      symbol,
      name,
      icon_url: null,
      created_at: new Date().toISOString()
    };
    await db.assets.add(asset);
    
    setSelectedAsset(asset);
    setShowManualAssetModal(false);
    setShowAdd(false);
    setShowAddTxnModal(true);
  };

  const handleAddFiatBank = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await db.fiat_holdings.add({
      id: crypto.randomUUID(),
      user_id: 'local_user',
      source_id: 'manual',
      name: formData.get('name') as string,
      type: 'bank',
      currency: 'IDR',
      amount: Number(formData.get('amount')),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      sync_status: 'pending'
    });
    setShowFiatBankModal(false);
  };

  const handleAddFiatDebt = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const type = formData.get('debtType') as 'utang' | 'piutang';
    const amount = Number(formData.get('amount'));
    const finalAmount = type === 'utang' ? -Math.abs(amount) : Math.abs(amount);
    
    await db.fiat_holdings.add({
      id: crypto.randomUUID(),
      user_id: 'local_user',
      source_id: 'manual',
      name: formData.get('name') as string,
      type: 'debt',
      currency: 'IDR',
      amount: finalAmount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      sync_status: 'pending'
    });
    setShowFiatDebtModal(false);
  };

  const handleDeleteFiat = async (id: string) => {
    if (confirm('Hapus item ini?')) {
      await db.fiat_holdings.update(id, { deleted_at: new Date().toISOString(), sync_status: 'pending' });
    }
  };

  const handleSetTarget = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!targetAsset) return;
    const formData = new FormData(e.currentTarget);
    const targetPriceStr = formData.get('targetPrice') as string;
    const targetPrice = targetPriceStr ? Number(targetPriceStr) : null;

    const existing = await db.watchlist.where('asset_id').equals(targetAsset.id).filter(w => !w.deleted_at).first();
    if (existing) {
      if (targetPrice === null || targetPrice === 0) {
        await db.watchlist.update(existing.id, { deleted_at: new Date().toISOString(), sync_status: 'pending' });
      } else {
        await db.watchlist.update(existing.id, {
          target_price_usd: Number(targetPrice) || null,
          updated_at: new Date().toISOString(),
          sync_status: 'pending'
        });
      }
    } else if (targetPrice && targetPrice > 0) {
      await db.watchlist.add({
        id: crypto.randomUUID(),
        user_id: 'local_user',
        asset_id: targetAsset.id,
        target_price_idr: null,
        target_price_usd: Number(targetPrice) || null,
        note: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        sync_status: 'pending'
      });
    }
    setShowTargetModal(false);
    setTargetAsset(null);
  };

  const displayAmt = (amt: number) => hideBalance ? '***' : formatCurrency(amt);
  const displayAmtUSD = (amt: number) => hideBalance ? '***' : '$' + amt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  const displayAmtUSDTotal = (amt: number) => hideBalance ? '***' : '$' + amt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ─── DERIVED DATA ─────────────────────────────────────────

  const groupedCrypto = useMemo(() => {
    const holdingMap = new Map<string, any>();
    
    transactions.forEach(txn => {
      const key = `${txn.source_id}_${txn.asset_id}`;
      if (!holdingMap.has(key)) {
        holdingMap.set(key, { qty: 0, totalCostUSD: 0, source_id: txn.source_id, asset_id: txn.asset_id });
      }
      const h = holdingMap.get(key);
      if (txn.type === 'buy') {
        h.qty += txn.quantity;
        h.totalCostUSD += txn.price_usd * txn.quantity;
      } else if (txn.type === 'sell') {
        h.qty -= txn.quantity;
        const avgCostUSD = h.totalCostUSD / (h.qty + txn.quantity || 1);
        h.totalCostUSD -= avgCostUSD * txn.quantity;
      }
    });

    let list = Array.from(holdingMap.values()).filter(h => h.qty > 0.000001).map(h => {
      const asset = assets.find(a => a.id === h.asset_id);
      const source = sources.find(s => s.id === h.source_id);
      const price = priceCache.find(p => p.coingecko_id === asset?.coingecko_id);
      
      const currentPriceUSD = price?.price_usd || (h.qty > 0 ? h.totalCostUSD / h.qty : 0);
      const currentValueUSD = h.qty * currentPriceUSD;
      const avgCostUSD = h.qty > 0 ? h.totalCostUSD / h.qty : 0;
      const pnlUSD = currentValueUSD - h.totalCostUSD;
      const pnlPercent = h.totalCostUSD > 0 ? ((currentValueUSD - h.totalCostUSD) / h.totalCostUSD) * 100 : 0;
      
      const watchItem = watchlist.find(w => w.asset_id === h.asset_id);
      const targetPrice = watchItem?.target_price_usd || null;
      let targetProgress = null;
      if (targetPrice && currentPriceUSD > 0) {
        targetProgress = ((currentPriceUSD - targetPrice) / targetPrice) * 100;
      }

      return {
        id: `${h.source_id}_${h.asset_id}`,
        sourceId: h.source_id,
        assetId: h.asset_id,
        sourceName: source?.name || 'Unknown',
        name: asset?.name || 'Unknown',
        symbol: asset?.symbol || '?',
        icon_url: asset?.icon_url || null,
        asset: asset,
        quantity: parseFloat(h.qty.toFixed(6)),
        currentPrice: currentPriceUSD,
        currentValue: currentValueUSD,
        avgCost: avgCostUSD,
        pnl: pnlUSD,
        pnlPercent: pnlPercent.toFixed(2),
        targetPrice,
        targetProgress
      };
    });

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(h => h.name.toLowerCase().includes(q) || h.symbol.toLowerCase().includes(q) || h.sourceName.toLowerCase().includes(q));
    }
    
    list.sort((a, b) => {
      if (sortBy === 'value') return b.currentValue - a.currentValue;
      if (sortBy === 'pnl') return Number(b.pnlPercent) - Number(a.pnlPercent);
      return a.name.localeCompare(b.name);
    });

    const groups: Record<string, typeof list> = {};
    let total = 0;
    let totalPnL = 0;
    list.forEach(h => {
      if (!groups[h.sourceName]) groups[h.sourceName] = [];
      groups[h.sourceName].push(h);
      total += h.currentValue;
      totalPnL += h.pnl;
    });
    return { groups, total, totalPnL };
  }, [search, sortBy, transactions, assets, sources, priceCache, watchlist]);

  const groupedFiat = useMemo(() => {
    const banks = fiatHoldingsRaw.filter(f => f.type === 'bank');
    const debts = fiatHoldingsRaw.filter(f => f.type === 'debt');
    const totalBank = banks.reduce((sum, item) => sum + item.amount, 0);
    const totalDebt = debts.reduce((sum, item) => sum + item.amount, 0);
    return { banks, debts, totalBank, totalDebt, grandTotal: totalBank + totalDebt };
  }, [fiatHoldingsRaw]);

  const auditTxns = useMemo(() => {
    if (!auditAsset || !auditAsset.asset) return [];
    const src = sources.find(s => s.name === auditAsset.sourceName);
    if (!src) return [];
    return transactions
      .filter(t => t.asset_id === auditAsset.asset.id && t.source_id === src.id)
      .sort((a, b) => new Date(b.txn_date).getTime() - new Date(a.txn_date).getTime());
  }, [auditAsset, transactions, sources]);

  // ─── RENDER ──────────────────────────────────────────────

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-4xl mx-auto space-y-6">
      
      {/* Top Portfolio Stats Card (Container Box) */}
      <div className="brutalist-card p-6 bg-accent-amber border-2 border-black shadow-[4px_4px_0px_#000] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-black mb-1">
            <span className="text-xs font-black uppercase tracking-wider border-2 border-black bg-white px-2 py-0.5">
              Total Aset Saya (Est. {displayCurrency})
            </span>
            <button onClick={() => setHideBalance(!hideBalance)} className="p-1 hover:bg-black/10 transition-colors border-2 border-black bg-white" title="Sembunyikan Saldo">
              {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => {
                const nextCur = displayCurrency === 'IDR' ? 'USD' : 'IDR';
                setDisplayCurrency(nextCur);
                localStorage.setItem('portotrack_display_currency', nextCur);
              }}
              className="px-2 py-0.5 text-xs font-black border-2 border-black bg-white hover:bg-gray-100 transition-colors uppercase shadow-[1px_1px_0px_#000] active:translate-y-[1px] active:shadow-none"
              title="Ganti Mata Uang"
            >
              {displayCurrency === 'IDR' ? 'Ke USD' : 'Ke IDR'}
            </button>
          </div>
          <p className="text-3xl md:text-5xl font-black text-black tracking-tight mt-2">
            {hideBalance ? (
              displayCurrency === 'IDR' ? 'Rp ***' : '$***'
            ) : displayCurrency === 'IDR' ? (
              formatCurrency((groupedCrypto.total * (usdRate || 16100)) + groupedFiat.grandTotal)
            ) : (
              `$${(groupedCrypto.total + (groupedFiat.grandTotal / (usdRate || 16100))).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            )}
          </p>
        </div>

        <div className="flex flex-wrap md:flex-nowrap gap-4 w-full md:w-auto">
          {/* Unrealized PnL Card */}
          <div className={`brutalist-card p-3 bg-white border-2 border-black flex flex-col justify-center flex-1 md:flex-none min-w-[120px] ${groupedCrypto.totalPnL >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
            <span className="text-[10px] font-black uppercase text-text-muted">Unrealized PnL</span>
            <span className={`text-lg font-black ${groupedCrypto.totalPnL >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {hideBalance ? '***' : `${groupedCrypto.totalPnL >= 0 ? '+' : ''}$${groupedCrypto.totalPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
          </div>

          {/* Kurs Realtime */}
          {usdRate && (
            <div className="brutalist-card p-3 bg-white border-2 border-black flex flex-col justify-center flex-1 md:flex-none min-w-[120px]">
              <span className="text-[10px] font-black uppercase text-text-muted">Kurs Realtime USD/IDR</span>
              <span className="text-lg font-black text-black">{formatCurrency(usdRate)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex justify-between items-center border-b-2 border-black pb-4">
        <div className="flex bg-white border-2 border-black p-1 shadow-[2px_2px_0px_#000] self-stretch md:self-auto">
          <button
            onClick={() => setActiveTab('crypto')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold uppercase transition-colors ${
              activeTab === 'crypto' ? 'bg-black text-white' : 'text-text-muted hover:text-black hover:bg-gray-100'
            }`}
          >
            <Coins className="w-4 h-4" /> Crypto
          </button>
          <button
            onClick={() => setActiveTab('fiat')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold uppercase transition-colors ${
              activeTab === 'fiat' ? 'bg-black text-white' : 'text-text-muted hover:text-black hover:bg-gray-100'
            }`}
          >
            <Landmark className="w-4 h-4" /> Fiat
          </button>
        </div>
      </div>

      {/* ─── CRYPTO TAB ─── */}
      {activeTab === 'crypto' && (
        <div className="space-y-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Cari platform, koin..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 brutalist-input"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="brutalist-input px-3 py-2 text-sm font-bold uppercase cursor-pointer hidden md:block"
            >
              <option value="value">Nilai</option>
              <option value="pnl">PnL</option>
              <option value="name">Nama</option>
            </select>
            <button 
              onClick={() => setShowAdd(true)}
              className="px-4 py-2 bg-accent-emerald text-black text-sm font-bold uppercase border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all whitespace-nowrap"
            >
              <Plus className="w-5 h-5 inline-block md:mr-1" /> <span className="hidden md:inline">Tambah</span>
            </button>
          </div>

          {Object.entries(groupedCrypto.groups).length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-black font-bold uppercase text-text-muted bg-white">
              Tidak ada aset crypto.
            </div>
          ) : (
            Object.entries(groupedCrypto.groups).map(([platform, items]) => (
              <div key={platform} className="brutalist-card p-0 bg-white overflow-hidden">
                <div className="bg-bg-secondary p-3 border-b-2 border-black flex justify-between items-center">
                  <h3 className="font-black text-black uppercase">{platform}</h3>
                  <span className="text-sm font-bold bg-white px-2 py-0.5 border-2 border-black">
                    {displayAmtUSDTotal(items.reduce((s, i) => s + i.currentValue, 0))}
                  </span>
                </div>
                <div className="divide-y-2 divide-black">
                  {items.map(h => {
                    const isProfit = h.pnl >= 0;
                    return (
                      <div key={h.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 border-2 border-black bg-accent-amber/20 flex items-center justify-center font-bold text-xl overflow-hidden">
                            {h.icon_url ? <img src={h.icon_url} alt={h.symbol} className="w-full h-full object-cover" /> : '🪙'}
                          </div>
                          <div>
                            <p className="font-black uppercase text-black">{h.name}</p>
                            <p className="text-sm font-bold text-text-muted">{h.quantity} {h.symbol}</p>
                          </div>
                        </div>
                        <div className="flex flex-col md:items-end text-sm border-l-2 md:border-l-0 border-black pl-3 md:pl-0">
                          <p className="font-bold text-text-muted">Avg: {displayAmtUSD(h.avgCost)}</p>
                          <p className="font-bold text-black">Now: {displayAmtUSD(h.currentPrice)}</p>
                        </div>
                        <div className="text-left md:text-right flex-shrink-0">
                          <p className="font-black text-lg">{displayAmtUSDTotal(h.currentValue)}</p>
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 border-2 border-black mb-2 ${isProfit ? 'bg-accent-emerald text-black' : 'bg-accent-rose text-white'}`}>
                            {isProfit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            <span className="text-xs font-bold">{isProfit ? '+' : '-'}{displayAmtUSDTotal(Math.abs(h.pnl))} ({isProfit ? '+' : ''}{h.pnlPercent}%)</span>
                          </div>
                          {h.targetPrice && h.targetProgress !== null && (
                            <div className="block">
                              <span className={`text-[10px] font-black px-1 border-2 border-black ${h.targetProgress >= 0 ? 'bg-accent-emerald' : 'bg-accent-amber'}`}>
                                {h.targetProgress >= 0 ? '🎯 TARGET TERCAPAI' : `⏳ Ke Target: ${h.targetProgress.toFixed(1)}%`}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0 mt-2 md:mt-0">
                          <button 
                            onClick={() => { setAuditAsset(h); setShowAuditModal(true); }}
                            className="p-2 border-2 border-transparent hover:border-black hover:bg-white transition-all text-text-muted hover:text-black"
                            title="Audit Riwayat Transaksi"
                          >
                            <List className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleAIPredict(h)}
                            className="p-2 border-2 border-transparent hover:border-black hover:bg-white transition-all text-text-muted hover:text-black"
                            title="Prediksi AI (Gemini)"
                          >
                            <Sparkles className="w-5 h-5 text-accent-purple" />
                          </button>
                          <button 
                            onClick={() => { setTargetAsset(h.asset || null); setShowTargetModal(true); }}
                            className="p-2 border-2 border-transparent hover:border-black hover:bg-white transition-all text-text-muted hover:text-black"
                            title="Set Limit Jual"
                          >
                            <Target className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteEntireHolding(h)}
                            className="p-2 border-2 border-transparent hover:border-black hover:bg-white transition-all text-text-muted hover:text-accent-rose"
                            title="Hapus Seluruh Holding Koin Ini"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── FIAT TAB ─── */}
      {activeTab === 'fiat' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black uppercase text-black">Saldo Bank / E-Wallet</h2>
            <button onClick={() => setShowFiatBankModal(true)} className="px-3 py-1 bg-accent-blue text-white font-bold text-sm border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all">
              + Tambah Bank
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupedFiat.banks.length === 0 && (
               <div className="col-span-full p-4 border-2 border-dashed border-black text-center font-bold text-text-muted">Belum ada data bank.</div>
            )}
            {groupedFiat.banks.map(b => (
              <div key={b.id} className="brutalist-card p-4 bg-white flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <Wallet className="w-6 h-6 text-black" />
                  <span className="font-black uppercase text-black">{b.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-black text-lg">{displayAmt(b.amount)}</span>
                  <button onClick={() => handleDeleteFiat(b.id)} className="p-1 md:opacity-0 group-hover:opacity-100 transition-opacity bg-accent-rose text-white border-2 border-black hover:scale-110">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t-2 border-black">
            <h2 className="text-xl font-black uppercase text-black">Utang & Piutang</h2>
            <button onClick={() => setShowFiatDebtModal(true)} className="px-3 py-1 bg-accent-rose text-white font-bold text-sm border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all">
              + Tambah Utang
            </button>
          </div>

          <div className="space-y-3">
            {groupedFiat.debts.length === 0 && (
               <div className="p-4 border-2 border-dashed border-black text-center font-bold text-text-muted">Belum ada data utang/piutang.</div>
            )}
            {groupedFiat.debts.map(d => {
              const isPiutang = d.amount > 0;
              return (
                <div key={d.id} className={`brutalist-card p-4 flex justify-between items-center group ${isPiutang ? 'bg-accent-emerald/20' : 'bg-accent-rose/20'}`}>
                  <span className="font-black uppercase text-black">{d.name}</span>
                  <div className="flex items-center gap-3">
                    <span className={`font-black text-lg ${isPiutang ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {isPiutang ? '+' : ''}{displayAmt(d.amount)}
                    </span>
                    <button onClick={() => handleDeleteFiat(d.id)} className="p-1 md:opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white border-2 border-black hover:scale-110">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── MODALS ─── */}

      {/* ADD ASSET MODAL */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="brutalist-card p-6 bg-white w-full max-w-md max-h-[80vh] flex flex-col shadow-[8px_8px_0px_#000]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-black">
              <h2 className="text-xl font-black uppercase text-black">Cari Aset</h2>
              <button onClick={() => setShowAdd(false)} className="p-1 hover:bg-bg-secondary border-2 border-transparent hover:border-black transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="Cari nama koin (contoh: btc)..." 
                className="brutalist-input flex-1 p-2"
                autoFocus
              />
              <button type="submit" disabled={searching} className="px-4 py-2 bg-accent-amber border-2 border-black font-bold shadow-[2px_2px_0px_#000] disabled:opacity-50 flex items-center justify-center hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all">
                <Search className="w-5 h-5" />
              </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {searching ? (
                <div className="text-center p-4 font-bold animate-pulse">Mencari...</div>
              ) : results.length > 0 ? (
                results.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-2 border-2 border-black hover:bg-bg-secondary group cursor-pointer transition-colors" onClick={() => handleSelectCoin(r)}>
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.thumb} alt={r.name} className="w-8 h-8 rounded-full border-2 border-black" />
                      <div>
                        <p className="font-bold text-black uppercase">{r.name}</p>
                        <p className="text-xs text-text-muted font-bold">{r.symbol}</p>
                      </div>
                    </div>
                    <div className="hidden group-hover:block p-1 bg-accent-emerald border-2 border-black">
                      <Plus className="w-4 h-4 text-black" />
                    </div>
                  </div>
                ))
              ) : query && !searching ? (
                <div className="text-center p-4 font-bold text-text-muted bg-gray-100 border-2 border-dashed border-black">
                  <p>Koin tidak ditemukan.</p>
                  <button onClick={() => { setShowAdd(false); setShowManualAssetModal(true); }} className="mt-2 text-sm font-black text-black underline underline-offset-4 hover:text-accent-amber">
                    + Tambah Koin Manual
                  </button>
                </div>
              ) : (
                <div className="text-center mt-4">
                  <button onClick={() => { setShowAdd(false); setShowManualAssetModal(true); }} className="text-sm font-black text-text-muted underline underline-offset-4 hover:text-black">
                    + Tambah Koin Manual
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD TXN MODAL */}
      {showAddTxnModal && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="brutalist-card p-6 bg-white w-full max-w-md shadow-[8px_8px_0px_#000]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-black">
              <h2 className="text-xl font-black uppercase text-black flex items-center gap-2">
                {selectedAsset.icon_url && <img src={selectedAsset.icon_url} alt="" className="w-6 h-6 rounded-full border border-black" />}
                Tambah {selectedAsset.symbol}
              </h2>
              <button type="button" onClick={() => { setShowAddTxnModal(false); setSelectedAsset(null); setTxnPrice(''); }} className="p-1 hover:bg-bg-secondary border-2 border-transparent hover:border-black transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddTxn} className="space-y-4">
              <div>
                <label className="block text-sm font-bold uppercase mb-1">Jenis Transaksi</label>
                <select name="type" className="brutalist-input w-full p-2 bg-white" required>
                  <option value="buy">Beli (Buy)</option>
                  <option value="sell">Jual (Sell)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold uppercase mb-1">Platform / Sumber</label>
                <input list="sources-list" type="text" name="sourceName" placeholder="Ketik atau pilih (Binance, Bybit...)" className="brutalist-input w-full p-2" required autoComplete="off" />
                <datalist id="sources-list">
                  {sources.map(s => (
                    <option key={s.id} value={s.name} />
                  ))}
                  {/* Default suggestions if db is empty */}
                  {sources.length === 0 && (
                    <>
                      <option value="Binance" />
                      <option value="Tokocrypto" />
                      <option value="Bybit" />
                      <option value="Indodax" />
                      <option value="OKX" />
                    </>
                  )}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-bold uppercase mb-1">Jumlah (Qty)</label>
                <input type="number" step="any" name="quantity" placeholder="0.00" className="brutalist-input w-full p-2" required />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase mb-1">Harga per Koin (USD)</label>
                <input type="number" step="any" name="price_usd" placeholder="Harga dalam USD (USDT)" className="brutalist-input w-full p-2" value={txnPrice} onChange={(e) => setTxnPrice(e.target.value)} required />
              </div>
              <button type="submit" className="w-full py-3 bg-accent-emerald text-black font-black uppercase border-2 border-black shadow-[4px_4px_0px_#000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#000] transition-all">
                Simpan Transaksi
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TARGET PRICE MODAL */}
      {showTargetModal && targetAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="brutalist-card p-6 bg-white w-full max-w-md shadow-[8px_8px_0px_#000]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-black">
              <h2 className="text-xl font-black uppercase text-black flex items-center gap-2">
                {targetAsset.icon_url && <img src={targetAsset.icon_url} alt="" className="w-6 h-6 rounded-full border border-black" />}
                Target {targetAsset.symbol}
              </h2>
              <button type="button" onClick={() => { setShowTargetModal(false); setTargetAsset(null); }} className="p-1 hover:bg-bg-secondary border-2 border-transparent hover:border-black transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSetTarget} className="space-y-4">
              <div>
                <label className="block text-sm font-bold uppercase mb-1">Target Limit Jual (USD)</label>
                <input 
                  type="number" 
                  step="any" 
                  name="targetPrice" 
                  placeholder="Contoh: 65000" 
                  className="brutalist-input w-full p-2" 
                />
                <p className="text-xs font-bold text-text-muted mt-1">Kosongkan/Isi 0 untuk menghapus target.</p>
              </div>
              <button type="submit" className="w-full py-3 bg-accent-amber text-black font-black uppercase border-2 border-black shadow-[4px_4px_0px_#000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#000] transition-all">
                Simpan Target
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD MANUAL ASSET MODAL */}
      {showManualAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="brutalist-card p-6 bg-white w-full max-w-md shadow-[8px_8px_0px_#000]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-black">
              <h2 className="text-xl font-black uppercase text-black">Tambah Koin Manual</h2>
              <button onClick={() => setShowManualAssetModal(false)} className="p-1 hover:bg-bg-secondary border-2 border-transparent hover:border-black transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddManualAsset} className="space-y-4">
              <div>
                <label className="block text-sm font-bold uppercase mb-1">Simbol Koin</label>
                <input type="text" name="symbol" placeholder="Contoh: BTC, ETH" className="brutalist-input w-full p-2 uppercase" required />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase mb-1">Nama Koin</label>
                <input type="text" name="name" placeholder="Contoh: Bitcoin" className="brutalist-input w-full p-2" required />
              </div>
              <button type="submit" className="w-full py-3 bg-accent-amber text-black font-black uppercase border-2 border-black shadow-[4px_4px_0px_#000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#000] transition-all">
                Lanjut
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD FIAT BANK MODAL */}
      {showFiatBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="brutalist-card p-6 bg-white w-full max-w-md shadow-[8px_8px_0px_#000]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-black">
              <h2 className="text-xl font-black uppercase text-black">Tambah Bank/E-Wallet</h2>
              <button onClick={() => setShowFiatBankModal(false)} className="p-1 hover:bg-bg-secondary border-2 border-transparent hover:border-black transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddFiatBank} className="space-y-4">
              <div>
                <label className="block text-sm font-bold uppercase mb-1">Nama Bank / Platform</label>
                <input type="text" name="name" placeholder="Contoh: BCA, GoPay" className="brutalist-input w-full p-2" required />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase mb-1">Saldo (IDR)</label>
                <input type="number" name="amount" placeholder="0" className="brutalist-input w-full p-2" required />
              </div>
              <button type="submit" className="w-full py-3 bg-accent-blue text-white font-black uppercase border-2 border-black shadow-[4px_4px_0px_#000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#000] transition-all">
                Simpan Saldo
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD FIAT DEBT MODAL */}
      {showFiatDebtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="brutalist-card p-6 bg-white w-full max-w-md shadow-[8px_8px_0px_#000]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-black">
              <h2 className="text-xl font-black uppercase text-black">Tambah Utang/Piutang</h2>
              <button onClick={() => setShowFiatDebtModal(false)} className="p-1 hover:bg-bg-secondary border-2 border-transparent hover:border-black transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddFiatDebt} className="space-y-4">
              <div>
                <label className="block text-sm font-bold uppercase mb-1">Nama / Keterangan</label>
                <input type="text" name="name" placeholder="Contoh: Utang Budi" className="brutalist-input w-full p-2" required />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase mb-1">Jenis</label>
                <select name="debtType" className="brutalist-input w-full p-2 bg-white" required>
                  <option value="utang">Utang (Saya yang pinjam)</option>
                  <option value="piutang">Piutang (Orang pinjam ke saya)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold uppercase mb-1">Nominal (IDR)</label>
                <input type="number" name="amount" placeholder="0" className="brutalist-input w-full p-2" required />
              </div>
              <button type="submit" className="w-full py-3 bg-accent-rose text-white font-black uppercase border-2 border-black shadow-[4px_4px_0px_#000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#000] transition-all">
                Simpan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AUDIT (HISTORY) MODAL */}
      {showAuditModal && auditAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="brutalist-card p-6 bg-white w-full max-w-lg shadow-[8px_8px_0px_#000] max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-black">
              <div>
                <h2 className="text-xl font-black uppercase text-black flex items-center gap-2">
                  🔍 Audit: {auditAsset.name} ({auditAsset.symbol})
                </h2>
                <p className="text-xs font-bold text-text-muted uppercase">Platform: {auditAsset.sourceName}</p>
              </div>
              <button onClick={() => { setShowAuditModal(false); setAuditAsset(null); }} className="p-1 hover:bg-bg-secondary border-2 border-transparent hover:border-black transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-3">
              {auditTxns.length === 0 ? (
                <div className="p-4 border-2 border-dashed border-black text-center font-bold text-text-muted">
                  Tidak ada riwayat transaksi.
                </div>
              ) : (
                <div className="divide-y border-2 border-black overflow-hidden divide-black">
                  {auditTxns.map((t) => {
                    const isEditing = editingTxnId === t.id;
                    return (
                      <div key={t.id} className="p-3 bg-bg-secondary flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm">
                        {isEditing ? (
                          <div className="flex-1 flex flex-wrap gap-2 items-center">
                            <span className={`px-1.5 py-0.5 text-xs font-black border border-black uppercase ${t.type === 'buy' ? 'bg-accent-emerald text-black' : 'bg-accent-rose text-white'}`}>
                              {t.type === 'buy' ? 'BELI' : 'JUAL'}
                            </span>
                            <div className="flex flex-col gap-1 min-w-[100px]">
                              <label className="text-[10px] font-black uppercase text-text-muted">Jumlah</label>
                              <input 
                                type="number" 
                                value={editQty} 
                                onChange={e => setEditQty(e.target.value)} 
                                className="brutalist-input p-1 text-xs font-bold" 
                              />
                            </div>
                            <div className="flex flex-col gap-1 min-w-[100px]">
                              <label className="text-[10px] font-black uppercase text-text-muted">Harga USD</label>
                              <input 
                                type="number" 
                                step="any" 
                                value={editPrice} 
                                onChange={e => setEditPrice(e.target.value)} 
                                className="brutalist-input p-1 text-xs font-bold" 
                              />
                            </div>
                            <div className="flex gap-1 ml-auto">
                              <button 
                                onClick={() => handleSaveEditTxn(t.id)} 
                                className="p-2 bg-accent-emerald border-2 border-black hover:scale-115 transition-transform"
                                title="Simpan"
                              >
                                <Check className="w-4 h-4 text-black" />
                              </button>
                              <button 
                                onClick={() => setEditingTxnId(null)} 
                                className="p-2 bg-white border-2 border-black hover:scale-115 transition-transform font-bold text-xs"
                                title="Batal"
                              >
                                X
                              </button>
                              <button 
                                onClick={() => handleDeleteTxn(t.id)} 
                                className="p-2 bg-accent-rose border-2 border-black hover:scale-115 transition-transform text-white"
                                title="Hapus Transaksi"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div>
                              <span className={`px-1.5 py-0.5 text-xs font-black border border-black uppercase ${t.type === 'buy' ? 'bg-accent-emerald text-black' : 'bg-accent-rose text-white'}`}>
                                {t.type === 'buy' ? 'BELI' : 'JUAL'}
                              </span>
                              <div className="text-xs text-text-muted font-bold mt-1">
                                {new Date(t.txn_date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                              </div>
                              {t.notes && <div className="text-xs text-black italic mt-0.5">"{t.notes}"</div>}
                            </div>
                            <div className="flex items-center gap-4 ml-auto md:ml-0">
                              <div className="text-right">
                                <div className="font-black text-black">{t.quantity.toLocaleString('en-US')} {auditAsset.symbol}</div>
                                <div className="text-xs text-text-muted font-bold">@ ${t.price_usd.toLocaleString('en-US')}</div>
                              </div>
                              <button 
                                onClick={() => handleStartEditTxn(t)} 
                                className="p-2 bg-white border-2 border-black hover:bg-gray-100 transition-colors"
                                title="Edit Transaksi"
                              >
                                <Edit className="w-4 h-4 text-black" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <button onClick={() => { setShowAuditModal(false); setAuditAsset(null); }} className="w-full mt-4 py-2 bg-black text-white font-black uppercase border-2 border-black shadow-[4px_4px_0px_#000] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-none transition-all">
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* AI PREDICTION MODAL */}
      {showPredictionModal && predictionAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="brutalist-card p-6 bg-white w-full max-w-lg shadow-[8px_8px_0px_#000] max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-black">
              <h2 className="text-xl font-black uppercase text-black flex items-center gap-2">
                🔮 Analisis AI: {predictionAsset.name}
              </h2>
              <button onClick={() => { setShowPredictionModal(false); setPredictionAsset(null); setPredictionResult(''); }} className="p-1 hover:bg-bg-secondary border-2 border-transparent hover:border-black transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 bg-bg-secondary border-2 border-black">
              {predicting ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
                  <span className="font-black text-xs uppercase animate-pulse">Menghubungi Gemini AI...</span>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none text-black whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {predictionResult}
                </div>
              )}
            </div>

            <button onClick={() => { setShowPredictionModal(false); setPredictionAsset(null); setPredictionResult(''); }} className="w-full mt-4 py-2 bg-black text-white font-black uppercase border-2 border-black shadow-[4px_4px_0px_#000] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-none transition-all">
              Tutup
            </button>
          </div>
        </div>
      )}

      <div className="h-8" />
    </div>
  );
}
