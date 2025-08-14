// online_lockstep_hotfix_v2.js — do not ignore 'start' on guest; rely on server echo ordering
(function(){
  const origOnMessage = window.Net && window.Net.onMessage;
  if (!window.Net){ console.warn('[hotfix v2] Net not found'); return; }

  window.Net.onMessage = function(m){
    try{
      if (m && m.type === 'cmd'){
        // No-op: allow default handlers in app to process 'cmd'
      } else if (m && m.type === 'start'){
        // Allow both peers to apply start from server broadcast
        // (App's __applyStartMatch will handle payload; no local start here)
      }
    }catch(e){ console.warn('[hotfix v2]', e); }
    if (typeof origOnMessage === 'function') try{ origOnMessage(m); }catch(e){}
  };
  console.log('[hotfix v2] installed');
})();
