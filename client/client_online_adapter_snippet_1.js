// client_online_adapter_snippet.js (updated)
(function(){
  const WS_URL = (window.NET_WS_URL || 'ws://localhost:8080');
  let ws, myId=null, role='GUEST', roomId=null;

  window.Net = {
    connect: (room)=>{
      roomId = room;
      ws = new WebSocket(WS_URL);
      ws.onopen = () => ws.send(JSON.stringify({ type: 'join', room: roomId }));
      ws.onmessage = (ev) => {
        const m = JSON.parse(ev.data);
        if (m.type === 'hello') return;
        if (m.type === 'joined'){ myId=m.id; window.Net.onMessage && window.Net.onMessage(m); return; }
        if (m.type === 'start' || m.type === 'cmd' || m.type === 'state' || m.type === 'peer_join' || m.type === 'peer_leave' || m.type === 'host_change'){
          // Ignore local echo for cmd
          if (m.type === 'cmd' && m.from && m.from === myId) return;
          window.Net.onMessage && window.Net.onMessage(m);
          return;
        }
      };
    },
    ready: (v)=> ws && ws.send(JSON.stringify({ type:'ready', value: !!v })),
    sendCmd: (cmd)=> ws && ws.send(JSON.stringify({ type:'cmd', cmd })),
    isHost: ()=> false,
    onMessage: null,
  };

  console.log('[Net] adapter loaded. Usage: ?room=ROOM123&ws=ws://host:8080');
})();