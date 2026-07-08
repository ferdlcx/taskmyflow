export interface FinanceTransaction {
  id: string;
  type: 'income' | 'expense' | 'receivable' | 'payable';
  amount: number;
  status: 'paid' | 'unpaid' | 'upcoming';
}

export interface CryptoHolding {
  coinId: string;
  quantity: number;
  averageEntryUsd: number;
}

export function calculateNetWorth(
  fiatTransactions: FinanceTransaction[], 
  cryptoHoldings: CryptoHolding[], 
  cryptoPrices: Record<string, number>,
  displayCurrency: 'USD' | 'IDR',
  staticUsdRate: number = 16500
): { totalCrypto: number, totalFiatBank: number, totalFiatDebt: number, netWorth: number } {
  let cash = 0;
  let receivablesNotPaid = 0;
  let payablesNotPaid = 0;

  for (const t of fiatTransactions) {
    // Ignore 'upcoming' status
    if (t.status === 'upcoming') continue;

    switch (t.type) {
      case 'income':
        cash += t.amount;
        break;
      case 'expense':
        cash -= t.amount;
        break;
      case 'receivable':
        if (t.status === 'unpaid') receivablesNotPaid += t.amount;
        break;
      case 'payable':
        if (t.status === 'unpaid') payablesNotPaid += t.amount;
        break;
    }
  }

  const debtNet = receivablesNotPaid - payablesNotPaid;
  const totalFiatIdr = cash + debtNet;
  const totalFiatUSD = totalFiatIdr / staticUsdRate;

  let totalCryptoUSD = 0;
  for (const h of cryptoHoldings) {
    const price = cryptoPrices[h.coinId] ?? h.averageEntryUsd;
    totalCryptoUSD += h.quantity * price;
  }

  const totalNetWorthUSD = totalFiatUSD + totalCryptoUSD;

  let totalCrypto = totalCryptoUSD;
  let totalFiatBank = cash / staticUsdRate;
  let totalFiatDebt = debtNet / staticUsdRate;
  let netWorth = totalNetWorthUSD;

  if (displayCurrency === 'IDR') {
    totalCrypto *= staticUsdRate;
    totalFiatBank = cash;
    totalFiatDebt = debtNet;
    netWorth = totalNetWorthUSD * staticUsdRate;
  }
  
  return { totalCrypto, totalFiatBank, totalFiatDebt, netWorth };
}
