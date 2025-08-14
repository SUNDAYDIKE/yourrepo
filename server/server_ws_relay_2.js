// server_ws_relay.js (Render-ready: HTTP healthcheck + WS bound to PORT)
import http from 'http';
import { WebSocketServer } from 'ws';

// HTTP healthcheck for Render
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});

// Attach WS to HTTP server
const wss = new WebSocketServer({ server });

// Listen on Render's PORT (fallback 8080)
const PORT = Number(process.env.PORT || 8080);
server.listen(PORT, () => console.log('[relay] listening on', PORT));

// --- Minimal 2-player room relay ---
const rooms = new Map(); // Map<roomId, Map<clientId, ws>>
let nextId = 1;

function broadcast(roomId, msg){
  const r = rooms.get(roomId); if (!r) return;
  const data = JSON.stringify(msg);
  for (const [, ws] of r){
    if (ws.readyState === ws.OPEN){
      try { ws.send(data); } catch {}
    }
  }
}

wss.on('connection', (ws) => {
  ws._id = String(nextId++);
  ws._room = null;

  ws.on('message', (buf) => {
    let m; try { m = JSON.parse(buf); } catch { return; }

    if (m.type === 'join'){
      const roomId = String(m.room || '').trim();
      if (!roomId) return;
      if (!rooms.has(roomId)) rooms.set(roomId, new Map());
      const r = rooms.get(roomId);
      if (r.size >= 2){
        try { ws.send(JSON.stringify({ type:'error', error:'room_full' })); } catch {}
        try { ws.close(1001, 'room_full'); } catch {}
        return;
      }
      r.set(ws._id, ws);
      ws._room = roomId;
      try { ws.send(JSON.stringify({ type:'joined', id: ws._id })); } catch {}
      return;
    }

    const roomId = ws._room; if (!roomId) return;
    if (m.type === 'cmd'){
      broadcast(roomId, { type:'cmd', from: ws._id, cmd: m.cmd, st: Date.now() });
    } else if (m.type === 'start'){
      broadcast(roomId, { type:'start', payload: m.payload });
    } else if (m.type === 'state'){
      broadcast(roomId, { type:'state', payload: m.payload });
    }
  });

  ws.on('close', () => {
    const roomId = ws._room;
    if (!roomId) return;
    const r = rooms.get(roomId);
    if (!r) return;
    r.delete(ws._id);
    try { broadcast(roomId, { type:'peer_leave', id: ws._id }); } catch {}
    if (r.size === 0) rooms.delete(roomId);
  });
});
