// net_debug_overlay.js – floating console for WS + start tracing
(function(){
  function ready(fn){
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true});
    else fn();
  }
  ready(()=>{
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:2147483646;background:#111;color:#eee;padding:8px 10px;border-radius:10px;font:12px/1.4 system-ui, sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.3);opacity:.9';
    box.innerHTML = [
      '<div style="margin-bottom:6px"><b>Net Debug</b>',
      '<button id="ndg_tgl" style="margin-left:8px;padding:2px 6px">hide</button></div>',
      '<div id="ndg_body">',
      '<div>WS: <span id="ndg_ws"></span></div>',
      '<div>ID: <span id="ndg_id"></span></div>',
      '<div>Last: <span id="ndg_last"></span></div>',
      '<div style="margin-top:6px">',
      '<button id="ndg_btn_start" style="padding:4px 6px;margin-right:6px">Force Local Start</button>',
      '<button id="ndg_btn_log" style="padding:4px 6px">Log Messages</button>',
      '</div>',
      '</div>'
    ].join('');
    document.body.appendChild(box);
    const wsEl = box.querySelector('#ndg_ws');
    const idEl = box.querySelector('#ndg_id');
    const lastEl = box.querySelector('#ndg_last');
    const body = box.querySelector('#ndg_body');
    const tgl = box.querySelector('#ndg_tgl');
    tgl.onclick = ()=>{ body.style.display = (body.style.display==='none'?'block':'none'); tgl.textContent = (body.style.display==='none'?'show':'hide'); };
    function wsURL(){ try{ return window.NET_WS_URL || '(auto)'; } catch{ return '(n/a)'; } }
    function refresh(){ wsEl.textContent = wsURL(); idEl.textContent = (window.Net && window.Net.myId && window.Net.myId()) || '(none)'; }
    setInterval(refresh, 1000);
    window.addEventListener('net:joined', (e)=>{ lastEl.textContent = 'joined ' + (e.detail&&e.detail.id); refresh(); });
    window.addEventListener('net:start',  (e)=>{ lastEl.textContent = 'start ' + JSON.stringify(e.detail); refresh(); });
    window.addEventListener('net:state',  (e)=>{ lastEl.textContent = 'state'; refresh(); });
    window.addEventListener('net:cmd',    (e)=>{ lastEl.textContent = 'cmd'; refresh(); });
    window.addEventListener('net:error',  (e)=>{ lastEl.textContent = 'error ' + (e.detail&&e.detail.code); refresh(); });
    window.addEventListener('net:open',   refresh);
    window.addEventListener('net:close',  refresh);
    box.querySelector('#ndg_btn_log').onclick = ()=> console.log('[NetDebug] Net=', window.Net);
    box.querySelector('#ndg_btn_start').onclick = ()=>{
      const u = new URL(location.href);
      const rows = +(u.searchParams.get('rows')||8);
      const cols = +(u.searchParams.get('cols')||8);
      const colors = +(u.searchParams.get('colors')||5);
      const payload = { seed: Math.floor(Math.random()*1e9), rows, cols, colors };
      if (window.__applyStartMatch) window.__applyStartMatch(payload);
      else alert('__applyStartMatch not found');
    };
  });
})();