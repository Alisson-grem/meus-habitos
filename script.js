// --- Elementos Base e Utilitários ---
const $ = id => document.getElementById(id);

// O conserto da Sipah: Tenta ler como JSON, se der erro (dados antigos), devolve o texto normal!
const lsGet = (k, def) => {
    const val = localStorage.getItem(k);
    if (val === null) return def;
    try { 
        return JSON.parse(val); 
    } catch (e) { 
        return val; 
    }
};

const lsSet = (k, v) => localStorage.setItem(k, JSON.stringify(v));

// --- Variáveis de Estado ---
let listaHabitos = lsGet('listaHabitosConfig', [
    { id: 'agua', icon: '💧', text: 'Beber Água' },
    { id: 'leitura', icon: '📚', text: 'Ler 10 pág.' },
    { id: 'alongar', icon: '🧘‍♂️', text: 'Alongar' }
]);
let habitos = lsGet('meusHabitos', {});
let streak = parseInt(lsGet('streakAtual', 0));
let melhorStreak = parseInt(lsGet('streakMelhor', 0));
let ultimoDiaCompleto = lsGet('ultimoDiaCompleto', null);
let notificouHoje = lsGet('notificouHoje', false) === true || lsGet('notificouHoje', false) === 'true';
let somLigado = lsGet('somLigado', true) === true || lsGet('somLigado', true) === 'true';
let habitoEmEdicaoId = null;

// --- Som e Confetes ---
const somMoeda = new Audio('./Sons/moeda.mp3');
const btnSom = $('toggle-sound-btn');

const atualizarBotaoSom = () => {
    btnSom.innerText = somLigado ? 'Ligado' : 'Desligado';
    btnSom.style.color = btnSom.style.borderColor = somLigado ? 'var(--primary)' : 'var(--text-muted)';
};
atualizarBotaoSom();

btnSom.onclick = () => {
    somLigado = !somLigado;
    lsSet('somLigado', somLigado);
    atualizarBotaoSom();
};

const tocarSomMoeda = () => {
    if (!somLigado) return;
    try { somMoeda.volume = 1.0; somMoeda.currentTime = 0; somMoeda.play().catch(e=>e); } catch(e){}
};

const soltarConfetesMagicos = () => {
    const emojis = ['✨', '🎉', '🔥', '🏆', '💎', '🌟'];
    for(let i = 0; i < 40; i++) {
        const c = document.createElement('div');
        c.innerText = emojis[Math.floor(Math.random() * emojis.length)];
        c.style.cssText = `position:fixed; left:${Math.random()*100}vw; top:-5vh; font-size:${Math.random()*20+15}px; z-index:9999; pointer-events:none; transition: all 2.5s cubic-bezier(0.25,0.46,0.45,0.94); opacity:1;`;
        document.body.appendChild(c);
        setTimeout(() => {
            c.style.top = '105vh';
            c.style.transform = `rotate(${Math.random()*720}deg) translateX(${Math.random()*200-100}px)`;
            c.style.opacity = '0';
        }, 50);
        setTimeout(() => c.remove(), 2600);
    }
};

// --- Lógica Principal (Hábitos e Progresso) ---
const verificarOfensiva = () => {
    const hoje = new Date().toDateString();
    const ontem = new Date(Date.now() - 86400000).toDateString();
    if (ultimoDiaCompleto && ultimoDiaCompleto !== hoje && ultimoDiaCompleto !== ontem) {
        streak = 0; lsSet('streakAtual', streak);
    }
    $('current-streak-display').innerText = streak;
    $('best-streak-display').innerText = melhorStreak + ' dias';
};

const atualizarProgresso = () => {
    const total = listaHabitos.length;
    if(!total) {
        $('progressBar').style.width = '0%';
        return;
    }
    
    const concluidos = Object.values(habitos).filter(Boolean).length;
    const porcentagem = (concluidos / total) * 100;
    $('progressBar').style.width = `${porcentagem}%`;
    
    if (porcentagem === 100) {
        const hoje = new Date().toDateString();
        const ontem = new Date(Date.now() - 86400000).toDateString();
        if (ultimoDiaCompleto !== hoje) {
            soltarConfetesMagicos();
            streak = (ultimoDiaCompleto === ontem || !ultimoDiaCompleto || !streak) ? streak + 1 : 1;
            melhorStreak = Math.max(streak, melhorStreak);
            ultimoDiaCompleto = hoje;
            lsSet('streakAtual', streak); lsSet('streakMelhor', melhorStreak); lsSet('ultimoDiaCompleto', ultimoDiaCompleto);
            verificarOfensiva(); 
        }
        if ("Notification" in window && Notification.permission === "granted" && !notificouHoje) {
            new Notification("✨ Uhuu!", { body: "Você completou todos os mini-hábitos!", icon: "https://cdn-icons-png.flaticon.com/512/190/190411.png" });
            notificouHoje = true; lsSet('notificouHoje', true);
        }
    }
};

const renderizarHabitos = () => {
    $('habits-list').innerHTML = '';$('settings-habits-list').innerHTML = listaHabitos.length ? '' : '<p style="color:var(--text-muted); font-size:14px;">Nenhum hábito.</p>';
    
    listaHabitos.forEach(h => {
        // Na tela principal
        const btn = document.createElement('button');
        btn.className = `habit-btn ${habitos[h.id] ? 'completed' : ''}`;
        btn.innerHTML = `<span class="icon">${h.icon}</span><span class="text">${h.text}</span>`;
        btn.onclick = () => {
            if (navigator.vibrate) navigator.vibrate(50);
            if (!btn.classList.contains('completed')) tocarSomMoeda();
            btn.classList.toggle('completed');
            habitos[h.id] = btn.classList.contains('completed');
            lsSet('meusHabitos', habitos);
            atualizarProgresso();
        };
        $('habits-list').appendChild(btn);

        // Na lista de gerenciar
        const div = document.createElement('div');
        div.className = 'manage-habit-item glass-item';
        div.innerHTML = `<span>${h.icon} ${h.text}</span><div class="manage-actions"><button class="manage-btn edit">✏️</button><button class="manage-btn delete">🗑️</button></div>`;
        div.querySelector('.edit').onclick = () => prepararModalHabito(h);
        div.querySelector('.delete').onclick = () => {
            if(confirm(`Apagar '${h.text}', humano?`)) {
                listaHabitos = listaHabitos.filter(item => item.id !== h.id);
                delete habitos[h.id];
                lsSet('listaHabitosConfig', listaHabitos); lsSet('meusHabitos', habitos);
                renderizarHabitos();
            }
        };
        $('settings-habits-list').appendChild(div);
    });
    atualizarProgresso();
};

const zerarHabitos = () => {
    habitos = {}; notificouHoje = false;
    localStorage.removeItem('meusHabitos'); localStorage.removeItem('notificouHoje');
    renderizarHabitos();
};

$('reset-btn').onclick = () => {
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
    zerarHabitos();
    lsSet('ultimoReset', Date.now());
};

// Reset Automático 24h
const ultimoReset = lsGet('ultimoReset', null);
if (ultimoReset && (Date.now() - parseInt(ultimoReset)) >= 86400000) {
    zerarHabitos(); lsSet('ultimoReset', Date.now());
}

// --- Lógica de UI e Modais ---
const toggleModal = (id, show) => $(id).classList[show ? 'add' : 'remove']('show');

['settings', 'stats'].forEach(m => {
    const open = () => { if(m==='stats') verificarOfensiva(); toggleModal(`${m}-modal`, true); };
    if($(`${m}-btn-pc`)) $(`${m}-btn-pc`).onclick = open;
    if($(`${m}-btn-mobile`)) $(`${m}-btn-mobile`).onclick = open;
    if($(`close-${m}-btn`)) $(`close-${m}-btn`).onclick = () => toggleModal(`${m}-modal`, false);
});

const prepararModalHabito = (h = null) => {
    habitoEmEdicaoId = h ? h.id : null;
    $('modal-habit-title').innerText = h ? "✏️ Editar Hábito" : "✨ Novo Hábito";
    $('habit-emoji-input').value = h ? h.icon : "⭐";
    $('habit-name-input').value = h ? h.text : "";
    if(h) toggleModal('settings-modal', false);
    toggleModal('add-habit-modal', true);
};

$('add-btn-mobile').onclick = () => prepararModalHabito();
$('add-btn-pc').onclick = () => prepararModalHabito();$('cancel-habit-btn').onclick = () => toggleModal('add-habit-modal', false);

$('save-habit-btn').onclick = () => {
    const icon = $('habit-emoji-input').value || '⭐';
    const text = $('habit-name-input').value.trim();
    if (!text) return alert("Escreve o nome do hábito!");
    
    if (habitoEmEdicaoId) {
        const h = listaHabitos.find(x => x.id === habitoEmEdicaoId);
        if(h) { h.icon = icon; h.text = text; }
    } else {
        listaHabitos.push({ id: 'hab_' + Date.now(), icon, text });
    }
    lsSet('listaHabitosConfig', listaHabitos);
    toggleModal('add-habit-modal', false);
    renderizarHabitos();
};

// Temas
let isDark = lsGet('darkMode', false) === true || lsGet('darkMode', false) === 'true';
let corTema = lsGet('corTema', 'emerald');

const aplicarTema = () => {
    document.body.classList[isDark ? 'add' : 'remove']('dark-mode');
    $('theme-btn-pc').innerText =$('theme-btn-mobile').querySelector('.icon').innerText = isDark ? '☀️' : '🌙';
    $('meta-theme-color').setAttribute('content', isDark ? '#1e1e1e' : '#f8f9fa');
    document.body.setAttribute('data-color', corTema);
};
aplicarTema();

const switchDark = () => { isDark = !isDark; lsSet('darkMode', isDark); aplicarTema(); };
$('theme-btn-pc').onclick = switchDark;
$('theme-btn-mobile').onclick = switchDark;

document.querySelectorAll('.theme-color-btn').forEach(btn => {
    btn.onclick = (e) => { corTema = e.target.dataset.setcolor; lsSet('corTema', corTema); aplicarTema(); };
});

// Notificações e PWA
if (!("Notification" in window) || Notification.permission !== 'default') $('notify-btn').style.display = 'none';$('notify-btn').onclick = () => {
    Notification.requestPermission().then(p => { if (p === 'granted') { $('notify-btn').style.display = 'none'; new Notification("Hmph!", { body: "Sipah atenta!" }); } });
};

let eventoInstalacao;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); eventoInstalacao = e; $('install-icon-btn').style.display = 'inline-block';
});
$('install-icon-btn').onclick = async () => {
    if (!eventoInstalacao) return;
    eventoInstalacao.prompt();
    if ((await eventoInstalacao.userChoice).outcome === 'accepted') $('install-icon-btn').style.display = 'none';
    eventoInstalacao = null;
};
window.addEventListener('appinstalled', () => $('install-icon-btn').style.display = 'none');

// Inicialização
verificarOfensiva();
renderizarHabitos();

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(e=>e));