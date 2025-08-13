// online_start_helper_v3.js – robust mobile click with overlay container
(function(){
  function ready(fn){
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true});
    else fn();
  }
  ready(()=>{
    try{
      const u = new URL(location.href);
      if (!u.searchParams.get('room')) return;

      // Overlay container to guarantee topmost clickable area
      const wrap = document.createElement('div');
      Object.assign(wrap.style, {
        position:'fixed', right:'8px', bottom:'8px', zIndex:'2147483647',
        pointerEvents:'none'  // container ignores events
      });
      const btn = document.createElement('button');
      btn.textContent = 'Online Start';
      btn.type = 'button';
      Object.assign(btn.style, {
        pointerEvents:'auto',  // button alone captures
        padding:'12px 16px',
        borderRadius:'12px',
        border:'1px solid #7a7a7a',
        background:'#fff',
        boxShadow:'0 4px 14px rgba(0,0,0,.18)',
        fontSize:'15px',
        fontWeight:'600',
        WebkitTapHighlightColor:'rgba(0,0,0,0)',
        touchAction:'manipulation',
        userSelect:'none',
        transform:'translateZ(0)', // iOS stacking fix
      });
      wrap.appendChild(btn);
      document.body.appendChild(wrap);

      function startOnline(ev){
        if (ev){ ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation(); }
        const rows = +(u.searchParams.get('rows')||8);
        const cols = +(u.searchParams.get('cols')||8);
        const colors = +(u.searchParams.get('colors')||5);
        const seed = Math.floor(Math.random()*1e9);
        const payload = { seed, rows, cols, colors };
        if (!window.Net){ alert('Net adapter not loaded.'); return; }
        try { window.Net.start(payload); } catch(e){ console.warn(e); }
        if (window.__applyStartMatch) window.__applyStartMatch(payload);
        const prev = btn.textContent;
        btn.textContent = 'Starting...';
        btn.style.opacity = '0.75';
        setTimeout(()=>{ btn.textContent = prev; btn.style.opacity = '1'; }, 700);
        console.log('[OnlineStart v3]', payload);
      }
      btn.addEventListener('pointerdown', startOnline, {capture:true});
      btn.addEventListener('touchstart', startOnline, {capture:true, passive:false});
      btn.addEventListener('click', startOnline, {capture:true});
    }catch(e){ console.warn('[online_start_helper_v3]', e); }
  });
})();