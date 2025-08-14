// online_pvp_patch.js
// Drop-in patch: make online matches PvP (disable CPU) and ignore own echoed cmds.
// Include this AFTER your game scripts and adapter in index.html.

(function(){
  function log(){ try{ console.log.apply(console, arguments); }catch(_){} }

  // --- PvP toggle: provide a global you can call, and try to stop any CPU loops if present
  if (typeof window.setOnlineMode !== 'function'){
    window.setOnlineMode = function(on){
      window.__ONLINE_MODE__ = !!on;
      // Common flags seen in builds
      try { if (on && typeof window.CPU_ENABLED !== 'undefined') window.CPU_ENABLED = false; } catch(_) {}
      try { if (on && typeof window.setCpuEnabled === 'function') window.setCpuEnabled(false); } catch(_) {}
      try { if (on && typeof window.stopCPU === 'function') window.stopCPU(); } catch(_) {}
      log('[online_pvp_patch] setOnlineMode =>', on);
    };
  }

  // --- Hook: when a net start arrives, force PvP mode (CPU OFF)
  (function(){
    const prev = window.__applyStartMatch;
    window.__applyStartMatch = function(payload){
      if (prev) try { prev(payload); } catch(e){ console.warn(e); }
      try { window.setOnlineMode(true); } catch(_){}
    };
    window.addEventListener('net:start', function(){
      try { window.setOnlineMode(true); } catch(_){}
    });
  })();

  // --- Ignore echo of our own cmd (prevents double-apply and ping-pong)
  (function(){
    if (!window.Net) return;
    const prevOnMessage = window.Net.onMessage;
    window.Net.onMessage = function(m){
      try{
        if (m && m.type === 'cmd'){
          if (m.from && typeof window.Net.myId === 'function' && m.from === window.Net.myId()){
            // it's our own command echoed back; ignore
            return;
          }
        }
      }catch(_){}
      if (prevOnMessage) try { prevOnMessage(m); } catch(e){ console.warn(e); }
    };
    log('[online_pvp_patch] Net.onMessage echo filter installed');
  })();

})();