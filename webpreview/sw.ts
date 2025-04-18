///<reference lib="WebWorker"/>
var d = self as unknown as ServiceWorkerGlobalScope;
d.addEventListener('activate', (ev)=>{
ev.waitUntil(d.clients.claim())
})
d.addEventListener('install', (ev)=>{
    d.skipWaiting();
});
d.addEventListener('fetch', (ev)=>{
    ev.respondWith((async()=>{
        return fetch(ev.request);
    })());
})