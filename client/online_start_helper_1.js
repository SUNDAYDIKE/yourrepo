// online_start_helper.js
(function(){
  function onceDOMReady(fn){
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true});
    else fn();
  }

  onceDOMReady(()=>{
    try{
      const u = new URL(location.href);
      const room = u.searchParams.get('room');
      const ws   = u.searchParams.get('ws');
      if (ws) window.NET_WS_URL = ws;
      if (!room) return; // only when ?room= is present

      // Ensure connection (if app hasn't already connected)
      function tryConnect(){
        if (!window.Net) return false;
        if (window.Net.isConnected && window.Net.isConnected()) return true;
        try { window.Net.connect(room); } catch {}
        return true;
      }
      if (!tryConnect()){
        const iv = setInterval(()=>{ if (tryConnect()) clearInterval(iv); }, 300);
        setTimeout(()=> clearInterval(iv), 5000);
      }

      // Floating "Online Start" button
      const btn = document.createElement('button');
      btn.textContent = 'Online Start';
      Object.assign(btn.style, {
        position:'fixed', right:'12px', bottom:'12px', zIndex:99999,
        padding:'10px 14px', borderRadius:'10px', border:'1px solid #888',
        background:'#fff', boxShadow:'0 2px 8px rgba(0,0,0,.15)', fontSize:'14px', cursor:'pointer'
      });
      btn.onclick = ()=>{
        const rows = +(u.searchParams.get('rows')||8);
        const cols = +(u.searchParams.get('cols')||8);
        const colors = +(u.searchParams.get('colors')||5);
        const seed = Math.floor(Math.random()*1e9);
        const payload = { seed, rows, cols, colors };
        if (!window.Net){ alert('Net adapter not loaded.'); return; }
        // Broadcast to both
        window.Net.start(payload);
        // Apply locally immediately
        if (window.__applyStartMatch) window.__applyStartMatch(payload);
      };
      document.body.appendChild(btn);
    }catch(e){ console.warn(e); }
  });
})();