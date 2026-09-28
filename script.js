const listaHabitosDiv = document.getElementById('habits-list');
const barraProgresso = document.getElementById('progressBar');
const botaoReset = document.getElementById('reset-btn');
const botaoNotificacao = document.getElementById('notify-btn');
const settingsHabitsListDiv = document.getElementById('settings-habits-list');

// Som Local
const somMoeda = new Audio('./moeda.mp3');

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

function tocarSomMoeda() {
    if (!somLigado) return;
    try {
        somMoeda.volume = 1.0;
        somMoeda.currentTime = 0; 
        somMoeda.play().catch(e => console.log('Som bloqueado', e));
    } catch (e) {
        console.log('Erro de som:', e);
    }
}

// Variáveis da Ofensiva
let streak = parseInt(localStorage.getItem('streakAtual')) || 0;
let melhorStreak = parseInt(localStorage.getItem('streakMelhor')) || 0;
let ultimoDiaCompleto = localStorage.getItem('ultimoDiaCompleto'); 

let listaHabitos = JSON.parse(localStorage.getItem('listaHabitosConfig')) || [
    { id: 'agua', icon: '💧', text: 'Beber Água' },
    { id: 'leitura', icon: '📚', text: 'Ler 10 pág.' },
    { id: 'alongar', icon: '🧘‍♂️', text: 'Alongar' }
];

let habitos = JSON.parse(localStorage.getItem('meusHabitos')) || {};
let notificouHoje = localStorage.getItem('notificouHoje') === 'true';

// Variável para saber se estamos Editando ou Criando um hábito
let habitoEmEdicaoId = null;

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
    renderizarListaGerenciar(); 
}

// === NOVO: Lista de Gerenciar (Editar e Excluir) ===
function renderizarListaGerenciar() {
    settingsHabitsListDiv.innerHTML = '';
    if (listaHabitos.length === 0) {
        settingsHabitsListDiv.innerHTML = '<p style="color: var(--text-muted); font-size: 14px;">Nenhum hábito na lista.</p>';
        return;
    }
    listaHabitos.forEach(habito => {
        const div = document.createElement('div');
        div.className = 'manage-habit-item';
        div.innerHTML = `
            <span>${habito.icon} ${habito.text}</span>
            <div class="manage-actions">
                <button class="manage-btn edit" title="Editar hábito">✏️</button>
                <button class="manage-btn delete" title="Apagar hábito">🗑️</button>
            </div>
        `;
        
        // Botão de Editar
        const editBtn = div.querySelector('.edit');
        editBtn.addEventListener('click', () => {
            prepararEdicaoHabito(habito);
        });

        // Botão de Excluir
        const deleteBtn = div.querySelector('.delete');
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

// Função para Resetar a tela de Criação (Para não virar Edição sem querer)
function prepararCriacaoHabito() {
    habitoEmEdicaoId = null;
    document.getElementById('modal-habit-title').innerText = "✨ Novo Hábito";
    document.getElementById('habit-emoji-input').value = "⭐";
    document.getElementById('habit-name-input').value = "";
    modalAddHabit.classList.add('show');
}

// Função para Abrir a tela já no Modo de Edição
function prepararEdicaoHabito(habito) {
    habitoEmEdicaoId = habito.id;
    document.getElementById('modal-habit-title').innerText = "✏️ Editar Hábito";
    document.getElementById('habit-emoji-input').value = habito.icon;
    document.getElementById('habit-name-input').value = habito.text;
    modalAddHabit.classList.add('show');
}

// Botões de Criar Hábito Normal
document.getElementById('add-btn-mobile').addEventListener('click', prepararCriacaoHabito);
document.getElementById('add-btn-pc').addEventListener('click', prepararCriacaoHabito);
document.getElementById('cancel-habit-btn').addEventListener('click', () => modalAddHabit.classList.remove('show'));

document.getElementById('stats-btn-pc').addEventListener('click', () => { verificarOfensiva(); modalStats.classList.add('show'); });
document.getElementById('stats-btn-mobile').addEventListener('click', () => { verificarOfensiva(); modalStats.classList.add('show'); });
document.getElementById('close-stats-btn').addEventListener('click', () => modalStats.classList.remove('show'));

// === O BOTÃO DE SALVAR MAGIA (Cria ou Edita!) ===
document.getElementById('save-habit-btn').addEventListener('click', () => {
    const icon = document.getElementById('habit-emoji-input').value || '⭐';
    const text = document.getElementById('habit-name-input').value;
    if (text.trim() === '') { alert("Escreve o nome do hábito!"); return; }
    
    if (habitoEmEdicaoId !== null) {
        // Sipah está Editando
        const index = listaHabitos.findIndex(h => h.id === habitoEmEdicaoId);
        if (index !== -1) {
            listaHabitos[index].icon = icon;
            listaHabitos[index].text = text;
        }
        habitoEmEdicaoId = null; // Reseta
    } else {
        // Sipah está Criando do zero
        const id = 'hab_' + Date.now(); 
        listaHabitos.push({ id, icon, text });
    }

    localStorage.setItem('listaHabitosConfig', JSON.stringify(listaHabitos));
    modalAddHabit.classList.remove('show');
    renderizarHabitos();
});

// Temas
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