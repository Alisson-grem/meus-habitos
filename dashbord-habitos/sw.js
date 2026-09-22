const CACHE_NAME = 'habitos-v3';
const arquivosParaSalvar = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json'
];

// Instala o ajudante
self.addEventListener('install', evento => {
    evento.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(arquivosParaSalvar);
        })
    );
    // Diz pra ele não ficar esperando e trabalhar logo!
    self.skipWaiting();
});

// O feitiço novo da Sipah pra limpar o lixo velho!
self.addEventListener('activate', evento => {
    evento.waitUntil(
        caches.keys().then(chaves => {
            return Promise.all(
                chaves.map(chave => {
                    if (chave !== CACHE_NAME) {
                        return caches.delete(chave);
                    }
                })
            );
        })
    );
    // Manda ele assumir o controle na mesma hora!
    self.clients.claim();
});

// Pega os arquivos
self.addEventListener('fetch', evento => {
    evento.respondWith(
        caches.match(evento.request).then(resposta => {
            return resposta || fetch(evento.request);
        })
    );
});