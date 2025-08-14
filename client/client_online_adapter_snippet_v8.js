// client_online_adapter_snippet_v8.js — adds Net.isHost + roster handling
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
  function dispatch(name, detail){ try { window.dispatchEvent(new CustomEvent(name, { detail })); } catch {} }

  let ws = null, connected = false, myId = null, roomId = null, isHost = false;
  function canSend(){ return connected && ws && ws.readyState === WebSocket.OPEN; }

  function ensureSingleConnect(room){
    roomId = String(room||'').trim();
    if (!roomId) return false;
    if (ws && connected) return true;

    // Warm-up HTTP to wake Render
    try{ const httpURL = getWSURL().replace(/^wss:/,'https:').replace(/^ws:/,'http:'); const u = new URL(httpURL); fetch(u.origin + '/', { mode:'no-cors' }).catch(()=>{}); }catch(_){}

    ws = new WebSocket(getWSURL());
    window.Net._ws = ws;
    ws.onopen = () => { connected = true; try { ws.send(JSON.stringify({ type:'join', room: roomId })); } catch {}; dispatch('net:open', { room: roomId }); };
    ws.onmessage = (ev) => {
      let m; try { m = JSON.parse(ev.data); } catch { return; }
      if (m.type === 'joined'){
        myId = m.id; window.Net._id = myId; isHost = !!m.host; window.Net.isHost = isHost;
        dispatch('net:joined', { id: myId, room: roomId, host: isHost });
        if (window.Net.onMessage) window.Net.onMessage(m);
        return;
      }
      if (m.type === 'roster'){
        if (m.hostId){ isHost = (myId && m.hostId === myId); window.Net.isHost = isHost; }
        dispatch('net:roster', m);
        if (window.Net.onMessage) window.Net.onMessage(m);
        return;
      }
      if (m.type === 'error' && m.error === 'room_full'){
        alert('この部屋は満員です（2人まで）。別の room を指定してください。');
        try { ws.close(1001, 'room_full'); } catch {}
        dispatch('net:error', { code:'room_full' });
        return;
      }
      if (m.type === 'start'){
        if (window.__applyStartMatch) try { window.__applyStartMatch(m.payload); } catch(e){ console.warn(e); }
        dispatch('net:start', m.payload);
        if (window.Net.onMessage) window.Net.onMessage(m);
        return;
      }
      if (m.type === 'state'){
        if (window.__applyState) try { window.__applyState(m.payload); } catch(e){ console.warn(e); }
        dispatch('net:state', m.payload);
        if (window.Net.onMessage) window.Net.onMessage(m);
        return;
      }
      if (m.type === 'cmd'){
        dispatch('net:cmd', m);
        if (window.Net.onMessage) window.Net.onMessage(m);
        return;
      }
    };
    ws.onclose = () => { connected=false; dispatch('net:close', {}); };
    ws.onerror = () => { dispatch('net:error', { code:'ws_error' }); };
    return true;
  }

  window.Net = {
    connect: (room)=> ensureSingleConnect(room),
    start: (payload)=> { if (canSend()) try { ws.send(JSON.stringify({ type:'start', payload })); } catch {} },
    ready: (v)=> { if (canSend()) try { ws.send(JSON.stringify({ type:'ready', value: !!v })); } catch {} },
    sendCmd: (cmd)=> { if (canSend()) try { ws.send(JSON.stringify({ type:'cmd', cmd })); } catch {} },
    isConnected: ()=> connected,
    isHost: false,
    myId: ()=> myId,
    onMessage: null,
    _ws: null,
    _id: null
  };

  if (ROOM){ ensureSingleConnect(ROOM); }
  console.log('[Net] adapter v8 loaded.');
})(); 
