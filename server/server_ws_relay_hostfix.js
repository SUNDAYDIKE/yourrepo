// server_ws_relay_hostfix.js — 2P WS relay with explicit host and roster
import http from 'http';
import { WebSocketServer } from 'ws';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});
const wss = new WebSocketServer({ server });
const PORT = Number(process.env.PORT || 8080);
server.listen(PORT, () => console.log('[relay] listening on', PORT));

const rooms = new Map(); // roomId -> { clients: Map<id,ws>, hostId: string|null, seq: number }
let nextId = 1;

function getRoom(roomId){
  if (!rooms.has(roomId)) rooms.set(roomId, { clients: new Map(), hostId: null, seq: 0 });
  return rooms.get(roomId);
}
function roster(roomId){
  const room = rooms.get(roomId); if (!room) return {hostId:null, ids:[]};
  return { hostId: room.hostId, ids: [...room.clients.keys()] };
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
    let m; try { m = JSON.parse(String(buf)); } catch { return; }

    if (m.type === 'join'){
      const roomId = String(m.room||'').trim(); if (!roomId){ try { ws.close(1002, 'no_room'); } catch {}; return; }
      const room = getRoom(roomId);
      if (room.clients.size >= 2){
        try { ws.send(JSON.stringify({ type:'error', error:'room_full' })); } catch {}
        try { ws.close(1001, 'room_full'); } catch {}
        return;
      }
      const isFirst = room.clients.size === 0;
      room.clients.set(ws._id, ws);
      ws._room = roomId;
      if (isFirst) room.hostId = ws._id;
      // Send joined (with host flag) to this client only
      try { ws.send(JSON.stringify({ type:'joined', id: ws._id, host: ws._id === room.hostId, st: Date.now() })); } catch {}
      // Broadcast roster to everyone
      const r = roster(roomId);
      try { broadcast(roomId, { type:'roster', ...r }); } catch {}
      return;
    }

    const roomId = ws._room; if (!roomId) return;
    const room = rooms.get(roomId); if (!room) return;

    if (m.type === 'start'){
      room.seq = 0;
      broadcast(roomId, { type:'start', payload: m.payload, st: Date.now(), seq: room.seq });
      return;
    }
    if (m.type === 'cmd'){
      const seq = ++room.seq;
      broadcast(roomId, { type:'cmd', from: ws._id, cmd: m.cmd, st: Date.now(), seq });
      return;
    }
    if (m.type === 'ready'){
      broadcast(roomId, { type:'ready', id: ws._id, value: !!m.value });
      return;
    }
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
    if (room.hostId === ws._id){
      room.hostId = [...room.clients.keys()][0] || null; // hand over to remaining peer
    }
    try { broadcast(roomId, { type:'peer_leave', id: ws._id }); } catch {}
    if (room.clients.size === 0) rooms.delete(roomId);
    else {
      const r = roster(roomId);
      try { broadcast(roomId, { type:'roster', ...r }); } catch {}
    }
  });
});
