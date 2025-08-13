// client_online_adapter_snippet.js (auto-WS param, no localhost lock-in)
(function(){
  // Read ?ws= from URL and set window.NET_WS_URL early
  try{
    const u = new URL(location.href);
    const qws = u.searchParams.get('ws');
    if (qws) window.NET_WS_URL = qws;
  }catch(e){}

  function getWSURL(){
    // Evaluate at call-time so later scripts can override window.NET_WS_URL
    const v = (typeof window.NET_WS_URL === 'string' && window.NET_WS_URL.trim()) ? window.NET_WS_URL.trim() : null;
    if (v) return v;
    // Fallback: if page is https, prefer wss to avoid mixed content
    const proto = (location.protocol === 'https:' ? 'wss:' : 'ws:');
    return proto + '//localhost:8080';
  }

  function warmup(){
    try{
      const wsurl = getWSURL();
      const httpURL = wsurl.replace(/^wss:/,'https:').replace(/^ws:/,'http:');
      const u = new URL(httpURL);
      fetch(u.origin + '/', { mode: 'no-cors' }).catch(()=>{});
    }catch(e){/* ignore */}
  }

  let ws, myId=null, roomId=null, connected=false;

  window.Net = {
    connect: (room)=>{
      roomId = room;
      const connectURL = getWSURL();
      console.log('[Net] connecting to', connectURL);
      warmup();
      ws = new WebSocket(connectURL);
      ws.onopen = () => {
        connected = true;
        try { ws.send(JSON.stringify({ type:'join', room: roomId })); } catch {}
      };
      ws.onmessage = (ev) => {
        let m; try { m = JSON.parse(ev.data); } catch { return; }
        if (m.type === 'hello') return;
        if (m.type === 'joined'){ myId=m.id; window.Net._id = myId; window.Net.onMessage && window.Net.onMessage(m); return; }
        if (m.type === 'error' && m.error === 'room_full'){
          alert('この部屋は満員です（2人まで）。別の room を指定してください。');
          try { ws.close(1001, 'room_full'); } catch {}
          return;
        }
        if (m.type === 'start' || m.type === 'state'){
          window.Net.onMessage && window.Net.onMessage(m);
          return;
        }
        if (m.type === 'cmd'){
          if (m.from && m.from === myId) return;
          window.Net.onMessage && window.Net.onMessage(m);
          return;
        }
      };
      ws.onclose = () => { connected=false; };
      ws.onerror = () => { /* noop */ };
    },
    start: (payload)=> { try { ws && ws.send(JSON.stringify({ type:'start', payload })); } catch { console.warn('[Net] start failed: ws not open'); } },
    ready: (v)=> { try { ws && ws.send(JSON.stringify({ type:'ready', value: !!v })); } catch {} },
    sendCmd: (cmd)=> { try { ws && ws.send(JSON.stringify({ type:'cmd', cmd })); } catch {} },
    isConnected: ()=> connected,
    onMessage: null,
    myId: ()=> myId
  };

  console.log('[Net] adapter (auto-WS) loaded. Use ?ws=wss://<render-app>.onrender.com');
})();