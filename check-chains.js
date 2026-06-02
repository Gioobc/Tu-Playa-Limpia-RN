const fetch = require('node-fetch');

async function checkChain(url) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_chainId', params: [], id: 1 })
    });
    const data = await res.json();
    console.log(`${url}: ${data.result} (${parseInt(data.result, 16)})`);
  } catch (e) {
    console.log(`${url}: Error ${e.message}`);
  }
}

checkChain('https://rpc.tanenbaum.io');
checkChain('https://rpc.tanenbaum.io');
