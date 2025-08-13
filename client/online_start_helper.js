// online_start_helper.js (mobile clickfix)
(function(){
  function domReady(fn){
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true});
    else fn();
  }

  domReady(()=>{
    try{
      const u = new URL(location.href);
      const room = u.searchParams.get('room');
      const ws   = u.searchParams.get('ws');
      if (ws) window.NET_WS_URL = ws;
      if (!room) return;

      // Ensure adapter connects (if not already)
      function ensureConnect(){
        if (!window.Net) return false;
        try{
          if (!window.Net.isConnected || !window.Net.isConnected()){
            window.Net.connect(room);
          }
        }catch(_){}
        return true;
      }
      if (!ensureConnect()){
        const t = setInterval(()=>{ if (ensureConnect()) clearInterval(t); }, 300);
        setTimeout(()=> clearInterval(t), 6000);
      }

      const btn = document.createElement('button');
      btn.textContent = 'Online Start';
      btn.setAttribute('type','button');
      btn.setAttribute('aria-label','Start online match');
      btn.tabIndex = 0;

      const style = btn.style;
      style.position = 'fixed';
      style.right = '12px';
      style.bottom = '12px';
      style.padding = '12px 16px';
      style.borderRadius = '12px';
      style.border = '1px solid #7a7a7a';
      style.background = '#ffffff';
      style.boxShadow = '0 4px 14px rgba(0,0,0,.18)';
      style.fontSize = '15px';
      style.fontWeight = '600';
      style.zIndex = '2147483647';       // max
      style.pointerEvents = 'auto';
      style.opacity = '1';
      style.touchAction = 'manipulation';
      style.userSelect = 'none';
      style.webkitTapHighlightColor = 'rgba(0,0,0,0)';

      function startOnline(ev){
        try{
          if (ev){ ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation(); }
          const rows = +(u.searchParams.get('rows')||8);
          const cols = +(u.searchParams.get('cols')||8);
          const colors = +(u.searchParams.get('colors')||5);
          const seed = Math.floor(Math.random()*1e9);
          const payload = { seed, rows, cols, colors };
          if (!window.Net){ alert('Net adapter not loaded.'); return; }
          // Broadcast
          window.Net.start(payload);
          // Apply locally
          if (window.__applyStartMatch) window.__applyStartMatch(payload);
          // Visual feedback
          const prev = btn.textContent;
          btn.textContent = 'Starting...';
          btn.style.opacity = '0.7';
          setTimeout(()=>{ btn.textContent = prev; btn.style.opacity = '1'; }, 800);
          console.log('[OnlineStart] payload', payload);
        }catch(e){
          console.warn('[OnlineStart] error', e);
          alert('Online start failed: ' + e.message);
        }
      }

      // Capture touch/click before game handlers
      btn.addEventListener('pointerdown', startOnline, {capture:true});
      btn.addEventListener('touchstart', startOnline, {capture:true, passive:false});
      btn.addEventListener('click', startOnline, {capture:true});

      document.body.appendChild(btn);
    }catch(e){ console.warn('[online_start_helper clickfix]', e); }
  });
})();