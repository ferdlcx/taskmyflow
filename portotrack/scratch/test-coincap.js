async function test() {
  try {
    const res = await fetch('https://api.coincap.io/v2/assets?limit=3');
    console.log('CoinCap status:', res.status);
    const data = await res.json();
    console.log('CoinCap keys:', Object.keys(data));
  } catch (e) {
    console.error('CoinCap err:', e.message);
  }
}
test();
