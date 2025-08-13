// server_ws_relay.js (ESM)
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: process.env.PORT ? Number(process.env.PORT) : 8080 });
console.log('[relay] listening on', wss.options.port);

const rooms = new Map(); // roomId -> Map<clientId, ws>
let nextId = 1;

function broadcast(roomId, msg){
  const r = rooms.get(roomId); if (!r) return;
  const data = JSON.stringify(msg);
  for (const [id, ws] of r){
    if (ws.readyState === ws.OPEN){ ws.send(data); }
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
      if (r.size >= 2) { ws.send(JSON.stringify({ type:'error', error:'room_full' })); return; }
      r.set(ws._id, ws);
      ws._room = roomId;
      ws.send(JSON.stringify({ type:'joined', id: ws._id }));
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

  ws.on('close', ()=>{
    const roomId = ws._room;
    if (!roomId) return;
    const r = rooms.get(roomId);
    if (!r) return;
    r.delete(ws._id);
    if (r.size === 0) rooms.delete(roomId);
  });
});