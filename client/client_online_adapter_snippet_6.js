// client_online_adapter_snippet.js (singleton + auto-WS + room-full handling)
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

  let ws=null, myId=null, roomId=null;
  let connected=false;

  function canSend(){ return ws && ws.readyState === 1; }

  function ensureSingleConnect(room){
    if (ws && (ws.readyState === 0 || ws.readyState === 1)) return true;
    roomId = room;
    const url = getWSURL();
    console.log('[Net] connecting to', url, 'room=', roomId);
    // wake Render (ignore result)
    try{
      const httpURL = url.replace(/^wss:/,'https:').replace(/^ws:/,'http:');
      const u = new URL(httpURL); fetch(u.origin + '/', { mode:'no-cors' }).catch(()=>{});
    }catch(_){}

    ws = new WebSocket(url);
    window.Net._ws = ws;

    ws.onopen = () => {
      connected = true;
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
    myId: ()=> myId,
    onMessage: null,
    _ws: null,
    _id: null
  };

  if (ROOM){ ensureSingleConnect(ROOM); }

  console.log('[Net] singleton adapter loaded.');
})();