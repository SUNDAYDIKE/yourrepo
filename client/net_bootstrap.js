// net_bootstrap.js – minimal wiring for Net.onMessage + auto-connect
(function(){
  try{
    const u = new URL(location.href);
    const room = u.searchParams.get('room');
    const ws   = u.searchParams.get('ws');
    if (ws) window.NET_WS_URL = ws;
    if (!room) return;
    function bind(){
      if (!window.Net){ return false; }
      try { Net.connect(room); } catch(e){}
      Net.onMessage = function(m){
        try{
          if (m.type === 'start'){
            if (window.__applyStartMatch) window.__applyStartMatch(m.payload);
            return;
          }
          if (m.type === 'cmd' && m.cmd){
            const {kind,args} = m.cmd;
            if (kind==='tap')        window.__applyStart?.(...(args||[]));
            if (kind==='twoFinger')  window.__applyCancelLast?.();
            if (kind==='closeLoop')  window.__applyClose?.();
          }
          if (m.type === 'state' && window.__applyState){
            window.__applyState(m.payload);
          }
        }catch(e){ console.warn('[net_bootstrap] apply error', e); }
      };
      return true;
    }
    if (!bind()){
      const iv = setInterval(()=>{ if (bind()){ clearInterval(iv); } }, 250);
      setTimeout(()=> clearInterval(iv), 8000);
    }
  }catch(e){ console.warn('[net_bootstrap]', e); }
})();