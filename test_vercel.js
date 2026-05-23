const https = require('https');
https.get('https://tdb-responde-full.vercel.app/assets/index-CZ-hZVYg.js', (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    console.log("Includes reconnectTimeout?", data.includes("reconnectTimeout"));
    console.log("Includes websocket?", data.toLowerCase().includes("websocket"));
    console.log("Includes conection magic word?", data.includes("[WebSocket] Conectando a:"));
  });
});
