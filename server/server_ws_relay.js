// server_ws_relay.js — Render-ready WebSocket relay with per-room seq ordering
// Usage: `node server_ws_relay.js` (PORT from env on Render)
import http from 'http';
import { WebSocketServer } from 'ws';

// Basic HTTP server for Render healthcheck (GET / -> 'ok')
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});

// Bind WS to the same HTTP server/port
const wss = new WebSocketServer({ server });

const PORT = Number(process.env.PORT || 8080);
server.listen(PORT, () => console.log('[relay] listening on', PORT));

// --- 2-player rooms with ordered broadcast ---
// rooms: Map<roomId, { clients: Map<clientId, ws>, seq: number }>
const rooms = new Map();
let nextId = 1;

function getRoom(roomId){
  if (!rooms.has(roomId)) rooms.set(roomId, { clients: new Map(), seq: 0 });
  return rooms.get(roomId);
}

function broadcast(roomId, msg){
  const room = rooms.get(roomId); if (!room) return;
  const data = JSON.stringify(msg);
  for (const [, ws] of room.clients){
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

    // --- join ---
    if (m.type === 'join'){
      const roomId = String(m.room || '').trim();
      if (!roomId) return;
      const room = getRoom(roomId);
      if (room.clients.size >= 2){
        try { ws.send(JSON.stringify({ type:'error', error:'room_full' })); } catch {}
        try { ws.close(1001, 'room_full'); } catch {}
        return;
      }
      room.clients.set(ws._id, ws);
      ws._room = roomId;
      try { ws.send(JSON.stringify({ type:'joined', id: ws._id, st: Date.now() })); } catch {}
      return;
    }

    const roomId = ws._room; if (!roomId) return;
    const room = rooms.get(roomId); if (!room) return;

    // --- start --- (reset ordering)
    if (m.type === 'start'){
      room.seq = 0;
      broadcast(roomId, { type:'start', payload: m.payload, st: Date.now(), seq: room.seq });
      return;
    }

    // --- cmd --- (order with seq)
    if (m.type === 'cmd'){
      const seq = ++room.seq;
      broadcast(roomId, { type:'cmd', from: ws._id, cmd: m.cmd, st: Date.now(), seq });
      return;
    }

    // --- state (optional snapshots) ---
    if (m.type === 'state'){
      broadcast(roomId, { type:'state', payload: m.payload, st: Date.now() });
      return;
    }
  });

  ws.on('close', () => {
    const roomId = ws._room;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;
    room.clients.delete(ws._id);
    try { broadcast(roomId, { type:'peer_leave', id: ws._id }); } catch {}
    if (room.clients.size === 0) rooms.delete(roomId);
  });
});
