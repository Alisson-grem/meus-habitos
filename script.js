const listaHabitosDiv = document.getElementById('habits-list');
const barraProgresso = document.getElementById('progressBar');
const botaoReset = document.getElementById('reset-btn');
const botaoNotificacao = document.getElementById('notify-btn');
const settingsHabitsListDiv = document.getElementById('settings-habits-list');

// Variáveis da Ofensiva
let streak = parseInt(localStorage.getItem('streakAtual')) || 0;
let melhorStreak = parseInt(localStorage.getItem('streakMelhor')) || 0;
let ultimoDiaCompleto = localStorage.getItem('ultimoDiaCompleto'); 

// Variáveis de Som da Sipah
let somLigado = localStorage.getItem('somLigado') !== 'false';
const toggleSoundBtn = document.getElementById('toggle-sound-btn');

function atualizarBotaoSom() {
    toggleSoundBtn.innerText = somLigado ? 'Ligado' : 'Desligado';
    toggleSoundBtn.style.borderColor = somLigado ? 'var(--primary)' : 'var(--text-muted)';
    toggleSoundBtn.style.color = somLigado ? 'var(--primary)' : 'var(--text-muted)';
}
atualizarBotaoSom();

toggleSoundBtn.addEventListener('click', () => {
    somLigado = !somLigado;
    localStorage.setItem('somLigado', somLigado);
    atualizarBotaoSom();
});

// A Magia do Som sem arquivos! (Plim!)
function tocarSomMoeda() {
    if (!somLigado) return;
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, ctx.currentTime); // Nota B5
        osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.1); // Nota E6
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
        console.log('Navegador não deixou a Sipah fazer som', e);
    }
}

let listaHabitos = JSON.parse(localStorage.getItem('listaHabitosConfig')) || [
    { id: 'agua', icon: '💧', text: 'Beber Água' },
    { id: 'leitura', icon: '📚', text: 'Ler 10 pág.' },
    { id: 'alongar', icon: '🧘‍♂️', text: 'Alongar' }
];

let habitos = JSON.parse(localStorage.getItem('meusHabitos')) || {};
let notificouHoje = localStorage.getItem('notificouHoje') === 'true';

function verificarOfensiva() {
    const hoje = new Date().toDateString();
    const ontem = new Date(Date.now() - 86400000).toDateString();
    if (ultimoDiaCompleto !== hoje && ultimoDiaCompleto !== ontem && ultimoDiaCompleto !== null) {
        streak = 0;
        localStorage.setItem('streakAtual', streak);
    }
    document.getElementById('current-streak-display').innerText = streak;
    document.getElementById('best-streak-display').innerText = melhorStreak + ' dias';
}
verificarOfensiva();

function renderizarHabitos() {
    listaHabitosDiv.innerHTML = ''; 
    listaHabitos.forEach(habito => {
        const btn = document.createElement('button');
        btn.className = 'habit-btn';
        btn.setAttribute('data-habit', habito.id);
        
        if (habitos[habito.id]) btn.classList.add('completed');
        
        btn.innerHTML = `<span class="icon">${habito.icon}</span><span class="text">${habito.text}</span>`;
        
        btn.addEventListener('click', () => {
            if (navigator.vibrate) navigator.vibrate(50);
            
            // Toca som APENAS quando for completar (não quando tirar)
            if (!btn.classList.contains('completed')) {
                tocarSomMoeda();
            }
            
            btn.classList.toggle('completed');
            habitos[habito.id] = btn.classList.contains('completed');
            localStorage.setItem('meusHabitos', JSON.stringify(habitos));
            atualizarProgresso();
        });
        
        listaHabitosDiv.appendChild(btn);
    });
    atualizarProgresso();
    renderizarListaExcluir(); 
}

function renderizarListaExcluir() {
    settingsHabitsListDiv.innerHTML = '';
    if (listaHabitos.length === 0) {
        settingsHabitsListDiv.innerHTML = '<p style="color: var(--text-muted); font-size: 14px;">Nenhum hábito na lista.</p>';
        return;
    }
    listaHabitos.forEach(habito => {
        const div = document.createElement('div');
        div.className = 'delete-habit-item';
        div.innerHTML = `
            <span>${habito.icon} ${habito.text}</span>
            <button class="delete-btn" title="Apagar hábito">🗑️</button>
        `;
        const deleteBtn = div.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            if(confirm(`Jogar '${habito.text}' no lixo, humano?`)) {
                excluirHabito(habito.id);
            }
        });
        settingsHabitsListDiv.appendChild(div);
    });
}

function excluirHabito(idParaApagar) {
    listaHabitos = listaHabitos.filter(habito => habito.id !== idParaApagar);
    localStorage.setItem('listaHabitosConfig', JSON.stringify(listaHabitos));
    if (habitos[idParaApagar] !== undefined) {
        delete habitos[idParaApagar];
        localStorage.setItem('meusHabitos', JSON.stringify(habitos));
    }
    renderizarHabitos();
}

function atualizarProgresso() {
    const total = listaHabitos.length;
    if(total === 0) { barraProgresso.style.width = `0%`; return; }
    const concluidos = Object.values(habitos).filter(status => status === true).length;
    const porcentagem = (concluidos / total) * 100;
    barraProgresso.style.width = `${porcentagem}%`;
    
    if (porcentagem === 100) {
        const hoje = new Date().toDateString();
        const ontem = new Date(Date.now() - 86400000).toDateString();
        
        if (ultimoDiaCompleto !== hoje) {
            if (ultimoDiaCompleto === ontem || ultimoDiaCompleto === null || streak === 0) {
                streak++;
            } else {
                streak = 1; 
            }
            if (streak > melhorStreak) melhorStreak = streak;
            
            ultimoDiaCompleto = hoje;
            localStorage.setItem('streakAtual', streak);
            localStorage.setItem('streakMelhor', melhorStreak);
            localStorage.setItem('ultimoDiaCompleto', ultimoDiaCompleto);
            verificarOfensiva(); 
        }
        enviarNotificacaoParabens();
    }
}

function enviarNotificacaoParabens() {
    if ("Notification" in window && Notification.permission === "granted" && !notificouHoje) {
        new Notification("✨ Uhuu!", { body: "Você completou todos os mini-hábitos!", icon: "https://cdn-icons-png.flaticon.com/512/190/190411.png" });
        notificouHoje = true;
        localStorage.setItem('notificouHoje', 'true');
    }
}

if (!("Notification" in window) || Notification.permission === 'granted' || Notification.permission === 'denied') {
    botaoNotificacao.style.display = 'none';
}
botaoNotificacao.addEventListener('click', () => {
    Notification.requestPermission().then(permissao => {
        if (permissao === 'granted') {
            botaoNotificacao.style.display = 'none';
            new Notification("Hmph!", { body: "Sipah tá de olho!" });
        }
    });
});

// === MODAIS ===
const modalSettings = document.getElementById('settings-modal');
const modalAddHabit = document.getElementById('add-habit-modal');
const modalStats = document.getElementById('stats-modal');

document.getElementById('settings-btn-pc').addEventListener('click', () => modalSettings.classList.add('show'));
document.getElementById('settings-btn-mobile').addEventListener('click', () => modalSettings.classList.add('show'));
document.getElementById('close-settings-btn').addEventListener('click', () => modalSettings.classList.remove('show'));

document.getElementById('add-btn-mobile').addEventListener('click', () => modalAddHabit.classList.add('show'));
document.getElementById('add-btn-pc').addEventListener('click', () => modalAddHabit.classList.add('show'));
document.getElementById('cancel-habit-btn').addEventListener('click', () => modalAddHabit.classList.remove('show'));

document.getElementById('stats-btn-pc').addEventListener('click', () => { verificarOfensiva(); modalStats.classList.add('show'); });
document.getElementById('stats-btn-mobile').addEventListener('click', () => { verificarOfensiva(); modalStats.classList.add('show'); });
document.getElementById('close-stats-btn').addEventListener('click', () => modalStats.classList.remove('show'));

document.getElementById('save-habit-btn').addEventListener('click', () => {
    const icon = document.getElementById('habit-emoji-input').value || '⭐';
    const text = document.getElementById('habit-name-input').value;
    if (text.trim() === '') { alert("Escreve o nome do hábito!"); return; }
    const id = 'hab_' + Date.now(); 
    listaHabitos.push({ id, icon, text });
    localStorage.setItem('listaHabitosConfig', JSON.stringify(listaHabitos));
    document.getElementById('habit-name-input').value = '';
    modalAddHabit.classList.remove('show');
    renderizarHabitos();
});

let isDark = localStorage.getItem('darkMode') === 'true';
let corTema = localStorage.getItem('corTema') || 'emerald';

function aplicarTema() {
    if (isDark) {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-btn-pc').innerText = '☀️';
        document.getElementById('theme-btn-mobile').querySelector('.icon').innerText = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        document.getElementById('theme-btn-pc').innerText = '🌙';
        document.getElementById('theme-btn-mobile').querySelector('.icon').innerText = '🌙';
    }
    document.body.setAttribute('data-color', corTema);
}
aplicarTema();

function alternarDark() {
    isDark = !isDark;
    localStorage.setItem('darkMode', isDark);
    aplicarTema();
}
document.getElementById('theme-btn-pc').addEventListener('click', alternarDark);
document.getElementById('theme-btn-mobile').addEventListener('click', alternarDark);

document.querySelectorAll('.theme-color-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        corTema = e.target.getAttribute('data-setcolor');
        localStorage.setItem('corTema', corTema);
        aplicarTema();
    });
});

function zerarHabitos() {
    habitos = {};
    localStorage.removeItem('meusHabitos');
    notificouHoje = false;
    localStorage.removeItem('notificouHoje');
    renderizarHabitos();
}

botaoReset.addEventListener('click', () => {
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
    zerarHabitos();
    localStorage.setItem('ultimoReset', Date.now());
});

function checarResetAutomatico() {
    const ultimoReset = localStorage.getItem('ultimoReset');
    if (ultimoReset) {
        const agora = Date.now();
        if ((agora - parseInt(ultimoReset)) >= (24 * 60 * 60 * 1000)) {
            zerarHabitos();
            localStorage.setItem('ultimoReset', agora);
        }
    }
}
checarResetAutomatico();

let eventoInstalacao;
const botaoInstalarIcone = document.getElementById('install-icon-btn');
window.addEventListener('beforeinstallprompt', (evento) => {
    evento.preventDefault();
    eventoInstalacao = evento;
    botaoInstalarIcone.style.display = 'inline-block';
});
botaoInstalarIcone.addEventListener('click', async () => {
    if (!eventoInstalacao) return;
    eventoInstalacao.prompt();
    const resultado = await eventoInstalacao.userChoice;
    if (resultado.outcome === 'accepted') botaoInstalarIcone.style.display = 'none';
    eventoInstalacao = null;
});
window.addEventListener('appinstalled', () => { botaoInstalarIcone.style.display = 'none'; });

renderizarHabitos();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(erro => console.log('Falha', erro));
    });
}