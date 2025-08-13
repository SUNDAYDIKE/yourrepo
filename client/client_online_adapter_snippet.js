// client_online_adapter_snippet.js (patched: adds Net.start, warmup, isConnected)
(function(){
  const WS_URL = (window.NET_WS_URL || 'ws://localhost:8080');
  let ws, myId=null, roomId=null, connected=false;

  function warmup(){
    try{
      if (!window.NET_WS_URL) return;
      const httpURL = window.NET_WS_URL.replace(/^wss:/,'https:').replace(/^ws:/,'http:');
      const u = new URL(httpURL);
      // Wake Render free instance (ignore result)
      fetch(u.origin + '/', { mode: 'no-cors' }).catch(()=>{});
    }catch(e){/* ignore */}
  }

  window.Net = {
    connect: (room)=>{
      roomId = room;
      warmup();
      ws = new WebSocket(WS_URL);
      ws.onopen = () => {
        connected = true;
        window.Net._connected = true;
        try { ws.send(JSON.stringify({ type: 'join', room: roomId })); } catch {}
      };
      ws.onmessage = (ev) => {
        let m; try { m = JSON.parse(ev.data); } catch { return; }
        if (m.type === 'hello') return;
        if (m.type === 'joined'){ myId=m.id; window.Net._id = myId; window.Net.onMessage && window.Net.onMessage(m); return; }
        if (m.type === 'start' || m.type === 'state'){
          window.Net.onMessage && window.Net.onMessage(m);
          return;
        }
        if (m.type === 'cmd'){
          // ignore my own echo
          if (m.from && m.from === myId) return;
          window.Net.onMessage && window.Net.onMessage(m);
          return;
        }
      };
      ws.onclose = () => { connected=false; window.Net._connected=false; };
      ws.onerror = () => { /* keep silent; UI can inspect console if needed */ };
    },
    start: (payload)=> { try { ws && ws.send(JSON.stringify({ type:'start', payload })); } catch {} },
    ready: (v)=> { try { ws && ws.send(JSON.stringify({ type:'ready', value: !!v })); } catch {} },
    sendCmd: (cmd)=> { try { ws && ws.send(JSON.stringify({ type:'cmd', cmd })); } catch {} },
    isConnected: ()=> connected,
    onMessage: null,
    myId: ()=> myId
  };

  console.log('[Net] adapter loaded. Example: Net.connect(\"ROOM1\"); Net.start({seed,rows,cols,colors});');
})();