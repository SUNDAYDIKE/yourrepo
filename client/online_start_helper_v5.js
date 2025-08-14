// online_start_helper_v5.js — Host-only start button (auto-disables on guest)
(function(){
  function ready(fn){ if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true}); else fn(); }
  ready(()=>{
    try{
      const u = new URL(location.href);
      if (!u.searchParams.get('room')) return;

      const wrap = document.createElement('div');
      Object.assign(wrap.style, { position:'fixed', right:'8px', bottom:'8px', zIndex:'2147483647', pointerEvents:'none' });
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = 'Waiting…';
      btn.dataset.onlineStart = '1';
      Object.assign(btn.style, { pointerEvents:'auto', padding:'8px 12px', borderRadius:'10px', border:'1px solid #444', background:'#111', color:'#fff', font:'600 12px/1.4 -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial', boxShadow:'0 2px 10px rgba(0,0,0,0.5)', opacity:'0.5' });
      wrap.appendChild(btn); document.body.appendChild(wrap);

      function update(){
        const ok = window.Net && typeof Net.isConnected==='function' && Net.isConnected();
        const host = !!(window.Net && 'isHost' in Net && Net.isHost);
        if (ok && host){
          btn.disabled = false; btn.style.opacity = '1'; btn.textContent = 'Online Start (Host)';
        }else if (ok && !host){
          btn.disabled = true; btn.style.opacity = '0.6'; btn.textContent = 'Waiting Host…';
        }else{
          btn.disabled = true; btn.style.opacity = '0.5'; btn.textContent = 'Connecting…';
        }
      }
      update();
      const iv = setInterval(update, 400);
      window.addEventListener('net:joined', update);
      window.addEventListener('net:roster', update);
      window.addEventListener('net:open', update);
      window.addEventListener('net:close', update);
      window.addEventListener('beforeunload', ()=> clearInterval(iv));

      function startOnline(ev){
        ev.preventDefault(); ev.stopPropagation();
        if (!window.Net || !Net.isConnected() || !Net.isHost) return;
        const payload = window.__collectStartPayload ? window.__collectStartPayload() : (window.__DEFAULT_START__ || {});
        if (!payload) return;
        try { window.Net.start(payload); } catch {}
        if (window.__applyStartMatch) window.__applyStartMatch(payload);
        const prev = btn.textContent;
        btn.textContent = 'Starting...'; btn.style.opacity = '0.75';
        setTimeout(()=>{ btn.textContent = prev; btn.style.opacity = '1'; }, 800);
        console.log('[OnlineStart v5] payload', payload);
      }

      btn.addEventListener('pointerdown', startOnline, {capture:true});
      btn.addEventListener('touchstart', startOnline, {capture:true, passive:false});
      btn.addEventListener('click', startOnline, {capture:true});
    }catch(e){ console.warn('[online_start_helper_v5]', e); }
  });
})();
