const CACHE='muthakkir-v17';
const SHELL=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./style.css?v=17','./app.js?v=17'];
const FONT='https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@500;700&display=swap';
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(async c=>{await c.addAll(SHELL);try{const r=await fetch(FONT),t=await r.clone().text();await c.put(FONT,r);await Promise.all([...t.matchAll(/url\((https:[^)]+)\)/g)].map(m=>fetch(m[1]).then(x=>c.put(m[1],x)).catch(()=>{})))}catch(_){}}).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith('muthakkir-v')&&x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const r=e.request;
  // الصوت وطلبات Range تُترك للمتصفح مباشرة ليعمل التشغيل والتقديم بسلاسة
  if(r.method!=='GET'||r.destination==='audio'||r.destination==='video'||r.headers.has('range'))return;
  const u=new URL(r.url),same=u.origin===self.location.origin;
  if(u.pathname.includes('/quran/quran-uthmani'))return;
  const save=res=>{if(res&&(res.ok||res.type==='opaque')){const c=res.clone();caches.open(CACHE).then(x=>x.put(r,c))}return res};
  // نص السور: من الذاكرة أولًا ثم الشبكة
  if(u.hostname==='api.alquran.cloud'&&u.pathname.startsWith('/v1/surah')){e.respondWith(caches.open('muthakkir-text').then(async c=>{const m=await c.match(r,{ignoreVary:true});if(m)return m;try{const res=await fetch(r);if(res.ok)c.put(r,res.clone());return res}catch(err){return (await caches.match(r,{ignoreVary:true}))||Response.error()}}));return}
  // الخطوط: من الذاكرة أولًا (لا تتغير)
  if(u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'){e.respondWith(caches.match(r,{ignoreVary:true}).then(m=>m||fetch(r).then(save)));return}
  // ملفات التطبيق: تُعرض فورًا من الذاكرة وتُحدَّث في الخلفية (أسرع فتح للتطبيق)
  if(same||r.mode==='navigate'){
    const key=r.mode==='navigate'?'./index.html':r;
    e.respondWith(caches.match(key,{ignoreVary:true,ignoreSearch:true}).then(m=>{
      const net=fetch(r.mode==='navigate'?r.url:r,{cache:'no-cache'}).then(save).catch(()=>m);
      e.waitUntil(net.catch(()=>{}));
      return m||net;
    }));return;
  }
  e.respondWith(fetch(r).then(save).catch(()=>caches.match(r,{ignoreVary:true})));
});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>l.length?l[0].focus():clients.openWindow('./')))});
