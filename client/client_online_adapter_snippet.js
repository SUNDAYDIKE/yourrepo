// client_online_adapter_snippet.js (singleton, auto-connect once, auto-WS)
// - Reads ?ws= and ?room=
// - Connects only once per page (prevents double-join -> room_full)
// - Applies 'start'/'state' by default if hooks exist
(function(){
  const U = new URL(location.href);
  const ROOM = U.searchParams.get('room');
  const QWS  = U.searchParams.get('ws');
  if (QWS) window.NET_WS_URL = QWS;

  function getWSURL(){
    const v = (typeof window.NET_WS_URL === 'string' && window.NET_WS_URL.trim()) ? window.NET_WS_URL.trim() : null;
    if (v) return v;
    const proto = (location.protocol === 'https:' ? 'wss:' : 'ws:');
    return proto + '//localhost:8080';
  }

  function warmup(){
    try{
      const wsurl = getWSURL();
      const httpURL = wsurl.replace(/^wss:/,'https:').replace(/^ws:/,'http:');
      const u = new URL(httpURL);
      fetch(u.origin + '/', { mode: 'no-cors' }).catch(()=>{});
    }catch(e){}
  }

  let ws=null, myId=null, roomId=null;
  let connected=false, everConnected=false;

  function canSend(){ return ws && ws.readyState === 1; } // OPEN

  function ensureSingleConnect(room){
    // If a socket exists and is CONNECTING(0) or OPEN(1), do nothing
    if (ws && (ws.readyState === 0 || ws.readyState === 1)) return true;
    roomId = room;
    const url = getWSURL();
    console.log('[Net] connecting to', url, 'room=', roomId);
    warmup();
    ws = new WebSocket(url);
    window.Net._ws = ws;

    ws.onopen = () => {
      connected = true; everConnected = true;
      try { ws.send(JSON.stringify({ type:'join', room: roomId })); } catch {}
    };
    ws.onmessage = (ev) => {
      let m; try { m = JSON.parse(ev.data); } catch { return; }
      if (m.type === 'hello') return;
      if (m.type === 'joined'){ myId=m.id; window.Net._id=myId; if (window.Net.onMessage) window.Net.onMessage(m); return; }
      if (m.type === 'error' && m.error === 'room_full'){
        alert('この部屋は満員です（2人まで）。別の room を指定してください。');
        try { ws.close(1001, 'room_full'); } catch {}
        return;
      }
      // Default apply for start/state if no custom handler
      if (!window.Net.onMessage){
        if (m.type === 'start' && window.__applyStartMatch){ window.__applyStartMatch(m.payload); return; }
        if (m.type === 'state' && window.__applyState){ window.__applyState(m.payload); return; }
      } else {
        window.Net.onMessage(m);
      }
    };
    ws.onclose = () => { connected=false; };
    ws.onerror = () => { /* noop */ };
    return true;
  }

  window.Net = {
    connect: (room)=> ensureSingleConnect(room),
    start: (payload)=> { if (canSend()) try { ws.send(JSON.stringify({ type:'start', payload })); } catch {} },
    ready: (v)=> { if (canSend()) try { ws.send(JSON.stringify({ type:'ready', value: !!v })); } catch {} },
    sendCmd: (cmd)=> { if (canSend()) try { ws.send(JSON.stringify({ type:'cmd', cmd })); } catch {} },
    isConnected: ()=> connected,
    hasEverConnected: ()=> everConnected,
    myId: ()=> myId,
    onMessage: null,
    _ws: null
  };

  // Auto-connect once when ?room= is present (no duplicate calls)
  if (ROOM){ ensureSingleConnect(ROOM); }

  console.log('[Net] singleton adapter loaded.');
})();