// online_lockstep_hotfix.js
(function(){
  // ---- 0) 安全ログ
  const log = (...a)=>{ try{ console.log('[hotfix]', ...a); }catch(e){} };

  // ---- 0.5) 送信エコー対策のフラグ（未定義なら初期化）
  if (typeof window.__REPLAYING === 'undefined') window.__REPLAYING = false;

  // ---- 1) Host 以外は Online Start を抑止（start は Host だけが送る）
  if (window.Net && typeof Net.start === 'function'){
    const _start = Net.start;
    Net.start = function(payload){
      if (!Net.isHost){ log('ignore start on guest'); return; }
      try { _start(payload); } catch(e){ console.warn('[hotfix start]', e); }
    };
  }

  // ---- 2) myId を確実にキャッシュ
  window.__MYID = null;
  try{
    window.addEventListener('net:joined', (e)=>{
      window.__MYID = (e && e.detail && e.detail.id) || null;
      log('joined myId=', window.__MYID);
    });
  }catch(e){}
  // 補助: 接続完了後に Net.myId() をポーリングで取得
  (function pollMyId(){
    if (window.__MYID) return;
    try{
      if (window.Net && typeof Net.myId === 'function'){
        const id = Net.myId();
        if (id) { window.__MYID = id; log('polled myId=', id); return; }
      }
    }catch(e){}
    setTimeout(pollMyId, 200);
  })();

  // ---- 3) 受信適用のキー決定を強化（myId 未確定でも破綻しない & 送信ループ防止）
  if (window.Net){
    const prev = Net.onMessage;
    const seen = { self:null, other:null }; // フォールバック用

    Net.onMessage = function(m){
      try{
        if (!m) return;

        if (m.type === 'joined'){
          // 参加時に self/other を推定（myId確定前でも安全に）
          if (m.id && window.__MYID){
            if (m.id === window.__MYID) seen.self = m.id;
            else if (!seen.other) seen.other = m.id;
          }
          return;
        }

        if (m.type === 'start'){
          // 開始はホスト発。状態反映(setRows/Cols/Colors/Seed)が終わってから開始。
          const p = m.payload || {};
          const apply = window.__applyStartMatch;
          if (typeof apply === 'function'){
            requestAnimationFrame(()=> setTimeout(()=> {
              try { apply(p); } catch(e){ console.warn('[hotfix start apply]', e); }
            }, 0));
          }
          return;
        }

        if (m.type === 'cmd'){
          // キー決定
          const my = window.__MYID;
          let key;
          if (my && m.from){
            key = (m.from === my) ? 'P' : 'C';
          }else{
            if (!seen.self) seen.self = m.from;
            else if (!seen.other && m.from !== seen.self) seen.other = m.from;
            key = (m.from === seen.self) ? 'P' : 'C';
          }

          const payload = m.cmd || {};
          const args = payload.args || [];

          // 適用（リプレイ中は送信禁止）。P/C 専用が無ければ汎用を使う。
          window.__REPLAYING = true;
          try{
            if (payload.kind === 'tap'){
              const fn = window['__applyStart_' + key] || window.__applyStart;
              if (fn) return fn(...args);
            }
            if (payload.kind === 'twoFinger'){
              const fn = window['__applyCancelLast_' + key] || window.__applyCancelLast;
              if (fn) return fn();
            }
            if (payload.kind === 'closeLoop'){
              const fn = window['__applyClose_' + key] || window.__applyClose;
              if (fn) return fn();
            }
          } finally { window.__REPLAYING = false; }
          return;
        }

      } catch(e){ console.warn('[hotfix onMessage]', e); }
      // 非cmd系は元のハンドラへ
      if (prev) try{ prev(m); }catch(e){}
    };
  }

  // ---- 4) ゲスト側の Online Start ボタンを無効化（UI目安）
  try{
    const disableGuestStart = ()=>{
      if (!window.Net) return;
      if (!Net.isHost){
        const btn = document.querySelector('[data-online-start]');
        if (btn){ btn.disabled = true; btn.style.opacity = '0.5'; btn.title = 'Host only'; }
      }
    };
    setTimeout(disableGuestStart, 300);
  }catch(e){}
})();