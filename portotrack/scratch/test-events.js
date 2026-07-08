async function test() {
  // Binance
  try {
    const res = await fetch('https://www.binance.com/bapi/composite/v1/public/cms/article/catalog/list/query?catalogId=48&pageNo=1&pageSize=3', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    console.log('Binance status:', res.status);
    const data = await res.json();
    console.log('Binance data keys:', Object.keys(data));
    console.log('Binance articles count:', data?.data?.articles?.length);
    if (data?.data?.articles) {
      console.log('Sample article:', data.data.articles[0]);
    }
  } catch (e) {
    console.error('Binance err:', e.message);
  }

  // Bybit
  try {
    const res = await fetch('https://api.bybit.com/v5/announcements/index?locale=en-US&limit=3', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    console.log('Bybit status:', res.status);
    const data = await res.json();
    console.log('Bybit data keys:', Object.keys(data));
    console.log('Bybit list count:', data?.result?.list?.length);
    if (data?.result?.list) {
      console.log('Sample Bybit:', data.result.list[0]);
    }
  } catch (e) {
    console.error('Bybit err:', e.message);
  }
}
test();
